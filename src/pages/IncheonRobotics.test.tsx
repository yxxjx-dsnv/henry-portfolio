import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IncheonRobotics } from './IncheonRobotics';

const renderPage = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <IncheonRobotics />
    </MemoryRouter>,
  );

test('renders the hero and the way back to Projects', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: 'Incheon ASRS' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /All projects/ })).toHaveAttribute('href', '/projects');
});

test('names the company and links its site', () => {
  renderPage();
  expect(screen.getByRole('link', { name: 'Incheon Robotics' })).toHaveAttribute(
    'href',
    'https://incheonrobotics.com',
  );
  expect(screen.getByText(/Incheon Global Campus, Songdo/)).toBeInTheDocument();
});

test('the voice chain is drawn, labelled, and ends in a robot command', () => {
  renderPage();
  // the SVG carries its own accessible name so the diagram is not a dead image
  expect(screen.getByRole('img', { name: /kiosk voice chain/i })).toBeInTheDocument();
  expect(screen.getByText(/Speech → text/)).toBeInTheDocument();
  expect(screen.getByText(/Intent → command/)).toBeInTheDocument();
  expect(screen.getByText(/"action": "retrieve"/)).toBeInTheDocument();
});

test('the robot spec table compares against the machines it is priced under', () => {
  renderPage();
  expect(screen.getByText('AutoStore R5')).toBeInTheDocument();
  expect(screen.getByText('Amazon Kiva')).toBeInTheDocument();
  expect(screen.getByText('8 kg')).toBeInTheDocument();
});

test('every figure image has real alt text and reserved dimensions', () => {
  const { container } = renderPage();
  const imgs = Array.from(container.querySelectorAll('.story-figure img'));
  expect(imgs.length).toBeGreaterThan(5);
  for (const img of imgs) {
    expect(img.getAttribute('alt')!.length).toBeGreaterThan(0);
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(Number(img.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(img.getAttribute('height'))).toBeGreaterThan(0);
  }
});

test('the four-minute product film does not download until asked', () => {
  const { container } = renderPage();
  const film = container.querySelector('video[poster]')!;
  expect(film).toHaveAttribute('preload', 'none');
  expect(film).toHaveAttribute('controls');
});

test('the 3D embeds stay dormant posters until asked (no WebGL in jsdom)', () => {
  renderPage();
  expect(screen.getByRole('button', { name: /Inspect the robot in 3D/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Open the mechanism in 3D/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Run the simulation/ })).toBeInTheDocument();
});

test('states plainly that nothing confidential is published', () => {
  renderPage();
  expect(screen.getByText(/Nothing\s+here is confidential/)).toBeInTheDocument();
});
