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

test("momentum the browser won't cancel can't scroll the page while the band holds it", () => {
  // scrolling up inside the site: the gesture's first event went through, so the
  // rest can't be cancelled (Chrome), and the browser would scroll on its own
  start(EDGE + 60);
  const root = document.documentElement;
  let fought = 0;
  for (let i = 0; i < 20; i++) {
    const e = new WheelEvent('wheel', { deltaY: -20, cancelable: false });
    window.dispatchEvent(e);
    if (getComputedStyle(root).overflowY !== 'hidden' && !root.classList.contains('band-held')) y = Math.max(0, y - 20);
    else fought++;
    vi.advanceTimersByTime(16);
  }
  expect(fought).toBeGreaterThan(0); // held once it reached the edge
  expect(y).toBeGreaterThan(EDGE - 120); // only the band's stretch, not the momentum
  settle();
  expect(y).toBe(EDGE);
  expect(root.classList.contains('band-held')).toBe(false); // and scrolling is free again
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
  stroke(25, 20);
  settle();
  expect(y).toBe(EDGE);
  // …only lets the cover peek when made back up from the site
  vi.advanceTimersByTime(300);
  stroke(-25, 20);
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


test('ctrl+wheel and a trackpad pinch zoom the page; the band stays out of it', () => {
  start(0);
  for (let i = 0; i < 30; i++) {
    const e = new WheelEvent('wheel', { deltaY: 25, ctrlKey: true, cancelable: true });
    window.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    vi.advanceTimersByTime(16);
  }
  settle();
  expect(y).toBe(0);
});

/** `n` wheel events of `d` px over `el`; true when none was cancelled. */
function wheelOver(el: Element, d: number, n: number) {
  let free = true;
  for (let i = 0; i < n; i++) {
    const e = new WheelEvent('wheel', { deltaY: d, cancelable: true, bubbles: true });
    el.dispatchEvent(e);
    free &&= !e.defaultPrevented;
    vi.advanceTimersByTime(16);
  }
  return free;
}

test('wheeling over the ⌘K palette on the cover scrolls its list, not the page behind', () => {
  start(0);
  document.body.innerHTML =
    '<div class="cmdk" role="dialog"><input class="cmdk-input"><ul class="cmdk-list" style="overflow-y: auto"><li>Home</li></ul></div>';
  const list = document.querySelector('ul')!;
  Object.defineProperty(list, 'scrollHeight', { value: 725 });
  Object.defineProperty(list, 'clientHeight', { value: 320 });
  // the list has room to scroll: the wheel is the list's
  expect(wheelOver(document.querySelector('li')!, 25, 1)).toBe(true);
  // over the input (or past the end of the list) nothing should move: the page
  // behind stays on the cover instead of scrolling natively
  expect(wheelOver(document.querySelector('input')!, 25, 30)).toBe(false);
  list.scrollTop = 405;
  expect(wheelOver(document.querySelector('li')!, 25, 1)).toBe(false);
  settle();
  expect(y).toBe(0);
  document.body.innerHTML = '';
});

test('a box that scrolls on its own keeps its wheel, even at the top of the site', () => {
  start(EDGE);
  document.body.innerHTML = '<div style="overflow-y: auto"><p>text</p></div>';
  const box = document.querySelector('div')!;
  Object.defineProperty(box, 'scrollHeight', { value: 725 });
  Object.defineProperty(box, 'clientHeight', { value: 320 });
  box.scrollTop = 200; // with room to scroll up, the wheel is the box's
  expect(wheelOver(box.firstElementChild!, -25, 1)).toBe(true);
  // at the box's own top, the same wheel must not carry the page up onto the cover
  box.scrollTop = 0;
  expect(wheelOver(box.firstElementChild!, -25, 30)).toBe(false);
  settle();
  expect(y).toBe(EDGE);
  document.body.innerHTML = '';
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

/** A touch event with fingers at these clientYs. */
function touch(type: string, ...ys: number[]) {
  const e = new Event(type, { cancelable: true }) as Event & { touches: { clientY: number }[] };
  Object.defineProperty(e, 'touches', { value: ys.map((clientY) => ({ clientY })) });
  window.dispatchEvent(e);
  return e;
}

/** A finger dragging from `from` to `to` (clientY) in 10px moves, then lifting. */
function swipe(from: number, to: number) {
  touch('touchstart', from);
  const step = from < to ? 10 : -10;
  for (let c = from + step; step > 0 ? c <= to : c >= to; c += step) {
    const e = touch('touchmove', c);
    if (!e.defaultPrevented) y = Math.min(Math.max(0, y - step), 5000); // the browser scrolls
    vi.advanceTimersByTime(16);
  }
  touch('touchend');
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

test('on a phone, two fingers pinch-zoom the cover: the band never cancels them', () => {
  start(0);
  touch('touchstart', 500);
  touch('touchstart', 500, 300);
  for (let i = 1; i <= 10; i++) {
    expect(touch('touchmove', 500 - i * 10, 300 + i * 10).defaultPrevented).toBe(false);
    vi.advanceTimersByTime(16);
  }
  touch('touchend', 400); // one finger lifts; the other is still the pinch's
  expect(touch('touchmove', 300).defaultPrevented).toBe(false);
  touch('touchend');
  settle();
  expect(y).toBe(0);
});
