import { useMemo, useState } from 'react';
import { CodeEditor } from './CodeEditor';
import { useCRunner } from '../cide/useCRunner';
import type { LabProgram } from '../data/aps105Labs';

// One program's IDE: an editable code editor (per file), a preset stdin box, Run
// (compile + link + execute the C in a worker), and Reset (restore the original
// submission). Mount with a `key={program.id}` so switching programs starts fresh.
export function CLab({ program }: { program: LabProgram }) {
  const [codes, setCodes] = useState<Record<string, string>>(() =>
    Object.fromEntries(program.files.map((f) => [f.name, f.code])),
  );
  const [stdin, setStdin] = useState(program.stdin);
  const [active, setActive] = useState(program.files[0].name);
  const { state, run, reset } = useCRunner();

  const activeFile = useMemo(
    () => program.files.find((f) => f.name === active) ?? program.files[0],
    [program.files, active],
  );
  const dirty =
    program.files.some((f) => codes[f.name] !== f.code) || stdin !== program.stdin;
  const busy =
    state.phase === 'loading' || state.phase === 'compiling' || state.phase === 'running';
  const runnable = program.runnable !== false;

  const onRun = () => {
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
      ? 'Downloading the C toolchain — first run only (~40 MB, then cached)…'
      : state.phase === 'compiling'
        ? 'Compiling…'
        : state.phase === 'running'
          ? 'Running…'
          : '';

  const failed = state.phase === 'done' && state.stage !== 'run';
  const showOutput = state.phase !== 'idle';

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
            <button type="button" className="clab-run" onClick={onRun} disabled={busy}>
              {busy ? 'Running…' : 'Run'}
            </button>
            <button
              type="button"
              className="clab-reset"
              onClick={onReset}
              disabled={busy || (!dirty && state.phase === 'idle')}
            >
              Reset
            </button>
            {status && (
              <span className="clab-status" role="status">
                {status}
              </span>
            )}
          </div>

          {showOutput && (
            <div className="clab-output" aria-live="polite">
              {state.diagnostics.trim() && (
                <pre className="clab-diag">{state.diagnostics.trim()}</pre>
              )}
              {state.timedOut && (
                <pre className="clab-diag">
                  Stopped after 10 seconds. The program ran too long. It may have an infinite loop,
                  or it is waiting for more input than the stdin box provides.
                </pre>
              )}
              {state.stdout && <pre className="clab-stdout">{state.stdout}</pre>}
              {state.phase === 'done' &&
                !state.stdout &&
                !state.diagnostics.trim() &&
                !state.timedOut && <pre className="clab-stdout">(no output)</pre>}
              {state.phase === 'done' && (
                <div className="clab-exit">
                  {state.timedOut
                    ? 'timed out'
                    : failed
                      ? `${state.stage === 'compile' ? 'compilation' : 'link'} failed`
                      : `program exited with code ${state.exitCode ?? '?'}`}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
