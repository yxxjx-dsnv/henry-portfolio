import { useId, useMemo, useRef } from 'react';
import { highlightLines, type CodeLang } from './CodeViewer';

const INDENT = '  ';

// An editable code area: a transparent <textarea> laid exactly over a
// syntax-highlighted <pre> (sharing the CodeViewer highlighter), with a synced
// line-number gutter. No editor dependency; lines never wrap (horizontal scroll)
// so the two layers stay aligned character-for-character.
//
// Tab indents (every selected line, when the selection spans lines) and
// Shift+Tab outdents, as in an IDE. Escape, then Tab, leaves the editor, so a
// keyboard user is never trapped in it.
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
  const hlRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const escaped = useRef(false);
  const hintId = useId();
  const lines = useMemo(() => highlightLines(value, lang), [value, lang]);

  // Move the highlight and the gutter by the textarea's scroll offset instead of
  // copying scrollTop/Left: with classic (always-shown) scrollbars the textarea
  // can scroll a scrollbar's width further than an overflow-hidden <pre>, and
  // the copied offsets drifted the code away from the caret.
  const syncScroll = () => {
    const ta = taRef.current;
    if (!ta) return;
    if (hlRef.current) hlRef.current.style.transform = `translate(${-ta.scrollLeft}px, ${-ta.scrollTop}px)`;
    if (gutterRef.current) gutterRef.current.style.transform = `translateY(${-ta.scrollTop}px)`;
  };

  /** Replace [from, to) with `text`, through the browser's own editing so Undo works. */
  const replace = (ta: HTMLTextAreaElement, from: number, to: number, text: string, select?: [number, number]) => {
    ta.setSelectionRange(from, to);
    let done = false;
    try {
      done = document.execCommand('insertText', false, text);
    } catch {
      /* not supported */
    }
    if (!done) onChange(value.slice(0, from) + text + value.slice(to));
    const [a, b] = select ?? [from + text.length, from + text.length];
    requestAnimationFrame(() => ta.setSelectionRange(a, b));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // a key that finishes a Korean (IME) syllable belongs to the IME
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Escape') {
      escaped.current = true;
      return;
    }
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return; // Escape, Shift+Tab
    if (e.key !== 'Tab') {
      escaped.current = false;
      return;
    }
    if (readOnly || escaped.current || e.altKey || e.ctrlKey || e.metaKey) {
      escaped.current = false;
      return; // let Tab move focus as usual
    }
    e.preventDefault();
    const ta = e.currentTarget;
    const { selectionStart: start, selectionEnd: end } = ta;
    const multiline = value.slice(start, end).includes('\n');
    if (!multiline && !e.shiftKey) {
      replace(ta, start, end, INDENT);
      return;
    }
    // indent / outdent every line the selection touches
    const from = value.lastIndexOf('\n', start - 1) + 1;
    const lastChar = end > start && value[end - 1] === '\n' ? end - 1 : end;
    const nl = value.indexOf('\n', lastChar);
    const to = nl === -1 ? value.length : nl;
    const block = value
      .slice(from, to)
      .split('\n')
      .map((l) => (e.shiftKey ? l.replace(/^ {1,2}/, '') : INDENT + l))
      .join('\n');
    if (block === value.slice(from, to)) return;
    const caret = Math.max(from, start - (to - from - block.length)); // outdenting one line keeps the caret in place
    replace(ta, from, to, block, multiline ? [from, from + block.length] : [caret, caret]);
  };

  return (
    <div className={`c-editor${readOnly ? ' is-readonly' : ''}`}>
      <div className="c-editor-gutter" aria-hidden="true">
        <div ref={gutterRef}>
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
      </div>
      <div className="c-editor-area">
        <pre className="c-editor-hl" aria-hidden="true">
          <div ref={hlRef}>
            {lines.map((nodes, i) => (
              <div className="c-editor-line" key={i}>
                {nodes.length ? nodes : ' '}
              </div>
            ))}
          </div>
        </pre>
        <textarea
          ref={taRef}
          className="c-editor-ta"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={onKeyDown}
          // an Escape only counts for the very next Tab
          onMouseDown={() => (escaped.current = false)}
          onBlur={() => (escaped.current = false)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          wrap="off"
          readOnly={readOnly}
          aria-label={ariaLabel}
          aria-readonly={readOnly}
          aria-describedby={readOnly ? undefined : hintId}
        />
        {!readOnly && (
          <span id={hintId} hidden>
            Tab indents and Shift+Tab outdents. Press Escape, then Tab, to leave the editor.
          </span>
        )}
      </div>
    </div>
  );
}
