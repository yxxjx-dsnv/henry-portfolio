import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HolyBridge } from './HolyBridge';

const renderPage = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <HolyBridge />
    </MemoryRouter>,
  );

test('renders the hero and the way back to Projects', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: 'The Holy Bridge' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /All projects/ })).toHaveAttribute('href', '/projects');
});

test('credits Team 107 and links Henry', () => {
  renderPage();
  expect(screen.getByText(/Alan W\., Luyu VK\./)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Henry Kim' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/henry-kim-uoft/',
  );
});

test('shows the hero photo and every carousel with reserved dimensions', () => {
  renderPage();
  // analysis 7 + marking 5 + gluing 6 + assembly 4 + finished 7 + test day 3 = 32 carousel slides,
  // plus hero + layer-heatmap + two BridgeStudio posters + failure photo = 37.
  const images = screen.getAllByRole('img');
  expect(images).toHaveLength(37);
  for (const img of images) {
    expect(img.getAttribute('alt')!.length).toBeGreaterThan(0);
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(Number(img.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(img.getAttribute('height'))).toBeGreaterThan(0);
  }
});

test('embeds the cutting and gluing clips with native controls and no autoplay', () => {
  renderPage();
  const videos = document.querySelectorAll('video');
  expect(videos).toHaveLength(2);
  for (const v of videos) {
    expect(v).toHaveAttribute('controls');
    expect(v).not.toHaveAttribute('autoplay');
  }
  expect(document.querySelector('video[src="/media/civ102-bridge/cutting.mp4"]')).toBeTruthy();
  expect(document.querySelector('video[src="/media/civ102-bridge/gluing.mp4"]')).toBeTruthy();
});

test('reports the honest test-day failure at the splice', () => {
  const { container } = renderPage();
  expect(container.querySelector('.story-head')).toBeTruthy();
  expect(container.textContent).toContain('Test day');
  expect(container.textContent).toContain('failed at 133');
  expect(container.textContent).toContain('splice');
  expect(document.querySelector('img[src="/media/civ102-bridge/photo-failure.jpg"]')).toBeTruthy();
});

test('offers the box girder as an interactive 3D model behind a poster', () => {
  renderPage();
  expect(screen.getByRole('button', { name: /View in 3D/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Run test day/ })).toBeInTheDocument();
  expect(document.querySelector('canvas')).toBeNull();
});

test('the design report flows inline on the page, not behind a shelf row', () => {
  renderPage();
  // report shown continuously via PdfFlow; not a shelf accordion row
  expect(document.querySelector('.pdf-flow')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Design Report/ })).toBeNull();
});

test('the document shelf lists the remaining five reports plus four scripts', () => {
  renderPage();
  const rows = document.querySelectorAll('.doc-row');
  expect(rows).toHaveLength(9);
  const calc = screen.getByRole('button', { name: /Design Calculations/ });
  fireEvent.click(calc);
  expect(calc).toHaveAttribute('aria-expanded', 'true');
  expect(document.querySelector('.pdf-viewer')).toBeTruthy();
});

test('the main engine script opens in the IDE viewer with highlighted Python', async () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: /civ102-team107-script\.py/ }));
  await waitFor(() => expect(document.querySelector('.code-viewer')).toBeTruthy());
  const viewer = document.querySelector('.code-viewer')!;
  expect(viewer.querySelectorAll('.tk-kw').length).toBeGreaterThan(10);
  expect(viewer.textContent).toContain('load_case');
});
