// The cover and the site are two resting places with a rubber band between
// them. Push past the edge (down from the badge, or up from the top of the site)
// and the page stretches a little, harder the further it goes; ease off and it
// springs back. Keep pushing and the band gives way: the page carries on at the
// speed it was already moving, gathers pace, and eases to rest. A fling that only
// happens to reach the edge counts for much less than a deliberate push, so a
// quick flick back up the site lands softly at its top instead of shooting past.
// Everything is drawn once per frame, so a trackpad's stream of tiny wheel
// events reads as one smooth stretch. Keyboard and scrollbar are left alone.

const BAND = 220; // px the stretch approaches but never reaches
const GIVE = 380; // pressure (px of push) at which the band gives way, cover -> site
// Back up from the site takes twice the push: reading the top of the site you
// nudge up all the time, and that should only let the cover peek, not take you there.
// Its band is longer, so all that pushing still visibly moves the page.
const GIVE_UP = 760;
const BAND_UP = 340;
const CARRY = 0.25; // weight of a push that arrived already moving (a fling)
const LEAK = 0.9; // s: pressure bleeds away even while you push, so it takes intent
const RELAX = 0.11; // s: how fast it springs back once you let go
const GAP = 120; // ms between wheel events that starts a new gesture
const IDLE = 90; // ms without input that counts as letting go
// Wheel events don't line up with frames (one frame gets two, the next none),
// so the page follows the band through a short low-pass instead of jumping to it.
const FOLLOW = 0.06; // s

type Edge = { offsetTop: number; offsetHeight: number };
type Mode = 'cover' | 'site' | 'free' | 'glide';

/** iOS's rubber band: stretch grows with pressure but flattens out toward `band`. */
export const stretch = (p: number, band = BAND) => (1 - 1 / ((p * 0.55) / band + 1)) * band;
/** 0→1 with no jolt at either end (zero speed and zero acceleration). */
const smoother = (s: number) => s * s * s * (s * (6 * s - 15) + 10);

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
  let held = false; // the badge is in someone's hand: their drag is not a scroll
  // a glide: from `from` to `to` over `T` s, leaving at speed `v0` (px/s)
  const glide = { from: 0, to: 0, v0: 0, t0: 0, T: 0.7 };
  let vel = 0; // how fast the stretch is moving, so a glide can carry it on
  let prevY = NaN;
  let shown = 0; // the stretch actually on screen, trailing the band's own

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
      const k = (t - glide.t0) / 1000 / glide.T;
      if (k >= 1) {
        put(glide.to);
        mode = glide.to === 0 ? 'cover' : 'site';
        vel = 0;
        return;
      }
      // the eased trip, plus the speed it left with fading out: s(1-s)^3 starts
      // at slope 1 and ends flat, so nothing jumps at either end
      put(glide.from + (glide.to - glide.from) * smoother(k) + glide.v0 * glide.T * k * (1 - k) ** 3);
      run();
      return;
    }
    if (mode !== 'cover' && mode !== 'site') return;
    const letGo = !touching && t - lastInput > IDLE;
    p *= Math.exp(-dt / (letGo ? RELAX : LEAK));
    if (p < 0.5) p = 0;
    const target = mode === 'cover' ? stretch(p) : stretch(p, BAND_UP);
    shown += (target - shown) * (1 - Math.exp(-dt / FOLLOW));
    if (p === 0 && shown < 0.3) shown = 0;
    const y = mode === 'cover' ? shown : e - shown;
    if (dt > 0 && Number.isFinite(prevY)) vel = 0.6 * vel + 0.4 * ((y - prevY) / dt);
    prevY = y;
    put(y);
    if (p > 0 || shown > 0) run();
    else prevY = NaN;
  }

  /** Push of `d` px toward the other side (negative eases off). */
  function push(d: number) {
    p = Math.max(0, p + (d > 0 ? d * weight : d));
    if (p >= (mode === 'cover' ? GIVE : GIVE_UP)) {
      // leave from where the page is on screen, at the speed it is moving
      const from = Number.isFinite(prevY) ? prevY : window.scrollY;
      startGlide(from, mode === 'cover' ? edge() : 0, vel);
      p = 0;
      afterGlide = true;
    }
    run();
  }

  function startGlide(from: number, to: number, v: number) {
    const dist = Math.abs(to - from);
    glide.from = from;
    glide.to = to;
    glide.T = Math.min(0.85, Math.max(0.5, 0.35 + dist / 2400));
    // keep the push's speed only if it is heading the right way, and never more
    // than the trip can absorb without overshooting
    glide.v0 = Math.sign(v) === Math.sign(to - from) ? Math.sign(v) * Math.min(Math.abs(v), (1.2 * dist) / glide.T) : 0;
    glide.t0 = now();
    mode = 'glide';
    prevY = NaN;
    vel = 0;
    shown = 0;
  }

  /** A scroll of `dy` (positive = down) from wheel or touch; true when taken over. */
  function input(dy: number, fresh: boolean) {
    if (held) return false;
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
      if (shown > 0 && dy > 0) {
        // scrolling back down while the cover still peeks: close the gap 1:1
        shown = Math.max(0, shown - dy);
        run();
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
      p = 0;
      startGlide(window.scrollY, edge(), 0);
      run();
    },
    /** While the badge is being dragged, touches move it, not the page. */
    hold(on: boolean) {
      held = on;
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
