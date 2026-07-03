# henrykim.ca

My personal website — designed, built, tested, and operated by me.

**Live:** [https://henrykim.ca](https://henrykim.ca)
**Stack:** Vite · React 18 · TypeScript · plain CSS · Vitest · GitHub Actions → GitHub Pages

---

## Why this site exists

I wanted one place on the internet that is unmistakably mine — not a template, not a site builder export, but a page where every decision, from the typeface to the way the cursor behaves, was made deliberately by me.

Three products shaped my taste: Apple's restraint, Toss's tactile clarity, and Tesla's confident minimalism. None of their colors or layouts appear here. What I borrowed is the discipline: **black and white only, one serif, and nothing on screen moves unless the visitor asked it to.** The site should feel like a quiet book that happens to respond when you touch it.

The second reason is that I'm an engineering student who builds things, and a portfolio that merely *lists* that is weaker than one that *demonstrates* it. Every interaction below is hand-written — there are **zero runtime UI libraries** in this project. No component kits, no animation frameworks, no CSS frameworks. React, the DOM, and a single stylesheet.

## Design system in one paragraph

The whole site derives from a single motif: a small hollow circle that fills when something is alive. It marks every timeline entry, fills on hover, travels the sidebar to show the current page, becomes the cursor itself, multiplies into an interactive canvas field on the home page, closes the essay like a magazine end-mark, and orbits your cursor if you rescue the one that got lost on the 404 page. Typography is Libre Baskerville throughout — including the command palette and the printed commit hash — because a second typeface would be a second voice. All motion shares two tokens (160ms / 240ms ease-out), so every hover on the site answers in the same accent.

## Interaction inventory

Everything is mouse-first with keyboard and touch fallbacks, and everything respects `prefers-reduced-motion`.

### The cursor
- The native arrow is replaced by a two-layer cursor: a 4px core that sits at the exact pointer position (precision) and a hollow ring that trails it on a spring (character).
- The ring fills over anything interactive, dips on click, slowly inhales if you press and hold, and dozes off — a slow blink — after 15 seconds of stillness.
- It resyncs on window focus, tab switches, and bfcache restores, and disappears entirely on touch devices and under reduced motion.

### Dark mode
- Clicking the logo sweeps darkness across the page as a circle growing from the exact click point (View Transitions API, with a plain toggle as fallback).
- First visit follows the OS theme; the OS can keep flipping it live until the visitor chooses manually, after which the choice is persisted.
- A `<head>` inline script applies the stored theme before React mounts, so there is no flash of the wrong theme.

### The dot field (home)
A canvas grid of the signature hollow dots under the hero. Dots fill and lean toward the cursor; clicking sends a ripple through the grid; dragging stirs it — dots fling along the stroke and spring back; scrolling the page makes the field flutter with per-cell weights; and when nobody is around, a lone dot blinks about every seven seconds. The animation loop only runs while something is actually moving — idle cost is zero.

### Navigation
- A filled dot travels the sidebar to whichever link is active.
- Keys `1–5` switch pages. `⌘K` (or `/`) opens a serif command palette: pages, dark-mode toggle, copy email, copy page link, print.
- Route changes rise gently into place, scroll restores to the top, and each page sets its own tab title. Legacy `#hash` URLs from the previous site still redirect.

### The clock
The sidebar shows local time in Toronto. Click it and a small plane crosses the line — eastbound left-to-right when heading to Toronto, westbound right-to-left (mirrored) when heading home to Seoul, the way those flights actually cross the globe.

### The essay page
- A reading dot travels a hairline rail as you scroll; the rail is scrubbable — click or drag it to move through the page.
- The browser-tab favicon fills like a pie behind the H mark as you read, and restores when you leave.
- While your pointer is inside the essay body, the sidebar quietly recedes.
- The text closes with the site's hollow dot — the magazine end-mark convention.

### Timeline pages (Projects, Extra-Curricular, Education)
- Hover details unfold with real height animation (CSS grid rows — no `max-height` hacks), with a 120ms intent delay so a passing cursor doesn't trigger them and a 250ms grace period so slipping off doesn't snap them shut. They also open on focus and touch.
- Hovering any date quietly appends how long it lasted ("1 yr 2 mo"), computed from the range.
- Education is grouped school → program, with a faded, centered interlude marking upcoming military service.

### Small things that are the point
- A quote opens every home visit — one of ~2,000 (filtered from the MIT-licensed quotable dataset, lazy-loaded so the main bundle doesn't pay for it). Click it for another.
- The hero name's letters lift toward the cursor like piano keys, and dip when pressed.
- Clicking "Email" copies the address; the label swaps to "Copied" for 1.5 seconds with zero layout shift. `mailto:` remains the fallback.
- Text selection inverts to black-on-white / white-on-black. External links carry a small ↗. Keyboard users get thin mono focus rings.
- `⌘P` produces a clean document: sidebar hidden, details expanded, links printed with their URLs, signed "— henrykim.ca —".
- The favicon is the actual H mark as an SVG that turns white in dark browser themes.
- The 404 page keeps a lost hollow dot that wanders its box and flees the cursor. Catch it and it fills, the colophon remembers it forever, and — for the rest of your session — it orbits your cursor as a tiny satellite.
- A colophon page states what the site is set in and built with, and carries the build date and git commit hash injected at build time — a printer's mark proving the page you're reading was compiled from a specific commit.
- Clicking "South Korea" on the home page rains 250 Korean flags. This one survived from the very first version of the site.

## Engineering notes

**Architecture.** Vite + React 18 + TypeScript, React Router with real routes, one global stylesheet. State is local component state and two small hooks (`useDarkMode`, view-only observers); the content is typed data (`src/data/*.ts`) rendered by presentational components, so updating my résumé history is a data edit, not a markup hunt.

**No dependencies where it counts.** The cursor, dot field, command palette, ripples, springs, and the 404 chase are hand-rolled `requestAnimationFrame` + canvas + CSS. Every loop gates itself: the dot field renders exactly one static frame when idle, the cursor spring runs only while enabled, and IntersectionObserver work disconnects after use.

**Deployment.** Pushing to `main` triggers a GitHub Actions workflow: type-check, Vite build, copy `index.html` → `404.html` (the SPA fallback that lets `/essays` survive a hard refresh on GitHub Pages), and deploy. The custom domain is pinned by `public/CNAME`; `.nojekyll` keeps the legacy Jekyll builder away from the docs folder.

**Testing.** 42 Vitest + Testing Library tests across 11 files cover routing (including the `#hash` redirects and the 404 catch-all), dark-mode persistence, the command palette's filter-and-enter flow, clipboard copy, data integrity (every timeline entry, every image `alt`), the duration parser, and the accessibility contract (`aria-expanded`, decorative icons hidden). CI runs the same build the deploy uses.

**A migration story I'm a little proud of.** This site began as a single hand-written `index.html`. When I rebuilt it in React, the rule was pixel-identical output — and one bug proved the rigor was worth it: the original markup used a non-standard `<p1>` tag, which browsers render as an *inline* element, silently ignoring its `margin-top: 50px`. My faithful React port used a real `<p>` — block-level — and the margin suddenly applied, dropping every subtitle by 50px. The fix (and the lesson about what "faithful" means) is preserved in [`src/styles/index.css`](src/styles/index.css) with a comment, and the original site is kept in [`_archive/`](_archive/) — history, not deletion.

## Project structure

```
├── .github/workflows/deploy.yml   # build + deploy to GitHub Pages
├── public/
│   ├── CNAME                      # henrykim.ca
│   ├── favicon.svg                # the H mark, dark-tab aware
│   ├── quotes.json                # ~2,000 quotes, lazy-loaded
│   └── Images/                    # logos, favicon.ico fallback
├── src/
│   ├── App.tsx                    # shell: routes, titles, keys, palette, sweep
│   ├── components/                # CursorDot, DotField, CommandPalette,
│   │                              # Sidebar, LocalTime, DailyQuote, Hero,
│   │                              # ActivityItem, ReadProgress, LostDot, …
│   ├── pages/                     # Home, Projects, Essays, ExtraCurricular,
│   │                              # Education, Colophon, NotFound
│   ├── data/                      # typed content: profile, projects,
│   │                              # activities, education
│   ├── hooks/useDarkMode.ts
│   ├── utils/duration.ts          # "Sep 2025 - present" → "1 yr 10 mo"
│   └── styles/index.css           # the one stylesheet
├── docs/superpowers/              # design specs + implementation plans
└── _archive/                      # the original vanilla site, preserved
```

## Running locally

```bash
npm install
npm run dev      # local dev server
npm test         # 42 tests
npm run build    # type-check + production build + SPA fallback
npm run preview  # serve the production build
```

## Colophon

Set in [Libre Baskerville](https://fonts.google.com/specimen/Libre+Baskerville). Black on white — and white on black after dark. The live site's [/colophon](https://henrykim.ca/colophon) page carries the build date and commit hash of whatever you're looking at.

Quotes data filtered from the MIT-licensed [quotable](https://github.com/lukePeavey/quotable) dataset.

---

Henry (Yeonjun) Kim — Electrical & Computer Engineering, University of Toronto.
[henrykim.ca](https://henrykim.ca) · [GitHub](https://github.com/yxxjx-dsnv) · [LinkedIn](https://www.linkedin.com/in/henry-kim-85b554336/)
