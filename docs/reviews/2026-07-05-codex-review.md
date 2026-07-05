# Codex Review — henrykim.ca

## 1. Verification summary

- 환경: macOS / Chrome extension browser QA, `http://localhost:5173`, Node `v24.14.0`, npm `11.9.0`, Vite `5.4.21`.
- 읽은 컨텍스트: `Henry's portfolio/00 Index.md`, `07 Meta/AI Handbook.md`, `Henry's Taste Profile.md`, `Removed & Rejected.md`, `Features Index.md` 및 전체 feature note, `README.md`, `src/`, `index.html`, `vite.config.ts`, `.github/workflows/deploy.yml`.
- `npm install`: 성공. `up to date`, 하지만 `npm audit` 기준 5건(dev tooling: 3 moderate, 1 high, 1 critical)이 남아 있음.
- `npm test`: 성공. 11 files / 42 tests all green. 단, jsdom `HTMLCanvasElement.prototype.getContext`, `window.scrollTo` not implemented 에러 스택과 React Router v7 future warning이 stderr에 반복 출력됨.
- `npm run build`: 성공. `tsc --noEmit`, `vite build`, `scripts/spa-fallback.mjs` 모두 통과했고 `dist/404.html` 생성 확인.
- Chrome QA: desktop 약 `1200x1189`, mobile-width `innerWidth=698`에서 확인. Home, Projects, Essays, Extra-Curricular, Education, Colophon, 404, `/#essays` cold reload, keyboard palette, clock flight, 404 rescue, quote fetch, email copy를 실제 조작함.
- 확인된 정상 동작: quote lazy fetch asset(`quotes.json`) 관찰, quote click 시 즉시 중복 없이 교체, dot field canvas 존재, hero letter lift, keyboard 1-5 / `/` / `Cmd+K`, palette typing guard, clock east/west direction, essay rail scroll/favicon restore/sidebar dim, 404 rescue + companion + colophon line, route titles, scroll reset, mobile side-tab drawer.
- 제한: Chrome automation에서 native print preview 내부 DOM은 노출되지 않았음. `Cmd+P`는 한 번 호출/닫기 시도했고, print 동작은 `src/styles/index.css`의 `@media print` 규칙으로 소스 검증함.

## 2. Bugs & errors

**BUG-1 · Severity major · Where `src/styles/index.css:72` / dark-mode sidebar hover**

- Repro steps: Chrome에서 Home을 dark mode로 전환한 뒤 sidebar `Projects` 링크 위에 hover.
- Expected vs actual: hard rule은 mono/B&W only인데, 실제 computed color가 `rgb(225, 122, 203)` (`#e17acb`)로 분홍색임.
- Suggested fix direction: `body.dark-mode .sidebar a:hover`를 기존 dark-mode 흑백 토큰(`#f1f1f1`, `#dad9e2`, `#c6c4c4` 계열) 중 하나로 교체. 새 컬러 추가 금지.

**BUG-2 · Severity major · Where `src/components/CursorDot.tsx:24-29`, `src/styles/index.css:625-629` / mobile-width cursor**

- Repro steps: Chrome window를 `innerWidth=698`로 줄이고 Home reload.
- Expected vs actual: 요청 체크리스트의 mobile viewport `<=768px`에서는 custom cursor가 없어야 함. 실제로 `body.has-cursor-dot`이 유지되고 `.cursor-dot`도 렌더됨. side-tab drawer는 정상 동작함.
- Suggested fix direction: cursor enable 조건에 mobile breakpoint를 포함하거나 CSS/React 양쪽에서 `max-width: 768px`일 때 `has-cursor-dot`과 cursor DOM을 끄기. `pointer: coarse`만 믿으면 desktop narrow QA에서 계속 켜짐.

**BUG-3 · Severity major · Where `src/components/ActivityItem.tsx:8`, `src/components/ProjectItem.tsx:11` / timeline rows**

- Repro steps: `/projects`에서 Tab으로 첫 project row에 focus. 세부 설명은 열리지만 row DOM 검사.
- Expected vs actual: feature note는 rows가 tabbable이고 `aria-expanded`가 state를 반영한다고 함. 실제 row는 focusable `div`이고 `role=null`, `aria-expanded=null`; visual open만 됨.
- Suggested fix direction: row를 semantic `button`/`summary` 패턴으로 바꾸거나, 최소 `role="button"` + keyboard handler + 실제 open state를 관리해 `aria-expanded`를 갱신. hover/focus CSS의 촉감은 유지.

