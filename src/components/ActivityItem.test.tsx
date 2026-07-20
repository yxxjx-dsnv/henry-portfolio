import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ActivityItem } from './ActivityItem';

test('renders prefix, linked org, suffix, date, and details', () => {
  render(
    <ActivityItem
      item={{
        prefix: 'Executive member at ',
        link: { label: 'UTKESA', url: 'https://example.com' },
        suffix: ' in Event Dept.',
        date: 'Sep 2025 - present',
        detail: ['Para one.', 'Para two.'],
      }}
    />,
  );
  expect(screen.getByText(/Executive member at/)).toBeInTheDocument();
  const link = screen.getByRole('link', { name: 'UTKESA' });
  expect(link).toHaveAttribute('href', 'https://example.com');
  expect(screen.getByText(/in Event Dept\./)).toBeInTheDocument();
  expect(screen.getByText('Sep 2025 - present')).toBeInTheDocument();
  expect(screen.getByText('Para one.')).toBeInTheDocument();
  expect(screen.getByText('Para two.')).toBeInTheDocument();
});

test('renders a link without href when url is absent (MONO case)', () => {
  render(
    <ActivityItem
      item={{ prefix: 'Founder & CEO at ', link: { label: 'MONO' }, suffix: ' (Startup)', date: 'x' }}
    />,
  );
  const link = screen.getByText('MONO');
  expect(link.tagName).toBe('A');
  expect(link).not.toHaveAttribute('href');
});

test('a slugged activity titles itself as a link to its story page', () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ActivityItem item={{ prefix: 'X', date: 'Feb 2026', slug: 'greenstone-grind' }} />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'X' })).toHaveAttribute(
    'href',
    '/extra-curricular/greenstone-grind',
  );
});
