# henrykim.ca

My personal website — designed, built, tested, and operated by me. Not a template, not a site-builder export: a page where every decision, from the typeface to the way the cursor behaves, was made deliberately.

<p>
  <a href="https://henrykim.ca"><img alt="Live" src="https://img.shields.io/website?url=https%3A%2F%2Fhenrykim.ca&label=henrykim.ca&up_message=live&style=flat-square"></a>
  <a href="https://github.com/yxxjx-dsnv/henry-portfolio/actions/workflows/deploy.yml"><img alt="Deploy" src="https://img.shields.io/github/actions/workflow/status/yxxjx-dsnv/henry-portfolio/deploy.yml?branch=main&label=deploy&style=flat-square"></a>
  <img alt="Tests" src="https://img.shields.io/badge/tests-97%20passing-brightgreen?style=flat-square">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.5-3178c6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-18.3-149eca?style=flat-square&logo=react&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite&logoColor=white">
  <img alt="Runtime UI deps" src="https://img.shields.io/badge/runtime%20UI%20deps-0-black?style=flat-square">
</p>

**Live:** [henrykim.ca](https://henrykim.ca) · **Stack:** Vite · React 18 · TypeScript · one hand-written stylesheet · Vitest · GitHub Actions → GitHub Pages

---

## Highlight: a C compiler that runs in your browser

The [APS105 — Coding Labs](https://henrykim.ca/projects/aps105-labs) page shows the weekly labs from my intro-to-programming course, in C. Not as static listings: **each lab compiles and runs in the browser, with no server.** A real `clang`/LLVM toolchain, compiled to WebAssembly, is embedded in the page. Edit any lab, press **Run**, and it is compiled, linked, and executed client-side; press **Reset** to restore my original submission.

- **Real compilation, not interpretation.** `clang -cc1 -emit-obj` per file, `wasm-ld` to link, against a genuine WASI libc, so `scanf`, `malloc`, `struct`, `math.h`, and multi-file programs all behave exactly as they do natively. The Reversi lab links `reversi.c` + `reversi.h`; the ER-triage lab runs a real `malloc` singly-linked list.
- **Static-host friendly.** The engine is single-threaded and needs no `SharedArrayBuffer`, so it runs on plain GitHub Pages, which cannot set cross-origin-isolation headers. The ~60 MB toolchain lives in [`public/cide/`](public/cide/), lazy-loads on the first Run, and is cached via the Cache Storage API (instant and offline afterward).
- **Safe under editing.** A program's `_start` runs synchronously inside a Web Worker, so an infinite loop cannot be interrupted from within. A 10-second watchdog terminates a runaway worker and reports it, so a visitor's bad edit can never hang the page.
- Each lab carries a short **task** and **approach** writeup, grounded in the actual code, plus a preset stdin sample so it produces real output on the first click.

The engine is vendored from [binji/wasm-clang](https://github.com/binji/wasm-clang) (Apache-2.0) and patched to compile C rather than C++, link multiple objects, implement `clock_time_get`, and expose a `compileLinkRunMulti` entry point. See [`src/cide/`](src/cide/).

## Why this site exists

Three products shaped my taste: Apple's restraint, Toss's tactile clarity, and Tesla's confident minimalism. None of their colours or layouts appear here. What I borrowed is the discipline: **black and white only, one serif, and nothing on screen moves unless the visitor asked it to.** The site should feel like a quiet book that happens to respond when you touch it.

The second reason: I am an engineering student who builds things, and a portfolio that merely *lists* that is weaker than one that *demonstrates* it. Every interaction is hand-written — there are **zero runtime UI libraries**. No component kits, no animation frameworks, no CSS frameworks. React, the DOM, and a single stylesheet. (The only heavy runtime dependencies are `three` and `pdfjs-dist`, loaded lazily and only on the pages that show a 3D model or a PDF deck.)

## Design system in one paragraph

The whole site derives from a single motif: a small hollow circle that fills when something is alive. It marks every timeline entry, fills on hover, travels the sidebar to show the current page, becomes the cursor itself, multiplies into an interactive canvas field on the home page, closes each essay like a magazine end-mark, and orbits your cursor if you rescue the one lost on the 404 page. Typography is Libre Baskerville throughout — including the command palette and the printed commit hash — because a second typeface would be a second voice. All motion shares two tokens (160 ms / 240 ms ease-out), so every hover answers in the same accent.

## Project story pages

Beyond the résumé timeline, several projects have their own long-form pages with photos, videos, interactive figures, and source:

| Project | What it is |
| --- | --- |
| [APS105 — Coding Labs](https://henrykim.ca/projects/aps105-labs) | Ten weeks of C labs, each compiled and run in the browser (above). |
| [Campus Pulse](https://henrykim.ca/projects/campus-pulse) | A one-day hackathon build: live library-occupancy dashboard on AWS Rekognition + DynamoDB, with a faithful in-page port of the live dashboard and detection videos that autoplay on scroll. |
| [MONO](https://henrykim.ca/projects/mono) | The AI resale-analytics startup I am building, with the pitch deck rendered inline. |
| [Gyroscope Wand](https://henrykim.ca/projects/gyroscope-wand) | An APS112 design project for a real client: a motion-detecting response wand. Two-wand Arduino firmware, a Blender prototype in an interactive 3D viewer, and the full report set. |
| [Holy Bridge](https://henrykim.ca/projects/civ102-bridge) | A CIV102 matboard box girder designed across seven iterations with Python-computed load envelopes. |
| [Simple Pendulum](https://henrykim.ca/projects/pendulum) | A PHY180 experiment measured against theory with Python curve-fitting and full uncertainty propagation. |

Documents open in place: a lazy `pdf.js` deck turns one slide at a time, code panels get syntax-highlighted by the same dependency-free highlighter the editable C editor uses, and every expanded deck offers "open in its own tab." Personal data on scanned letters (student numbers, home address) is redacted by rasterizing the pages, so nothing is text-extractable.

## Interaction inventory

Everything is mouse-first with keyboard and touch fallbacks, and everything respects `prefers-reduced-motion`.

- **The cursor.** The native arrow is replaced by a two-layer cursor: a 4 px core at the exact pointer position and a hollow ring that trails it on a spring. The ring fills over anything interactive, dips on click, inhales on press-and-hold, and dozes (a slow blink) after 15 s of stillness. It resyncs on focus, tab switches, and bfcache restores, and disappears on touch and under reduced motion.
- **Dark mode.** Clicking the logo sweeps darkness across the page as a circle growing from the click point (View Transitions API, with a plain toggle fallback). First visit follows the OS theme live until the visitor chooses; a `<head>` inline script applies the stored theme before React mounts, so there is no flash.
- **The dot field (home).** A canvas grid of hollow dots that lean toward the cursor, ripple on click, stir on drag, flutter on scroll, and blink a lone dot when idle. The loop runs only while something moves; idle cost is zero. Typing certain words or codes turns the field into easter eggs: a Seoul-skyline dot mural, a birthday message, Conway's Game of Life, Snake, a piano you play with the keyboard, a real-cat-behaviour cat that stalks a fishing-rod cursor, an NPC band, and a full-screen Tetris / 1943-style arcade that unfolds from the grid.
- **Navigation.** A filled dot travels the sidebar to the active link. Keys `1–5` switch pages; `⌘K` (or `/`) opens a serif command palette (pages, dark toggle, copy email, copy link, print, and the secret eggs). Route changes rise into place; legacy `#hash` URLs still redirect.
- **The clock.** The sidebar shows Toronto time. Click it and a small plane crosses the line, eastbound to Toronto and mirrored westbound home to Seoul, the way those flights actually cross the globe.
- **The essay page.** A reading dot travels a scrubbable hairline rail; the tab favicon fills like a pie as you read; the sidebar recedes while you read; the text closes with the hollow end-mark.
- **Timeline pages.** Hover details unfold with real CSS-grid-row height animation (no `max-height` hacks), with intent delay and grace period, and open on focus and touch. Hovering a date appends how long it lasted. Education groups school → program with an interlude for upcoming military service.
- **Small things that are the point.** A quote (from ~2,000, lazy-loaded) opens every home visit. The hero name's letters lift toward the cursor like piano keys. "Email" copies with a zero-shift "Copied" swap. `⌘P` prints a clean, sidebar-free, URL-annotated document. The 404 keeps a lost dot that flees the cursor; catch it and it orbits you for the session. Clicking "South Korea" rains 250 flags, the one interaction that survived from the very first version of the site.

## Engineering notes

**Architecture.** Vite + React 18 + TypeScript, React Router with real routes, one global stylesheet. State is local component state and small hooks; content is typed data in [`src/data/`](src/data/) rendered by presentational components, so updating my history is a data edit, not a markup hunt.

**No dependencies where it counts.** The cursor, dot field, command palette, ripples, springs, the syntax highlighter, the arcade games, and the 404 chase are hand-rolled `requestAnimationFrame` + canvas + CSS. Every loop gates itself: the dot field renders one static frame when idle, the cursor spring runs only while enabled, IntersectionObserver work disconnects after use, and the C toolchain and heavy media libraries load only when first needed.

**Deployment.** Pushing to `main` triggers a GitHub Actions workflow: type-check, Vite build, SPA `404.html` fallback (so `/projects/aps105-labs` survives a hard refresh on Pages), and deploy. The custom domain is pinned by `public/CNAME`; `.nojekyll` keeps Jekyll away. Build date and commit hash are injected at build time and printed on [/colophon](https://henrykim.ca/colophon) as a printer's mark proving which commit produced the page you are reading.

**Testing.** 97 Vitest + Testing Library tests across 19 files cover routing (including `#hash` redirects and the 404 catch-all), dark-mode persistence, the command palette, clipboard copy, data integrity (every timeline entry and image `alt`), the duration parser, the faithful Campus Pulse dashboard port, and the accessibility contract. CI runs the same build the deploy uses.

## By the numbers

| | |
| --- | --- |
| Source | ~10,700 lines across 75 TypeScript/TSX files |
| Components / pages | 24 components · 15 routed pages |
| Tests | 97 across 19 files (Vitest + Testing Library) |
| Runtime UI libraries | 0 |
| Embedded toolchain | ~60 MB `clang` + `lld` + WASI sysroot (lazy, cached) |
| Commits | 150+ |
| Hosting | GitHub Pages, custom domain, Actions-deployed |

## Project structure

```
├── .github/workflows/deploy.yml   # type-check → build → deploy to GitHub Pages
├── public/
│   ├── CNAME  favicon.svg  quotes.json
│   ├── cide/                       # clang + lld + sysroot.tar + memfs (WASM C toolchain)
│   ├── draco/                      # Draco decoder for the 3D model viewer
│   └── media/                      # per-project images, videos, PDFs (redacted where scanned)
├── src/
│   ├── App.tsx                     # shell: routes, titles, keys, palette, theme sweep, egg codes
│   ├── cide/                       # in-browser C engine: clangCore (vendored+patched),
│   │                               #   clangWorker, useCRunner hook
│   ├── components/                 # CursorDot, DotField, ArcadeOverlay, CommandPalette,
│   │                               #   CLab + CodeEditor, PdfDeck, DocShelf, ModelViewer,
│   │                               #   FigureCarousel, CampusPulseDash, Sidebar, …
│   ├── pages/                      # Home, Projects, Education, Colophon, NotFound, and the
│   │                               #   story pages (Aps105Labs, CampusPulse, Mono, …)
│   ├── data/                       # typed content, incl. aps105Labs.ts (labs + writeups)
│   ├── assets/                     # raw lab/firmware/analysis sources shown in code panels
│   ├── hooks/  utils/  styles/index.css   # the one stylesheet
├── tools/                          # headless Blender builds of the 3D assets (blendkit.py +
│                                   #   asrs/, bridge/, pendulum/, robot/ → public/media/*.glb)
├── scripts/spa-fallback.mjs        # copies index.html to 404.html for GitHub Pages routing
└── docs/superpowers/specs/         # design specs (C-lab IDE, ASRS robot, Holy Bridge, pendulum)
```

## Running locally

```bash
npm install
npm run dev      # local dev server
npm test         # 97 tests
npm run build    # type-check + production build + SPA fallback
npm run preview  # serve the production build
```

## Colophon

Set in [Libre Baskerville](https://fonts.google.com/specimen/Libre+Baskerville). Black on white, and white on black after dark. The live [/colophon](https://henrykim.ca/colophon) carries the build date and commit hash of whatever you are looking at. Quotes filtered from the MIT-licensed [quotable](https://github.com/lukePeavey/quotable) dataset; the C toolchain vendored from [binji/wasm-clang](https://github.com/binji/wasm-clang) (Apache-2.0).

---

Henry (Yeonjun) Kim — Electrical & Computer Engineering, University of Toronto.
[henrykim.ca](https://henrykim.ca) · [GitHub](https://github.com/yxxjx-dsnv) · [LinkedIn](https://www.linkedin.com/in/henry-kim-uoft/)
