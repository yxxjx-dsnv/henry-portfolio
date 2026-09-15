import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { LangProvider, initialLang, interpolate, translate, useLang } from '../i18n';
import { KO } from './ko';

function Probe() {
  const { lang, setLang, t } = useLang();
  return (
    <button type="button" onClick={() => setLang(lang === 'en' ? 'ko' : 'en')}>
      {t('South Korea')}
    </button>
  );
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});

test('the reader starts in English, switches to Korean, and the choice is remembered', () => {
  render(
    <LangProvider>
      <Probe />
    </LangProvider>,
  );
  const b = screen.getByRole('button');
  expect(b).toHaveTextContent('South Korea');
  act(() => b.click());
  expect(b).toHaveTextContent(KO['South Korea']);
  expect(document.documentElement.lang).toBe('ko');
  expect(localStorage.getItem('lang')).toBe('ko');
});

test('?lang=ko on the link opens the Korean site', () => {
  window.history.replaceState({}, '', '/?lang=ko');
  expect(initialLang()).toBe('ko');
});

test("a first-time visitor gets the device's own language", () => {
  const device = (tag: string) => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue([tag]);
    vi.spyOn(navigator, 'language', 'get').mockReturnValue(tag);
  };
  device('ko-KR');
  expect(initialLang()).toBe('ko');
  device('en-CA');
  expect(initialLang()).toBe('en');
  // a choice already made outranks the device
  localStorage.setItem('lang', 'ko');
  expect(initialLang()).toBe('ko');
  vi.restoreAllMocks();
});

test('an untranslated line stays English; placeholders keep their elements', () => {
  expect(translate('ko', 'no such line')).toBe('no such line');
  const out = interpolate('Built with {link}.', { link: <a href="/x">React</a> }) as React.ReactNode[];
  expect(Array.isArray(out) && out.length).toBe(3);
});

// Every English string the source hands to t()/tx() has its Korean. The site itself would
// only show English for a missing one — this is what makes the Korean site complete.
function sources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name !== 'i18n') sources(p, out);
    } else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}
const unescape = (s: string) => s.replace(/\\(['"\\n])/g, (_, c) => (c === 'n' ? '\n' : c));

test('every t()/tx() string in the source has a Korean line', () => {
  const missing: string[] = [];
  const re = /\btx?\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g;
  for (const file of sources(join(__dirname, '..'))) {
    const text = readFileSync(file, 'utf8');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const key = unescape(m[1] ?? m[2]);
      if (!(key in KO)) missing.push(`${file.split('/src/')[1]}: ${key.slice(0, 80)}`);
    }
  }
  expect(missing).toEqual([]);
});
