# React Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate henrykim.ca from a vanilla static site to a Vite + React + TypeScript app while keeping the rendered design pixel-identical.

**Architecture:** A Vite SPA with React Router (real routes). Repeated/structured content (activities, education) becomes typed data rendered by presentational components; long prose (Home intro, Essay) stays as JSX. Dark mode persists to localStorage with a system-theme default and a flash-prevention inline script. The existing `styles.css` is migrated verbatim so class-based markup renders identically. Deployed to GitHub Pages via GitHub Actions, with an `index.html`→`404.html` SPA fallback so clean URLs survive refresh.

**Tech Stack:** Vite, React 18, TypeScript, react-router-dom v6, Vitest + React Testing Library, GitHub Actions Pages deploy.

## Global Constraints

- **Visual parity is the prime directive.** Light, dark, and mobile (`<768px`) output must match the current site. The ONLY intentional markup change is the non-standard `<p1>` → `<p className="subtitle">` (with its CSS moved to `.subtitle`).
- **Vite base path:** `'/'` (custom domain serves at root, not a project subpath).
- **Node version:** 20 (CI uses `node-version: 20`).
- **Asset paths:** logos and favicon are served from `/Images/...` (Vite `public/` dir).
- **Preserve content verbatim:** all copy is copied exactly, including curly apostrophes (`’`) and em-dashes (`—`).
- **Every commit message ends with the trailer:**
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- **Branch:** all work happens on the `react-migration` branch (already created).

---

## File Structure

```
henrykim.ca/
├─ .github/workflows/deploy.yml   # build + deploy to GitHub Pages
├─ public/
│  ├─ CNAME                       # henrykim.ca (moved from root)
│  └─ Images/                     # logos + favicon (moved from /Images)
├─ scripts/
│  └─ spa-fallback.mjs            # copies dist/index.html -> dist/404.html
├─ src/
│  ├─ main.tsx                    # React root + BrowserRouter + CSS import
│  ├─ App.tsx                     # layout shell + routes + dark mode + hash redirect
│  ├─ App.test.tsx
│  ├─ setupTests.ts               # jest-dom + matchMedia polyfill
│  ├─ types.ts                    # LinkedLine, ResumeLine, Activity, Education
│  ├─ components/
│  │  ├─ Hero.tsx        / Hero.test.tsx
│  │  ├─ ActivityItem.tsx / ActivityItem.test.tsx
│  │  ├─ KoreaEasterEgg.tsx / KoreaEasterEgg.test.tsx
│  │  └─ Sidebar.tsx     / Sidebar.test.tsx
│  ├─ pages/
│  │  ├─ Home.tsx / Essays.tsx / ExtraCurricular.tsx / Education.tsx
│  │  └─ pages.test.tsx
│  ├─ data/
│  │  ├─ profile.ts / activities.ts / education.ts
│  │  └─ data.test.ts
│  ├─ hooks/
│  │  ├─ useDarkMode.ts / useDarkMode.test.ts
│  └─ styles/index.css            # migrated styles.css
├─ _archive/                      # legacy: steve-jobs/, extras/, lib/, *_tbu.*, legacy-vanilla-index.html, legacy-styles.css, *.pptx
├─ index.html                     # Vite entry shell + flash-prevention script
├─ vite.config.ts / tsconfig.json / package.json / .gitignore
```

---

## Task 1: Archive legacy + relocate assets

Clears the working tree and moves assets into `public/` before scaffolding. Preserves the current `index.html`/`styles.css` as porting references (also kept in git history).

**Files:**
- Create: `public/` (dir), `_archive/` (dir)
- Move: `Images/` → `public/Images/`, `CNAME` → `public/CNAME`
- Move: `steve-jobs/`, `extras/`, `lib/`, `index_tbu.html`, `styles_tbu.css`, `Notebook-covers.pptx` → `_archive/`
- Move: `index.html` → `_archive/legacy-vanilla-index.html`, `styles.css` → `_archive/legacy-styles.css`
- Create: `.gitignore`

- [ ] **Step 1: Create directories and move assets**

```bash
mkdir -p public _archive
git mv Images public/Images
git mv CNAME public/CNAME
```

- [ ] **Step 2: Archive legacy code (keeps git history)**

```bash
git mv steve-jobs extras lib _archive/
git mv index_tbu.html _archive/index_tbu.html
git mv styles_tbu.css _archive/styles_tbu.css
git mv Notebook-covers.pptx _archive/Notebook-covers.pptx
git mv index.html _archive/legacy-vanilla-index.html
git mv styles.css _archive/legacy-styles.css
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
dist/
.DS_Store
*.local

# Obsidian project vault (personal notes; backed up via OneDrive)
Henry's portfolio/
```

- [ ] **Step 4: Verify the tree and assets**

Run:
```bash
test -f public/CNAME && cat public/CNAME && \
test -f "public/Images/H Logo.svg" && \
test -f _archive/legacy-vanilla-index.html && \
test -f _archive/legacy-styles.css && \
ls _archive && echo "OK"
```
Expected: prints `henrykim.ca`, lists `extras index_tbu.html lib legacy-styles.css legacy-vanilla-index.html Notebook-covers.pptx steve-jobs styles_tbu.css`, then `OK`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: archive legacy flipbook code and relocate assets to public/

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Scaffold Vite + React + TypeScript + Vitest

Foundation: package, configs, entry shell, minimal App, and a passing smoke test.

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/setupTests.ts`, `src/App.test.tsx`, `scripts/spa-fallback.mjs`

**Interfaces:**
- Produces: `App` (default export, React component) — later replaced with full layout in Task 10.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "henrykim-ca",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build && node scripts/spa-fallback.mjs",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^25.0.0",
    "typescript": "^5.5.4",
    "vite": "^5.4.3",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: false,
  },
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 4: Create `scripts/spa-fallback.mjs`**

```js
import { copyFileSync, existsSync } from 'node:fs';

