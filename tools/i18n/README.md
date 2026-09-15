# Korean-gap sweep

`src/i18n/i18n.test.tsx` only scans literal `t('…')` calls, so strings that reach `t()` from
arrays (carousel captions, alt text, data-file paragraphs) can miss Korean without failing it.
To sweep at render time: copy `ko-gap.test.tsx.txt` to `src/pages/_ko_gap.test.tsx` and
`pages-index.ts.txt` to `src/pages/index_all.ts`, run
`KO_GAP_OUT=/tmp/ko-gap.txt npx vitest run src/pages/_ko_gap.test.tsx`, read the file, delete
the two copies. What remains should be chrome only (row titles, dates, shelf labels, subtitles).
