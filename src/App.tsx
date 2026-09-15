import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { CursorDot } from './components/CursorDot';
import { CommandPalette, type PaletteAction } from './components/CommandPalette';
import { ArcadeOverlay } from './components/ArcadeOverlay';
import { profile } from './data/profile';
import { Home } from './pages/Home';
import { Projects } from './pages/Projects';
import { CampusPulse } from './pages/CampusPulse';
import { Mono } from './pages/Mono';
import { GyroscopeWand } from './pages/GyroscopeWand';
import { HolyBridge } from './pages/HolyBridge';
import { Pendulum } from './pages/Pendulum';
import { Aps105Labs } from './pages/Aps105Labs';
import { IncheonRobotics } from './pages/IncheonRobotics';
import { GreenstoneGrind } from './pages/GreenstoneGrind';
import { Utkesa } from './pages/Utkesa';
import { Essays } from './pages/Essays';
import { ExtraCurricular } from './pages/ExtraCurricular';
import { Education } from './pages/Education';
import { NotFound } from './pages/NotFound';
import { Colophon } from './pages/Colophon';
import { useDarkMode } from './hooks/useDarkMode';
import { useLang } from './i18n';

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
  '/projects/incheon-robotics': 'Incheon ASRS — Henry Kim',
  '/extra-curricular/incheon-robotics': 'Incheon ASRS — Henry Kim',
  '/projects/campus-pulse': 'Campus Pulse — Henry Kim',
  '/projects/mono': 'MONO — Henry Kim',
  '/projects/gyroscope-wand': 'Gyroscope Wand — Henry Kim',
  '/projects/civ102-bridge': 'The Holy Bridge — Henry Kim',
  '/projects/pendulum': 'Simple Pendulum — Henry Kim',
  '/essays': 'Essays — Henry Kim',
  '/extra-curricular': 'Extra-Curricular — Henry Kim',
  '/extra-curricular/greenstone-grind': 'The Greenstone Grind — Henry Kim',
  '/extra-curricular/utkesa': 'UTKESA — Henry Kim',
  '/education': 'Education — Henry Kim',
  '/colophon': 'Colophon — Henry Kim',
};

// Invisible affordance: the five nav pages answer to the keys 1–5.
const KEY_ROUTES = ['/', '/projects', '/essays', '/extra-curricular', '/education'];

