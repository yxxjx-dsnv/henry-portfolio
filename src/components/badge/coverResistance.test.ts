import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { attachCoverResistance } from './coverResistance';

const EDGE = 800;
let band: ReturnType<typeof attachCoverResistance>;
let y: number;

function start(at: number) {
  y = at;
  band = attachCoverResistance({ offsetTop: 0, offsetHeight: EDGE });
}
beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => y });
  window.scrollTo = vi.fn((o: ScrollToOptions) => {
    y = o.top ?? y;
  }) as unknown as typeof window.scrollTo;
});
afterEach(() => {
  band.dispose();
  vi.useRealTimers();
});

/** A trackpad stroke: `n` wheel events of `d` px, one per frame. */
function stroke(d: number, n: number) {
  for (let i = 0; i < n; i++) {
    const e = new WheelEvent('wheel', { deltaY: d, cancelable: true });
    window.dispatchEvent(e);
    if (!e.defaultPrevented) y = Math.min(Math.max(0, y + d), 5000); // the browser scrolls
    vi.advanceTimersByTime(16);
  }
}
const settle = () => vi.advanceTimersByTime(2500);

test('scrolling inside the site is untouched', () => {
  start(2000);
  stroke(-20, 5);
  expect(y).toBe(1900);
});

test('a short push up from the site only stretches, then springs back', () => {
  start(EDGE);
  stroke(-15, 8);
  expect(y).toBeLessThan(EDGE);
  expect(y).toBeGreaterThan(EDGE - 120);
  settle();
  expect(y).toBe(EDGE);
});

test('a long push up from the site gives way and glides to the badge', () => {
  start(EDGE);
  stroke(-25, 60);
  settle();
  expect(y).toBe(0);
});

test('going back up takes a harder push than coming down', () => {
  // a push that carries the badge down to the site…
  start(0);
  stroke(25, 30);
  settle();
  expect(y).toBe(EDGE);
  // …only lets the cover peek when made back up from the site
  vi.advanceTimersByTime(300);
  stroke(-25, 30);
  settle();
  expect(y).toBe(EDGE);
});

test('a fling that just reaches the edge lands softly at the top of the site', () => {
  start(EDGE + 200);
  stroke(-40, 30); // one unbroken stroke from inside the site
  settle();
  expect(y).toBe(EDGE);
});

test('down from the badge works the same way: a nudge springs back, a push goes', () => {
  start(0);
  stroke(15, 8);
  expect(y).toBeGreaterThan(0);
  settle();
  expect(y).toBe(0);
  stroke(25, 30);
  settle();
  expect(y).toBe(EDGE);
});

test('the tease tugs the cover toward the site and comes back to rest', () => {
  start(0);
  band.tease();
  vi.advanceTimersByTime(380);
  expect(y).toBeGreaterThan(40);
  settle();
  expect(y).toBe(0);
});

test('scrolling during a tease takes over smoothly instead of snapping', () => {
  start(0);
  band.tease();
  vi.advanceTimersByTime(380);
  const mid = y;
  stroke(2, 1);
  expect(Math.abs(y - mid)).toBeLessThan(15);
});

test('a scroll from elsewhere (a link, the keyboard) cancels a tease', () => {
  start(0);
  band.tease();
  vi.advanceTimersByTime(200);
  y = EDGE; // e.g. the [more] link jumping to the site
  window.dispatchEvent(new Event('scroll'));
  settle();
  expect(y).toBe(EDGE);
});

test('[more] glides to the site even in the middle of a tease', () => {
  start(0);
  band.tease();
  vi.advanceTimersByTime(300);
  band.toSite();
  settle();
  expect(y).toBe(EDGE);
});

test('scrolling back down while the cover peeks follows the hand, no dead zone', () => {
  start(EDGE);
  stroke(-20, 10); // peek
  vi.advanceTimersByTime(40);
  const peek = y;
  stroke(15, 3);
  expect(y).toBeGreaterThan(peek); // already heading back down, right away
  settle();
  expect(y).toBe(EDGE);
});
