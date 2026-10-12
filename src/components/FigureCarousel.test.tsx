import { render, screen, fireEvent, act } from '@testing-library/react';
import { FigureCarousel } from './FigureCarousel';

const slides = Array.from({ length: 5 }, (_, i) => ({
  src: `/s${i}.jpg`,
  alt: `slide ${i + 1}`,
  caption: `caption ${i + 1}`,
  width: 4,
  height: 3,
}));

test('a swipe that cuts a chevron scroll short still moves the counter', () => {
  vi.useFakeTimers();
  try {
    render(<FigureCarousel slides={slides} label="deck" />);
    const track = screen.getByRole('group', { name: 'deck' });
    Object.defineProperty(track, 'clientWidth', { value: 100 });
    const scrollTo = (left: number) => {
      track.scrollLeft = left;
      fireEvent.scroll(track);
    };
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' })); // aims at slide 2
    scrollTo(30); // the smooth scroll starts...
    scrollTo(0); // ...and a swipe drags it back before it lands
    scrollTo(300); // then a swipe to slide 4
    act(() => void vi.advanceTimersByTime(200));
    expect(screen.getByText('4 / 5')).toBeInTheDocument();
    expect(screen.getByText('caption 4')).toBeInTheDocument();
    scrollTo(400); // and plain swipes are followed again
    expect(screen.getByText('5 / 5')).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});
