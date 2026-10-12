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
// Back up from the site takes a little more push: reading the top of the site you
// nudge up all the time, and that should only let the cover peek, not take you there.
// (Twice the push was too much: a firm trackpad swipe up didn't get back.) Its band
// is longer, so the pushing visibly moves the page.
const GIVE_UP = 460;
const BAND_UP = 340;
const CARRY = 0.25; // weight of a push that arrived already moving (a fling)
const LEAK = 0.9; // s: pressure bleeds away even while you push, so it takes intent
const RELAX = 0.11; // s: how fast it springs back once you let go
const GAP = 120; // ms between wheel events that starts a new gesture
const IDLE = 90; // ms without input that counts as letting go
// A finger can't keep pushing the way a trackpad can: on touch, letting go with
// the band stretched this far toward its give (fraction) carries on through.
const TOUCH_COMMIT = 0.3;
const TOUCH_GAIN = 1.5; // px of band pressure per px of finger travel
// Wheel events don't line up with frames (one frame gets two, the next none),
// so the page follows the band through a short low-pass instead of jumping to it.
const FOLLOW = 0.06; // s

type Edge = { offsetTop: number; offsetHeight: number };
type Mode = 'cover' | 'site' | 'free' | 'glide';

/** iOS's rubber band: stretch grows with pressure but flattens out toward `band`. */
export const stretch = (p: number, band = BAND) => (1 - 1 / ((p * 0.55) / band + 1)) * band;
/** 0→1 with no jolt at either end (zero speed and zero acceleration). */
const smoother = (s: number) => s * s * s * (s * (6 * s - 15) + 10);
/** Over a dialog on top of the page (⌘K, a game) or a box that scrolls on its
 *  own (⌘K's results, the phone's menu): that wheel or finger is theirs, not the page's. */
function theirs(t: EventTarget | null): Element | null {
  for (let el = t instanceof Element ? t : null; el && el !== document.body; el = el.parentElement) {
    if (el.getAttribute('role') === 'dialog') return el;
    const o = getComputedStyle(el).overflowY;
    if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight) return el;
  }
  return null;
}

