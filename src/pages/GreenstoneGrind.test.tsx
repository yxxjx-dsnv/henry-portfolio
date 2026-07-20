import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GreenstoneGrind } from './GreenstoneGrind';

const renderPage = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <GreenstoneGrind />
    </MemoryRouter>,
  );

test('renders the hero and the way back to Extra-Curricular', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: 'The Greenstone Grind' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /All activities/ })).toHaveAttribute(
    'href',
    '/extra-curricular',
  );
});

test('links out to the mine and the Ontario Mining Association', () => {
  renderPage();
  expect(screen.getByRole('link', { name: 'Greenstone Mine' })).toHaveAttribute(
    'href',
    'https://greenstonegoldmines.com',
  );
  expect(screen.getByRole('link', { name: 'Ontario Mining Association' })).toHaveAttribute(
    'href',
    'https://oma.on.ca',
  );
});

test('shows every photograph across the section carousels with alt text and reserved dimensions', () => {
  renderPage();
  // email + journey 3 + arrival 6 + pit 13 + mill 10 + shop 1 + stays 2 + group 1 = 37
  const images = screen.getAllByRole('img');
  expect(images).toHaveLength(37);
  for (const img of images) {
    expect(img.getAttribute('alt')!.length).toBeGreaterThan(0);
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(Number(img.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(img.getAttribute('height'))).toBeGreaterThan(0);
  }
});

test('embeds the clips (pit, group, and official reel) with native controls and no autoplay', () => {
  renderPage();
  const videos = document.querySelectorAll('video');
  expect(videos.length).toBe(5);
  for (const v of videos) {
    expect(v).toHaveAttribute('controls');
    expect(v).not.toHaveAttribute('autoplay');
  }
  const reel = document.querySelector('video[src="/media/greenstone-grind/reel.mp4"]')!;
  expect(reel).toBeTruthy();
});
