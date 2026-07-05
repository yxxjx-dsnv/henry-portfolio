import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { profile } from '../data/profile';
import { LocalTime } from './LocalTime';

const EMAIL = profile.social.email.replace(/^mailto:/, '');

const LOGO_LIGHT = '/Images/H Logo.svg';
const LOGO_DARK = '/Images/H Logo - White.svg';

type Props = {
  isDark: boolean;
  onToggleDark: (e: React.MouseEvent) => void;
  open: boolean;
  onClose: () => void;
};

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');

export function Sidebar({ isDark, onToggleDark, open, onClose }: Props) {
  const location = useLocation();
  const navRef = useRef<HTMLUListElement>(null);
  const [dotY, setDotY] = useState<number | null>(null);
  // The nav dot travels to whichever link is active — "you are here".
  useEffect(() => {
    const measure = () => {
      const a = navRef.current?.querySelector<HTMLElement>('a.active');
      setDotY(a ? a.offsetTop + a.offsetHeight / 2 - 3.5 : null);
    };
    measure();
    const t = setTimeout(measure, 350); // after webfont settles
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [location.pathname]);

  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const copyEmail = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!navigator.clipboard?.writeText) return; // fall through to mailto
    e.preventDefault();
    navigator.clipboard
      .writeText(EMAIL)
      .then(() => {
        setCopied(true);
        clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        window.location.href = profile.social.email;
      });
  };

  return (
    <nav className={`sidebar${open ? ' open' : ''}`}>
      <button type="button" className="close-btn" id="close-sidebar" aria-label="Close navigation" onClick={onClose}>
        ×
      </button>
      <button type="button" className="logo-button" aria-label="Toggle dark mode" onClick={onToggleDark}>
      <img
        src={isDark ? LOGO_DARK : LOGO_LIGHT}
        alt="Logo"
        id="logo-toggle"
        className="logo"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
          const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
          e.currentTarget.style.transform = `translate(${dx * 7}px, ${dy * 7}px)`;
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.transform = '';
        }}
      />
      </button>
      <p>Navigation</p>
      <br />
      <ul className="nav-list" ref={navRef}>
        <span
          className="nav-dot"
          aria-hidden="true"
          style={{ transform: `translateY(${dotY ?? 0}px)`, opacity: dotY === null ? 0 : 1 }}
        />
        <li>
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/projects" className={navClass}>
            Projects
          </NavLink>
        </li>
        <li>
          <NavLink to="/essays" className={navClass}>
            Essays
          </NavLink>
        </li>
        <li>
          <NavLink to="/extra-curricular" className={navClass}>
            Extra-Curricular
          </NavLink>
        </li>
        <li>
          <NavLink to="/education" className={navClass}>
            Education
          </NavLink>
        </li>
        <br />
      </ul>
      <p>Find me on</p>
      <br />
      <ul className="social-list">
        <li>
          <a href={profile.social.instagram} target="_blank" rel="noopener noreferrer">
            <i className="fa-brands fa-instagram" aria-hidden="true" />
            Instagram
          </a>
        </li>
        <li>
          <a href={profile.social.linkedin} target="_blank" rel="noopener noreferrer">
            <i className="fa-brands fa-linkedin-in" aria-hidden="true" />
            Linkedin
          </a>
        </li>
        <li>
          <a href={profile.social.github} target="_blank" rel="noopener noreferrer">
            <i className="fa-brands fa-github" aria-hidden="true" />
            GitHub
          </a>
        </li>
        <li>
          <a href={profile.social.email} onClick={copyEmail} title={EMAIL}>
            <i className="fa-regular fa-envelope" aria-hidden="true" />
            <span className="email-label" aria-live="polite">
              {copied ? 'Copied' : 'Email'}
            </span>
          </a>
        </li>
      </ul>
      <LocalTime />
      <p className="sidebar-colophon">
        <NavLink to="/colophon" className={navClass}>
          Colophon
        </NavLink>
      </p>
    </nav>
  );
}