**BUG-4 · Severity major · Where `src/components/Sidebar.tsx:60-78`, `src/App.tsx:148-154`, `src/components/KoreaEasterEgg.tsx:25` / click-only controls**

- Repro steps: DOM snapshot에서 logo dark toggle은 `img`, mobile side-tab/close는 `div`, Korea trigger는 `span`으로만 노출됨. `South Korea` click은 mouse로 flags 250개 생성 확인했지만 focusable/role 없음.
- Expected vs actual: hard rule 6은 keyboard path를 요구함. 실제 dark mode, mobile drawer open/close, Korea easter egg는 keyboard/assistive tech에서 control로 인식되지 않음.
- Suggested fix direction: visual은 그대로 두고 semantic element로 교체. logo는 `button` 안에 `img` 또는 `button` background, side-tab/close는 `button`, Korea trigger는 inline `button` 스타일로. accessible name과 `Enter`/`Space` 동작을 보장.

**BUG-5 · Severity minor · Where `src/styles/index.css:449`, `src/components/Sidebar.tsx:136-140` / email copy label**

- Repro steps: Home에서 Email click. Clipboard에는 `mail2yjkim@gmail.com`이 정상 복사됨.
- Expected vs actual: feature note는 `"Copied" swap, no layout shift`. 실제 `.email-label` width가 `Email` 약 `47.59px`에서 `Copied` 약 `52.14px`로 증가함.
- Suggested fix direction: `.email-label`의 reserved width를 `"Copied"` 기준으로 고정하거나 `ch`/px 값을 충분히 키워 before/after width가 동일하게 만들기. acceptance: click 전후 label bounding width 동일.

**BUG-6 · Severity minor · Where `src/App.tsx:70-78` / legacy hash redirect**

- Repro steps: 이미 Home SPA가 mounted 된 상태에서 `http://localhost:5173/#essays`로 이동. 그 상태에서는 `/essays`로 redirect되지 않고 Home + `#essays`에 머무름. 같은 URL을 reload하면 cold mount에서는 `/essays`로 정상 redirect됨.
- Expected vs actual: legacy `#essays` hash redirect는 in-session hash navigation에서도 동작하는 편이 안전함. 현재 effect가 mount 한 번만 실행되어 hash-only navigation을 놓침.
- Suggested fix direction: mount 처리 유지 + `hashchange` listener 추가. `HASH_ROUTES`에 있는 hash만 `navigate(target, { replace: true })`하고 listener cleanup.

**BUG-7 · Severity minor · Where `src/data/education.ts:15-17` vs `Henry's portfolio/04 Features/Timeline Interactions.md` / military service date**

- Repro steps: `/education`에서 military divider 확인. 실제 text는 `Mandatory Military Service @ S.Korea · Oct 2026 - Apr 2028`.
- Expected vs actual: feature note에는 military service가 `Oct 2026–Sep 2028`로 문서화되어 있음. 코드/data는 `Apr 2028`. 어느 쪽이 실제 fact인지 확정 필요.
- Suggested fix direction: Henry의 실제 이력 source로 date를 확정하고, 코드와 vault note 중 틀린 쪽을 맞추기. fact invent 금지.

## 3. Code quality & architecture

- `src/setupTests.ts:3-15`: `matchMedia`만 mock되어 있어 tests는 green이어도 stderr가 지저분함. `canvas.getContext`와 `window.scrollTo`를 명시적으로 mock/stub하면 “green but noisy” 상태를 없앨 수 있음.
- React Router future warnings가 live console과 test stderr 모두에 반복됨. 지금 당장 runtime bug는 아니지만 v7 migration 전에 `future` flag 적용 가능 여부를 검토할 것.
- `npm audit --json`: 취약점은 Vite/Vitest/esbuild dev tooling 쪽. production runtime dependency 문제는 아니지만 local dev server를 매일 쓰는 repo라서 Vite/Vitest major upgrade 계획이 필요함.
- `src/components/LocalTime.tsx:23,47-48`: `timers.current`에 timeout id를 계속 push하고 제거하지 않음. unmount cleanup은 되지만 반복 toggle 세션에서 배열이 불필요하게 누적됨.
- `src/components/ReadProgress.tsx:41-45`: favicon wedge canvas가 H mark를 항상 black으로 그림. 기본 `favicon.svg`는 dark-tab-aware인데 reading favicon은 그 속성을 잃을 수 있음.
- `src/types.ts:1-4` + `src/components/ActivityItem.tsx:11-19`: `url?: string` 때문에 href 없는 `<a>`가 의도적으로 만들어짐(MONO case). 링크가 아니면 `span` 타입으로 모델링하는 편이 더 명확함.
- 현재 tests는 핵심 happy path는 좋지만 BUG-1~6을 막지 못함. 특히 mobile cursor breakpoint, timeline ARIA, same-session hashchange, email label width, dark hover color에 회귀 테스트가 없음.

