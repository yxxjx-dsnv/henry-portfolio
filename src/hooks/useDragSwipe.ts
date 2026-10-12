import { useEffect, useRef, type RefObject } from 'react';

/** A press held this long without moving is a hold (it opens the photo), not a drag. */
export const HOLD_MS = 420;
/** How far a pointer may wander, px, and still be holding or clicking rather than dragging. */
export const SLOP = 6;

/**
 * Drag a track of full-width, snapping slides with the mouse, the way a finger already
 * swipes it: the slides follow the pointer, and on release the track goes on to the next
 * slide (dragged a sixth of the way, or flicked) or settles back. `goTo(i)` scrolls to slide
 * i (clamped by the caller). Touch and pen are left to the browser's own scrolling. The
 * click that ends a drag is swallowed, so a drag never also counts as a click.
 */
export function useDragSwipe(trackRef: RefObject<HTMLElement>, goTo: (i: number) => void, ready = true) {
  const go = useRef(goTo);
  go.current = goTo;

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !ready) return;
    let down: { id: number; x: number; left: number; t: number } | null = null;
    let prev = { x: 0, t: 0 }; // the last two moves, for the speed at release
    let last = { x: 0, t: 0 };
    let dragging = false;
    let swallow = false;
    let restore = 0;

    // snapping back on once the slide has landed, not mid-scroll (it would jump); a scrollend
    // from a drag that has already begun again is not a landing
    const back = () => {
      if (dragging) return;
      window.clearTimeout(restore);
      el.removeEventListener('scrollend', back);
      el.classList.remove('is-dragging');
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      const t = e.target as HTMLElement;
      // links and buttons keep their press, and a video its own controls strip (scrubbing)
      if (t.closest('a, button, input') || (t.tagName === 'VIDEO' && e.offsetY > t.clientHeight - 48)) return;
      e.preventDefault(); // no text selection or image ghost while dragging
      el.focus({ preventScroll: true }); // what a click on the track would have done (arrow keys then turn it)
      down = { id: e.pointerId, x: e.clientX, left: el.scrollLeft, t: e.timeStamp };
      prev = last = { x: e.clientX, t: e.timeStamp };
      dragging = false;
      swallow = false;
    };
    const onMove = (e: PointerEvent) => {
      if (!down || e.pointerId !== down.id) return;
      const dx = e.clientX - down.x;
      if (!dragging) {
        if (Math.abs(dx) < SLOP) return;
        if (e.timeStamp - down.t >= HOLD_MS) {
          down = null; // it was a hold
          return;
        }
        dragging = true;
        el.classList.add('is-dragging'); // snapping off, so the slides follow the pointer
        el.setPointerCapture?.(down.id);
      }
      el.scrollLeft = down.left - dx;
      prev = last;
      last = { x: e.clientX, t: e.timeStamp };
    };
    const onUp = (e: PointerEvent) => {
      if (!down || e.pointerId !== down.id) return;
      const start = down;
      down = null;
      if (!dragging) return;
      dragging = false;
      swallow = true;
      const w = el.clientWidth || 1;
      const dx = e.clientX - start.x;
      // a pointerup comes where the last move was, so the flick is read off the last two moves,
      // and a pointer that paused before letting go was not flicked
      const speed = e.timeStamp - last.t > 100 ? 0 : (last.x - prev.x) / Math.max(1, last.t - prev.t); // px/ms
      const from = Math.round(start.left / w);
      const flick = Math.abs(speed) > 0.4 && Math.sign(speed) === Math.sign(dx);
      const dir = Math.abs(dx) > w / 6 || flick ? -Math.sign(dx) : 0;
      go.current(from + dir);
      el.addEventListener('scrollend', back);
      window.clearTimeout(restore);
      restore = window.setTimeout(back, 800);
    };
    const onCancel = (e: PointerEvent) => {
      if (down && e.pointerId === down.id && dragging) onUp(e);
      else down = null;
    };
    const onClick = (e: MouseEvent) => {
      if (!swallow) return;
      swallow = false;
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onCancel);
    el.addEventListener('click', onClick, true);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onCancel);
      el.removeEventListener('click', onClick, true);
      el.removeEventListener('scrollend', back);
      window.clearTimeout(restore);
    };
  }, [trackRef, ready]); // `ready`: the track is mounted (a deck draws it once its PDF has loaded)
}
