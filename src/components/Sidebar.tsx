import { NavLink } from 'react-router-dom';
import { profile } from '../data/profile';

const LOGO_LIGHT = '/Images/H Logo.svg';
const LOGO_DARK = '/Images/H Logo - White.svg';

type Props = {
  isDark: boolean;
  onToggleDark: () => void;
  open: boolean;
  onClose: () => void;
};

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');

export function Sidebar({ isDark, onToggleDark, open, onClose }: Props) {
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
      <ul>
        <li>
          <a href={profile.social.instagram} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </li>
        <li>
          <a href={profile.social.linkedin} target="_blank" rel="noopener noreferrer">
            Linkedin
          </a>
        </li>
        <li>
          <a href={profile.social.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </li>
        <li>
          <a href={profile.social.email}>Email</a>
        </li>
      </ul>
    </nav>
  );
}