## 4. UX / a11y / performance / SEO observations

- UX/design: BUG-1은 Henry의 hard rule을 정면으로 위반함. 작은 hover 하나라도 분홍색은 “mono/B&W only” 리뷰에서 바로 걸릴 가능성이 큼.
- A11y: keyboard palette는 좋지만, click-only controls와 timeline ARIA 누락 때문에 “keyboard paths for every interactive feature” 기준에는 아직 못 미침.
- UX: mobile drawer 자체는 `innerWidth=698`에서 정상 open됨. 다만 custom cursor까지 같이 남아 mobile QA 인상이 어긋남.
- Performance: Home `quotes.json`은 page asset inventory에서 `fetch` resource로 1개 관찰됨. bundle은 `dist/assets/index-*.js` 약 `216.10 kB` / gzip `73.63 kB`로 포트폴리오 치고 무겁지 않음.
- Console: live route sweep에서 error는 없고 React Router future warnings만 반복됨. 배포 전 콘솔을 더 조용하게 만들면 site의 “quiet polish”와 맞음.
- SEO/meta: 기본 description/OG tags, per-route titles는 있음. `og:image`는 없음; 개인 포트폴리오라 필수는 아니지만 공유 미리보기 품질을 원하면 별도 검토 가능.

## 5. Mentor suggestions — for Claude to implement

**[Fix-first]** Dark-mode sidebar hover를 흑백으로 되돌리기. Acceptance: dark mode에서 모든 sidebar hover computed color가 grayscale이고 CSS에 `#e17acb` 같은 non-B&W 값이 없음.

**[Fix-first]** mobile-width에서 custom cursor 비활성화. Acceptance: `innerWidth <= 768`에서 `.cursor-dot`/`.cursor-core`가 없거나 hidden이고 `body.has-cursor-dot`이 없음; side-tab drawer는 그대로 동작.

**[Fix-first]** timeline row semantics/ARIA 복구. Acceptance: focus로 detail이 열릴 때 screen reader에 expandable control로 노출되고 `aria-expanded`가 실제 open/closed 상태와 일치.

**[Fix-first]** click-only controls를 semantic button으로 바꾸기. Acceptance: logo, side-tab, close, Korea trigger가 Tab으로 접근 가능하고 Enter/Space로 mouse click과 같은 결과를 냄.

**[Improve]** test harness noise 제거. Acceptance: `npm test`가 pass하면서 jsdom not implemented error stack 없이 끝남.

**[Improve]** in-session hash redirect 처리. Acceptance: mounted 상태에서 `/#essays`로 hash-only navigation해도 `/essays`로 replace됨.

**[Improve]** email copy label width 고정. Acceptance: Email/Copied 전환 전후 `.email-label.getBoundingClientRect().width`가 같음.

**[Improve]** Vite/Vitest audit upgrade spike. Acceptance: no runtime deps 추가 없이 tests/build green, `npm audit` critical/high 0, React Router warnings 처리 방향 문서화.

**[Idea]** reading favicon dark-tab handling 정리. Acceptance: normal favicon과 reading-progress favicon 모두 light/dark browser tab에서 H mark 대비가 유지됨.

## 6. Verdict

전체 품질은 꽤 좋다. 손으로 만든 interaction들이 실제로 대부분 살아 있고, build/test도 green이며, clock/essay/404 같은 signature 기능은 Chrome에서 기대대로 작동했다. 다만 top 3 우선순위는 명확함: (1) dark-mode pink hover 제거, (2) mobile cursor + semantic controls + timeline ARIA로 hard rule 6 맞추기, (3) noisy tests/audit/future warnings를 정리해 “조용한 완성도”를 코드 품질까지 확장하기.
