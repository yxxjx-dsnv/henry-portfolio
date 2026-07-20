import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Projects } from './Projects';
import { projects } from '../data/projects';

const renderPage = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Projects />
    </MemoryRouter>,
  );

test('Projects renders the hero and one dot-timeline item per project', () => {
  const { container } = renderPage();
  expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
  expect(container.querySelectorAll('.activity-item')).toHaveLength(projects.length);
});

test('the Campus Pulse row links to its story page', () => {
  renderPage();
  expect(
    screen.getByRole('link', { name: 'Campus Pulse — Live Campus Occupancy Dashboard' }),
  ).toHaveAttribute('href', '/projects/campus-pulse');
});