/** Whether `box` itself can still scroll `dy` further (a dialog's frame cannot). */
function roomIn(box: Element, dy: number) {
  if (box.getAttribute('role') === 'dialog') return false;
  return dy > 0 ? box.scrollTop + box.clientHeight < box.scrollHeight - 1 : box.scrollTop > 0;
}

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
  let touchOff = false; // this touch is not the band's (see onTouchStart)
  let afterGlide = false; // swallow the tail of the gesture that caused a glide
  let ownY = NaN; // the last scroll position we set, to tell our scrolls from others
  let raf = 0;
  let lastT = 0;
  let beat = 0; // the display's frame interval (ms), learned from the frames
  let clock = 0; // the band's own time (ms), in whole beats
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
    if (!raf) raf = requestAnimationFrame(frame);
  };

  // A trackpad's momentum can't always be cancelled: once a gesture's first
  // wheel event went through (scrolling up inside the site, say), the browser
  // scrolls on whatever the page says, and it and the band moved the page in
  // turn (30, 20, back 27, 29 px). While the band holds the page, the page
  // can't be scrolled by hand (overflow hidden; the band's own scrolling still
  // works), which ends that momentum at once. It frees when the band is at rest
  // and the wheel has gone quiet. Wheel only: a finger is already the band's.
  const root = document.documentElement;
  let freeAt = 0;
  let taken = -1e9; // the last wheel event the band took (the momentum it is absorbing)
  const free = () => {
    window.clearTimeout(freeAt);
    root.classList.remove('band-held');
  };
  const tryFree = () => {
    freeAt = 0;
    // (a wheel the band didn't take, like scrolling back down into the site, frees it soon)
    if (mode === 'glide' || p > 0 || shown > 0 || now() - taken < 150) freeAt = window.setTimeout(tryFree, 150);
    else free();
  };
  const hold = () => {
    taken = now();
    root.classList.add('band-held');
    if (!freeAt) freeAt = window.setTimeout(tryFree, 150);
  };

  // The band keeps its own time, counted in whole frames. Reading the clock
  // inside this callback moves with whatever ran before it in the frame (the
  // badge's 3D, the cover's flying name), and even the frame's timestamp
  // wobbles around the display's beat (7.4 then 9.3 ms at a steady 120 Hz): a
  // page stepped by either goes 15, 19.5, 15 px, a judder anything tied to the
  // scroll shows. A frame is one beat, a dropped one two.
  function frame(ts: number) {
    raf = 0;
    const raw = ts - lastT;
    lastT = ts;
    let step = 0; // a fresh start (or a stall) moves nothing
    if (raw > 0 && raw < 50) {
      if (!beat || Math.abs(raw - beat) < beat * 0.4) beat = beat ? beat + (raw - beat) * 0.05 : raw;
      step = Math.max(1, Math.round(raw / beat)) * beat;
    }
    clock += step;
    const dt = step / 1000;
    const e = edge();
    if (mode === 'glide') {
      if (!Number.isFinite(glide.t0)) glide.t0 = clock; // the trip starts on its first frame
      const k = (clock - glide.t0) / 1000 / glide.T;
      if (k >= 1) {
        put(glide.to);
        mode = glide.to === 0 ? 'cover' : 'site';
        vel = 0;
        return;
      }
      // the eased trip, plus the speed it left with fading out: k(1-k)^3(1+3k)
      // starts at slope 1 with no bend and ends flat, so the push hands over to
      // the trip without the page catching (k(1-k)^3 braked hard at once: the
      // page slowed by a third, then sped up again)
      put(glide.from + (glide.to - glide.from) * smoother(k) + glide.v0 * glide.T * k * (1 - k) ** 3 * (1 + 3 * k));
      run();
      return;
    }
    if (mode !== 'cover' && mode !== 'site') return;
    const letGo = !touching && ts - lastInput > IDLE;
    p *= Math.exp(-dt / (letGo ? RELAX : LEAK));
    if (p < 0.5) p = 0;
    const target = mode === 'cover' ? stretch(p) : stretch(p, BAND_UP);
    shown += (target - shown) * (1 - Math.exp(-dt / FOLLOW));
    if (p === 0 && shown < 0.3) shown = 0;
    const y = mode === 'cover' ? shown : e - shown;
    // the page's own speed this frame (it already trails the wheel through FOLLOW;
    // averaging it again made a glide leave slower than the page was moving)
    if (dt > 0 && Number.isFinite(prevY)) vel = (y - prevY) / dt;
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
    // than the trip can absorb without overshooting (with k(1-k)^3(1+3k) that is
    // up to about 2.5x the trip's average; 2x keeps a margin)
    glide.v0 = Math.sign(v) === Math.sign(to - from) ? Math.sign(v) * Math.min(Math.abs(v), (2 * dist) / glide.T) : 0;
    glide.t0 = NaN; // set by the first frame
    mode = 'glide';
    prevY = NaN;
    vel = 0;
    shown = 0;
  }

  /** A scroll of `dy` (positive = down) from wheel or touch; true when taken over. */
  function input(dy: number, fresh: boolean, finger = false) {
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
      if (!fresh && !finger) weight = CARRY; // a finger on the glass is never momentum
      push(e - (y + dy));
      return true;
    }
    return false; // 'free': somewhere in between, by keyboard or scrollbar
  }

  function onWheel(ev: WheelEvent) {
    // ctrl+wheel and a trackpad pinch are the browser zooming, not a scroll
    if (ev.ctrlKey) return;
    const dy = ev.deltaY * (ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? window.innerHeight : 1);
    const box = theirs(ev.target);
    if (box) {
      // the overlay's own list scrolls; what it cannot take (its input, its
      // frame, the end of its list) must not slide the page behind off the cover
      if (dy && window.scrollY + dy < edge() && !roomIn(box, dy)) ev.preventDefault();
      return;
    }
    const t = now();
    const fresh = t - lastInput > GAP;
    lastInput = t;
    if (input(dy, fresh)) {
      ev.preventDefault();
      hold();
    }
  }
  function onTouchStart(ev: TouchEvent) {
    // a second finger makes it a pinch, the browser's to zoom; a finger on a
    // dialog or a box that scrolls itself is theirs. Either way, the whole touch.
    touchOff = ev.touches.length > 1 || !!theirs(ev.target);
    touching = !touchOff;
    if (touchOff) return;
    touchY = ev.touches[0]?.clientY ?? 0;
    lastInput = now();
    input(0, true);
  }
  function onTouchMove(ev: TouchEvent) {
    if (ev.touches.length > 1) touchOff = true;
    if (touchOff) return;
    const y = ev.touches[0]?.clientY ?? touchY;
    const dy = touchY - y; // finger up = page down
    touchY = y;
    lastInput = now();
    if (dy && input(dy * TOUCH_GAIN, false, true)) ev.preventDefault();
  }
  function onTouchEnd() {
    touching = false;
    lastInput = now();
    if (!touchOff && (mode === 'cover' || mode === 'site') && p >= (mode === 'cover' ? GIVE : GIVE_UP) * TOUCH_COMMIT) {
      startGlide(Number.isFinite(prevY) ? prevY : window.scrollY, mode === 'cover' ? edge() : 0, vel);
      p = 0;
      afterGlide = true;
    }
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
    free();
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('touchcancel', onTouchEnd);
    window.removeEventListener('scroll', onScroll);
    },
  };
}
