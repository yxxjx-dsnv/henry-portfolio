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




test('[more] (and a slingshot release) glide to the site', () => {
  start(0);
  band.toSite();
  settle();
  expect(y).toBe(EDGE);
});

test('while the badge is held, a drag on it moves the badge, not the page', () => {
  start(0);
  band.hold(true);
  stroke(25, 30);
  settle();
  expect(y).toBe(30 * 25); // the browser scrolled; the band stayed out of it
  band.hold(false);
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

/** A finger dragging from `from` to `to` (clientY) in 10px moves, then lifting. */
function swipe(from: number, to: number) {
  const touch = (type: string, clientY: number) => {
    const e = new Event(type, { cancelable: true }) as Event & { touches: { clientY: number }[] };
    Object.defineProperty(e, 'touches', { value: type === 'touchend' ? [] : [{ clientY }] });
    window.dispatchEvent(e);
    return e;
  };
  touch('touchstart', from);
  const step = from < to ? 10 : -10;
  for (let c = from + step; step > 0 ? c <= to : c >= to; c += step) {
    const e = touch('touchmove', c);
    if (!e.defaultPrevented) y = Math.min(Math.max(0, y - step), 5000); // the browser scrolls
    vi.advanceTimersByTime(16);
  }
  touch('touchend', to);
}

test('on a phone, a decent swipe down at the top of the site goes back to the badge', () => {
  start(EDGE);
  swipe(200, 420); // finger moves 220px down the screen = the page asked to go up
  settle();
  expect(y).toBe(0);
});

test('on a phone, a short swipe at the top of the site only lets the cover peek', () => {
  start(EDGE);
  swipe(200, 260);
  settle();
  expect(y).toBe(EDGE);
});

test('on a phone, a swipe up on the badge cover goes down to the site', () => {
  start(0);
  swipe(500, 380);
  settle();
  expect(y).toBe(EDGE);
});
