import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Where the page sits after a route change.
// - A new page (a link, a key, the palette) starts at the top, as the original
//   site did. Coming back to Home that way lands on the site itself, below the
//   badge cover, which greets only an arrival.
// - A link to a #section of a page (/projects/aerious#mono) opens it there.
// - Back and Forward return to where the reader was on that page. The browser
//   can't do this for a single-page app (the new page is not drawn yet when it
//   tries), so each history entry's scroll position is remembered here, in
//   sessionStorage so it outlives a reload of the tab.
// A layout effect, so a new page is never painted at the old page's position
// (on Home that showed a flash of the cover and a faded sidebar, like a reload).

const STORE = 'scroll-positions';

function load(): Map<string, number> {
  try {
    return new Map(JSON.parse(sessionStorage.getItem(STORE) ?? '[]') as [string, number][]);
  } catch {
    return new Map();
  }
}

/**
 * The history entry's id for remembering its position. react-router gives every
 * entry it creates a key; an entry it did not create (the arrival, or a #fragment
 * typed into the address bar) is reported as 'default'. Only the arrival — the
 * one with the router's index 0 — may use that shared name.
 */
function entryId(key: string): string | null {
  if (key !== 'default') return key;
  const state = window.history.state as { idx?: number } | null;
  return state?.idx === 0 ? 'default' : null;
}

export function useRouteScroll() {
  const location = useLocation();
  const navType = useNavigationType();
  const positions = useRef<Map<string, number> | null>(null);
  positions.current ??= load();
  const entry = useRef(entryId(location.key)); // the history entry on screen
  const shownKey = useRef(location.key);
  const previous = useRef<string | null>(null); // the previous page's path; null on arrival
  const previousHash = useRef('');
  const handled = useRef<string | null>(null); // the location last placed

  // Remember where the reader was on the page being left. Read while rendering
  // the new location: the old page is still on screen until React commits, so
  // this is its real position (a scroll listener misses positions the browser
  // never reported, e.g. in a background tab).
  if (shownKey.current !== location.key && entry.current) {
    positions.current.set(entry.current, window.scrollY);
    try {
      sessionStorage.setItem(STORE, JSON.stringify([...positions.current].slice(-50)));
    } catch {
      /* private mode */
    }
  }

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);

  useLayoutEffect(() => {
    // React's dev StrictMode runs this twice on arrival; the second run would
    // restore a stale 'default' position from sessionStorage over the #anchor
    const at = location.key + location.pathname + location.hash;
    if (handled.current === at) return;
    handled.current = at;
    const arrival = previous.current === null;
    const samePage = previous.current === location.pathname;
    const hadHash = previousHash.current !== '';
    previous.current = location.pathname;
    previousHash.current = location.hash;
    shownKey.current = location.key;
    entry.current = entryId(location.key);

    const saved = !arrival && navType === 'POP' && entry.current ? positions.current!.get(entry.current) : undefined;
    if (saved !== undefined) return restore(saved);
    // a #fragment naming a section on the page (/projects/aerious#mono) opens there
    const anchor = location.hash ? document.getElementById(location.hash.slice(1)) : null;
    // the same page again: stay put, unless a link asked for a section of it,
    // or left a section for the page itself (#mono -> the top of the page)
    if (samePage && !(navType !== 'POP' && (anchor || hadHash))) return;

    const backHome = location.pathname === '/' && !arrival;
    let top = 0;
    if (anchor) {
      // layout offsets, not getBoundingClientRect: the page is still mid rise-in (route-in's translateY)
      for (let n: HTMLElement | null = anchor; n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop;
    } else if (backHome) {
      const cover = document.querySelector<HTMLElement>('.badge-cover');
      const tail = document.querySelector<HTMLElement>('.badge-cover-tail');
      top = (cover?.offsetHeight ?? 0) + (tail?.offsetHeight ?? 0);
    }
    scrollToY(top);
  }, [location.key, location.pathname, location.hash, navType]);
}

function scrollToY(top: number) {
  try {
    window.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
  } catch {
    /* jsdom */
  }
}

/**
 * Scroll back to `y`, and hold it there for a second and a half: a page keeps
 * growing after it is first drawn (PDF decks, videos, images above the reader),
 * and the browser's scroll anchoring would follow that content and carry the
 * reader a screen away. Anything the reader does ends the hold.
 * (A timer, not requestAnimationFrame: frames don't run in a background tab.)
 */
function restore(y: number) {
  const root = document.documentElement;
  const anchor = root.style.overflowAnchor;
  root.style.overflowAnchor = 'none';
  let timer: ReturnType<typeof setTimeout> | undefined;
  let ticks = 0;
  const done = () => {
    clearTimeout(timer);
    root.style.overflowAnchor = anchor;
    for (const ev of USER_INPUT) window.removeEventListener(ev, done);
  };
  const hold = () => {
    if (Math.abs(window.scrollY - y) > 1) scrollToY(y);
    if (ticks++ < 30) timer = setTimeout(hold, 50);
    else done();
  };
  for (const ev of USER_INPUT) window.addEventListener(ev, done, { passive: true });
  scrollToY(y);
  timer = setTimeout(hold, 50);
  return done; // a newer navigation ends an unfinished hold
}

const USER_INPUT = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
