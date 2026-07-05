import { useEffect, useRef, useState } from 'react';

// The cursor, in the site's own vocabulary: the native arrow is hidden and
// replaced by a tiny instant core (exact pointer position, for precision)
// with the hollow ring trailing it on a soft spring. Over anything
// interactive the ring fills — the signature gesture, everywhere.
// Mouse-only (pointer: fine); absent on touch and under reduced motion.
export function CursorDot() {
  const ringRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  // the dot rescued on the 404 page tags along for the rest of the session
  const [companion, setCompanion] = useState(() => {
    try {
      return sessionStorage.getItem('dot-companion') === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const on = () => setCompanion(true);
    window.addEventListener('dot-rescued', on);
    return () => window.removeEventListener('dot-rescued', on);
  }, []);
  // desktop-only: fine pointer, motion allowed, and wider than the mobile
  // breakpoint — re-evaluated live so resizing past 768px flips it (BUG-2)
  const compute = () =>
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    !window.matchMedia('(max-width: 768px)').matches;
  const [enabled, setEnabled] = useState(compute);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setEnabled(compute());
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const ring = ringRef.current;
    const core = coreRef.current;
    if (!ring || !core) return;

    document.body.classList.add('has-cursor-dot'); // hides the native cursor
    document.documentElement.classList.add('has-cursor-dot');

    let x = -100;
    let y = -100;
    let tx = -100;
    let ty = -100;
    let down = false;
    let downAt = 0;
    let scale = 1;
    let popped = false; // one pop per hold; release to re-arm
    let visible = false;
    let raf = 0;
    let lastMove = performance.now();
    const burst = ring.querySelector<HTMLElement>('.cursor-burst');

    const loop = () => {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      // press: quick dip, then a slow inhale while held — until it pops
      const held = down ? performance.now() - downAt : 0;
      let target = 1;
      if (down && !popped) {
        target = 0.72 + Math.min(held / 1400, 1) * 0.9;
        if (held >= 1500) {
          popped = true;
          scale = 0.45; // deflates instantly, springs back to small
          if (burst) {
            burst.classList.remove('go');
            void burst.offsetWidth; // restart the burst animation
            burst.classList.add('go');
          }
        }
      }
      scale += (target - scale) * 0.18;
      ring.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
      ring.classList.toggle('is-idle', visible && performance.now() - lastMove > 15000);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse') return; // touch-screen laptops (W7)
      lastMove = performance.now();
      tx = e.clientX;
      ty = e.clientY;
      core.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
      if (!visible) {
        visible = true;
        x = tx;
        y = ty;
        ring.style.opacity = '1';
        core.style.opacity = '1';
      }
      const t = e.target as Element | null;
      const interactive = !!t?.closest?.(
        'a, button, [role="button"], .activity-item, #logo-toggle, .dot-field, .end-mark',
      );
      ring.classList.toggle('is-active', interactive);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      down = true;
      downAt = performance.now();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      down = false;
      popped = false; // re-arm for the next hold
    };
    const onLeaveWindow = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        visible = false;
        ring.style.opacity = '0';
        core.style.opacity = '0';
      }
    };
    // Returning from another window/tab (or bfcache) can leave the pair in a
    // half state — re-assert everything and let the next move re-show both.
    const resync = () => {
      document.body.classList.add('has-cursor-dot');
      document.documentElement.classList.add('has-cursor-dot');
      visible = false;
      down = false;
      ring.style.opacity = '0';
      core.style.opacity = '0';
      lastMove = performance.now();
    };
    const onVisibility = () => {
      if (!document.hidden) resync();
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerout', onLeaveWindow);
    window.addEventListener('focus', resync);
    window.addEventListener('pageshow', resync);
    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(loop);

    return () => {
      document.body.classList.remove('has-cursor-dot');
      document.documentElement.classList.remove('has-cursor-dot');
      window.removeEventListener('focus', resync);
      window.removeEventListener('pageshow', resync);
      document.removeEventListener('visibilitychange', onVisibility);
      cancelAnimationFrame(raf);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerout', onLeaveWindow);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div className="cursor-core" ref={coreRef} aria-hidden="true" />
      <div className="cursor-dot" ref={ringRef} aria-hidden="true">
        <span className="cursor-burst" aria-hidden="true" />
        {companion && (
          <span className="cursor-orbit" aria-hidden="true">
            <span className="cursor-satellite" />
          </span>
        )}
      </div>
    </>
  );
}
