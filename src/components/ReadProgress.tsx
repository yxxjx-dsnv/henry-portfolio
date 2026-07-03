import { useEffect, useRef, useState } from 'react';

// A filled dot travelling down a hairline as you read — scroll feedback in
// the site's own vocabulary. Desktop only; hidden on narrow screens via CSS.
export function ReadProgress() {
  const [p, setP] = useState(0);
  const [enabled] = useState(
    () => typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches,
  );

  const favRef = useRef<((p: number) => void) | null>(null);

  // The browser-tab dot fills like a pie as you read; restored on leave.
  useEffect(() => {
    if (!enabled) return;
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) return;
    const orig = link.href;
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let last = -1;
    favRef.current = (prog: number) => {
      const q = Math.round(prog * 24);
      if (q === last) return;
      last = q;
      ctx.clearRect(0, 0, 32, 32);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#787878';
      ctx.beginPath();
      ctx.arc(16, 16, 11, 0, Math.PI * 2);
      ctx.stroke();
      if (prog > 0.005) {
        ctx.fillStyle = '#121212';
        ctx.beginPath();
        ctx.moveTo(16, 16);
        ctx.arc(16, 16, 11, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
      link.href = c.toDataURL('image/png');
    };
    return () => {
      favRef.current = null;
      link.href = orig;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
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
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div className="read-rail" aria-hidden="true">
      <div className="read-dot" style={{ top: `${p * 100}%` }} />
    </div>
  );
}
