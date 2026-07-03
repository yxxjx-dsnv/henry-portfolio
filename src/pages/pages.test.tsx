import { render, screen } from '@testing-library/react';
import { Home } from './Home';
import { Essays } from './Essays';
import { ExtraCurricular } from './ExtraCurricular';
import { Education } from './Education';

test('Home shows the name hero and the Korea trigger', () => {
  render(<Home />);
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

test('ExtraCurricular renders all 7 activity items', () => {
  const { container } = render(<ExtraCurricular />);
  expect(screen.getByRole('heading', { name: 'Extra-Curricular' })).toBeInTheDocument();
  expect(container.querySelectorAll('.activity-item')).toHaveLength(7);
});

test('Education renders 2 school groups with nested programs', () => {
  const { container } = render(<Education />);
  expect(screen.getByRole('heading', { name: 'Education' })).toBeInTheDocument();
  expect(container.querySelectorAll('.edu-group')).toHaveLength(2);
  expect(container.querySelectorAll('.edu-entry')).toHaveLength(5);
  expect(screen.getByText(/Electrical & Computer Engineering/)).toBeInTheDocument();
  expect(screen.getByText('Freshman - Fall')).toBeInTheDocument();
  expect(screen.getByText('Grade 10 – 12')).toBeInTheDocument();
  // military-service interlude, centered + faded
  expect(screen.getByText(/Military Service/)).toBeInTheDocument();
  expect(container.querySelector('.edu-break .edu-break-line')).toBeTruthy();
});
