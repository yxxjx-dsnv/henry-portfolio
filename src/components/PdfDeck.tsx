import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n';

type PDFDocument = import('pdfjs-dist').PDFDocumentProxy;
type LoadingTask = ReturnType<(typeof import('pdfjs-dist'))['getDocument']>;

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
  const rendered = useRef<Set<number>>(new Set());
  const pending = useRef<number | null>(null);
  const [pages, setPages] = useState(0);
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
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

    const renderPage = async (n: number, canvas: HTMLCanvasElement) => {
      if (rendered.current.has(n)) return;
      rendered.current.add(n);
      try {
        const page = await doc.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const cssWidth = track.clientWidth || 560;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: (cssWidth / base.width) * dpr });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, viewport }).promise;
      } catch {
        rendered.current.delete(n);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const canvas = e.target as HTMLCanvasElement;
            renderPage(Number(canvas.dataset.page), canvas);
          }
        }
      },
      { root: track, rootMargin: '0px 400px' },
    );
    track.querySelectorAll<HTMLCanvasElement>('canvas[data-page]').forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [status, pages]);

  const go = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    const from = pending.current ?? idx;
    const next = Math.min(Math.max(from + dir, 0), pages - 1);
    pending.current = next;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo?.({ left: next * el.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
    setIdx(next);
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const at = Math.min(Math.max(Math.round(el.scrollLeft / el.clientWidth), 0), pages - 1);
    if (pending.current !== null) {
      if (at === pending.current) pending.current = null;
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
  );
}
