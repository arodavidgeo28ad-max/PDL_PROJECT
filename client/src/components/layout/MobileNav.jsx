import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './MobileNav.module.css';

const studentLinks = [
  { icon: 'dashboard', label: 'Home', to: '/' },
  { icon: 'analytics', label: 'Stats', to: '/analysis' },
  { icon: 'self_care', label: 'Wellness', to: '/wellness' },
  { icon: 'forum', label: 'Chat', to: '/messages' },
  { icon: 'person', label: 'Profile', to: '/profile' },
];

const mentorLinks = [
  { icon: 'dashboard', label: 'Home', to: '/' },
  { icon: 'calendar_today', label: 'Schedule', to: '/appointments' },
  { icon: 'forum', label: 'Chat', to: '/messages' },
  { icon: 'notifications', label: 'Alerts', to: '/notifications' },
  { icon: 'person', label: 'Profile', to: '/profile' },
];

export default function MobileNav() {
  const { user } = useAuth();
  const links = user?.role === 'mentor' ? mentorLinks : studentLinks;
  return (
    <nav className={styles.nav}>
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
          <span className="material-symbols-outlined">{l.icon}</span>
          <span className={styles.label}>{l.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
