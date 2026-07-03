import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { CursorDot } from './components/CursorDot';
import { CommandPalette, type PaletteAction } from './components/CommandPalette';
import { profile } from './data/profile';
import { Home } from './pages/Home';
import { Projects } from './pages/Projects';
import { Essays } from './pages/Essays';
import { ExtraCurricular } from './pages/ExtraCurricular';
import { Education } from './pages/Education';
import { NotFound } from './pages/NotFound';
import { Colophon } from './pages/Colophon';
import { useDarkMode } from './hooks/useDarkMode';

const HASH_ROUTES: Record<string, string> = {
  '#home': '/',
  '#projects': '/projects',
  '#essays': '/essays',
  '#extra-curricular': '/extra-curricular',
  '#education': '/education',
};

const PAGE_TITLES: Record<string, string> = {
  '/': 'Henry Kim',
  '/projects': 'Projects — Henry Kim',
  '/essays': 'Essays — Henry Kim',
  '/extra-curricular': 'Extra-Curricular — Henry Kim',
  '/education': 'Education — Henry Kim',
  '/colophon': 'Colophon — Henry Kim',
};

// Invisible affordance: the five nav pages answer to the keys 1–5.
const KEY_ROUTES = ['/', '/projects', '/essays', '/extra-curricular', '/education'];

export default function App() {
  const { isDark, toggle } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Dark mode sweeps across the page as a circle growing from the click.
  // (View Transitions API; falls back to a plain toggle where unsupported.)
  const toggleDarkFrom = (e: React.MouseEvent) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduced) {
      toggle();
      return;
    }
    const x = e.clientX;
    const y = e.clientY;
    const vt = document.startViewTransition(() => flushSync(() => toggle()));
    vt.ready.then(() => {
      const r = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        {
          duration: 550,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    });
  };

  // One-time redirect from legacy #hash URLs to real routes.
  useEffect(() => {
    const target = HASH_ROUTES[window.location.hash];
    if (target && target !== location.pathname) {
      navigate(target, { replace: true });
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On every route change: return to the top (as the original site did) and
  // give the tab a page-specific title.
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    } catch {
      /* jsdom */
    }
    document.title = PAGE_TITLES[location.pathname] ?? 'Not Found — Henry Kim';
  }, [location.pathname]);

  // Number-key navigation (1–5). No hint on screen — documented on the colophon.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      const i = ['1', '2', '3', '4', '5'].indexOf(e.key);
      if (i >= 0) navigate(KEY_ROUTES[i]);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);

  const closeSidebar = () => setSidebarOpen(false);

  // ⌘K switchboard
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const paletteActions: PaletteAction[] = [
    { label: 'Home', hint: '1', run: () => navigate('/') },
    { label: 'Projects', hint: '2', run: () => navigate('/projects') },
    { label: 'Essays', hint: '3', run: () => navigate('/essays') },
    { label: 'Extra-Curricular', hint: '4', run: () => navigate('/extra-curricular') },
    { label: 'Education', hint: '5', run: () => navigate('/education') },
    { label: 'Colophon', run: () => navigate('/colophon') },
    { label: 'Toggle dark mode', run: () => toggle() },
    {
      label: 'Copy email address',
      run: () => navigator.clipboard?.writeText?.(profile.social.email.replace(/^mailto:/, '')),
    },
  ];



  return (
    <main>
      <CursorDot />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} actions={paletteActions} />
      <div
        id="side-tab"
        className={sidebarOpen ? 'hidden' : ''}
        onClick={() => setSidebarOpen(true)}
      >
        &#8250;
      </div>
      <div className="main-container" onClick={() => sidebarOpen && closeSidebar()}>
        <Sidebar isDark={isDark} onToggleDark={toggleDarkFrom} open={sidebarOpen} onClose={closeSidebar} />
        <div className="content-wrapper">
          <div className="route-fade" key={location.pathname}>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/essays" element={<Essays />} />
            <Route path="/extra-curricular" element={<ExtraCurricular />} />
            <Route path="/education" element={<Education />} />
            <Route path="/colophon" element={<Colophon />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </div>
    </main>
  );
}
