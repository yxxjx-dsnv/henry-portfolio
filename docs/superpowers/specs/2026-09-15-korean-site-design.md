# The site in Korean

**Date:** 2026-09-15 · **Branch:** `korean` · **Status:** built, awaiting the owner's review

## What the owner asked for

A Korean version of the whole site, switched by a rounded-square button at the foot of the
sidebar, because showing an English-only site in Korea costs him reach. Then, on seeing the
first pass: keep the chrome English — sidebar, page titles and subtitles, section headings,
bold lead-ins, buttons, HUDs, row titles, course names — and put only the reading matter in
Korean. Tone: 합니다체, like a well-written Korean company site, first person for his own story.

## Mechanism (`src/i18n.tsx`, `src/i18n/ko/`)

No library. `LangProvider` holds `en | ko`, chosen by `?lang=ko` on the link, else the
reader's last choice (localStorage), else a Korean browser; it sets `<html lang>`. `useLang()`
gives `t(en)` — the Korean for an exact English string when Korean is on, the English itself
otherwise, so an untranslated line never breaks a page — and `tx(en, parts)` for sentences with
elements inside, written as `{name}` placeholders. The Korean lives in one file per page under
`src/i18n/ko/`, keyed by the exact English string (the owner edits the right-hand side). Data
strings (project and activity paragraphs) are translated at render time in ProjectItem and
ActivityItem; APS105 writeups likewise on their page. Libre Baskerville has no Hangul, so
`Noto Serif KR` follows it in the stack; `html[lang=ko]` gets `word-break: keep-all`.

**The switch is the clock.** The sidebar's local time (`LocalTime`) was already a button that
flew a small plane between Toronto and Seoul; it now carries the language with it. Toronto
reads English, Seoul Korean, the language changes mid-flight when the plane lands, and the
city always matches the language the site is in. Its title and accessible name say what a
click does ("한국어로 보기" / "View in English"). There is no separate toggle button. The
command palette also has a "Switch language" action.

## Coverage

Korean: Home, Essays, Colophon, Education's sentences, the Projects and Extra-Curricular row
paragraphs, every story page's prose, captions and alt text (Incheon ASRS, Holy Bridge,
Gyroscope Wand, Pendulum, Campus Pulse, MONO, Greenstone Grind, UTKESA), the 3D viewers'
captions and the robot viewer's step notes, the APS105 intro and the ten labs' objective,
task and approach, the 404 line, and the PDF/carousel reader's messages.

English by choice: navigation, titles, subtitles ("last updated"), headings, bold lead-ins,
row titles and dates, course and document names, tab titles, the palette, viewer controls and
HUDs, the Tracker window, the Campus Pulse dashboard, the IDE, easter eggs and quotes.

## Verification

`src/i18n/i18n.test.tsx`: the provider's default, `?lang=ko`, persistence, fallback and
interpolation, and a completeness check that scans every `t()`/`tx()` literal in `src/` and
fails on any without a Korean line. Existing page tests still assert English (the default).
Browser: `/?lang=ko` renders Korean prose under English headings in the site's serif; the
toggle flips and remembers; a story page reads Korean under "The method".
