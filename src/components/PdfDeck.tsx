import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n';
import { Expandable } from './Expandable';
import { drawPages } from './PdfFlow';
import { useDragSwipe } from '../hooks/useDragSwipe';

type PDFDocument = import('pdfjs-dist').PDFDocumentProxy;
type LoadingTask = ReturnType<(typeof import('pdfjs-dist'))['getDocument']>;

// the expanded frame's padding and caption room (Expandable's chrome): a phone drops the
// paddings, and its caption wraps to more lines
const CHROME = (vw: number): [number, number] => (vw <= 640 ? [2, 130] : [58, 140]);

// t() for an attribute: fills {name} placeholders with plain values (tx() returns elements)
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k) => String(v[k] ?? m));

// A slide deck the way a deck wants to be read: one slide at a time, turned
// left and right. Pages render lazily as they scroll into view, native
// scroll-snap does the paging (so touch swipe works), and faint chevrons plus
// a quiet counter mark that there is more. Optional per-slide notes print
// under the current slide.
export function PdfDeck({
  src,
  title,
  captions,
}: {
  src: string;
  title: string;
  captions?: string[];
}) {
  const { t, tx } = useLang();
  const trackRef = useRef<HTMLDivElement>(null);
  const pending = useRef<number | null>(null);
  const settle = useRef<number>();
  const [pages, setPages] = useState(0);
  const [idx, setIdx] = useState(0);
  const shown = useRef(0); // idx, for the resize observer
  shown.current = idx;
  const laidOut = useRef(0); // the track width the slides sit at, once a resize observer watches it
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [aspect, setAspect] = useState<number>(); // the slides' shape, so the expanded frame takes it
  const docRef = useRef<PDFDocument | null>(null);
  const loadingRef = useRef<LoadingTask | null>(null);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const task = pdfjs.getDocument({ url: src });
        loadingRef.current = task;
        const doc = await task.promise;
        if (dead) return;
        docRef.current = doc;
        const first = (await doc.getPage(1)).getViewport({ scale: 1 });
        if (dead) return;
        setAspect(first.width / first.height);
        setPages(doc.numPages);
        setStatus('ready');
      } catch {
        if (!dead) setStatus('error');
      }
    })();
    return () => {
      dead = true;
      loadingRef.current?.destroy();
      loadingRef.current = null;
      docRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    if (status !== 'ready' || pages === 0) return;
    const track = trackRef.current;
    const doc = docRef.current;
    if (!track || !doc) return;

    // the box a slide is drawn for: the track's width, and in the expand frame,
    // where a slide is fitted whole, its height too
    const box = () => ({
      w: track.clientWidth || 560,
      h: track.closest('.xp')?.classList.contains('is-open') ? track.clientHeight : Infinity,
    });
    const drawn = drawPages(doc, track, '0px 100%', (page) => { // one slide-width either side, at any size
      const { w, h } = box();
      return Math.min(w, (h * page.width) / page.height);
    });

    // Grown into the expand frame or back, the track changes size but keeps its
    // scroll offset in pixels, which would land between slides: put the slide
    // being read back in view at once, then, once the size settles, draw the
    // slides again, sharp for it.
    let size = box();
    let timer = 0;
    const ro =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            if (track.clientWidth !== laidOut.current) {
              if (laidOut.current) track.scrollLeft = (pending.current ?? shown.current) * track.clientWidth;
              laidOut.current = track.clientWidth;
            }
            const now = box();
            if (now.w === size.w && now.h === size.h) return;
            size = now;
            window.clearTimeout(timer);
            timer = window.setTimeout(drawn.redraw, 150);
          })
        : undefined;
    ro?.observe(track);
    return () => {
      ro?.disconnect();
      window.clearTimeout(timer);
      drawn.stop();
    };
  }, [status, pages]);

  // A swipe can cut a chevron's smooth scroll short so it never lands; once the
  // track has been still for a moment, stop waiting and read where it stopped.
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
  useDragSwipe(trackRef, (i) => goTo(i), status === 'ready');

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const next = Math.min(Math.max(i, 0), pages - 1);
    pending.current = next;
    settleSoon(600);
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo?.({ left: next * el.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
    setIdx(next);
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    if (laidOut.current && el.clientWidth !== laidOut.current) return; // resized: the slide is put back first
    const at = Math.min(Math.max(Math.round(el.scrollLeft / el.clientWidth), 0), pages - 1);
    if (pending.current !== null) {
      if (at === pending.current) pending.current = null;
      else settleSoon(); // still moving, or cut short by a swipe
      return;
    }
    setIdx(at);
  };

  if (status === 'error') {
    return (
      <p className="pdf-status">
        {tx("The in-page deck couldn't open — {link} instead.", {
          link: (
            <a href={src} target="_blank" rel="noopener noreferrer">
              {t('open it in its own tab')}
            </a>
          ),
        })}
      </p>
    );
  }

  const atStart = idx === 0;
  const atEnd = idx === pages - 1;

  return (
    <Expandable label={title} aspect={aspect} chrome={CHROME} holdToOpen>
      <figure className="story-figure pdf-deck">
        {status === 'loading' ? (
          <p className="pdf-status" role="status">
            {tx('loading {title}…', { title })}
          </p>
        ) : (
          <>
            <div className="pdf-deck-stage">
              <div
                className="pdf-deck-track"
                ref={trackRef}
                onScroll={onScroll}
                tabIndex={0}
                role="group"
                aria-roledescription={t('slide deck')}
                aria-label={title}
              >
                {Array.from({ length: pages }, (_, i) => (
                  <div className="pdf-deck-slide" key={i}>
                    <canvas
                      className="pdf-deck-canvas"
                      data-page={i + 1}
                      aria-label={fill(t('{title}, slide {n} of {m}'), { title, n: i + 1, m: pages })}
                    />
                  </div>
                ))}
              </div>
              {pages > 1 && (
                <>
                  <button
                    type="button"
                    className="carousel-arrow carousel-prev"
                    aria-label={t('Previous slide')}
                    aria-disabled={atStart}
                    onClick={() => !atStart && go(-1)}
                  >
                    &#8249;
                  </button>
                  <button
                    type="button"
                    className="carousel-arrow carousel-next"
                    aria-label={t('Next slide')}
                    aria-disabled={atEnd}
                    onClick={() => !atEnd && go(1)}
                  >
                    &#8250;
                  </button>
                </>
              )}
            </div>
            <figcaption aria-live="polite" aria-atomic="true">
              <span className="pdf-deck-note">{captions?.[idx]}</span>
              {pages > 1 && (
                <span className="carousel-count">
                  {idx + 1} / {pages}
                </span>
              )}
            </figcaption>
            <p className="doc-escape">
              <a href={src} target="_blank" rel="noopener noreferrer">
                {t('open in its own tab')}
              </a>
            </p>
          </>
        )}
      </figure>
    </Expandable>
  );
}
