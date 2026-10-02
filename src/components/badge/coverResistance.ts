// The cover and the site are two resting places with a rubber band between
// them. Push past the edge (down from the badge, or up from the top of the site)
// and the page stretches a little, harder the further it goes; ease off and it
// springs back. Keep pushing and the band gives way: the page glides the rest of
// the way on a spring, picking up the speed you gave it. A fling that only
// happens to reach the edge counts for much less than a deliberate push, so a
// quick flick back up the site lands softly at its top instead of shooting past.
// Everything is drawn once per frame, so a trackpad's stream of tiny wheel
// events reads as one smooth stretch. Keyboard and scrollbar are left alone.

const BAND = 220; // px the stretch approaches but never reaches
const GIVE = 380; // pressure (px of push) at which the band gives way
const CARRY = 0.25; // weight of a push that arrived already moving (a fling)
const LEAK = 0.9; // s: pressure bleeds away even while you push, so it takes intent
const RELAX = 0.11; // s: how fast it springs back once you let go
const GAP = 120; // ms between wheel events that starts a new gesture
const IDLE = 90; // ms without input that counts as letting go
const OMEGA = 10; // glide spring stiffness (critically damped)
const TEASE_P = 170; // pressure of the "there's more below" nudge (about 65 px of stretch)
const TEASE_MS = 1400;

type Edge = { offsetTop: number; offsetHeight: number };
type Mode = 'cover' | 'site' | 'free' | 'glide';

/** Two soft tugs, the second smaller, eased in and out (0..1 over the tease). */
const tug = (t: number) => (t < 0.55 ? Math.sin((Math.PI * t) / 0.55) ** 2 : 0.45 * Math.sin((Math.PI * (t - 0.55)) / 0.45) ** 2);

/** iOS's rubber band: stretch grows with pressure but flattens out toward BAND. */
export const stretch = (p: number) => (1 - 1 / ((p * 0.55) / BAND + 1)) * BAND;
/** The inverse: the pressure that holds a stretch of `d` px. */
const pressureFor = (d: number) => (BAND / 0.55) * (1 / (1 - Math.min(0.99, Math.max(0, d) / BAND)) - 1);

