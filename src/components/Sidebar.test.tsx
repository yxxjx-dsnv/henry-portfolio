import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';

function renderSidebar(props: Partial<Parameters<typeof Sidebar>[0]> = {}) {
  const onToggleDark = vi.fn();
  const onClose = vi.fn();
  render(
    <MemoryRouter>
      <Sidebar isDark={false} onToggleDark={onToggleDark} open={false} onClose={onClose} {...props} />
    </MemoryRouter>,
  );
  return { onToggleDark, onClose };
}

test('renders the five nav links and social links', () => {
  renderSidebar();
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
  expect(screen.getByRole('link', { name: 'Essays' })).toHaveAttribute('href', '/essays');
  expect(screen.getByRole('link', { name: 'Extra-Curricular' })).toHaveAttribute('href', '/extra-curricular');
  expect(screen.getByRole('link', { name: 'Education' })).toHaveAttribute('href', '/education');
  expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/yxxjx-dsnv');
});

test('clicking the logo toggles dark mode; light logo shown when not dark', () => {
  const { onToggleDark } = renderSidebar({ isDark: false });
  const logo = screen.getByAltText('Logo') as HTMLImageElement;
  expect(logo.getAttribute('src')).toBe('/Images/H Logo.svg');
  logo.click();
  expect(onToggleDark).toHaveBeenCalledTimes(1);
});

test('shows the white logo in dark mode', () => {
  renderSidebar({ isDark: true });
  expect(screen.getByAltText('Logo').getAttribute('src')).toBe('/Images/H Logo - White.svg');
});

test('close button calls onClose', async () => {
  const { onClose } = renderSidebar({ open: true });
  await userEvent.click(screen.getByText('×'));
  expect(onClose).toHaveBeenCalled();
});
