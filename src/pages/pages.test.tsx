import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Home } from './Home';
import { Essays } from './Essays';
import { ExtraCurricular } from './ExtraCurricular';
import { Education } from './Education';
import { activities } from '../data/activities';

// ExtraCurricular now contains an internal story link, so it needs a router.
const renderExtraCurricular = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ExtraCurricular />
    </MemoryRouter>,
  );

// Home links to the Projects page from the Branphic bullet, so it needs a router too.
const renderHome = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Home />
    </MemoryRouter>,
  );

test('Home shows the name hero and the Korea trigger', () => {
  renderHome();
  expect(screen.getByRole('heading', { name: 'Henry Kim' })).toBeInTheDocument();
  expect(screen.getByText('South Korea')).toHaveAttribute('id', 'korea-trigger');
  expect(screen.getByText(/Some things about me:/)).toBeInTheDocument();
});

test('Essays shows the essay hero and prompt', () => {
  render(<Essays />);
  expect(screen.getByRole('heading', { name: 'Learnings from past three years' })).toBeInTheDocument();
  expect(screen.getByText(/Prompt: Discuss an accomplishment/)).toBeInTheDocument();
  expect(screen.getByText(/Incheon International Airport/)).toBeInTheDocument();
});

test('ExtraCurricular renders one timeline item per activity', () => {
  const { container } = renderExtraCurricular();
  expect(screen.getByRole('heading', { name: 'Extra-Curricular' })).toBeInTheDocument();
  expect(container.querySelectorAll('.activity-item')).toHaveLength(activities.length);
});

test('timeline rows are announced as expandable controls — BUG-3', () => {
  const { container } = renderExtraCurricular();
  const row = container.querySelector('.activity-item')!;
  expect(row).toHaveAttribute('role', 'button');
  expect(row).toHaveAttribute('aria-expanded', 'false');
  fireEvent.focus(row);
  expect(row).toHaveAttribute('aria-expanded', 'true');
  fireEvent.keyDown(row, { key: 'Enter' });
  expect(row.className).toContain('is-open');
});

test('the Korea trigger is a real button', () => {
  renderHome();
  expect(screen.getByRole('button', { name: 'South Korea' })).toHaveAttribute('id', 'korea-trigger');
});

test('Education renders 2 school groups with nested programs', () => {
  const { container } = render(<Education />);
  expect(screen.getByRole('heading', { name: 'Education' })).toBeInTheDocument();
  expect(container.querySelectorAll('.edu-group')).toHaveLength(2);
  expect(container.querySelectorAll('.edu-entry')).toHaveLength(5);
  expect(screen.getByText(/Electrical & Computer Engineering/)).toBeInTheDocument();
  expect(screen.getByText('Fall 2025')).toBeInTheDocument();
  expect(screen.getByText('Grade 10 – 12')).toBeInTheDocument();
  // military-service interlude, centered + faded
  expect(screen.getByText(/Military Service/)).toBeInTheDocument();
  expect(container.querySelector('.edu-break .edu-break-line')).toBeTruthy();
});