export function attachCoverResistance(cover: Edge) {
  const edge = () => cover.offsetTop + cover.offsetHeight;
  const now = () => performance.now();
  const at = (y: number): Mode => (y <= 1 ? 'cover' : y >= edge() - 1 ? 'site' : 'free');

  let mode: Mode = at(window.scrollY);
  let p = 0; // pressure on the band
  let weight = 1; // CARRY or 1, per gesture
  let lastInput = -1e9;
  let touching = false;
  let touchY = 0;
  let afterGlide = false; // swallow the tail of the gesture that caused a glide
  let ownY = NaN; // the last scroll position we set, to tell our scrolls from others
  let raf = 0;
  let lastT = 0;
  let teaseFrom: number | null = null; // when the current tease began
  const glide = { y: 0, v: 0, to: 0 };

  const put = (y: number) => {
    ownY = y;
    window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
  };
  const run = () => {
    if (!raf) {
      lastT = now();
      raf = requestAnimationFrame(frame);
    }
  };

  function frame() {
    raf = 0;
    const t = now();
    const dt = Math.min((t - lastT) / 1000, 0.05);
    lastT = t;
    const e = edge();
    if (mode === 'glide') {
      // critically damped spring toward the other resting place
      const a = -OMEGA * OMEGA * (glide.y - glide.to) - 2 * OMEGA * glide.v;
      glide.v += a * dt;
      glide.y += glide.v * dt;
      if (Math.abs(glide.y - glide.to) < 0.5 && Math.abs(glide.v) < 8) {
        put(glide.to);
        mode = glide.to === 0 ? 'cover' : 'site';
        return;
      }
      put(glide.y);
      run();
      return;
    }
    if (mode !== 'cover' && mode !== 'site') return;
    if (teaseFrom !== null && mode === 'cover') {
      const k = (t - teaseFrom) / TEASE_MS;
      if (k >= 1) teaseFrom = null;
      put(stretch(k >= 1 ? 0 : TEASE_P * tug(k)));
      if (teaseFrom !== null) run();
      return;
    }
    const letGo = !touching && t - lastInput > IDLE;
    p *= Math.exp(-dt / (letGo ? RELAX : LEAK));
    if (p < 0.5) p = 0;
    put(mode === 'cover' ? stretch(p) : e - stretch(p));
    if (p > 0) run();
  }

  /** Push of `d` px toward the other side (negative eases off). */
  function push(d: number) {
    p = Math.max(0, p + (d > 0 ? d * weight : d));
    if (p >= GIVE) {
      const e = edge();
      const from = mode === 'cover' ? stretch(p) : e - stretch(p);
      glide.to = mode === 'cover' ? e : 0;
      glide.y = from;
      glide.v = Math.sign(glide.to - from) * 900; // leave with the momentum of the push
      p = 0;
      mode = 'glide';
      afterGlide = true;
    }
    run();
  }

  /** A scroll of `dy` (positive = down) from wheel or touch; true when taken over. */
  function input(dy: number, fresh: boolean) {
    if (teaseFrom !== null) {
      // they took over mid-tease: carry on from where the page is now
      teaseFrom = null;
      if (mode === 'cover') p = pressureFor(window.scrollY);
    }
    if (fresh) {
      afterGlide = false;
      weight = 1;
    }
    if (mode === 'glide' || afterGlide) return true;
    const y = window.scrollY;
    const e = edge();
    if (mode === 'cover') {
      if (dy <= 0 && p === 0) return false; // already at the very top
      push(dy);
      return true;
    }
    if (mode === 'site') {
      if (p > 0) {
        push(-dy);
        return true;
      }
      if (dy >= 0 || y + dy >= e) return false; // ordinary scrolling inside the site
      // reaching the edge: what's left of this scroll becomes pressure
      if (!fresh) weight = CARRY;
      push(e - (y + dy));
      return true;
    }
    return false; // 'free': somewhere in between, by keyboard or scrollbar
  }

  function onWheel(ev: WheelEvent) {
    const t = now();
    const fresh = t - lastInput > GAP;
    lastInput = t;
    const dy = ev.deltaY * (ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? window.innerHeight : 1);
    if (input(dy, fresh)) ev.preventDefault();
  }
  function onTouchStart(ev: TouchEvent) {
    touching = true;
    touchY = ev.touches[0]?.clientY ?? 0;
    lastInput = now();
    input(0, true);
  }
  function onTouchMove(ev: TouchEvent) {
    const y = ev.touches[0]?.clientY ?? touchY;
    const dy = touchY - y; // finger up = page down
    touchY = y;
    lastInput = now();
    if (dy && input(dy, false)) ev.preventDefault();
  }
  function onTouchEnd() {
    touching = false;
    lastInput = now();
    run();
  }
  function onScroll() {
    const y = window.scrollY;
    if (Math.abs(y - ownY) < 1 || mode === 'glide') return;
    teaseFrom = null; // someone else is scrolling (a link, the keyboard): the tease yields
    const e = edge();
    // a touch fling's momentum sailing up past the top of the site: catch it in the band
    if (mode === 'site' && y < e && now() - lastInput < 1200) {
      if (p === 0) weight = CARRY;
      push(e - y);
      return;
    }
    if (p === 0) mode = at(y);
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd);
  window.addEventListener('touchcancel', onTouchEnd);
  window.addEventListener('scroll', onScroll, { passive: true });
  return {
    /** Glide from wherever the page is down to the site (the [more] link). */
    toSite() {
      teaseFrom = null;
      p = 0;
      glide.y = window.scrollY;
      glide.to = edge();
      glide.v = 900;
      mode = 'glide';
      run();
    },
    /** Tug the page a little toward the site and let it spring back. Only from the cover, at rest. */
    tease() {
      if (mode !== 'cover' || p > 0 || teaseFrom !== null) return;
      teaseFrom = now();
      run();
    },
    dispose() {
    cancelAnimationFrame(raf);
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('touchcancel', onTouchEnd);
    window.removeEventListener('scroll', onScroll);
    },
  };
}
