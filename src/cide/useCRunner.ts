import { useCallback, useEffect, useRef, useState } from 'react';

export type RunFile = { name: string; contents: string };

export type RunPhase = 'idle' | 'loading' | 'compiling' | 'running' | 'done';

/** How a run ended, when it did not end on its own. */
export type RunEnd = 'timeout' | 'limit' | 'stopped' | 'crashed' | 'error';

export type RunState = {
  phase: RunPhase;
  stdout: string;
  diagnostics: string;
  exitCode: number | null;
  stage: 'compile' | 'link' | 'run' | null;
  ended: RunEnd | null;
};

const IDLE: RunState = {
  phase: 'idle',
  stdout: '',
  diagnostics: '',
  exitCode: null,
  stage: null,
  ended: null,
};

// A program's `_start` runs synchronously inside the worker, so an infinite loop
// (or one waiting for more input than stdin provides) can't be interrupted from
// inside — the only cure is to terminate the whole worker. The clock starts when
// the program itself starts, not at Run: downloading and compiling the toolchain
// on a slow connection is not the program running away.
export const RUN_TIMEOUT_MS = 10_000;

type WorkerMsg = {
  type: 'status' | 'stdout' | 'diag' | 'limit' | 'done' | 'error';
  id: number;
  phase?: 'loading' | 'compiling' | 'running';
  data?: string;
  exitCode?: number;
  stage?: RunState['stage'];
  crashed?: boolean;
  message?: string;
};

// One worker for the whole page: the toolchain is downloaded and compiled once,
// not again for every program you open. Each run carries a page-wide id, and
// each runner only listens to its own. Once no runner is left (the reader went
// to another page), the worker and the ~60 MB it holds are let go after a while.
let shared: Worker | null = null;
let nextId = 0;
let inFlight = -1; // the id of the run the worker is on
const listeners = new Set<(m: WorkerMsg) => void>();
const IDLE_KILL_MS = 30_000;
let idleTimer: ReturnType<typeof setTimeout> | undefined;

const broadcast = (m: WorkerMsg) => listeners.forEach((l) => l(m));

function getWorker(): Worker {
  if (!shared) {
    const w = new Worker(new URL('./clangWorker.ts', import.meta.url), { type: 'module' });
    w.postMessage({ type: 'init', base: `${import.meta.env.BASE_URL}cide/` });
    w.onmessage = (e: MessageEvent<WorkerMsg>) => broadcast(e.data);
    // the worker script itself failed (a stale build after a deploy, no module
    // workers): nothing would ever answer, so end the run instead of waiting
    w.onerror = (e) => {
      e.preventDefault();
      killWorker();
      broadcast({ type: 'error', id: inFlight, message: 'The C runner could not start in this browser.' });
    };
    shared = w;
  }
  return shared;
}

/** Stop whatever the worker is doing (it may be spinning); the next run makes a new one. */
function killWorker() {
  shared?.terminate();
  shared = null;
}

// Owns one program's runs. `run()` compiles + executes the given files with the
// given stdin; `stop()` ends a run now; `reset()` clears the output. The worker is
// created on the first run (so the page — and the toolchain — stay untouched
// until someone clicks Run).
export function useCRunner() {
  const idRef = useRef(-1); // this runner's current run; -1 when none
  const activeRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // output arrives write by write; it reaches the screen once per frame
  const outBuf = useRef('');
  const outFrame = useRef(0);
  const [state, setState] = useState<RunState>(IDLE);

  const commitOutput = useCallback(() => {
    cancelAnimationFrame(outFrame.current);
    outFrame.current = 0;
    const data = outBuf.current;
    outBuf.current = '';
    if (data) setState((s) => ({ ...s, stdout: s.stdout + data }));
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  /** Settle the run: `end` says why, if it did not finish on its own. */
  const finish = useCallback((patch: Partial<RunState>, kill = false) => {
    commitOutput();
    clearTimer();
    activeRef.current = false;
    idRef.current = -1; // drop anything still in flight from this run
    if (kill) killWorker();
    setState((s) => ({ ...s, phase: 'done', ...patch }));
  }, [commitOutput]);

  useEffect(() => {
    const onMessage = (m: WorkerMsg) => {
      if (m.id !== idRef.current) return;
      switch (m.type) {
        case 'status':
          if (m.phase === 'running') {
            clearTimer();
            timerRef.current = setTimeout(() => finish({ ended: 'timeout' }, true), RUN_TIMEOUT_MS);
          }
          if (m.phase) setState((s) => ({ ...s, phase: m.phase! }));
          return;
        case 'stdout':
          outBuf.current += m.data ?? '';
          if (!outFrame.current) outFrame.current = requestAnimationFrame(commitOutput);
          return;
        case 'diag':
          setState((s) => ({ ...s, diagnostics: s.diagnostics + (m.data ?? '') }));
          return;
        case 'limit':
          finish({ ended: 'limit', stage: 'run' }, true);
          return;
        case 'done':
          finish({ exitCode: m.exitCode ?? null, stage: m.stage ?? null, ended: m.crashed ? 'crashed' : null });
          return;
        case 'error':
          setState((s) => ({ ...s, diagnostics: (s.diagnostics.trim() ? s.diagnostics + '\n' : '') + (m.message ?? 'error') }));
          finish({ ended: 'error' });
          return;
      }
    };
    listeners.add(onMessage);
    clearTimeout(idleTimer);
    return () => {
      listeners.delete(onMessage);
      if (!listeners.size) idleTimer = setTimeout(killWorker, IDLE_KILL_MS);
      cancelAnimationFrame(outFrame.current);
      outFrame.current = 0;
      clearTimer();
      // leaving mid-run (another program opened): the shared worker may be spinning
      if (activeRef.current) killWorker();
      activeRef.current = false;
    };
  }, [finish, commitOutput]);

  const dropOutput = () => {
    cancelAnimationFrame(outFrame.current);
    outFrame.current = 0;
    outBuf.current = '';
  };

  const run = useCallback((files: RunFile[], stdin: string) => {
    const w = getWorker();
    const id = ++nextId;
    idRef.current = id;
    inFlight = id;
    activeRef.current = true;
    clearTimer();
    dropOutput();
    setState({ ...IDLE, phase: 'loading' });
    w.postMessage({ type: 'run', id, files, stdin });
  }, []);

  const stop = useCallback(() => {
    if (activeRef.current) finish({ ended: 'stopped' }, true);
  }, [finish]);

  const reset = useCallback(() => {
    clearTimer();
    dropOutput();
    idRef.current = -1;
    setState(IDLE);
  }, []);

  return { state, run, stop, reset };
}