const src = 'dist/index.html';
const dest = 'dist/404.html';
if (!existsSync(src)) {
  console.error('spa-fallback: dist/index.html not found — run vite build first');
  process.exit(1);
}
copyFileSync(src, dest);
console.log('spa-fallback: created dist/404.html');
```

- [ ] **Step 5: Create `index.html` (Vite entry + flash-prevention script)**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Henry Kim</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
      integrity="sha512-Evv84Mr4kqVGRNSgIGL/F/aIDqQb7xQ2vcrdIwxfjThSH8CSR7PBEakCr51Ck+w+/U6swU2Im1vVX0SVk9ABhg=="
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    />
    <link rel="shortcut icon" href="/Images/pavicon.ico" />
  </head>
  <body>
    <script>
      (function () {
        try {
          var t = localStorage.getItem('theme');
          if (t !== 'light' && t !== 'dark') {
            t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          }
          if (t === 'dark') document.body.classList.add('dark-mode');
        } catch (e) {}
      })();
    </script>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/setupTests.ts` (jest-dom + matchMedia polyfill)**

```ts
import '@testing-library/jest-dom';

// jsdom has no matchMedia; useDarkMode and the flash script rely on it.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
```

- [ ] **Step 7: Write the failing smoke test `src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('App renders the name heading', () => {
  render(<App />);
  expect(screen.getByText('Henry Kim')).toBeInTheDocument();
});
```

- [ ] **Step 8: Run the test to verify it fails**

Run: `npm install && npm test`
Expected: FAIL — cannot find module `./App`.

- [ ] **Step 9: Create minimal `src/main.tsx` and `src/App.tsx`**

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx`:
```tsx
export default function App() {
  return <h1>Henry Kim</h1>;
}
```

- [ ] **Step 10: Run the test to verify it passes**

Run: `npm test`
Expected: PASS (1 test).

- [ ] **Step 11: Verify dev server and build**

Run: `npm run build`
Expected: `tsc` passes, `vite build` writes `dist/`, console prints `spa-fallback: created dist/404.html`.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TypeScript + Vitest

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Migrate global stylesheet

Port `_archive/legacy-styles.css` to `src/styles/index.css` verbatim, with two changes: `p1` selectors → `.subtitle`, and add the easter-egg `.kr-flag` rule + `@keyframes fall` (moved out of the old inline JS). Import it from `main.tsx`.

**Files:**
- Create: `src/styles/index.css`
- Modify: `src/main.tsx` (add CSS import)

- [ ] **Step 1: Create `src/styles/index.css`**

The full migrated stylesheet (identical to `_archive/legacy-styles.css` except the two `p1` rules became `.subtitle`, and the `.kr-flag` + `@keyframes fall` block was appended):

```css
:root {
    --text-color: #3E3E3E;
    --link-color: #787878;
    --background-color: #ffffff;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Libre Baskerville';
    background-color: var(--background-color);
}

a {
    color: var(--link-color);
    text-decoration: none;
}

#essay-links a { color:#000000 }
#feature-links a { color:#000000 }

/* Sidebar styling */
.logo {
    display: flex;
    width: 120px;
    height: 120px;;
    object-fit: contain;
}

.sidebar {
    width: 200px;
    min-height: 100vh;
    padding: 30px 30px;
    background-color: #f8f8f8;
    font-size: 14px;
    position: sticky;
    top: 0;
}

