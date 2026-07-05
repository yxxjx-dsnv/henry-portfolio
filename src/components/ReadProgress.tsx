import { useEffect, useRef, useState } from 'react';
import { H_LOGO_PATH } from '../assets/hLogoPath';

// Scroll feedback in the site's own vocabulary: a dot on a hairline rail on
// desktop, a hairline across the top on narrow screens (CSS decides which
// shows). The favicon wedge stays desktop-only.
export function ReadProgress() {
  const [p, setP] = useState(0);
  const [fine] = useState(
    () => typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches,
  );
  // Windows-style persistent scrollbars already show reading position — a
  // second indicator 17px away would be noise, so the rail yields (W6).
  const [overlayScrollbars] = useState(
    () => window.innerWidth - document.documentElement.clientWidth === 0,
  );

  const favRef = useRef<((p: number) => void) | null>(null);

  // The browser-tab dot fills like a pie as you read; restored on leave.
  useEffect(() => {
    if (!fine) return;
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) return;
    const orig = link.href;
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let last = -1;
    const hMark = typeof Path2D !== 'undefined' ? new Path2D(H_LOGO_PATH) : null;
    favRef.current = (prog: number) => {
      const q = Math.round(prog * 24);
      if (q === last) return;
      last = q;
      ctx.clearRect(0, 0, 32, 32);
      // match the dark-tab-aware favicon.svg: light H on dark tabs
      const darkTab =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      // reading progress fills as a pale wedge behind the H mark
      if (prog > 0.005) {
        ctx.fillStyle = darkTab ? '#3f3f3f' : '#d4d4d4';
        ctx.beginPath();
        ctx.moveTo(16, 16);
        ctx.arc(16, 16, 16, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
      if (hMark) {
        ctx.save();
        ctx.scale(32 / 1024, 32 / 1024);
        ctx.fillStyle = darkTab ? '#f1f1f1' : '#121212';
        ctx.fill(hMark);
        ctx.restore();
      }
      link.href = c.toDataURL('image/png');
    };
    return () => {
      favRef.current = null;
      link.href = orig;
    };
  }, [fine]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        const next = max > 0 ? Math.min(1, Math.max(0, h.scrollTop / max)) : 0;
        setP(next);
        favRef.current?.(next);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const scrubTo = (clientY: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    const h = document.documentElement;
    window.scrollTo({ top: ratio * (h.scrollHeight - h.clientHeight) });
  };

  return (
    <>
      <div className="read-topbar" style={{ width: `${p * 100}%` }} aria-hidden="true" />
      {overlayScrollbars && (
      <div
      className="read-rail"
      aria-hidden="true"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        scrubTo(e.clientY, e.currentTarget);
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0) scrubTo(e.clientY, e.currentTarget);
      }}
    >
      <div className="read-dot" style={{ top: `${p * 100}%` }} />
      </div>
      )}
    </>
  );
}
