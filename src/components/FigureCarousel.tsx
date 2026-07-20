import { useRef, useState } from 'react';
import { AutoVideo } from './AutoVideo';

export type CarouselSlide = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  kind?: 'video'; // omitted = photograph
};

// A horizontal, swipeable strip of related photographs. One slide shows at a
// time; faint chevrons at the edges say "there is more", and the caption line
// carries a quiet 2 / 7 counter. Native scroll-snap does the swiping, so touch
// works with no extra code.
export function FigureCarousel({ slides, label }: { slides: CarouselSlide[]; label: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  // While a programmatic smooth-scroll is in flight, intermediate scroll events
  // would round back to the old slide; pending holds the target until we land.
  const pending = useRef<number | null>(null);
  const [idx, setIdx] = useState(0);

  const go = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    const from = pending.current ?? idx;
    const next = Math.min(Math.max(from + dir, 0), slides.length - 1);
    if (next === from && pending.current === null && next === idx) return;
    pending.current = next;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // jsdom has no Element.scrollTo; state still advances so the counter is honest
    el.scrollTo?.({ left: next * el.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
    setIdx(next);
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const at = Math.min(Math.max(Math.round(el.scrollLeft / el.clientWidth), 0), slides.length - 1);
    if (pending.current !== null) {
      if (at === pending.current) pending.current = null; // landed
      return; // ignore mid-flight positions
    }
    setIdx(at);
  };

  const current = slides[idx] ?? slides[0];
  const atStart = idx === 0;
  const atEnd = idx === slides.length - 1;

  const allVideo = slides.every((s) => s.kind === 'video');

  return (
    <figure className={`story-figure story-carousel${allVideo ? ' carousel-video' : ''}`}>
      <div className="carousel-stage">
        <div
          className="carousel-track"
          ref={trackRef}
          onScroll={onScroll}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label={label}
        >
          {slides.map((s) =>
            s.kind === 'video' ? (
              <div className="carousel-slide" key={s.src}>
                <AutoVideo src={s.src} width={s.width} height={s.height} alt={s.alt} />
              </div>
            ) : (
              <div className="carousel-slide" key={s.src}>
                <img src={s.src} alt={s.alt} width={s.width} height={s.height} loading="lazy" />
              </div>
            ),
          )}
        </div>
        {slides.length > 1 && (
          <>
            <button
              type="button"
              className="carousel-arrow carousel-prev"
              aria-label="Previous photo"
              aria-disabled={atStart}
              onClick={() => !atStart && go(-1)}
            >
              &#8249;
            </button>
            <button
              type="button"
              className="carousel-arrow carousel-next"
              aria-label="Next photo"
              aria-disabled={atEnd}
              onClick={() => !atEnd && go(1)}
            >
              &#8250;
            </button>
          </>
        )}
      </div>
      <figcaption aria-live="polite" aria-atomic="true">
        <span>{current.caption}</span>
        {slides.length > 1 && (
          <span className="carousel-count">
            {idx + 1} / {slides.length}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
