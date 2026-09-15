// The site in two languages. `t` returns the Korean for an English string when the reader
// has chosen Korean (and the English itself otherwise, so an untranslated line never breaks a
// page); `tx` does the same for a sentence with elements inside it, written as `{name}`
// placeholders. The Korean lives in src/i18n/ko/, one file per page, keyed by the exact
// English string — open the file, read the English on the left, edit the Korean on the right.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { KO } from './i18n/ko';

export type Lang = 'en' | 'ko';
type Parts = Record<string, ReactNode>;
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (en: string) => string; tx: (en: string, parts: Parts) => ReactNode };

export const translate = (lang: Lang, en: string): string => (lang === 'ko' ? (KO[en] ?? en) : en);

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

/** ?lang=ko on the link, then the reader's last choice, then the device's own language. */
export function initialLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  const q = new URLSearchParams(window.location.search).get('lang');
  if (q === 'ko' || q === 'en') return q;
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

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('lang', l);
    } catch {
      /* private mode */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const ctx = useMemo(() => makeCtx(lang, setLang), [lang, setLang]);
  return <LangContext.Provider value={ctx}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
