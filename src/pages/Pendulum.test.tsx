import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Pendulum } from './Pendulum';

const renderPage = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Pendulum />
    </MemoryRouter>,
  );

test('renders the hero and the way back to Projects', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: 'Analysis of a Simple Pendulum' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /All projects/ })).toHaveAttribute('href', '/projects');
});

test('credits Henry with his LinkedIn', () => {
  renderPage();
  expect(screen.getByRole('link', { name: 'Henry Kim' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/henry-kim-uoft/',
  );
});

test('shows the rig carousel and all five result graphs with reserved dimensions', () => {
  renderPage();
  // 6 build/rig slides + 5 graph figures = 11 images
  const images = screen.getAllByRole('img');
  expect(images).toHaveLength(12);
  for (const img of images) {
    expect(img.getAttribute('alt')!.length).toBeGreaterThan(0);
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(Number(img.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(img.getAttribute('height'))).toBeGreaterThan(0);
  }
});

test('embeds the swing clip with native controls and no autoplay', () => {
  renderPage();
  const video = document.querySelector('video[src="/media/pendulum/swing.mp4"]')!;
  expect(video).toBeTruthy();
  expect(video).toHaveAttribute('controls');
  expect(video).not.toHaveAttribute('autoplay');
});

test('the final report flows inline and the six scripts sit in the shelf', () => {
  renderPage();
  expect(document.querySelector('.pdf-flow')).toBeTruthy();
  expect(document.querySelectorAll('.doc-row')).toHaveLength(6);
});

test('a fitting script opens in the IDE viewer with highlighted Python', async () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: /time-vs-amplitude\.py/ }));
  await waitFor(() => expect(document.querySelector('.code-viewer')).toBeTruthy());
  const viewer = document.querySelector('.code-viewer')!;
  expect(viewer.querySelectorAll('.tk-kw').length).toBeGreaterThan(5);
});
