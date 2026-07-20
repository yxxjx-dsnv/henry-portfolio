import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectItem } from './ProjectItem';

test('renders name, date with stack, and detail', () => {
  render(
    <ProjectItem
      project={{ name: 'Branphic AI Suite', date: '2026', stack: ['Next.js', 'TS'], detail: ['desc one.'] }}
    />,
  );
  expect(screen.getByText('Branphic AI Suite')).toBeInTheDocument();
  expect(screen.getByText('2026 · Next.js, TS')).toBeInTheDocument();
  expect(screen.getByText('desc one.')).toBeInTheDocument();
});

test('shows date only when no stack is given', () => {
  render(<ProjectItem project={{ name: 'X', date: '2025' }} />);
  expect(screen.getByText('2025')).toBeInTheDocument();
});

test('renders an optional link', () => {
  render(<ProjectItem project={{ name: 'X', date: '2025', link: { label: 'repo', url: 'https://example.com' } }} />);
  expect(screen.getByRole('link', { name: 'repo' })).toHaveAttribute('href', 'https://example.com');
});

test('a slugged project titles itself as a link to its story page', () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ProjectItem project={{ name: 'X', date: '2026', slug: 'campus-pulse' }} />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'X' })).toHaveAttribute('href', '/projects/campus-pulse');
});
