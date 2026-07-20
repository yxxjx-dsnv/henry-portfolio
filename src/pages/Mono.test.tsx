import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mono } from './Mono';

const renderPage = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Mono />
    </MemoryRouter>,
  );

test('renders the hero and the way back to Projects', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: 'MONO' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /All projects/ })).toHaveAttribute('href', '/projects');
});

test('leads with the venture: the Profit Score and its validation', () => {
  renderPage();
  expect(screen.getByText(/The Profit Score/)).toBeInTheDocument();
  expect(screen.getByText(/Hana Social Venture University/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /github\.com\/yxxjx-dsnv/ })).toHaveAttribute(
    'href',
    'https://github.com/yxxjx-dsnv',
  );
});

test('credits In-woo Park with his LinkedIn', () => {
  renderPage();
  expect(screen.getByRole('link', { name: 'In-woo Park' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/in-woopark/',
  );
});

test('shows the Shopify store figure with alt text and reserved dimensions', () => {
  renderPage();
  // the decorative MONO logo is alt="" (excluded from the img role); the Shopify store remains
  const img = screen.getByRole('img', { name: /Shopify/ });
  expect(img.getAttribute('alt')!.length).toBeGreaterThan(0);
  expect(img).toHaveAttribute('loading', 'lazy');
  expect(Number(img.getAttribute('width'))).toBeGreaterThan(0);
  expect(Number(img.getAttribute('height'))).toBeGreaterThan(0);
});
