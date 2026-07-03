import { useEffect, useRef, useState } from 'react';

// The cursor, in the site's own vocabulary: the native arrow is hidden and
// replaced by a tiny instant core (exact pointer position, for precision)
// with the hollow ring trailing it on a soft spring. Over anything
// interactive the ring fills — the signature gesture, everywhere.
// Mouse-only (pointer: fine); absent on touch and under reduced motion.
export function CursorDot() {
  const ringRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const [enabled] = useState(
    () =>
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (!enabled) return;
    const ring = ringRef.current;
    const core = coreRef.current;
    if (!ring || !core) return;

    document.body.classList.add('has-cursor-dot'); // hides the native cursor

    let x = -100;
    let y = -100;
    let tx = -100;
    let ty = -100;
    let down = false;
    let visible = false;
    let raf = 0;

    const loop = () => {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      ring.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${down ? 0.7 : 1})`;
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
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
    const onDown = () => {
      down = true;
    };
    const onUp = () => {
      down = false;
    };
    const onLeaveWindow = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        visible = false;
        ring.style.opacity = '0';
        core.style.opacity = '0';
      }
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerout', onLeaveWindow);
    raf = requestAnimationFrame(loop);

    return () => {
      document.body.classList.remove('has-cursor-dot');
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
      <div className="cursor-dot" ref={ringRef} aria-hidden="true" />
    </>
  );
}
