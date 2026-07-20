import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Utkesa } from './Utkesa';

const renderPage = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Utkesa />
    </MemoryRouter>,
  );

test('renders the hero and the way back to Extra-Curricular', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: 'UTKESA & the Gallery of Korea' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /All activities/ })).toHaveAttribute(
    'href',
    '/extra-curricular',
  );
});

test('links both LinkedIn posts as proof of the donation', () => {
  renderPage();
  expect(screen.getByRole('link', { name: 'the donation' })).toHaveAttribute(
    'href',
    expect.stringContaining('linkedin.com/posts/utkesa_samiljeol'),
  );
  expect(screen.getByRole('link', { name: 'the event' })).toHaveAttribute(
    'href',
    expect.stringContaining('linkedin.com/posts/utkesa_as-utkesa'),
  );
});

test('shows the event carousel and the certificate, with reserved dimensions', () => {
  renderPage();
  // 5 carousel slides + the certificate figure
  const images = screen.getAllByRole('img');
  expect(images).toHaveLength(6);
  for (const img of images) {
    expect(img.getAttribute('alt')!.length).toBeGreaterThan(0);
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(Number(img.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(img.getAttribute('height'))).toBeGreaterThan(0);
  }
  expect(screen.getAllByText(/CAD \$400/).length).toBeGreaterThan(0);
});
