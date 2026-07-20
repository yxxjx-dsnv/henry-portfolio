# APS105 Labs — In-Browser C IDE (design)

Date: 2026-07-21
Status: approved (all forks decided with the owner)

## Goal

A Projects page showing Henry's APS105 (intro C) weekly labs. For each lab: its
objective (from the lab PDF), the submitted C code in an IDE-style editor, and a
**Run** that actually compiles and executes the code in the browser and shows the
output. Visitors can **edit** the code and **Reset** back to Henry's original.

## Decisions (owner-approved)

- **Placement**: a new Projects entry `aps105-labs` with its own page.
- **Scope**: all 10 labs (lab0–lab9) are editable, runnable, resettable.
- **Input model**: a preset **stdin textarea** + Run (no live terminal — a true
  blocking interactive console needs SharedArrayBuffer, which GitHub Pages cannot
  enable). Each lab ships with sample input pre-filled. This matches how APS105 is
  auto-graded.
- **Engine**: self-contained **real clang/LLVM compiled to WASM** (binji/wasm-clang,
  single-threaded — no SharedArrayBuffer, so it runs on header-less GitHub Pages).
  Compiles each `.c` with `clang -cc1 -emit-obj`, links with `wasm-ld`, runs against
  a real WASI libc (scanf/printf/malloc/free/math.h/rand all correct), multi-file
  supported (Reversi `reversi.c`+`reversi.h`, lab9 malloc linked-list).
- **Toolchain hosting**: the ~76 MB of wasm binaries live in `public/cide/`
  (same-origin, no CORS risk), lazy-loaded on first Run and cached via the Cache
  Storage API (instant + offline afterward).

## Rejected alternatives (from research workflow)

- Remote compile APIs (godbolt/Piston): simplest but send user code to a third party
  every Run — against the site's self-contained ethos. Kept only as a possible
  future opt-in fallback.
- JS/WASM interpreters (JSCPP, picoc): cannot do malloc + multi-file + stdin, so the
  linked-list and Reversi labs can't run. Dealbreaker.
- TinyCC→WASM: no WASM backend. Dead end.

## Architecture

- `public/cide/` — clang.wasm, lld.wasm, the wasi sysroot, plus binji's runtime glue.
- `src/cide/` — the engine, isolated from the rest of the app:
  - `clangWorker.ts` — Web Worker: writes files into an in-memory FS (MemFS), runs
    clang `-cc1 -emit-obj` per `.c`, `wasm-ld` to link, instantiates and runs the
    module with the stdin string on fd 0, captures stdout/stderr/exit code. Fresh FS
    per run. Lazy-fetches + caches the wasm blobs on first use with a progress signal.
  - `useCRunner.ts` — React hook wrapping the worker: `run(files, stdin)` →
    `{stdout, stderr, exitCode, diagnostics, phase}`; terminate+respawn on a hung run.
- `src/components/CLab.tsx` — the IDE surface (code-split via `React.lazy`): file
  tabs (`.c` editable, "do not modify" `.h` read-only), stdin textarea, output pane,
  Run + Reset. Editor reuses the existing dependency-free `CodeViewer` highlighter
  behind a transparent `<textarea>` (no heavy editor dependency).
- `src/data/aps105Labs.ts` — `{ id, title, objective, files: [{name, code, readonly?}],
  sampleStdin }[]`. Original code imported from `src/assets/aps105/**` via `?raw`
  (same pattern as the existing firmware viewer). The imported original is the Reset
  baseline.
- `src/pages/Aps105Labs.tsx` — hero + short intro + a lab selector rendering the
  chosen lab's objective and `<CLab>`.

## Lab source selection

- Canonical submission `.c` per lab/part is copied into `src/assets/aps105/<lab>/`.
  lab1's `submission/` duplicates the partN dirs (verified identical) — use partN.
- `.h` files marked "should not be modified" (e.g. `reversi.h`) are read-only compile
  inputs. Build artifacts under `Labs/**` (`.o`, `.dSYM`, `.vscode`, `.DS_Store`,
  `build/`) are excluded.
- Objectives are taken verbatim-in-spirit from each Lab PDF (literal, no invention).

## Build phases (risk-first)

1. **Engine spike** — acquire binji assets into `public/cide/`; get the worker to
   compile+run ONE simple lab (lab1) end-to-end in a dev browser. Proves the hardest
   part before building UI. (Verification needs a real browser — hand to owner to
   click Run.)
2. **IDE UX** — editor + stdin + output + Reset, single-file.
3. **All 10 labs** — wire every lab incl. multi-file (Reversi) and malloc (lab9);
   pre-fill sample stdin per lab.
4. **Page + story + styling** — Projects entry, route, hero/intro, polish; a11y,
   reduced-motion, dark/light; lazy-load progress UI.

## Risks

- binji/wasm-clang is a frozen 2019/2021 project — possible browser-specific issues;
  hence the Phase-1 spike before committing to the full build.
- ~76 MB added to the repo (owner accepted, for same-origin reliability).
- Final execution can only be verified in a real browser, not in the jsdom test suite;
  owner verifies Run in `npm run dev`.
