import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n';
import { useNearView } from '../hooks/useNearView';
import { Expandable } from './Expandable';

type PDFDocument = import('pdfjs-dist').PDFDocumentProxy;
type LoadingTask = ReturnType<(typeof import('pdfjs-dist'))['getDocument']>;
type RenderTask = ReturnType<import('pdfjs-dist').PDFPageProxy['render']>;

/**
 * Draws each `canvas[data-page]` under `root` as it nears view (shared with
 * PdfDeck), `cssWidth` giving the width to draw a page at. `redraw()` is for a
 * new size: drawings under way stop, the pages in view draw again now and the
 * rest as they come into view, from the PDF already loaded. `stop()` ends it.
 */
export function drawPages(
  doc: PDFDocument,
  root: HTMLElement,
  rootMargin: string,
  cssWidth: (page: { width: number; height: number }) => number,
) {
  const done = new Set<number>();
  const tasks = new Map<number, RenderTask>();
  const drawnAt = new Map<number, number>(); // the pixel width each page last finished drawing at
  const draw = async (n: number, canvas: HTMLCanvasElement) => {
    if (done.has(n)) return;
    done.add(n);
    let task: RenderTask | undefined;
    try {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: (cssWidth(base) / base.width) * dpr });
      const px = Math.floor(viewport.width);
      if (drawnAt.get(n) === px) return; // already sharp at this size (redrawing would blank it)
      tasks.get(n)?.cancel(); // a canvas takes one drawing at a time
      drawnAt.delete(n); // clearing the canvas below forgets the drawing it held
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      task = page.render({ canvas, viewport });
      tasks.set(n, task);
      await task.promise;
      drawnAt.set(n, px);
    } catch {
      if (tasks.get(n) === task) done.delete(n); // failed, not overtaken: try again when next in view
    } finally {
      if (tasks.get(n) === task) tasks.delete(n);
    }
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const canvas = e.target as HTMLCanvasElement;
          void draw(Number(canvas.dataset.page), canvas);
        }
      }
    },
    { root, rootMargin },
  );
  // observing afresh reports every page's visibility again
  const watch = () =>
    root.querySelectorAll<HTMLCanvasElement>('canvas[data-page]').forEach((c) => {
      io.unobserve(c);
      io.observe(c);
    });
  const halt = () => {
    tasks.forEach((t) => t.cancel());
    tasks.clear();
  };
  watch();
  return {
    redraw() {
      halt();
      done.clear();
      watch();
    },
    stop() {
      io.disconnect();
      halt();
    },
  };
}

// t() for an attribute: fills {name} placeholders with plain values (tx() returns elements)
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k) => String(v[k] ?? m));

// A continuous, in-page PDF reader: every page stacked vertically and rendered
// as it scrolls into view (pdf.js, bundled locally, loaded only when the flow
// mounts). The document reads like part of the page, not a file behind a link.
// Optional `captions` prints a note under each page (captions[i] for page i+1).
export function PdfFlow({
  src,
  title,
  captions,
}: {
  src: string;
  title: string;
  captions?: string[];
}) {
  const { t, tx } = useLang();
  const wrapRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<PDFDocument | null>(null);
  const loadingRef = useRef<LoadingTask | null>(null);
  const [pages, setPages] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // nothing is fetched until the reader is near the report
  const near = useNearView(wrapRef);
  useEffect(() => {
    if (!near) return;
    let dead = false;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const task = pdfjs.getDocument({ url: src, disableAutoFetch: true, disableStream: true }); // only the pages drawn are fetched
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
  }, [src, near]);

  useEffect(() => {
    if (status !== 'ready' || pages === 0) return;
    const wrap = wrapRef.current;
    const doc = docRef.current;
    if (!wrap || !doc) return;
    const drawn = drawPages(doc, wrap, '600px 0px', () => wrap.clientWidth || 560);

    // Grown into the expand frame or back, the pages change width: the reader
    // keeps their place, and once the size settles the pages draw again, sharp.
    // The place is kept as a page and how far into it, not as a share of the whole
    // report: pages still drawing change the report's height but not that.
    let width = wrap.clientWidth;
    let place = { page: 0, into: 0 };
    // in layout, not on screen: the expand frame's grow animation scales what rects report
    const top = (f: HTMLElement) => (f.offsetParent === wrap ? f.offsetTop : f.offsetTop - wrap.offsetTop);
    const onScroll = () => {
      if (wrap.clientWidth !== width) return; // resized: the place is put back first
      const figs = wrap.querySelectorAll<HTMLElement>('.pdf-flow-figure');
      for (let i = 0; i < figs.length; i++) {
        const at = top(figs[i]);
        const h = figs[i].offsetHeight;
        if (at + h > wrap.scrollTop) {
          place = { page: i, into: (wrap.scrollTop - at) / (h || 1) };
          return;
        }
      }
    };
    let timer = 0;
    const ro =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            if (wrap.clientWidth === width || wrap.clientWidth === 0) return;
            width = wrap.clientWidth;
            const fig = wrap.querySelectorAll<HTMLElement>('.pdf-flow-figure')[place.page];
            if (fig) wrap.scrollTop = top(fig) + place.into * fig.offsetHeight;
            window.clearTimeout(timer);
            timer = window.setTimeout(drawn.redraw, 150);
          })
        : undefined;
    ro?.observe(wrap);
    wrap.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      ro?.disconnect();
      wrap.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
      drawn.stop();
    };
  }, [status, pages]);

  if (status === 'error') {
    return (
      <p className="pdf-status">
        {tx("The in-page reader couldn't open this document — {link} instead.", {
          link: (
            <a href={src} target="_blank" rel="noopener noreferrer">
              {t('open it in its own tab')}
            </a>
          ),
        })}
      </p>
    );
  }

  return (
    <Expandable label={title}>
      <div className="pdf-flow">
        <div className="pdf-flow-scroll" ref={wrapRef} tabIndex={0} aria-label={title}>
          {status === 'loading' ? (
            <p className="pdf-status" role="status">
              {tx('loading {title}…', { title })}
            </p>
          ) : (
            Array.from({ length: pages }, (_, i) => (
              <figure className="pdf-flow-figure" key={i}>
                <canvas
                  className="pdf-flow-page"
                  data-page={i + 1}
                  aria-label={fill(t('{title}, page {n} of {m}'), { title, n: i + 1, m: pages })}
                />
                {captions?.[i] && <figcaption className="pdf-flow-caption">{captions[i]}</figcaption>}
              </figure>
            ))
          )}
        </div>
        <p className="doc-escape">
          <a href={src} target="_blank" rel="noopener noreferrer">
            {t('open in its own tab')}
          </a>
        </p>
      </div>
    </Expandable>
  );
}
