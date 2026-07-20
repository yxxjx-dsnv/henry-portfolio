// Web Worker that hosts the clang→WASM toolchain. It fetches the ~60 MB of
// binaries from /cide/ (cached via the Cache Storage API after first use),
// compiles+links the user's C files, runs the program with a preset stdin,
// and streams stdout back. Program output is separated from compiler
// diagnostics by watching the core's `_phase`.
import { API } from './clangCore';

type RunMsg = { type: 'run'; id: number; files: { name: string; contents: string }[]; stdin: string };
type InitMsg = { type: 'init'; base: string };
type InMsg = RunMsg | InitMsg;

const post = (m: unknown) => (self as unknown as { postMessage(m: unknown): void }).postMessage(m);

let assetBase = '';
let api: API | null = null;
let diag = '';
let currentId = -1;

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
      if (api && api._phase === 'run') post({ type: 'stdout', id: currentId, data: s });
      else diag += s;
    },
  });
}

self.onmessage = async (e: MessageEvent<InMsg>) => {
  const msg = e.data;
  if (msg.type === 'init') {
    assetBase = msg.base;
    return;
  }
  if (msg.type === 'run') {
    currentId = msg.id;
    diag = '';
    try {
      if (!api) {
        post({ type: 'status', id: currentId, phase: 'loading' });
        api = makeApi();
      }
      api._phase = 'compile';
      api.memfs.setStdinStr(msg.stdin ?? '');
      post({ type: 'status', id: currentId, phase: 'compiling' });
      const result = await api.compileLinkRunMulti(msg.files);
      if (result.stage !== 'run') post({ type: 'diag', id: currentId, data: diag });
      post({ type: 'done', id: currentId, exitCode: result.exitCode, stage: result.stage });
    } catch (err) {
      post({ type: 'diag', id: currentId, data: diag });
      post({ type: 'error', id: currentId, message: (err as Error).message });
    } finally {
      if (api) api._phase = 'compile';
    }
  }
};
