import { useEffect, useId, useState } from 'react';
import { CodeViewer, type CodeLang } from './CodeViewer';
import { PdfViewer } from './PdfViewer';

export type ShelfDoc = {
  title: string;
  meta: string;
  file: string;
  kind: 'pdf' | 'code';
  lang?: CodeLang;
  source?: string; // raw text for kind: 'code'
  loadSource?: () => Promise<string>; // lazy alternative to `source`
};

// Thin line-art icons that name the file type: a page for a PDF, angle
// brackets for code. Currentcolor + hairline stroke to match the mono set.
function DocIcon({ kind }: { kind: ShelfDoc['kind'] }) {
  return (
    <svg
      className="doc-icon"
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === 'code' ? (
        <>
          <path d="M5.5 5 2.5 8l3 3" />
          <path d="M10.5 5l3 3-3 3" />
        </>
      ) : (
        <>
          <path d="M4 1.5h5L12.5 5v9.5H4z" />
          <path d="M9 1.5V5h3.5" />
        </>
      )}
    </svg>
  );
}

function CodePanel({ doc }: { doc: ShelfDoc }) {
  const [source, setSource] = useState<string | null>(doc.source ?? null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (source !== null || !doc.loadSource) return;
    let dead = false;
    doc
      .loadSource()
      .then((s) => !dead && setSource(s))
      .catch(() => !dead && setFailed(true));
    return () => {
      dead = true;
    };
  }, [doc, source]);
  if (failed) return <p className="pdf-status">Couldn't load the source here.</p>;
  if (source === null)
    return (
      <p className="pdf-status" role="status">
        loading {doc.title}…
      </p>
    );
  return <CodeViewer source={source} filename={doc.title} meta={doc.meta} lang={doc.lang} />;
}

// The document shelf: each row opens its document right on the page — PDFs in
// the site's own pdf.js reader, code in the editor panel. A quiet "open in its
// own tab" escape hatch stays underneath.
export function DocShelf({ docs, base }: { docs: ShelfDoc[]; base: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const panelBaseId = useId();

  return (
    <ul className="doc-list">
      {docs.map((d, i) => {
        const isOpen = open === d.file;
        const href = `${base}/${d.file}`;
        const panelId = `${panelBaseId}-${i}`;
        return (
          <li key={d.file} className={isOpen ? 'doc-open' : ''}>
            <button
              type="button"
              className="doc-row"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : d.file)}
            >
              <span className="doc-label">
                <DocIcon kind={d.kind} />
                <span className="doc-title">{d.title}</span>
              </span>
              <span className="doc-meta">
                {d.meta} · {isOpen ? 'close' : 'view'}
              </span>
            </button>
            {isOpen && (
              <div className="doc-viewer" id={panelId}>
                {d.kind === 'code' ? <CodePanel doc={d} /> : <PdfViewer src={href} title={d.title} />}
                <p className="doc-escape">
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    open in its own tab
                  </a>
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
