import { useEffect, useMemo, useRef, useState } from 'react';

export type PaletteAction = {
  label: string;
  hint?: string;
  run: () => void;
  // extra terms to match on (not shown); e.g. an egg answers to "easter egg"
  keywords?: string;
  // hidden from the default list — only surfaces once its keywords are typed
  secret?: boolean;
};

// ⌘K switchboard — a quiet serif palette. Type to filter, arrows to move,
// Enter to run. The selected row's dot fills, of course.
export function CommandPalette({
  open,
  onClose,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  actions: PaletteAction[];
}) {
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, '');
    if (!q) return actions.filter((a) => !a.secret);
    return actions.filter((a) =>
      `${a.label} ${a.keywords ?? ''}`.toLowerCase().replace(/\s+/g, '').includes(q),
    );
  }, [actions, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSel(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setSel(0), [query]);

  if (!open) return null;

  const run = (a?: PaletteAction) => {
    if (!a) return;
    onClose();
    a.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(filtered[sel]);
    }
  };

  return (
    <>
      <div className="cmdk-scrim" onClick={onClose} />
      <div className="cmdk" role="dialog" aria-label="Command palette" onKeyDown={onKeyDown}>
        <input
          ref={inputRef}
          className="cmdk-input"
          placeholder="Type a page or action…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
        />
        <ul className="cmdk-list">
          {filtered.length === 0 && <li className="cmdk-empty">Nothing answers to that.</li>}
          {filtered.map((a, i) => (
            <li key={a.label}>
              <button
                type="button"
                className={`cmdk-row${i === sel ? ' is-selected' : ''}`}
                onPointerEnter={() => setSel(i)}
                onClick={() => run(a)}
              >
                <span className="cmdk-dot" aria-hidden="true" />
                <span className="cmdk-label">{a.label}</span>
                {a.hint && <span className="cmdk-hint">{a.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
