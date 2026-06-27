import { render, screen } from '@testing-library/react';
import { Projects } from './Projects';
import { projects } from '../data/projects';

test('Projects renders the hero and one dot-timeline item per project', () => {
  const { container } = render(<Projects />);
  expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
  expect(container.querySelectorAll('.activity-item')).toHaveLength(projects.length);
});
