// Web Worker that hosts the clang→WASM toolchain. It fetches the binaries from
// /cide/ (about 20 MB over the wire, cached via the Cache Storage API after first
// use), compiles+links the user's C files, runs the program with a preset stdin,
// and streams stdout back. Program output is separated from compiler
// diagnostics by watching the core's `_phase`.
//
// Messages out: status (loading → compiling → running), stdout, diag, limit
// (output cap reached: the host ends the run), done, error (the toolchain could
// not load).
import { API } from './clangCore';
import { OUTPUT_LIMIT, createByteDecoder, createOutputCap, stripAnsi, toByteString } from './text';

type RunMsg = { type: 'run'; id: number; files: { name: string; contents: string }[]; stdin: string };
type InitMsg = { type: 'init'; base: string };
type InMsg = RunMsg | InitMsg;

const post = (m: unknown) => (self as unknown as { postMessage(m: unknown): void }).postMessage(m);

// Linked into every program: stdout unbuffered. The core reports stdout as a
// file, so libc would buffer it fully, and whatever was printed before a crash,
// a timeout or Stop stayed in the program's memory and was lost.
const UNBUFFERED = {
  name: '__henry_stdout.c',
  contents: '#include <stdio.h>\n__attribute__((constructor)) static void henry_unbuffered_stdout(void) { setvbuf(stdout, 0, _IONBF, 0); }\n',
};

let assetBase = '';
let api: API | null = null;
let warm = false; // toolchain downloaded and compiled in this worker

// per run
let currentId = -1;
let diag = '';
let diagText = createByteDecoder();
let outText = createByteDecoder();
let cap = createOutputCap(OUTPUT_LIMIT);
let limited = false;

// Posted as it is written: `_start` runs synchronously, so nothing held back
// here could be sent later if the program then spins (the host batches instead).
function onOutput(text: string) {
  if (limited) return;
  const { text: fits, full } = cap.take(text);
  if (fits) post({ type: 'stdout', id: currentId, data: fits });
  if (full) {
    limited = true;
    post({ type: 'limit', id: currentId }); // the program may never stop by itself
  }
}

async function cachedFetch(url: string): Promise<Response> {
  try {
    const cache = await caches.open('cide-v1');
    const hit = await cache.match(url);
    if (hit) return hit;
    const res = await fetch(url);
    if (res.ok) await cache.put(url, res.clone());
    return res;
  } catch {
    // Cache Storage unavailable (e.g. an insecure context) — fetch directly.
    return fetch(url);
  }
}

function makeApi(): API {
  return new API({
    async readBuffer(filename: string) {
      return (await cachedFetch(assetBase + filename)).arrayBuffer();
    },
    async compileStreaming(filename: string) {
      return WebAssembly.compile(await (await cachedFetch(assetBase + filename)).arrayBuffer());
    },
    hostWrite(s: string) {
      if (api && api._phase === 'run') onOutput(outText.push(s));
      else diag += diagText.push(s);
    },
    onRunStart() {
      post({ type: 'status', id: currentId, phase: 'running' });
    },
  });
}

/** Download (first time) and compile the toolchain, so a Run only compiles the user's code. */
async function prepare() {
  const a = (api ??= makeApi());
  try {
    await a.ready;
    await a.getModule(a.clangFilename);
    await a.getModule(a.lldFilename);
    warm = true;
  } catch (err) {
    api = null; // a failed download must not break every later Run
    throw err;
  }
}

self.onmessage = async (e: MessageEvent<InMsg>) => {
  const msg = e.data;
  if (msg.type === 'init') {
    assetBase = msg.base;
    return;
  }
  if (msg.type !== 'run') return;
  currentId = msg.id;
  diag = '';
  diagText = createByteDecoder();
  outText = createByteDecoder();
  cap = createOutputCap(OUTPUT_LIMIT);
  limited = false;
  try {
    if (!warm) {
      post({ type: 'status', id: currentId, phase: 'loading' });
      try {
        await prepare();
      } catch (err) {
        // the toolchain did not load: its own progress lines are not worth showing
        post({ type: 'error', id: currentId, message: (err as Error).message });
        return;
      }
    }
    // the toolchain's own progress lines ("> Untarring…") are not the user's errors
    diag = '';
    diagText = createByteDecoder();
    const a = api!;
    a._phase = 'compile';
    a.memfs.setStdinStr(toByteString(msg.stdin ?? ''));
    post({ type: 'status', id: currentId, phase: 'compiling' });
    const result = await a.compileLinkRunMulti([
      ...msg.files.map((f) => ({ name: f.name, contents: toByteString(f.contents) })),
      UNBUFFERED,
    ]);
    onOutput(outText.end());
    if (result.stage !== 'run') post({ type: 'diag', id: currentId, data: stripAnsi(diag + diagText.end()) });
    post({ type: 'done', id: currentId, exitCode: result.exitCode, stage: result.stage });
  } catch (err) {
    if (api?._phase === 'run') {
      // A trap inside the program (out-of-bounds access, stack overflow…). The
      // core has already written "runtime error: …" into the program's output.
      onOutput(outText.end());
      post({ type: 'done', id: currentId, exitCode: 134, stage: 'run', crashed: true });
    } else {
      // clang or wasm-ld itself crashed on this code (a huge expression, say);
      // the core wrote "runtime error: …" into the diagnostics
      const text = stripAnsi(diag + diagText.end()).trim();
      post({ type: 'diag', id: currentId, data: text || (err as Error).message });
      post({ type: 'done', id: currentId, exitCode: 134, stage: 'compile', crashed: true });
    }
  } finally {
    if (api) api._phase = 'compile';
  }
};
