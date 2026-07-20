import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GyroscopeWand } from './GyroscopeWand';

const renderPage = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <GyroscopeWand />
    </MemoryRouter>,
  );

test('renders the hero and the way back to Projects', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: 'The Gyroscope Wand' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /All projects/ })).toHaveAttribute('href', '/projects');
});

test('credits the team and the client with their links', () => {
  renderPage();
  expect(screen.getByRole('link', { name: 'Kamilia Desroches Parchment' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/kamilia-desroches-parchment-8703a8368/',
  );
  expect(screen.getByRole('link', { name: 'Alexandre Klaus' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/alexandre-j-w-klaus/',
  );
  expect(screen.getByRole('link', { name: 'Henry Kim' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/henry-kim-85b554336/',
  );
  expect(screen.getByRole('link', { name: 'Skule™ Kup' })).toHaveAttribute(
    'href',
    'https://www.instagram.com/skuletm_kup/',
  );
  // Shannon has no public link; still credited by name.
  expect(screen.getByText(/Shannon Ho/)).toBeInTheDocument();
});

test('shows every photograph and render with alt text, lazy loading, and reserved dimensions', () => {
  renderPage();
  // 38 image slides (11 concepts + 7 modeling + 6 bench + 4 legwork + 5 build
  // + 3 presenting + 2 paperwork) + the whiteboard figure + the 3D poster
  const images = screen.getAllByRole('img');
  expect(images).toHaveLength(40);
  for (const img of images) {
    expect(img.getAttribute('alt')!.length).toBeGreaterThan(0);
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(Number(img.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(img.getAttribute('height'))).toBeGreaterThan(0);
  }
});

test('carousels page through their slides with the edge arrows', () => {
  renderPage();
  const track = screen.getByRole('group', { name: 'Blender model and renders' });
  const carousel = track.closest('.story-carousel')!;
  expect(carousel.textContent).toContain('1 / 7');
  const next = carousel.querySelector('.carousel-next')!;
  const prev = carousel.querySelector('.carousel-prev')!;
  expect(prev).toHaveAttribute('aria-disabled', 'true');
  fireEvent.click(next);
  expect(carousel.textContent).toContain('2 / 7');
  expect(prev).toHaveAttribute('aria-disabled', 'false');
});

test('the document shelf opens PDFs in the in-page reader', () => {
  renderPage();
  const row = screen.getByRole('button', { name: /Conceptual Design Specification/ });
  expect(row).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(row);
  expect(row).toHaveAttribute('aria-expanded', 'true');
  expect(document.querySelector('.pdf-viewer')).toBeTruthy();
  expect(screen.getByRole('link', { name: /open in its own tab/ })).toHaveAttribute(
    'href',
    '/media/gyroscope-wand/cds.pdf',
  );
});

test('the firmware row opens the IDE-style code viewer with highlighted source', () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: /Two_wand_system\.ino/ }));
  const viewer = document.querySelector('.code-viewer')!;
  expect(viewer).toBeTruthy();
  expect(viewer.querySelectorAll('.code-line').length).toBeGreaterThan(400);
  expect(viewer.querySelectorAll('.tk-kw').length).toBeGreaterThan(50);
  expect(viewer.textContent).toContain('TCA9548A');
});

test('the 3D model waits behind a poster button', () => {
  renderPage();
  const poster = screen.getByRole('button', { name: /View in 3D/ });
  expect(poster).toBeInTheDocument();
  expect(document.querySelector('canvas')).toBeNull();
});

test('embeds all four clips with native controls and no autoplay', () => {
  renderPage();
  const videos = document.querySelectorAll('video');
  expect(videos).toHaveLength(4);
  for (const v of videos) {
    expect(v).toHaveAttribute('controls');
    expect(v).not.toHaveAttribute('autoplay');
  }
  for (const src of ['bench-serial', 'bench-home', 'demo-shake', 'demo-two-wands']) {
    expect(document.querySelector(`video[src="/media/gyroscope-wand/${src}.mp4"]`)).toBeTruthy();
  }
});
