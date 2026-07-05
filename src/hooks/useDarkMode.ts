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
    // the <html> class drives color-scheme, so Windows' classic scrollbars
    // (page + palette list) turn dark with the page — W2
    document.documentElement.classList.toggle('dark-mode', theme === 'dark');
  }, [theme]);

  // Until the visitor chooses manually, follow the OS if it changes live.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(STORAGE_KEY)) return; // user has chosen
      } catch {
        /* fall through */
      }
      setTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // Applies the body class synchronously so the change can be snapshotted
  // inside a View Transition (the circular dark-mode sweep).
  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('dark-mode', next === 'dark');
    document.documentElement.classList.toggle('dark-mode', next === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore storage failures */
    }
    setTheme(next);
  }, [theme]);

  return { theme, isDark: theme === 'dark', toggle };
}
