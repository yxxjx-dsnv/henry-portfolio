import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';

function renderSidebar(props: Partial<Parameters<typeof Sidebar>[0]> = {}) {
  const onToggleDark = vi.fn();
  const onClose = vi.fn();
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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

test('clicking Email copies the address and shows a quiet Copied swap', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  renderSidebar();
  await userEvent.click(screen.getByRole('link', { name: /Email/ }));
  expect(writeText).toHaveBeenCalledWith('mail2yjkim@gmail.com');
  expect(await screen.findByText('Copied')).toBeInTheDocument();
});

test('sidebar shows the Toronto clock and a colophon link', () => {
  renderSidebar();
  expect(screen.getByText(/^Toronto — \d{1,2}:\d{2} (AM|PM)$/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Colophon' })).toHaveAttribute('href', '/colophon');
});

test('social links carry decorative brand icons', () => {
  renderSidebar();
  const social = document.querySelector('.social-list')!;
  expect(social.querySelector('.fa-instagram')).toBeTruthy();
  expect(social.querySelector('.fa-linkedin-in')).toBeTruthy();
  expect(social.querySelector('.fa-github')).toBeTruthy();
  expect(social.querySelector('.fa-envelope')).toBeTruthy();
  social.querySelectorAll('i').forEach((i) => expect(i).toHaveAttribute('aria-hidden', 'true'));
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
