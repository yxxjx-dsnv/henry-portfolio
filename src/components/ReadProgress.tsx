import { useEffect, useState } from 'react';

// A filled dot travelling down a hairline as you read — scroll feedback in
// the site's own vocabulary. Desktop only; hidden on narrow screens via CSS.
export function ReadProgress() {
  const [p, setP] = useState(0);
  const [enabled] = useState(
    () => typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches,
  );

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        setP(max > 0 ? Math.min(1, Math.max(0, h.scrollTop / max)) : 0);
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
