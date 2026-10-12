// The site in two languages. `t` returns the Korean for an English string when the reader
// has chosen Korean (and the English itself otherwise, so an untranslated line never breaks a
// page); `tx` does the same for a sentence with elements inside it, written as `{name}`
// placeholders. The Korean lives in src/i18n/ko/, one file per page, keyed by the exact
// English string — open the file, read the English on the left, edit the Korean on the right.
// The Korean is its own chunk, fetched only by a reader who reads Korean.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'ko';
type Parts = Record<string, ReactNode>;
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (en: string) => string; tx: (en: string, parts: Parts) => ReactNode };

let KO: Record<string, string> | null = null;
let loading: Promise<Record<string, string>> | null = null;
/** Fetch the Korean (once). */
export const loadKO = () => (loading ??= import('./i18n/ko').then((m) => (KO = m.KO)));

export const translate = (lang: Lang, en: string): string => (lang === 'ko' ? (KO?.[en] ?? en) : en);

/** Interleave `{name}` placeholders with their elements. */
export function interpolate(text: string, parts: Parts): ReactNode {
  const out: ReactNode[] = [];
  const re = /\{(\w+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<span key={`${m.index}`}>{parts[m[1]] ?? m[0]}</span>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length === 1 ? out[0] : out;
}

const makeCtx = (lang: Lang, setLang: (l: Lang) => void): Ctx => ({
  lang,
  setLang,
  t: (en) => translate(lang, en),
  tx: (en, parts) => interpolate(translate(lang, en), parts),
});

const LangContext = createContext<Ctx>(makeCtx('en', () => {}));

/** ?lang=ko on the link, then the reader's last choice, then the device's own language. A link's
 *  language counts as a choice: it is remembered, and taken off the address, so a later reload
 *  or a shared address follows the reader's own choice rather than the link's. */
export function initialLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  const url = new URL(window.location.href);
  const q = url.searchParams.get('lang');
  if (q === 'ko' || q === 'en') {
    try {
      localStorage.setItem('lang', q);
    } catch {
      /* private mode */
    }
    url.searchParams.delete('lang');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    return q;
  }
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'ko' || saved === 'en') return saved;
  } catch {
    /* private mode */
  }
  // the device's first preferred language decides for a first-time visitor
  const device = navigator.languages?.[0] || navigator.language || '';
  return device.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}

// read before the router mounts (main.tsx imports this first), so the address it starts from
// is already clean
const FIRST = initialLang();
if (FIRST === 'ko') void loadKO();

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (typeof window === 'undefined' ? FIRST : initialLang()));
  const [, setLoaded] = useState(KO !== null);
  // Korean is shown once its words are here: a switch waits the moment it takes to fetch them,
  // and a Korean first visit draws nothing until then (never a flash of English)
  const setLang = useCallback((l: Lang) => {
    try {
      localStorage.setItem('lang', l);
    } catch {
      /* private mode */
    }
    if (l === 'ko' && !KO) void loadKO().then(() => setLangState('ko'));
    else setLangState(l);
  }, []);
  useEffect(() => {
    if (lang === 'ko' && !KO) void loadKO().then(() => setLoaded(true));
  }, [lang]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const ctx = useMemo(() => makeCtx(lang, setLang), [lang, setLang]);
  if (lang === 'ko' && !KO) return null;
  return <LangContext.Provider value={ctx}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
