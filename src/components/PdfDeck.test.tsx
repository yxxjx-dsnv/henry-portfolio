import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PdfDeck } from './PdfDeck';

type Task = { width: number; promise: Promise<void>; cancel: () => void; cancelled: boolean };
const tasks: Task[] = [];
const getDocument = vi.fn();

vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {}, getDocument: (o: unknown) => getDocument(o) }));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '' }));

// slides 800 x 450; a drawing stays under way until cancelled
const page = {
  getViewport: ({ scale }: { scale: number }) => ({ width: 800 * scale, height: 450 * scale }),
  render: ({ viewport }: { viewport: { width: number } }) => {
    let fail = () => {};
    const task: Task = {
      width: viewport.width,
      promise: new Promise<void>((_, reject) => (fail = () => reject(new Error('cancelled')))),
      cancel: () => {
        task.cancelled = true;
        fail();
      },
      cancelled: false,
    };
    tasks.push(task);
    return task;
  },
};

let resized: () => void = () => {};
let trackW = 500;
let trackH = 300;
const clientWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth')!;
const clientHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight')!;

beforeEach(() => {
  tasks.length = 0;
  getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 3, getPage: async () => page }), destroy: () => {} });
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private cb: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.cb([{ isIntersecting: true, target } as unknown as IntersectionObserverEntry], this as never);
      }
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(cb: () => void) {
        resized = cb;
      }
      observe() {
        resized();
      }
      disconnect() {}
    },
  );
  const track = (el: Element) => el.classList.contains('pdf-deck-track');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get() { return track(this) ? trackW : 0; } });
  Object.defineProperty(Element.prototype, 'clientHeight', { configurable: true, get() { return track(this) ? trackH : 0; } });
});

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(Element.prototype, 'clientWidth', clientWidth);
  Object.defineProperty(Element.prototype, 'clientHeight', clientHeight);
  trackW = 500;
  trackH = 300;
});

test('expanded, the slide being read stays, and the slides draw again for the new size without fetching the PDF again', async () => {
  render(<PdfDeck src="/deck.pdf" title="Deck" />);
  const track = await screen.findByRole('group', { name: 'Deck' });
  await waitFor(() => expect(tasks.map((t) => t.width)).toEqual([500, 500, 500]));

  fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
  track.scrollLeft = 500;
  fireEvent.scroll(track); // landed on slide 2
  expect(screen.getByText('2 / 3')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Expand Deck' }));
  trackW = 1000;
  trackH = 400;
  track.scrollLeft = 2000;
  fireEvent.scroll(track); // the old offset under the new width, before the observer has run: not a slide turn
  act(() => resized());
  expect(track.scrollLeft).toBe(1000); // slide 2 at the new width
  expect(screen.getByText('2 / 3')).toBeInTheDocument();

  // fitted whole: 400 tall allows 400 * 800 / 450 wide, less than the 1000 there is
  const fitted = (400 * 800) / 450;
  await waitFor(() => expect(tasks.slice(3).map((t) => t.width)).toEqual([fitted, fitted, fitted]));
  expect(tasks.slice(0, 3).every((t) => t.cancelled)).toBe(true); // the stale drawings stopped
  expect(getDocument).toHaveBeenCalledTimes(1);
});
