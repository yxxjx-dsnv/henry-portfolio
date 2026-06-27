import { render, screen } from '@testing-library/react';
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

test('clicking the logo toggles the dark-mode body class', async () => {
  document.body.className = '';
  localStorage.clear();
  renderAt('/');
  await userEvent.click(screen.getByAltText('Logo'));
  expect(document.body.classList.contains('dark-mode')).toBe(true);
});
