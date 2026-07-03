import { useEffect, useRef, useState } from 'react';

// The site's hollow dot, following the cursor on a soft spring.
// Over anything interactive it fills — the signature gesture, everywhere.
// Mouse-only (pointer: fine); absent on touch and under reduced motion.
export function CursorDot() {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled] = useState(
    () =>
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

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
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${down ? 0.7 : 1})`;
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        x = tx;
        y = ty;
        el.style.opacity = '1';
      }
      const t = e.target as Element | null;
      const interactive = !!t?.closest?.(
        'a, button, [role="button"], .activity-item, #logo-toggle, .dot-field, .end-mark',
      );
      el.classList.toggle('is-active', interactive);
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
        el.style.opacity = '0';
      }
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerout', onLeaveWindow);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerout', onLeaveWindow);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div className="cursor-dot" ref={ref} aria-hidden="true" />;
}
