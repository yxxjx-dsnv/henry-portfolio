import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CampusPulse } from './CampusPulse';

const renderPage = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CampusPulse />
    </MemoryRouter>,
  );

test('renders the hero and the way back to Projects', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: 'Campus Pulse' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /All projects/ })).toHaveAttribute('href', '/projects');
});

test('credits every teammate with a LinkedIn link', () => {
  renderPage();
  expect(screen.getByRole('link', { name: 'Joshua Choi' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/joshua-choi-416-uoft/',
  );
  expect(screen.getByRole('link', { name: 'Suyeon Lee' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/suyeon-lee-443333393/',
  );
  expect(screen.getByRole('link', { name: 'Byeongmin Nam' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/byeongmin-nam-50a6852a0/',
  );
  expect(screen.getByRole('link', { name: 'Henry Kim' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/henry-kim-uoft/',
  );
});

test('the shelf opens the Rekognition engine in the IDE viewer', async () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: /video_processor\.py/ }));
  await waitFor(() => expect(document.querySelector('.code-viewer')).toBeTruthy());
  const viewer = document.querySelector('.code-viewer')!;
  expect(viewer.querySelectorAll('.tk-kw').length).toBeGreaterThan(20);
  expect(viewer.textContent).toContain('rekognition');
});

test('links out to the code and the Devpost entry', () => {
  renderPage();
  expect(screen.getByRole('link', { name: 'Code' })).toHaveAttribute(
    'href',
    'https://github.com/yxxjx-dsnv/AWS-Hackathon-project-Campus_Pulse',
  );
  expect(screen.getByRole('link', { name: 'Devpost' })).toHaveAttribute(
    'href',
    'https://devpost.com/software/campus-pulse-1u9aoy',
  );
});

test('plays the demo locally and turns the deck slide by slide with notes', () => {
  renderPage();
  const video = document.querySelector('video[src="/media/campus-pulse/demo.mp4"]')!;
  expect(video).toBeTruthy();
  expect(video).toHaveAttribute('controls');
  expect(video).not.toHaveAttribute('autoplay');
  // deck shows as a left-right slide deck, not a shelf row
  expect(document.querySelector('.pdf-deck')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Presentation deck/ })).toBeNull();
});

test('shows the photographs, each with alt text', () => {
  const { container } = renderPage();
  // the logo + 4 event photos (the detection frames are now video, see below)
  const images = Array.from(container.querySelectorAll('img'));
  expect(images).toHaveLength(5);
  for (const img of images) {
    expect(img).toHaveAttribute('alt');
    expect(img.getAttribute('alt')!.length).toBeGreaterThan(0);
    expect(img).toHaveAttribute('loading', 'lazy');
  }
});

test('runs the person-detector as video, one feed per building', () => {
  const { container } = renderPage();
  for (const b of ['detect-gerstein', 'detect-bahen', 'detect-sidney']) {
    expect(container.querySelector(`video[src="/media/campus-pulse/${b}.mp4"]`)).toBeTruthy();
  }
});

test('embeds the live interactive dashboard with the building directory', () => {
  renderPage();
  expect(document.querySelector('.cp-dash')).toBeTruthy();
  // every building is a clickable directory row
  for (const name of ['Robarts', 'Gerstein', 'Bahen', 'Sidney Smith']) {
    expect(screen.getByRole('button', { name: new RegExp(name) })).toBeInTheDocument();
  }
  // best-location banner recommends a building from the time-of-day occupancy
  expect(screen.getByText('Best location recommendation')).toBeInTheDocument();
  expect(screen.getByText(/Current best estimate:/)).toBeInTheDocument();
});
