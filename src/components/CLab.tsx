import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CodeEditor } from './CodeEditor';
import { RUN_TIMEOUT_MS, useCRunner } from '../cide/useCRunner';
import { OUTPUT_LIMIT } from '../cide/text';
import type { LabProgram } from '../data/aps105Labs';

// One program's IDE: an editable code editor (per file), a preset stdin box, Run
// (compile + link + execute the C in a worker; Stop while it runs), and Reset
// (restore the original submission). Mount with a `key={program.id}` so switching
// programs starts fresh.
export function CLab({ program }: { program: LabProgram }) {
  const [codes, setCodes] = useState<Record<string, string>>(() =>
    Object.fromEntries(program.files.map((f) => [f.name, f.code])),
  );
  const [stdin, setStdin] = useState(program.stdin);
  const [active, setActive] = useState(program.files[0].name);
  const { state, run, stop, reset } = useCRunner();
  const outRef = useRef<HTMLPreElement>(null);
  const stick = useRef(true); // the reader is at the bottom of the output

  const activeFile = useMemo(
    () => program.files.find((f) => f.name === active) ?? program.files[0],
    [program.files, active],
  );
  const dirty =
    program.files.some((f) => codes[f.name] !== f.code) || stdin !== program.stdin;
  const busy =
    state.phase === 'loading' || state.phase === 'compiling' || state.phase === 'running';
  const runnable = program.runnable !== false;

  // Run turns into Stop in the same place. A click that lands right after the
  // swap (the second click of a double-click, or a Stop that arrives as the run
  // ends) was meant for the other button, so it is ignored.
  const swappedAt = useRef(0);
  useEffect(() => {
    swappedAt.current = performance.now();
  }, [busy]);
  const justSwapped = () => performance.now() - swappedAt.current < 350;

  const onRun = () => {
    if (justSwapped()) return;
    stick.current = true;
    run(
      program.files.map((f) => ({ name: f.name, contents: codes[f.name] })),
      stdin,
    );
  };
  const onReset = () => {
    setCodes(Object.fromEntries(program.files.map((f) => [f.name, f.code])));
    setStdin(program.stdin);
    reset();
  };

  const status =
    state.phase === 'loading'
      ? 'Preparing the C compiler (the first run downloads about 20 MB, then it is cached)…'
      : state.phase === 'compiling'
        ? 'Compiling…'
        : state.phase === 'running'
          ? `Running… (stops after ${RUN_TIMEOUT_MS / 1000} s)`
          : '';

  // keep the newest output in view while it streams, unless the reader scrolled up
  // (whether they did is known from their own scrolling, not measured after the
  // new text has already pushed the bottom away)
  useLayoutEffect(() => {
    const el = outRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [state.stdout]);
  // …and when the box itself changes height (expanded or closed), which moves no text
  const hasOutput = !!state.stdout;
  useEffect(() => {
    const el = outRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      if (stick.current) el.scrollTop = el.scrollHeight;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasOutput]);
  const onOutputScroll = (e: React.UIEvent<HTMLPreElement>) => {
    const el = e.currentTarget;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  };

  const compilerCrashed = state.ended === 'crashed' && state.stage !== 'run';
  const notice =
    state.ended === 'timeout'
      ? `Stopped after ${RUN_TIMEOUT_MS / 1000} seconds. The program ran too long. It may have an infinite loop, or it is waiting for more input than the stdin box provides.`
      : state.ended === 'limit'
        ? `Stopped after ${OUTPUT_LIMIT.toLocaleString('en-US')} characters of output. A program that prints without end is usually asking for input again and again because the stdin box ran out. Add more input, or check the loop.`
        : state.ended === 'error'
          ? 'The C compiler could not load. Reload the page and press Run again.'
          : compilerCrashed
            ? 'The compiler itself crashed on this code (a very long or deeply nested expression can do this). Simplify it and run again.'
            : undefined;

  const failed = state.phase === 'done' && !state.ended && state.stage !== 'run';
  const showOutput = state.phase !== 'idle';
  const endLine =
    state.phase !== 'done'
      ? ''
      : state.ended === 'timeout'
        ? 'timed out'
        : state.ended === 'limit'
          ? 'stopped: too much output'
          : state.ended === 'stopped'
            ? 'stopped'
            : compilerCrashed
              ? 'compiler crashed'
              : state.ended === 'crashed'
                ? 'program crashed'
                : state.ended === 'error'
                  ? 'could not run'
                  : failed
                    ? `${state.stage === 'compile' ? 'compilation' : 'link'} failed`
                    : `program exited with code ${state.exitCode ?? '?'}`;
  // one always-present live region: the output itself streams too fast to read aloud
  const announce = busy
    ? status
    : endLine && `${endLine}${state.diagnostics.trim() || notice ? '. See the messages above the output.' : ''}`;

  return (
    <div className="clab">
      {program.files.length > 1 && (
        <div className="clab-tabs" role="tablist" aria-label="Files">
          {program.files.map((f) => (
            <button
              key={f.name}
              type="button"
              role="tab"
              aria-selected={f.name === active}
              className={`clab-tab${f.name === active ? ' is-active' : ''}`}
              onClick={() => setActive(f.name)}
            >
              {f.name}
              {f.readonly ? ' · read-only' : ''}
            </button>
          ))}
        </div>
      )}

      <CodeEditor
        value={codes[active] ?? ''}
        onChange={(v) => setCodes((c) => ({ ...c, [active]: v }))}
        lang="cpp"
        readOnly={!!activeFile.readonly}
        ariaLabel={`${program.title} — ${active}`}
      />

      {!runnable ? (
        <>
          {program.note && <p className="clab-note">{program.note}</p>}
          {dirty && (
            <div className="clab-controls">
              <button type="button" className="clab-reset" onClick={onReset}>
                Reset
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <label className="clab-stdin-label" htmlFor={`stdin-${program.id}`}>
            Program input (stdin)
          </label>
          <textarea
            id={`stdin-${program.id}`}
            className="clab-stdin"
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            spellCheck={false}
            wrap="off"
            rows={3}
            placeholder="What the program reads with scanf, one value per line."
          />

          <div className="clab-controls">
            {busy ? (
              <button type="button" className="clab-run is-stop" onClick={() => justSwapped() || stop()}>
                Stop
              </button>
            ) : (
              <button type="button" className="clab-run" onClick={onRun}>
                Run
              </button>
            )}
            <button
              type="button"
              className="clab-reset"
              onClick={onReset}
              disabled={busy || (!dirty && state.phase === 'idle')}
            >
              Reset
            </button>
            {status && <span className="clab-status">{status}</span>}
            <span className="sr-only" role="status">
              {announce}
            </span>
          </div>

          {showOutput && (
            <div className="clab-output">
              {state.diagnostics.trim() && (
                <pre className="clab-diag" tabIndex={0} aria-label="Compiler messages">
                  {state.diagnostics.trim()}
                </pre>
              )}
              {notice && <pre className="clab-diag">{notice}</pre>}
              {state.stdout && (
                // focusable, so a keyboard can scroll a long output
                <pre className="clab-stdout" ref={outRef} onScroll={onOutputScroll} tabIndex={0} aria-label="Program output">
                  {state.stdout}
                </pre>
              )}
              {state.phase === 'done' && !state.stdout && !state.diagnostics.trim() && !notice && (
                <pre className="clab-stdout">(no output)</pre>
              )}
              {endLine && <div className="clab-exit">{endLine}</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
