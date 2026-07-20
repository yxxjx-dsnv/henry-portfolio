import { useMemo, useRef } from 'react';
import { highlightLines, type CodeLang } from './CodeViewer';

// An editable code area: a transparent <textarea> laid exactly over a
// syntax-highlighted <pre> (sharing the CodeViewer highlighter), with a synced
// line-number gutter. No editor dependency; lines never wrap (horizontal scroll)
// so the two layers stay aligned character-for-character.
export function CodeEditor({
  value,
  onChange,
  lang = 'cpp',
  readOnly = false,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  lang?: CodeLang;
  readOnly?: boolean;
  ariaLabel: string;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const hlRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => highlightLines(value, lang), [value, lang]);

  const syncScroll = () => {
    const ta = taRef.current;
    if (!ta) return;
    if (hlRef.current) {
      hlRef.current.scrollTop = ta.scrollTop;
      hlRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && !readOnly) {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.slice(0, start) + '  ' + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className={`c-editor${readOnly ? ' is-readonly' : ''}`}>
      <div className="c-editor-gutter" ref={gutterRef} aria-hidden="true">
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <div className="c-editor-area">
        <pre className="c-editor-hl" ref={hlRef} aria-hidden="true">
          {lines.map((nodes, i) => (
            <div className="c-editor-line" key={i}>
              {nodes.length ? nodes : ' '}
            </div>
          ))}
        </pre>
        <textarea
          ref={taRef}
          className="c-editor-ta"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          wrap="off"
          readOnly={readOnly}
          aria-label={ariaLabel}
          aria-readonly={readOnly}
        />
      </div>
    </div>
  );
}