export default function App() {
  const { isDark, toggle } = useDarkMode();
  const { lang, setLang } = useLang();
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
    document.documentElement.classList.add('theme-sweep');
    const vt = document.startViewTransition(() => flushSync(() => toggle()));
    vt.finished.finally(() => document.documentElement.classList.remove('theme-sweep'));
    vt.ready.then(() => {
      const r = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      try {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        {
          duration: 550,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
      } catch {
        /* engines without pseudo-element animation: instant swap */
      }
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

  // …and the same for in-session hash-only navigation (BUG-6).
  useEffect(() => {
    const onHash = () => {
      const target = HASH_ROUTES[window.location.hash];
      if (target) navigate(target, { replace: true });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [navigate]);

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
  // A hidden birthday code (0627) takes priority: while its digits are being
  // typed in order, the single-key nav yields, so the "2" in 06-2-7 doesn't jump
  // to Projects. Completing it blooms "HBD HENRY" in the home dot field.
  useEffect(() => {
    const CODE = '0627';
    let progress = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      // a live egg (piano) or a full-screen game owns the number keys — don't navigate
      if (
        document.body.classList.contains('egg-playing') ||
        document.body.classList.contains('arcade-open')
      )
        return;
      if (e.key < '0' || e.key > '9') return;
      if (e.key === CODE[progress]) {
        progress += 1;
        if (progress === CODE.length) {
          progress = 0;
          window.dispatchEvent(new CustomEvent('henry:hbd'));
        }
        return; // this digit advanced the code — do not navigate
      }
      progress = e.key === CODE[0] ? 1 : 0;
      const i = ['1', '2', '3', '4', '5'].indexOf(e.key);
      if (i >= 0) navigate(KEY_ROUTES[i]);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);

  // typed word codes for the dot-field eggs (like the birthday code)
  useEffect(() => {
    const WORDS: Record<string, string> = {
      cat: 'henry:cat',
      piano: 'henry:piano',
      snake: 'henry:snake',
      life: 'henry:life',
      band: 'henry:band',
      tetris: 'henry:tetris',
      strikers: 'henry:shmup',
    };
    let buf = '';
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      if (document.body.classList.contains('arcade-open')) return; // a game owns the keys
      const k = e.key.toLowerCase();
      if (k.length !== 1 || k < 'a' || k > 'z') return;
      buf = (buf + k).slice(-8);
      for (const w of Object.keys(WORDS)) {
        if (buf.endsWith(w)) {
          buf = '';
          navigate('/');
          window.setTimeout(() => window.dispatchEvent(new CustomEvent(WORDS[w])), 200);
          break;
        }
      }
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
        return;
      }
      const t = e.target as HTMLElement;
      const typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // egg actions live on the home dot field, so send the visitor there first
  const fireEgg = (event: string) => {
    navigate('/');
    window.setTimeout(() => window.dispatchEvent(new CustomEvent(event)), 200);
  };

  const paletteActions: PaletteAction[] = [
    { label: 'Home', hint: '1', run: () => navigate('/') },
    { label: 'Projects', hint: '2', run: () => navigate('/projects') },
    { label: 'Essays', hint: '3', run: () => navigate('/essays') },
    { label: 'Extra-Curricular', hint: '4', run: () => navigate('/extra-curricular') },
    { label: 'Education', hint: '5', run: () => navigate('/education') },
    { label: 'Colophon', run: () => navigate('/colophon') },
    { label: 'Switch language', hint: lang === 'en' ? '한국어' : 'English', run: () => setLang(lang === 'en' ? 'ko' : 'en') },
    { label: 'Incheon ASRS — the story', run: () => navigate('/projects/incheon-robotics') },
    { label: 'Campus Pulse — the story', run: () => navigate('/projects/campus-pulse') },
    { label: 'MONO — the story', run: () => navigate('/projects/mono') },
    { label: 'Gyroscope Wand — the story', run: () => navigate('/projects/gyroscope-wand') },
    { label: 'The Holy Bridge — the story', run: () => navigate('/projects/civ102-bridge') },
    { label: 'Simple Pendulum — the story', run: () => navigate('/projects/pendulum') },
    { label: 'The Greenstone Grind — the story', run: () => navigate('/extra-curricular/greenstone-grind') },
    { label: 'UTKESA & the Gallery of Korea', run: () => navigate('/extra-curricular/utkesa') },
    { label: 'Toggle dark mode', run: () => toggle() },
    {
      label: 'Copy email address',
      run: () => navigator.clipboard?.writeText?.(profile.social.email.replace(/^mailto:/, '')),
    },
    { label: 'Copy link to this page', run: () => navigator.clipboard?.writeText?.(window.location.href) },
    { label: 'Print this page', run: () => window.print() },
    // hidden until you search "easter egg" — then click to set one off
    {
      label: 'Easter egg — the Seoul skyline in the dot field',
      secret: true,
      keywords: 'easter egg eggs secret korea seoul skyline city 서울 스카이라인 south korea',
      run: () => fireEgg('henry:seoul'),
    },
    {
      label: 'Easter egg — HBD Henry in the dot field',
      secret: true,
      keywords: 'easter egg eggs secret birthday hbd 0627',
      run: () => fireEgg('henry:hbd'),
    },
    {
      label: "Easter egg — Conway's Game of Life",
      secret: true,
      keywords: 'easter egg eggs secret life conway cells generative',
      run: () => fireEgg('henry:life'),
    },
    {
      label: 'Easter egg — Snake (arrow keys or WASD)',
      secret: true,
      keywords: 'easter egg eggs secret snake game play arcade',
      run: () => fireEgg('henry:snake'),
    },
    {
      label: 'Easter egg — a cat that follows your cursor',
      secret: true,
      keywords: 'easter egg eggs secret cat kitten follow cursor 고양이',
      run: () => fireEgg('henry:cat'),
    },
    {
      label: 'Easter egg — Piano (click the field to play)',
      secret: true,
      keywords: 'easter egg eggs secret piano music keys sound play 피아노',
      run: () => fireEgg('henry:piano'),
    },
    {
      label: 'Easter egg — a band plays in the dot field',
      secret: true,
      keywords: 'easter egg eggs secret band music musicians play concert 밴드',
      run: () => fireEgg('henry:band'),
    },
    {
      label: 'Easter egg — Tetris (full screen)',
      secret: true,
      keywords: 'easter egg eggs secret tetris game arcade play 테트리스',
      run: () => fireEgg('henry:tetris'),
    },
    {
      label: 'Easter egg — Strikers 1943 shooter (full screen)',
      secret: true,
      keywords: 'easter egg eggs secret strikers 1943 shooter shmup plane arcade game 슈팅',
      run: () => fireEgg('henry:shmup'),
    },
  ];



  return (
    <main>
      <CursorDot />
      <ArcadeOverlay />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} actions={paletteActions} />
      <button
        type="button"
        id="side-tab"
        aria-label="Open navigation"
        className={sidebarOpen ? 'hidden' : ''}
        onClick={() => setSidebarOpen(true)}
      >
        &#8250;
      </button>
      <div className="main-container" onClick={() => sidebarOpen && closeSidebar()}>
        <Sidebar isDark={isDark} onToggleDark={toggleDarkFrom} open={sidebarOpen} onClose={closeSidebar} />
        <div className="content-wrapper">
          <div className="route-fade" key={location.pathname}>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            {/* The Incheon ASRS story is reachable from both timelines it belongs to. */}
            <Route path="/projects/incheon-robotics" element={<IncheonRobotics />} />
            <Route path="/extra-curricular/incheon-robotics" element={<IncheonRobotics />} />
            <Route path="/projects/campus-pulse" element={<CampusPulse />} />
            <Route path="/projects/mono" element={<Mono />} />
            <Route path="/projects/gyroscope-wand" element={<GyroscopeWand />} />
            <Route path="/projects/civ102-bridge" element={<HolyBridge />} />
            <Route path="/projects/pendulum" element={<Pendulum />} />
            <Route path="/projects/aps105-labs" element={<Aps105Labs />} />
            <Route path="/essays" element={<Essays />} />
            <Route path="/extra-curricular" element={<ExtraCurricular />} />
            <Route path="/extra-curricular/greenstone-grind" element={<GreenstoneGrind />} />
            <Route path="/extra-curricular/utkesa" element={<Utkesa />} />
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
