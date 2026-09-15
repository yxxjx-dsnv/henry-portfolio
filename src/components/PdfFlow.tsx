import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n';

type PDFDocument = import('pdfjs-dist').PDFDocumentProxy;
type LoadingTask = ReturnType<(typeof import('pdfjs-dist'))['getDocument']>;

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
  const rendered = useRef<Set<number>>(new Set());
  const [pages, setPages] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

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
    const wrap = wrapRef.current;
    const doc = docRef.current;
    if (!wrap || !doc) return;

    const renderPage = async (n: number, canvas: HTMLCanvasElement) => {
      if (rendered.current.has(n)) return;
      rendered.current.add(n);
      try {
        const page = await doc.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const cssWidth = wrap.clientWidth || 560;
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
      { root: wrap, rootMargin: '600px 0px' },
    );
    wrap.querySelectorAll<HTMLCanvasElement>('canvas[data-page]').forEach((c) => io.observe(c));
    return () => io.disconnect();
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
  );
}