.sidebar p { margin-top: 15px; font-size: 17px; }
.sidebar ul { list-style: none; }
.sidebar li { margin-bottom: 15px; }
.sidebar a { color: #787878; text-decoration: none; }
.sidebar a.active { font-weight: bold; color: #000000; }
.sidebar a:hover { color: #000000; }

/* Dark mode */
body.dark-mode { background-color: #121212; color: #f1f1f1; }
body.dark-mode a { color: #c6c4c4; }
body.dark-mode .sidebar { background-color: #1e1e1e; }
body.dark-mode .sidebar a.active { font-weight: bold; color: #dad9e2; }
body.dark-mode .sidebar a:hover { color: #e17acb; }
.dark-mode .hero-section .text .subtitle { color: #c6c4c4; }

/* Main container */
.main-container {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    gap: 40px;
    max-width: 1100px;
    margin: 0 auto;
}

.content-wrapper { max-width: 600px; width: 100%; }

.hero-section {
    display: flex;
    justify-content: left;
    align-items: center;
    text-align: left;
    padding: 30px 40px;
    max-width: 600px;
}

.hero-section .text h1 { font-size: 36px; padding-bottom: 10px; }
.hero-section .text .subtitle {
    margin-top: 50px;
    padding: 5px 0;
    font-size: 14px;
    color: #787878;
}

/* SECTION HOME: ABOUT and INTEREST */
.about-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 40px;
    gap: 40px;
    max-width: 600px;
}
.about-section .text p { margin-bottom: 15px; font-weight: bold; }
.about-section .text .section-title { font-size: 14px; margin-left: 15px; }

/* SECTION ESSAYS */
.essay-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 40px;
    gap: 40px;
    max-width: 600px;
}
.essay-section .text .section-title p { margin-bottom: 15px; font-weight: bold; }
.essay-section .text .section-body p { font-size: 15px; font-weight: lighter; }

/* SECTION EXTRA CURRICULAR */
.extra-curricular-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 40px;
    gap: 40px;
    max-width: 600px;
}
.extra-curricular-section .text .activity-item p { font-weight: lighter; font-size: 14px }
.extra-curricular-section .text .activity-item .date p {
    font-size: 14px; font-weight: lighter; color: #787878;
}

.activity-item {
    margin-bottom: 20px;
    transition: all 0.6s ease;
    position: relative;
    padding-left: 18px;
    cursor: pointer;
}

.detail-box {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.6s ease, padding 0.6s ease, opacity 0.6s ease;
    padding: 0;
    opacity: 0;
    color: #787878
}

/* empty circle */
.activity-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.6px solid #787878;
  box-sizing: border-box;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

/* filled circle */
.activity-item:hover::before,
.activity-item.active::before,
.activity-item.in-view::before {
  background-color: #000000;
  border-color: #000000;
}

body.dark-mode .activity-item::before { border-color: #c6c4c4; }
body.dark-mode .activity-item:hover::before,
body.dark-mode .activity-item.active::before,
body.dark-mode .activity-item.in-view::before {
  background-color: #dad9e2;
  border-color: #dad9e2;
}

.activity-item:hover .detail-box { max-height: 9990px; padding: 20px 0; opacity: 1; }

body.dark-mode .detail-box { background-color: #121212; color: #c6c4c4; }
body.dark-mode .activity-item:hover .date p { color: #c6c4c4; }
body.dark-mode .extra-curricular-section .text .activity-item .date p { color: #c6c4c4; }

html { scrollbar-gutter: stable; }

/* side-tab */
#side-tab {
    display: block;
    position: fixed;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    width: 30px;
    height: 60px;
    background-color: #1e1e1e;
    color: white;
    font-size: 24px;
    text-align: center;
    line-height: 60px;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
    z-index: 1001;
    cursor: pointer;
    opacity: 1;
    transition: opacity 0.4s ease, left 0.4s ease;
}
#side-tab.hidden { opacity: 0; left: -40px; pointer-events: none; }
#side-tab { display: none; }
.close-btn { display: none; }

/* Mobile */
@media (max-width: 768px) {
    #side-tab { display: block; }
    .sidebar {
        position: fixed;
        left: -220px;
        top: 0;
        width: 200px;
        height: 100vh;
        background-color: #f8f8f8;
        transition: left 0.3s ease;
        z-index: 1000;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }
    .sidebar.open { left: 0; }
    .sidebar.open .close-btn { display: block; }
}

/* Desktop */
@media (min-width: 769px) {
    .sidebar { position: sticky; left: 0; }
    #side-tab { display: none !important; }
    .close-btn { display: none !important; }
}

.close-btn {
    display: none;
    position: absolute;
    top: 10px;
    right: 15px;
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
}

/* Korea easter-egg flag rain (ported from old inline JS) */
.kr-flag {
    position: fixed;
    top: -50px;
    z-index: 9999;
    pointer-events: none;
    animation: fall 4s ease-in forwards;
}
@keyframes fall {
    to { transform: translateY(400vh); opacity: 0; }
}
```

- [ ] **Step 2: Import the stylesheet in `src/main.tsx`**

Add the import line so `main.tsx` becomes:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 3: Verify no stray `p1` selectors and build passes**

Run:
```bash
! grep -nE '(^|[^.])p1\b' src/styles/index.css && grep -q '.subtitle' src/styles/index.css && npm run build && echo "OK"
```
Expected: prints `OK` (no `p1` selector remains, `.subtitle` present, build succeeds).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "style: migrate global stylesheet (p1 -> .subtitle, add flag-rain keyframes)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Types + data layer

Typed content extracted from the original. Long prose stays in pages (Task 9); this task covers the structured data only.

**Files:**
- Create: `src/types.ts`, `src/data/profile.ts`, `src/data/activities.ts`, `src/data/education.ts`, `src/data/data.test.ts`

**Interfaces:**
- Produces:
  - `type LinkedLine = { prefix: string; link?: { label: string; url?: string }; suffix?: string }`
  - `type ResumeLine = LinkedLine & { date: string; detail?: string[] }`
  - `type Activity = ResumeLine`, `type Education = ResumeLine`
  - `profile` (name, social links, per-section lastUpdated dates)
  - `activities: Activity[]` (length 7), `education: Education[]` (length 3)

- [ ] **Step 1: Write the failing test `src/data/data.test.ts`**

```ts
import { activities } from './activities';
import { education } from './education';
import { profile } from './profile';

test('activities has 7 entries, each with a prefix and date', () => {
  expect(activities).toHaveLength(7);
  for (const a of activities) {
    expect(a.prefix.length).toBeGreaterThan(0);
    expect(a.date.length).toBeGreaterThan(0);
  }
});

test('first activity is the UTKESA executive role with two detail paragraphs', () => {
  const first = activities[0];
  expect(first.prefix).toContain('Executive member at');
  expect(first.link?.label).toBe('UTKESA');
  expect(first.suffix).toContain('Event Dept.');
  expect(first.detail).toHaveLength(2);
});

test('education has 3 entries linking to schools', () => {
  expect(education).toHaveLength(3);
  expect(education[0].link?.url).toBe('https://www.utoronto.ca');
  expect(education[2].link?.label).toBe('Walnut Grove Secondary School');
});

test('profile exposes social links and section dates', () => {
  expect(profile.social.github).toBe('https://github.com/yxxjx-dsnv');
  expect(profile.social.email).toBe('mailto:mail2yjkim@gmail.com');
  expect(profile.lastUpdated.home).toBe('2026/02/03');
  expect(profile.lastUpdated.essays).toBe('2025/01/02');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/data/data.test.ts`
Expected: FAIL — cannot find module `./activities`.

- [ ] **Step 3: Create `src/types.ts`**

```ts
export type LinkedLine = {
  prefix: string;
  link?: { label: string; url?: string };
  suffix?: string;
};

export type ResumeLine = LinkedLine & {
  date: string;
  detail?: string[];
};

export type Activity = ResumeLine;
export type Education = ResumeLine;
```

- [ ] **Step 4: Create `src/data/profile.ts`**

```ts
export const profile = {
  name: 'Henry Kim',
  social: {
    instagram: 'https://www.instagram.com/yxxjx_dsnv/',
    linkedin: 'https://www.linkedin.com/in/henry-kim-uoft/',
    github: 'https://github.com/yxxjx-dsnv',
    email: 'mailto:mail2yjkim@gmail.com',
  },
  lastUpdated: {
    home: '2026/02/03',
    essays: '2025/01/02',
    extraCurricular: '2026/02/03',
    education: '2025/06/14',
  },
} as const;
```

- [ ] **Step 5: Create `src/data/activities.ts`**

```ts
import type { Activity } from '../types';

export const activities: Activity[] = [
  {
    prefix: 'Executive member at ',
    link: { label: 'UTKESA', url: 'https://www.instagram.com/utkesa_official/' },
    suffix: ' in Event Dept.',
    date: 'Sep 2025 - present',
    detail: [
      'University of Toronto Korean Engineering Student Association (UTKESA) is a student organization that connects Korean engineering students through academic support, professional development, and social networking.',
      'In Event Dept., We plans and executes social and professional events, coordinating logistics and collaborations to create engaging experiences for U of T students.',
    ],
  },
  {
    prefix: 'Founder & CEO at ',
    link: { label: 'MONO' },
    suffix: ' (Startup)',
    date: 'May 2025 - On hold',
    detail: [
      'Developed an AI-driven global resale analytics platform that automates profit prediction and Shopify listings. Applied engineering thinking and real-time data algorithms to streamline product sourcing and maximize resale margins, demonstrating technological innovation and entrepreneurial leadership.',
    ],
  },
  {
    prefix: 'Project Leader at WGSS Grad Council 2025 ',
    link: { label: '(@wgssgrads25)', url: 'https://www.instagram.com/wgssgrads25/' },
    date: 'May 2024 - Jun 2025',
    detail: [
      'Elected to lead the Class of 2025’s major senior events. Coordinated Spirit Week, Grad Cruise, and Graduation Ceremony with meticulous budgeting and crisis management. Unified diverse student ideas into successful, memorable events, strengthening strategic planning and teamwork under pressure.',
    ],
  },
  {
    prefix: 'President at WGSS LEO Club ',
    link: { label: '(@wgssleos)', url: 'https://www.instagram.com/wgssleos/' },
    date: 'Sep 2023 - Jun 2025',
    detail: [
      'Revitalized the club’s fundraising and community service impact as Treasurer and now President. Introduced data-driven financial tracking, grew membership through eco-awareness projects like campus recycling, and expanded local volunteer initiatives, proving commitment to sustainability and social leadership.',
    ],
  },
  {
    prefix: 'Co-President at ',
    link: { label: 'Unity 4 Charity (U4C)', url: 'https://unity4charity.com' },
    date: 'Aug 2023 - Jun 2025',
    detail: [
      'Transformed an unfocused group into a certified BC non-profit with structured departments and automated volunteer systems. Led successful refugee aid campaigns, increased donations by 40%, and fostered partnerships with local organizations — embodying visionary leadership and social entrepreneurship.',
    ],
  },
  {
    prefix: 'Vice-President at WGSS Korean Culture Club ',
    link: { label: '(@wgsskoreancultureclub)', url: 'https://www.instagram.com/wgsskoreancultureclub/' },
    date: 'Jun 2024 - Mar 2025',
    detail: [
      'Organized cultural showcases, traditional food festivals, and language workshops to celebrate Korean heritage within the school. Boosted club participation and strengthened cross-cultural understanding, showcasing initiative in cultural leadership and event management.',
    ],
  },
  {
    prefix: 'Teaching Assistant (TA) at ',
    link: { label: 'Canada Kwanglim Korean School', url: 'https://www.kwanglim.ca/school' },
    date: 'Aug 2024 - Jan 2025',
    detail: [
      'Assisted advanced Korean classes with customized lesson plans and real-life examples to prepare students for the TOPIK exam. Enhanced classroom engagement through Q&A and personalized tutoring, gaining deep insights into educational methodologies and mentorship.',
    ],
  },
];
```

- [ ] **Step 6: Create `src/data/education.ts`**

```ts
import type { Education } from '../types';

export const education: Education[] = [
  {
    prefix: 'TrackOne (Undeclared Engineering program) - BAsc @',
    link: { label: 'University of Toronto', url: 'https://www.utoronto.ca' },
    date: 'Jan 2026 - 2029(Anticipated)',
  },
  {
    prefix: 'Engineering Science - BAsc @',
    link: { label: 'University of Toronto', url: 'https://www.utoronto.ca' },
    date: 'Sep 2025 - Jan 2026',
  },
  {
    prefix: 'High School Diploma @',
    link: { label: 'Walnut Grove Secondary School', url: 'https://www.wgss.ca' },
    date: 'Sep 2022 - Jun 2025',
  },
];
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test -- src/data/data.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add typed content data (profile, activities, education)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: `useDarkMode` hook

Persisted theme with system default and body-class application.

**Files:**
- Create: `src/hooks/useDarkMode.ts`, `src/hooks/useDarkMode.test.ts`

**Interfaces:**
- Produces: `useDarkMode(): { theme: 'light' | 'dark'; isDark: boolean; toggle: () => void }`. Side effects: toggles `document.body` class `dark-mode`; writes `localStorage.theme`.

- [ ] **Step 1: Write the failing test `src/hooks/useDarkMode.test.ts`**

```ts
import { renderHook, act } from '@testing-library/react';
import { useDarkMode } from './useDarkMode';

beforeEach(() => {
  localStorage.clear();
  document.body.className = '';
});

test('defaults to light when nothing stored and system is light', () => {
  const { result } = renderHook(() => useDarkMode());
  expect(result.current.theme).toBe('light');
  expect(document.body.classList.contains('dark-mode')).toBe(false);
});

test('reads a stored dark theme and applies the body class', () => {
  localStorage.setItem('theme', 'dark');
  const { result } = renderHook(() => useDarkMode());
  expect(result.current.isDark).toBe(true);
  expect(document.body.classList.contains('dark-mode')).toBe(true);
});

test('toggle flips theme, body class, and persists', () => {
  const { result } = renderHook(() => useDarkMode());
  act(() => result.current.toggle());
  expect(result.current.theme).toBe('dark');
  expect(document.body.classList.contains('dark-mode')).toBe(true);
  expect(localStorage.getItem('theme')).toBe('dark');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/hooks/useDarkMode.test.ts`
Expected: FAIL — cannot find module `./useDarkMode`.

- [ ] **Step 3: Create `src/hooks/useDarkMode.ts`**

```ts
import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'theme';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function useDarkMode() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore storage failures */
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, isDark: theme === 'dark', toggle };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/hooks/useDarkMode.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add useDarkMode hook (localStorage + system default)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Hero + ActivityItem components

Two presentational components.

**Files:**
- Create: `src/components/Hero.tsx`, `src/components/ActivityItem.tsx`, `src/components/Hero.test.tsx`, `src/components/ActivityItem.test.tsx`

**Interfaces:**
- Consumes: `ResumeLine` from `../types`.
- Produces:
  - `Hero({ title, subtitle }: { title: string; subtitle: string })`
  - `ActivityItem({ item }: { item: ResumeLine })`

- [ ] **Step 1: Write the failing tests**

`src/components/Hero.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { Hero } from './Hero';

test('Hero renders title and subtitle', () => {
  render(<Hero title="Education" subtitle="last updated: 2025/06/14" />);
  expect(screen.getByRole('heading', { name: 'Education' })).toBeInTheDocument();
  expect(screen.getByText('last updated: 2025/06/14')).toHaveClass('subtitle');
});
```

`src/components/ActivityItem.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { ActivityItem } from './ActivityItem';

test('renders prefix, linked org, suffix, date, and details', () => {
  render(
    <ActivityItem
      item={{
        prefix: 'Executive member at ',
        link: { label: 'UTKESA', url: 'https://example.com' },
        suffix: ' in Event Dept.',
        date: 'Sep 2025 - present',
        detail: ['Para one.', 'Para two.'],
      }}
    />,
  );
  expect(screen.getByText(/Executive member at/)).toBeInTheDocument();
  const link = screen.getByRole('link', { name: 'UTKESA' });
  expect(link).toHaveAttribute('href', 'https://example.com');
  expect(screen.getByText(/in Event Dept\./)).toBeInTheDocument();
  expect(screen.getByText('Sep 2025 - present')).toBeInTheDocument();
  expect(screen.getByText('Para one.')).toBeInTheDocument();
  expect(screen.getByText('Para two.')).toBeInTheDocument();
});

test('renders a link without href when url is absent (MONO case)', () => {
  render(<ActivityItem item={{ prefix: 'Founder & CEO at ', link: { label: 'MONO' }, suffix: ' (Startup)', date: 'x' }} />);
  const link = screen.getByText('MONO');
  expect(link.tagName).toBe('A');
  expect(link).not.toHaveAttribute('href');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/components/Hero.test.tsx src/components/ActivityItem.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Create `src/components/Hero.tsx`**

```tsx
export function Hero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="hero-section">
      <div className="text">
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `src/components/ActivityItem.tsx`**

```tsx
import { Fragment } from 'react';
import type { ResumeLine } from '../types';

export function ActivityItem({ item }: { item: ResumeLine }) {
  const { prefix, link, suffix, date, detail } = item;
  return (
    <div className="activity-item">
      <p>
        {prefix}
        {link &&
          (link.url ? (
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          ) : (
            <a target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          ))}
        {suffix}
      </p>
      <div className="date">
        <p>{date}</p>
      </div>
      {detail && detail.length > 0 && (
        <div className="detail-box">
          {detail.map((para, i) => (
            <Fragment key={i}>
              <p>{para}</p>
              {i < detail.length - 1 && <br />}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- src/components/Hero.test.tsx src/components/ActivityItem.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Hero and ActivityItem presentational components

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: KoreaEasterEgg (Korea trigger) component

Clicking the wrapped text rains 250 flags that fall and clean up, matching the original behavior.

**Files:**
- Create: `src/components/KoreaEasterEgg.tsx`, `src/components/KoreaEasterEgg.test.tsx`

**Interfaces:**
- Produces: `KoreaTrigger({ children }: { children: React.ReactNode })` — renders a `<span id="korea-trigger">` that, on click, appends 250 `.kr-flag` nodes, removed after 10000ms.

- [ ] **Step 1: Write the failing test `src/components/KoreaEasterEgg.test.tsx`**

```tsx
import { render, screen, act } from '@testing-library/react';
import { KoreaTrigger } from './KoreaEasterEgg';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('clicking the trigger rains 250 flags, then clears them after 10s', () => {
  const { container } = render(<KoreaTrigger>South Korea</KoreaTrigger>);
  const span = screen.getByText('South Korea');
  act(() => {
    span.click();
  });
  expect(container.querySelectorAll('.kr-flag')).toHaveLength(250);
  act(() => {
    vi.advanceTimersByTime(10000);
  });
  expect(container.querySelectorAll('.kr-flag')).toHaveLength(0);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/KoreaEasterEgg.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/KoreaEasterEgg.tsx`**

```tsx
import { useCallback, useRef, useState, type ReactNode } from 'react';

type Flag = { id: number; left: number; size: number; delay: number };

export function KoreaTrigger({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Flag[]>([]);
  const nextId = useRef(0);

  const rain = useCallback(() => {
    const batch: Flag[] = Array.from({ length: 250 }, () => ({
      id: nextId.current++,
      left: Math.random() * 300,
      size: Math.random() * 24 + 16,
      delay: Math.random(),
    }));
    setFlags((prev) => [...prev, ...batch]);
    const ids = new Set(batch.map((f) => f.id));
    setTimeout(() => {
      setFlags((prev) => prev.filter((f) => !ids.has(f.id)));
    }, 10000);
  }, []);

  return (
    <>
      <span id="korea-trigger" onClick={rain}>
        {children}
      </span>
      {flags.map((f) => (
        <div
          key={f.id}
          className="kr-flag"
          style={{ left: `${f.left}vw`, fontSize: `${f.size}px`, animationDelay: `${f.delay}s` }}
        >
          🇰🇷
        </div>
      ))}
    </>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/KoreaEasterEgg.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: port Korea flag-rain easter egg to a React component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Sidebar component

Navigation, logo dark-toggle, social links, and mobile open/close.

**Files:**
- Create: `src/components/Sidebar.tsx`, `src/components/Sidebar.test.tsx`

**Interfaces:**
- Consumes: `profile` from `../data/profile`; `NavLink` from `react-router-dom` (requires a Router in tests).
- Produces: `Sidebar({ isDark, onToggleDark, open, onClose }: { isDark: boolean; onToggleDark: () => void; open: boolean; onClose: () => void })`.

- [ ] **Step 1: Write the failing test `src/components/Sidebar.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';

function renderSidebar(props: Partial<Parameters<typeof Sidebar>[0]> = {}) {
  const onToggleDark = vi.fn();
  const onClose = vi.fn();
  render(
    <MemoryRouter>
      <Sidebar isDark={false} onToggleDark={onToggleDark} open={false} onClose={onClose} {...props} />
    </MemoryRouter>,
  );
  return { onToggleDark, onClose };
}

test('renders the four nav links and social links', () => {
  renderSidebar();
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  expect(screen.getByRole('link', { name: 'Essays' })).toHaveAttribute('href', '/essays');
  expect(screen.getByRole('link', { name: 'Extra-Curricular' })).toHaveAttribute('href', '/extra-curricular');
  expect(screen.getByRole('link', { name: 'Education' })).toHaveAttribute('href', '/education');
  expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/yxxjx-dsnv');
});

test('clicking the logo toggles dark mode; light logo shown when not dark', () => {
  const { onToggleDark } = renderSidebar({ isDark: false });
  const logo = screen.getByAltText('Logo') as HTMLImageElement;
  expect(logo.getAttribute('src')).toBe('/Images/H Logo.svg');
  logo.click();
  expect(onToggleDark).toHaveBeenCalledTimes(1);
});

test('shows the white logo in dark mode', () => {
  renderSidebar({ isDark: true });
  expect(screen.getByAltText('Logo').getAttribute('src')).toBe('/Images/H Logo - White.svg');
});

test('close button calls onClose', async () => {
  const { onClose } = renderSidebar({ open: true });
  await userEvent.click(screen.getByText('×'));
  expect(onClose).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/Sidebar.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/Sidebar.tsx`**

```tsx
import { NavLink } from 'react-router-dom';
import { profile } from '../data/profile';

const LOGO_LIGHT = '/Images/H Logo.svg';
const LOGO_DARK = '/Images/H Logo - White.svg';

type Props = {
  isDark: boolean;
  onToggleDark: () => void;
  open: boolean;
  onClose: () => void;
};

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');

export function Sidebar({ isDark, onToggleDark, open, onClose }: Props) {
  return (
    <nav className={`sidebar${open ? ' open' : ''}`}>
      <div className="close-btn" id="close-sidebar" onClick={onClose}>
        ×
      </div>
      <img
        src={isDark ? LOGO_DARK : LOGO_LIGHT}
        alt="Logo"
        id="logo-toggle"
        className="logo"
        onClick={onToggleDark}
      />
      <p>Navigation</p>
      <br />
      <ul>
        <li>
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/essays" className={navClass}>
            Essays
          </NavLink>
        </li>
        <li>
          <NavLink to="/extra-curricular" className={navClass}>
            Extra-Curricular
          </NavLink>
        </li>
        <li>
          <NavLink to="/education" className={navClass}>
            Education
          </NavLink>
        </li>
        <br />
      </ul>
      <p>Find me on</p>
      <br />
      <ul>
        <li>
          <a href={profile.social.instagram} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </li>
        <li>
          <a href={profile.social.linkedin} target="_blank" rel="noopener noreferrer">
            Linkedin
          </a>
        </li>
        <li>
          <a href={profile.social.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </li>
        <li>
          <a href={profile.social.email}>Email</a>
        </li>
      </ul>
    </nav>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/Sidebar.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Sidebar (nav, logo dark-toggle, social, mobile close)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Page components

Four route pages. `Home` and `Essays` carry verbatim prose; `ExtraCurricular` and `Education` map over data.

**Files:**
- Create: `src/pages/Home.tsx`, `src/pages/Essays.tsx`, `src/pages/ExtraCurricular.tsx`, `src/pages/Education.tsx`, `src/pages/pages.test.tsx`

**Interfaces:**
- Consumes: `Hero`, `ActivityItem`, `KoreaTrigger`, `activities`, `education`, `profile`.
- Produces: `Home`, `Essays`, `ExtraCurricular`, `Education` (each a no-prop component).

- [ ] **Step 1: Write the failing test `src/pages/pages.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { Home } from './Home';
import { Essays } from './Essays';
import { ExtraCurricular } from './ExtraCurricular';
import { Education } from './Education';

test('Home shows the name hero and the Korea trigger', () => {
  render(<Home />);
  expect(screen.getByRole('heading', { name: 'Henry Kim' })).toBeInTheDocument();
  expect(screen.getByText('South Korea')).toHaveAttribute('id', 'korea-trigger');
  expect(screen.getByText(/Some things about me:/)).toBeInTheDocument();
});

test('Essays shows the essay hero and prompt', () => {
  render(<Essays />);
  expect(screen.getByRole('heading', { name: 'Learnings from past three years' })).toBeInTheDocument();
  expect(screen.getByText(/Prompt: Discuss an accomplishment/)).toBeInTheDocument();
  expect(screen.getByText(/Incheon International Airport/)).toBeInTheDocument();
});

test('ExtraCurricular renders all 7 activity items', () => {
  const { container } = render(<ExtraCurricular />);
  expect(screen.getByRole('heading', { name: 'Extra-Curricular' })).toBeInTheDocument();
  expect(container.querySelectorAll('.activity-item')).toHaveLength(7);
});

test('Education renders all 3 items', () => {
  const { container } = render(<Education />);
  expect(screen.getByRole('heading', { name: 'Education' })).toBeInTheDocument();
  expect(container.querySelectorAll('.activity-item')).toHaveLength(3);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/pages/pages.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Create `src/pages/ExtraCurricular.tsx`**

```tsx
import { Hero } from '../components/Hero';
import { ActivityItem } from '../components/ActivityItem';
import { activities } from '../data/activities';
import { profile } from '../data/profile';

export function ExtraCurricular() {
  return (
    <section className="section">
      <Hero title="Extra-Curricular" subtitle={`last updated: ${profile.lastUpdated.extraCurricular}`} />
      <section className="extra-curricular-section">
        <div className="text">
          {activities.map((item, i) => (
            <ActivityItem key={i} item={item} />
          ))}
        </div>
      </section>
    </section>
  );
}
```

- [ ] **Step 4: Create `src/pages/Education.tsx`**

```tsx
import { Hero } from '../components/Hero';
import { ActivityItem } from '../components/ActivityItem';
import { education } from '../data/education';
import { profile } from '../data/profile';

export function Education() {
  return (
    <section className="section">
      <Hero title="Education" subtitle={`last updated: ${profile.lastUpdated.education}`} />
      <section className="extra-curricular-section">
        <div className="text">
          {education.map((item, i) => (
            <ActivityItem key={i} item={item} />
          ))}
        </div>
      </section>
    </section>
  );
}
```

- [ ] **Step 5: Create `src/pages/Home.tsx`** (prose verbatim from the original)

```tsx
import { Hero } from '../components/Hero';
import { KoreaTrigger } from '../components/KoreaEasterEgg';
import { profile } from '../data/profile';

export function Home() {
  return (
    <section className="section">
      <Hero title="Henry Kim" subtitle={`last updated: ${profile.lastUpdated.home}`} />
      <section className="about-section">
        <div className="text">
          <p>Some things about me:</p>
          <div className="section-title">
            <li>
              18-years-old, born in <KoreaTrigger>South Korea</KoreaTrigger> — First Year
              TrackOne(Undeclared Engineering) student at the{' '}
              <a href="https://www.utoronto.ca" target="_blank" rel="noopener noreferrer">
                University of Toronto
              </a>
              .
            </li>
            <br />
            <li>
              (
              <u>
                <b>On hold</b>
              </u>
              ) I'm building a startup called{' '}
              <a target="_blank" rel="noopener noreferrer">
                MONO
              </a>
              , which uses AI and automation to analyze global resale markets, helping users identify
              profitable opportunities more efficiently. I lead the project as the Founder &amp; CEO.
            </li>
            <br />
            <li>
              Previously, I served as a Project Leader at WGSS Grad Council 2025, President of the WGSS
              LEO Club, and Co-President of Unity 4 Charity (U4C).
            </li>
            <br />
            <li>
              Now, I served as an Executive member in Event Dept. at{' '}
              <a href="https://www.instagram.com/utkesa_official/" target="_blank" rel="noopener noreferrer">
                UTKESA
              </a>
            </li>
            <br />
            <li>I enjoy combining technology, design, and systems thinking to solve practical problems.</li>
          </div>
          <br />
          <br />
          <div className="text">
            <p>Some things I'm interested in:</p>
            <div className="section-title">
              <li>
                <b>Technology and startups</b> — especially where automation, artificial intelligence,
                and user experience intersect. I'm fascinated by tools that can simplify life or create
                new possibilities.
              </li>
              <br />
              <li>
                <b>Design and clarity</b> — I value clean, intentional design in both digital products
                and communication. Good design, to me, makes things feel intuitive and respectful of the
                user's time.
              </li>
              <br />
              <li>
                <b>Independent learning</b> — I like teaching myself new skills and using them
                immediately: web development, writing, data analysis, and business strategy are all
                things I've explored hands-on.
              </li>
              <br />
              <li>
                <b>Education and leadership</b> — I've seen firsthand how student-led initiatives can
                create meaningful impact. I hope to keep exploring leadership grounded in action and
                empathy.
              </li>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
```

- [ ] **Step 6: Create `src/pages/Essays.tsx`** (essay verbatim from the original)

```tsx
import { Hero } from '../components/Hero';
import { profile } from '../data/profile';

export function Essays() {
  return (
    <section className="section">
      <Hero title="Learnings from past three years" subtitle={`written: ${profile.lastUpdated.essays}`} />
      <section className="essay-section">
        <div className="text">
          <div className="section-title">
            <p>
              Prompt: Discuss an accomplishment, event, or realization that sparked a period of personal
              growth and a new understanding of yourself or others.
            </p>
            <br />
          </div>
          <div className="section-body">
            <p>
              In August 2022, I stood alone at Incheon International Airport, poised to board a flight to
              Canada. It was a leap into the unknown. As the plane climbed, Neil Armstrong's words
              resonated in my brain: "That's one small step for a man, one giant leap for mankind." For
              me, this flight symbolized more than just changing my address. It was a transforming start,
              an opportunity to grow and reshape my future.
            </p>
            <br />
            <p>
              My first few days in Canada were a whirlwind of challenges. Taking classes in a foreign
              language, adjusting to new cultures, and living independently challenged me in ways I never
              imagined. Despite this whirlwind, I saw an opportunity to stretch beyond my comfort zone and
              get closer to my goals. Being an entrepreneur in a global marketplace, a vision I've long
              had, necessitated resilience and leadership. When I joined Unity 4 Charity (U4C), a
              non-profit that supports climate refugees and Indigenous communities, I recognized an
              opportunity to cultivate these traits.
            </p>
            <br />
            <p>
              At the time, U4C was bursting with enthusiasm but lacked structure. Meetings floundered
              without a clear direction, roles were unclear, and progress was slow. Where others saw
              chaos, I saw possibilities. I set out on the ambitious mission of converting the
              organization into an efficient, goal-driven institution fuelled by my optimism.
            </p>
            <br />
            <p>
              I began by examining the personnel management systems of global leaders such as Apple and
              Amazon, which prompted a thorough structural redesign. U4C was reorganized into four
              departments: planning and development, communications and media, operations and
              administration, and volunteer services. Each department was assigned specific duties that
              were unified by the goal of obtaining official non-profit certification. Over several
              months, I interviewed 40 members to determine their skills and placed them in places where
              they could thrive.
            </p>
            <br />
            <p>
              Our first significant challenge took the form of a fundraising effort. Each department met
              weekly to prepare: the Planning team researched and designed things to sell, Communications
              created engaging promotional materials, Operations secured event sites, and Volunteer
              Service trained members to interact with the public. The campaign's success exceeded all
              expectations, paving the way for future efforts. U4C acquired non-profit status in British
              Columbia in November 2023, demonstrating all members' commitment.
            </p>
            <br />
            <p>
              This adventure showed me that leadership is about empowerment, not control. Leadership
              brings people together under a shared vision, creating an atmosphere to ignite innovation.
              However, the most important lesson was not about systems or strategies; resilience is the
              ability to turn setbacks into opportunities and persevere toward a goal.
            </p>
            <br />
            <p>
              Throughout the campaign, we encountered obstacles that tested us. Creative solutions were
              needed to capture public interest, and moments of discord required careful mediation to
              align perspectives. These problems served as growth opportunities for both me and the
              organization. I learned how to navigate the complexities of team interactions while
              remaining focused on the broader picture.
            </p>
            <br />
            <p>
              The experience with U4C was revolutionary. It taught me the value of collaboration and
              balancing individual potential with a larger objective. Designing systems to increase
              organizational efficiency while nurturing passion and creativity became a pillar of my
              leadership. Furthermore, I gained the confidence to lead in uncertain, high-pressure
              situations.
            </p>
            <br />
            <p>
              Reflecting on this voyage, I reimagined how uncertain I felt as I boarded that plane to
              Canada. Back then, I feared the unknown, unsure of my readiness. But now I realize that
              challenges are not obstacles; they are opportunities to improve. Failures do not mark the
              end; rather, they serve as stepping stones to achievement. Each tiny action performed with
              intent builds the basis for something greater.
            </p>
            <br />
            <p>
              As I prepare to embark on the next stage in college, I carry the lessons learned from this
              experience. The fortitude to face uncertainty, the ingenuity to solve difficulties, and the
              determination to bring people together behind a common vision will guide me. Just as that
              flight to Canada marked the beginning, I am ready to take another leap, understanding that
              the journey begins with a single step.
            </p>
            <br />
          </div>
        </div>
      </section>
    </section>
  );
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test -- src/pages/pages.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Home, Essays, ExtraCurricular, Education pages

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Router wiring + App shell + hash redirect

Replace the placeholder `App` with the full layout: side-tab, main container, Sidebar, routed content, dark mode, mobile open/close, and the one-time legacy `#hash` → route redirect.

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`, `src/App.test.tsx`

**Interfaces:**
- Consumes: `Sidebar`, all four pages, `useDarkMode`, `BrowserRouter`/`Routes`/`Route`/`useNavigate`/`useLocation`.

- [ ] **Step 1: Update `src/main.tsx` to wrap App in `BrowserRouter`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 2: Replace the smoke test `src/App.test.tsx`** (App now needs a Router and route assertions)

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

test('renders Home at /', () => {
  renderAt('/');
  expect(screen.getByRole('heading', { name: 'Henry Kim' })).toBeInTheDocument();
});

test('renders Essays at /essays', () => {
  renderAt('/essays');
  expect(screen.getByRole('heading', { name: 'Learnings from past three years' })).toBeInTheDocument();
});

test('renders Education at /education', () => {
  renderAt('/education');
  expect(screen.getByRole('heading', { name: 'Education' })).toBeInTheDocument();
});

test('clicking the logo toggles the dark-mode body class', async () => {
  document.body.className = '';
  localStorage.clear();
  renderAt('/');
  await userEvent.click(screen.getByAltText('Logo'));
  expect(document.body.classList.contains('dark-mode')).toBe(true);
});
```

> Note: `App` no longer renders its own `<BrowserRouter>` — `main.tsx` and the tests provide the router. This avoids nested routers.

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- src/App.test.tsx`
Expected: FAIL — Essays/Education headings not found (placeholder App still renders only `<h1>`).

- [ ] **Step 4: Replace `src/App.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Home } from './pages/Home';
import { Essays } from './pages/Essays';
import { ExtraCurricular } from './pages/ExtraCurricular';
import { Education } from './pages/Education';
import { useDarkMode } from './hooks/useDarkMode';

const HASH_ROUTES: Record<string, string> = {
  '#home': '/',
  '#essays': '/essays',
  '#extra-curricular': '/extra-curricular',
  '#education': '/education',
};

export default function App() {
  const { isDark, toggle } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // One-time redirect from legacy #hash URLs to real routes.
  useEffect(() => {
    const target = HASH_ROUTES[window.location.hash];
    if (target && target !== location.pathname) {
      navigate(target, { replace: true });
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <main>
      <div
        id="side-tab"
        className={sidebarOpen ? 'hidden' : ''}
        onClick={() => setSidebarOpen(true)}
      >
        &#8250;
      </div>
      <div className="main-container" onClick={() => sidebarOpen && closeSidebar()}>
        <Sidebar isDark={isDark} onToggleDark={toggle} open={sidebarOpen} onClose={closeSidebar} />
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/essays" element={<Essays />} />
            <Route path="/extra-curricular" element={<ExtraCurricular />} />
            <Route path="/education" element={<Education />} />
          </Routes>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS (all suites: data, hook, Hero, ActivityItem, KoreaEasterEgg, Sidebar, pages, App).

- [ ] **Step 6: Verify dev server renders and routes work**

Run: `npm run build`
Expected: `tsc` clean, build succeeds, `dist/404.html` created.
Then manually: `npm run dev`, open `/`, click each nav link, confirm sections render; visit `/essays` directly and refresh (works via dev server). Toggle dark mode via logo; reload and confirm it persists.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: wire router, app shell, dark mode, and legacy hash redirect

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Deploy workflow + Pages docs

GitHub Actions builds and deploys to Pages; the build's `404.html` provides the SPA fallback so `/essays`-style URLs survive a refresh. `public/CNAME` keeps the custom domain.

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Create `README.md`**

```markdown
# henrykim.ca

Personal portfolio. Vite + React + TypeScript, deployed to GitHub Pages at https://henrykim.ca.

## Develop
```bash
npm install
npm run dev      # local dev server
npm test         # run unit tests
npm run build    # type-check + production build into dist/ (+ 404.html SPA fallback)
npm run preview  # preview the production build
```

## Deploy
Push to `main`. The `Deploy to GitHub Pages` workflow builds and publishes `dist/`.

**One-time setup (GitHub UI):** Settings → Pages → Build and deployment → **Source: GitHub Actions**.
The custom domain `henrykim.ca` is preserved via `public/CNAME`.

## Structure
- `src/pages` — route pages (`/`, `/essays`, `/extra-curricular`, `/education`)
- `src/components` — Sidebar, Hero, ActivityItem, KoreaEasterEgg
- `src/data` — typed content (profile, activities, education)
- `src/hooks/useDarkMode.ts` — persisted theme + system default
- `_archive/` — previous vanilla/flipbook site, kept for reference
```

- [ ] **Step 3: Verify the workflow file parses and the SPA fallback exists in a build**

Run:
```bash
npm run build && test -f dist/404.html && test -f dist/CNAME && cat dist/CNAME && echo "OK"
```
Expected: prints `henrykim.ca` then `OK` (build produced the 404 fallback and the CNAME made it into `dist/`).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "ci: add GitHub Pages deploy workflow and README

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification (after all tasks)

- [ ] `npm test` — all suites pass.
- [ ] `npm run build` — type-check clean, `dist/` with `index.html`, `404.html`, `CNAME`, `Images/`.
- [ ] **Visual parity:** run `_archive/legacy-vanilla-index.html` (open in a browser) beside `npm run preview`; compare each route in light, dark, and mobile (<768px). Confirm fonts, spacing, sidebar, dot markers/hover detail, and hero layout match.
- [ ] Dark mode persists across reload and follows system theme on first visit (clear localStorage to test); no theme flash on load.
- [ ] Korea easter egg: clicking "South Korea" rains flags identically.
- [ ] Direct-load `/essays` and refresh in `npm run preview` works (SPA fallback).
- [ ] Merge `react-migration` → `main`; after first deploy, set Pages Source = GitHub Actions in repo settings; confirm henrykim.ca loads and `/essays` survives refresh.

---

## Spec coverage check

| Spec section | Task(s) |
|---|---|
| Vite + React + TS scaffold | 2 |
| React Router real routes + `#hash` redirect | 10 |
| Hybrid content (typed data + JSX prose) | 4, 9 |
| Dark mode (localStorage + system + flash prevention) | 2 (flash script), 5 (hook), 10 (wire) |
| Styling migrated verbatim, `p1`→`.subtitle` | 3 |
| Korea easter egg ported | 7, 9 |
| Legacy → `_archive/` | 1 |
| Assets/CNAME → `public/` | 1 |
| GitHub Actions deploy + SPA 404 fallback | 2 (script), 11 (workflow) |
| Testing + visual parity | every task + Final verification |
