import { render, screen, fireEvent, within } from '@testing-library/react';
import { CampusPulseDash } from './CampusPulseDash';

test('renders the building directory and the best-location recommendation', () => {
  render(<CampusPulseDash />);
  for (const name of ['Robarts', 'Gerstein', 'Bahen', 'Sidney Smith']) {
    expect(screen.getByRole('button', { name: new RegExp(name) })).toBeInTheDocument();
  }
  expect(screen.getByText('Best location recommendation')).toBeInTheDocument();
});

test('sorts most-crowded first by default and least-crowded on request', () => {
  const { container } = render(<CampusPulseDash />);
  const firstName = () => container.querySelector('.cp-row .cp-row-name')!.textContent;
  // default "Most crowded" → Robarts (82%) on top
  expect(firstName()).toBe('Robarts');
  fireEvent.change(screen.getByLabelText('Sort buildings'), { target: { value: 'quiet' } });
  // "Least crowded" → Sidney Smith (29%) on top
  expect(firstName()).toBe('Sidney Smith');
});

test('search filters the directory and shows an empty state', () => {
  render(<CampusPulseDash />);
  const box = screen.getByLabelText('Search supported buildings');
  fireEvent.change(box, { target: { value: 'bahen' } });
  expect(screen.getByRole('button', { name: /Bahen/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Robarts/ })).toBeNull();
  fireEvent.change(box, { target: { value: 'zzz' } });
  expect(screen.getByText('No buildings match your search.')).toBeInTheDocument();
});

test('opens a building detail page and returns with Back', () => {
  render(<CampusPulseDash />);
  fireEvent.click(screen.getByRole('button', { name: /Robarts/ }));
  expect(screen.getByText('Floor Details')).toBeInTheDocument();
  expect(screen.getByText(/Occupancy Trend/)).toBeInTheDocument();
  // the floor table view is reachable
  fireEvent.click(screen.getByRole('button', { name: 'Table' }));
  expect(screen.getByRole('columnheader', { name: 'Occupancy' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Back/ }));
  expect(screen.getByLabelText('Search supported buildings')).toBeInTheDocument();
});

test('surfaces the Gerstein emergency alert on its detail page', () => {
  render(<CampusPulseDash />);
  fireEvent.click(screen.getByRole('button', { name: /Gerstein/ }));
  const alert = screen.getByText('Emergency / service alert').closest('.cp-alert')!;
  expect(within(alert as HTMLElement).getByText(/elevator disruption/)).toBeInTheDocument();
});
