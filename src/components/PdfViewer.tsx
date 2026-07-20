import { useEffect, useRef, useState } from 'react';

type PDFDocument = import('pdfjs-dist').PDFDocumentProxy;
type LoadingTask = ReturnType<(typeof import('pdfjs-dist'))['getDocument']>;
type RenderTask = ReturnType<import('pdfjs-dist').PDFPageProxy['render']>;

// In-page PDF reader built on pdf.js (bundled locally, loaded only when a
// document is opened). One page at a time; pages turn via the chevrons (top
// and bottom), a click on the left or right side of the page, a horizontal
// swipe, or the arrow keys. Click the page number to jump anywhere.
export function PdfViewer({ src, title }: { src: string; title: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<PDFDocument | null>(null);
  const loadingRef = useRef<LoadingTask | null>(null);
  const taskRef = useRef<RenderTask | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [editing, setEditing] = useState<'top' | 'bottom' | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const loadingTask = pdfjs.getDocument({ url: src });
        loadingRef.current = loadingTask;
        const doc = await loadingTask.promise;
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
      taskRef.current?.cancel();
      loadingRef.current?.destroy();
      loadingRef.current = null;
      docRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const doc = docRef.current;
    if (!doc || status !== 'ready') return;
    let dead = false;
    (async () => {
      try {
        const p = await doc.getPage(page);
        const canvas = canvasRef.current;
        const wrap = wrapRef.current;
        if (!canvas || !wrap || dead) return;
        const base = p.getViewport({ scale: 1 });
        const cssWidth = wrap.clientWidth || 560;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = p.getViewport({ scale: (cssWidth / base.width) * dpr });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        taskRef.current?.cancel();
        const task = p.render({ canvas, viewport });
        taskRef.current = task;
        await task.promise;
      } catch {
        /* render cancelled by a newer page turn */
      }
    })();
    return () => {
      dead = true;
    };
  }, [page, status]);

  const go = (dir: number) => setPage((p) => Math.min(Math.max(p + dir, 1), pages));
  const atStart = page <= 1;
  const atEnd = page >= pages;

  const beginEdit = (which: 'top' | 'bottom') => {
    setDraft(String(page));
    setEditing(which);
  };
  const commitEdit = () => {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n)) setPage(Math.min(Math.max(n, 1), pages));
    setEditing(null);
  };

  // click on the left / right side of the page turns it
  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    if (x < 0.4) go(-1);
    else if (x > 0.6) go(1);
  };

  // a horizontal swipe turns the page like a book
  const onTouchStartCapture = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  };

  if (status === 'error') {
    return (
      <p className="pdf-status">
        The in-page reader couldn't open this document —{' '}
        <a href={src} target="_blank" rel="noopener noreferrer">
          open it in its own tab
        </a>{' '}
        instead.
      </p>
    );
  }

  const toolbar = (which: 'top' | 'bottom') => (
    <div className="pdf-toolbar">
      <button
        type="button"
        className="pdf-arrow"
        aria-label="Previous page"
        aria-disabled={atStart}
        onClick={() => !atStart && go(-1)}
      >
        &#8249;
      </button>
      <span className="pdf-count">
        {'page '}
        {editing === which ? (
          <input
            className="pdf-page-input"
            type="text"
            inputMode="numeric"
            value={draft}
            autoFocus
            aria-label={`Go to page (1 to ${pages})`}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') setEditing(null);
            }}
          />
        ) : (
          <button
            type="button"
            className="pdf-page-current"
            aria-label={`Page ${page} of ${pages} — click to jump to a page`}
            onClick={() => beginEdit(which)}
          >
            {page}
          </button>
        )}
        {' / '}
        {pages}
      </span>
      <button
        type="button"
        className="pdf-arrow"
        aria-label="Next page"
        aria-disabled={atEnd}
        onClick={() => !atEnd && go(1)}
      >
        &#8250;
      </button>
    </div>
  );

  return (
    <div className="pdf-viewer" ref={wrapRef} onKeyDown={onKeyDown}>
      {status === 'loading' ? (
        <p className="pdf-status" role="status">
          loading {title}…
        </p>
      ) : (
        <>
          {toolbar('top')}
          <div className="pdf-page" onTouchStart={onTouchStartCapture} onTouchEnd={onTouchEnd}>
            <canvas
              ref={canvasRef}
              onClick={onCanvasClick}
              aria-label={`${title}, page ${page} of ${pages}. Click the left or right side to turn.`}
            />
          </div>
          {toolbar('bottom')}
        </>
      )}
    </div>
  );
}
