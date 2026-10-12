import { useEffect, useRef, useState } from 'react';
import { AutoVideo } from './AutoVideo';
import { Expandable } from './Expandable';
import { useDragSwipe } from '../hooks/useDragSwipe';
import { useLang } from '../i18n';

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
  const { t } = useLang();
  const trackRef = useRef<HTMLDivElement>(null);
  // While a programmatic smooth-scroll is in flight, intermediate scroll events
  // would round back to the old slide; pending holds the target until we land.
  const pending = useRef<number | null>(null);
  // A swipe can cut that scroll short so it never lands; once the track has
  // been still for a moment, stop waiting and read the slide where it stopped.
  const settle = useRef<number>();
  const [idx, setIdx] = useState(0);
  const shown = useRef(0); // idx, for the resize observer
  shown.current = idx;
  const laidOut = useRef(0); // the track width the slides sit at, once a resize observer watches it

  // Grown into the expand frame or back, the track changes width but keeps its
  // scroll offset in pixels, which would land between photos: put the photo
  // being looked at back in view.
  useEffect(() => {
    const el = trackRef.current;
    if (!el || typeof ResizeObserver !== 'function') return;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === laidOut.current) return;
      if (laidOut.current) el.scrollLeft = (pending.current ?? shown.current) * el.clientWidth;
      laidOut.current = el.clientWidth;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // (`ms`: a chevron arms a longer fallback, so a stall before its smooth scroll
  // even starts cannot clear the target early)
  const settleSoon = (ms = 150) => {
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      pending.current = null;
      onScroll();
    }, ms);
  };

  const go = (dir: number) => goTo((pending.current ?? idx) + dir);
  // a mouse drags the slides like a finger swipes them
  useDragSwipe(trackRef, (i) => goTo(i, true));

  // `dragged`: the track was let go between slides, so even its own slide must be scrolled back to
  const goTo = (i: number, dragged = false) => {
    const el = trackRef.current;
    if (!el) return;
    const from = pending.current ?? idx;
    const next = Math.min(Math.max(i, 0), slides.length - 1);
    if (!dragged && next === from && pending.current === null && next === idx) return;
    pending.current = next;
    settleSoon(600);
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
    if (laidOut.current && el.clientWidth !== laidOut.current) return; // resized: the photo is put back first
    const at = Math.min(Math.max(Math.round(el.scrollLeft / el.clientWidth), 0), slides.length - 1);
    if (pending.current !== null) {
      if (at === pending.current) pending.current = null; // landed
      else settleSoon(); // still moving, or cut short
      return; // ignore mid-flight positions
    }
    setIdx(at);
  };

  const current = slides[idx] ?? slides[0];
  const atStart = idx === 0;
  const atEnd = idx === slides.length - 1;

  const allVideo = slides.every((s) => s.kind === 'video');

  return (
    <Expandable
      label={`${allVideo ? 'Videos' : 'Photos'}: ${label}`}
      aspect={Math.max(...slides.map((s) => s.width / s.height))} // the widest slide fills the frame
      chrome={[0, 44]} // the caption row
      holdToOpen={!allVideo} // a video has no picture to hold (and its button stays in sight)
    >
      <figure className={`story-figure story-carousel${allVideo ? ' carousel-video' : ''}`}>
        <div className="carousel-stage">
          <div
            className="carousel-track"
            ref={trackRef}
            onScroll={onScroll}
            tabIndex={0}
            role="group"
            aria-roledescription={t('carousel')}
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
                aria-label={t('Previous photo')}
                aria-disabled={atStart}
                onClick={() => !atStart && go(-1)}
              >
                &#8249;
              </button>
              <button
                type="button"
                className="carousel-arrow carousel-next"
                aria-label={t('Next photo')}
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
    </Expandable>
  );
}
