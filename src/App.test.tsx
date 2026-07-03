import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

test('renders Home at /', () => {
  renderAt('/');
  expect(screen.getByRole('heading', { name: 'Henry Kim' })).toBeInTheDocument();
});

test('renders Projects at /projects', () => {
  renderAt('/projects');
  expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
});

test('renders Essays at /essays', () => {
  renderAt('/essays');
  expect(screen.getByRole('heading', { name: 'Learnings from past three years' })).toBeInTheDocument();
});

test('renders Education at /education', () => {
  renderAt('/education');
  expect(screen.getByRole('heading', { name: 'Education' })).toBeInTheDocument();
});

test('route changes set a page-specific tab title', () => {
  renderAt('/essays');
  expect(document.title).toBe('Essays — Henry Kim');
});

test('unknown paths render the quiet 404 page', () => {
  renderAt('/does-not-exist');
  expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
  expect(document.title).toBe('Not Found — Henry Kim');
});

test('number keys quietly navigate between pages', () => {
  renderAt('/');
  fireEvent.keyDown(document, { key: '3' });
  expect(screen.getByRole('heading', { name: 'Learnings from past three years' })).toBeInTheDocument();
});

test('colophon page renders with the printer mark', () => {
  renderAt('/colophon');
  expect(screen.getByRole('heading', { name: 'Colophon' })).toBeInTheDocument();
  expect(screen.getByText(/build \d{4}-\d{2}-\d{2}/)).toBeInTheDocument();
  expect(document.title).toBe('Colophon — Henry Kim');
});

test('cmd+K opens the switchboard and Enter jumps to a filtered page', async () => {
  renderAt('/');
  fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
  const input = await screen.findByPlaceholderText('Type a page or action…');
  await userEvent.type(input, 'essa');
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(screen.getByRole('heading', { name: 'Learnings from past three years' })).toBeInTheDocument();
});

test('the traveling nav dot exists in the sidebar', () => {
  renderAt('/');
  expect(document.querySelector('.nav-dot')).toBeTruthy();
});

test('Home always serves a quote with an author', () => {
  renderAt('/');
  const quote = document.querySelector('.hero-quote');
  expect(quote).toBeTruthy();
  expect(quote!.querySelector('.hero-quote-author')!.textContent).toMatch(/^— /);
});

test('404 hosts the lost dot', () => {
  renderAt('/nowhere');
  expect(screen.getByText(/One dot did get lost/)).toBeInTheDocument();
});

test('clicking the logo toggles the dark-mode body class', async () => {
  document.body.className = '';
  localStorage.clear();
  renderAt('/');
  await userEvent.click(screen.getByAltText('Logo'));
  expect(document.body.classList.contains('dark-mode')).toBe(true);
});
