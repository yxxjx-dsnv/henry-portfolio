import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Home } from './pages/Home';
import { Projects } from './pages/Projects';
import { Essays } from './pages/Essays';
import { ExtraCurricular } from './pages/ExtraCurricular';
import { Education } from './pages/Education';
import { useDarkMode } from './hooks/useDarkMode';

const HASH_ROUTES: Record<string, string> = {
  '#home': '/',
  '#projects': '/projects',
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
            <Route path="/projects" element={<Projects />} />
            <Route path="/essays" element={<Essays />} />
            <Route path="/extra-curricular" element={<ExtraCurricular />} />
            <Route path="/education" element={<Education />} />
          </Routes>
        </div>
      </div>
    </main>
  );
}
