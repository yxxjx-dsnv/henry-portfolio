import { useRef } from 'react';

type Props = { title: string; subtitle: string; playful?: boolean };

const FINE_POINTER = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches;

export function Hero({ title, subtitle, playful = false }: Props) {
  const h1Ref = useRef<HTMLHeadingElement>(null);

  if (!playful) {
    return (
      <section className="hero-section">
        <div className="text">
          <h1>{title}</h1>
          <p className="subtitle">{subtitle}</p>
        </div>
      </section>
    );
  }

  // Letters lift toward the cursor like piano keys, and settle back.
  const onMove = (e: React.PointerEvent) => {
    if (!FINE_POINTER() || !h1Ref.current) return;
    h1Ref.current.querySelectorAll<HTMLElement>('.hl-in').forEach((span) => {
      const r = span.getBoundingClientRect();
      const d = Math.abs(e.clientX - (r.left + r.width / 2));
      const lift = Math.max(0, 1 - d / 90) * 7;
      span.style.transform = lift > 0.2 ? `translateY(${-lift}px)` : '';
    });
  };
  const onLeave = () => {
    h1Ref.current?.querySelectorAll<HTMLElement>('.hl-in').forEach((span) => {
      span.style.transform = '';
    });
  };

  return (
    <section className="hero-section">
      <div className="text">
        <h1
          className="hero-playful"
          aria-label={title}
          ref={h1Ref}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
        >
          {title.split('').map((ch, i) => (
            <span className="hl" key={i} aria-hidden="true">
              <span className="hl-in">{ch === ' ' ? '\u00A0' : ch}</span>
            </span>
          ))}
        </h1>
        <p className="subtitle">{subtitle}</p>
      </div>
    </section>
  );
}
