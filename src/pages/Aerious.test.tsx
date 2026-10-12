import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Aerious } from './Aerious';
import App from '../App';

const renderPage = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Aerious />
    </MemoryRouter>,
  );

test('renders the hero, the MONO part, and the way back to Projects', () => {
  const { container } = renderPage();
  expect(screen.getByRole('heading', { level: 1, name: 'ÆRIOUS' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'MONO' })).toBeInTheDocument();
  expect(container.querySelector('#mono')).toContainElement(screen.getByRole('heading', { name: 'MONO' }));
  expect(screen.getByRole('link', { name: /All projects/ })).toHaveAttribute('href', '/projects');
});

test('never speaks as an operating company', () => {
  renderPage();
  expect(screen.queryByText(/\bwe build\b|our clients|our platform/i)).toBeNull();
});

test('keeps the venture: the Profit Score and its validation', () => {
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
  // the decorative marks (Æ, MONO) are alt="" (excluded from the img role); the Shopify store remains
  const img = screen.getByRole('img', { name: /Shopify/ });
  expect(img.getAttribute('alt')!.length).toBeGreaterThan(0);
  expect(img).toHaveAttribute('loading', 'lazy');
  expect(Number(img.getAttribute('width'))).toBeGreaterThan(0);
  expect(Number(img.getAttribute('height'))).toBeGreaterThan(0);
});

test('the old /projects/mono address lands on the MONO part of the ÆRIOUS page', () => {
  const offset = vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
    return this.id === 'mono' ? 1200 : 0;
  });
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  render(
    <MemoryRouter initialEntries={['/projects/mono']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { level: 1, name: 'ÆRIOUS' })).toBeInTheDocument();
  expect(document.title).toBe('ÆRIOUS — Henry Kim');
  expect(scroll).toHaveBeenLastCalledWith({ top: 1200, behavior: 'instant' });
  offset.mockRestore();
  scroll.mockRestore();
});
