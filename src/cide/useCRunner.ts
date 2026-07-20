import { useCallback, useEffect, useRef, useState } from 'react';

export type RunFile = { name: string; contents: string };

export type RunPhase = 'idle' | 'loading' | 'compiling' | 'running' | 'done';

export type RunState = {
  phase: RunPhase;
  stdout: string;
  diagnostics: string;
  exitCode: number | null;
  stage: 'compile' | 'link' | 'run' | null;
  timedOut: boolean;
};

const IDLE: RunState = {
  phase: 'idle',
  stdout: '',
  diagnostics: '',
  exitCode: null,
  stage: null,
  timedOut: false,
};

// A program's `_start` runs synchronously inside the worker, so an infinite loop
// (or one waiting for more input than stdin provides) can't be interrupted from
// inside — the only cure is to terminate the whole worker. Cap every run here.
const RUN_TIMEOUT_MS = 10_000;

// Owns the clang worker for one program's editor. `run()` compiles + executes the
// given files with the given stdin; `reset()` clears the output. The worker is
// created lazily on the first run (so the page — and the ~60 MB toolchain — stay
// untouched until someone clicks Run), watchdog-terminated if a run runs away,
// and torn down on unmount.
export function useCRunner() {
  const workerRef = useRef<Worker | null>(null);
  const idRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<RunState>(IDLE);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const ensureWorker = useCallback((): Worker => {
    if (workerRef.current) return workerRef.current;
    const w = new Worker(new URL('./clangWorker.ts', import.meta.url), { type: 'module' });
    w.postMessage({ type: 'init', base: `${import.meta.env.BASE_URL}cide/` });
    w.onmessage = (e: MessageEvent) => {
      const m = e.data as {
        type: string;
        id: number;
        phase?: string;
        data?: string;
        exitCode?: number;
        stage?: RunState['stage'];
        message?: string;
      };
      if (m.id !== idRef.current) return; // ignore a superseded run
      if (m.type === 'done' || m.type === 'error') clearTimer();
      setState((s) => {
        switch (m.type) {
          case 'status':
            if (m.phase === 'loading') return { ...s, phase: 'loading' };
            if (m.phase === 'compiling') return { ...s, phase: 'compiling' };
            return s;
          case 'stdout':
            return { ...s, phase: 'running', stdout: s.stdout + (m.data ?? '') };
          case 'diag':
            return { ...s, diagnostics: s.diagnostics + (m.data ?? '') };
          case 'done':
            return { ...s, phase: 'done', exitCode: m.exitCode ?? null, stage: m.stage ?? null };
          case 'error':
            return {
              ...s,
              phase: 'done',
              stage: 'run',
              diagnostics: (s.diagnostics ? s.diagnostics + '\n' : '') + (m.message ?? 'error'),
            };
          default:
            return s;
        }
      });
    };
    workerRef.current = w;
    return w;
  }, []);

  const run = useCallback(
    (files: RunFile[], stdin: string) => {
      const w = ensureWorker();
      const id = ++idRef.current;
      setState({ ...IDLE, phase: 'loading' });
      clearTimer();
      timerRef.current = setTimeout(() => {
        // The run overran — kill the (possibly spinning) worker and respawn next time.
        workerRef.current?.terminate();
        workerRef.current = null;
        idRef.current++;
        timerRef.current = null;
        setState((s) => ({ ...s, phase: 'done', timedOut: true }));
      }, RUN_TIMEOUT_MS);
      w.postMessage({ type: 'run', id, files, stdin });
    },
    [ensureWorker],
  );

  const reset = useCallback(() => {
    clearTimer();
    idRef.current++; // drop any in-flight run's messages
    setState(IDLE);
  }, []);

  useEffect(
    () => () => {
      clearTimer();
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    [],
  );

  return { state, run, reset };
}
