import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
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
      <div className="close-btn" id="close-sidebar" onClick={onClose}>
        ×
      </div>
      <img
        src={isDark ? LOGO_DARK : LOGO_LIGHT}
        alt="Logo"
        id="logo-toggle"
        className="logo"
        onClick={onToggleDark}
      />
      <p>Navigation</p>
      <br />
      <ul>
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
