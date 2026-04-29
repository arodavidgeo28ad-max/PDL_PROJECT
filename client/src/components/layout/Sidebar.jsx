import styles from './Sidebar.module.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const studentLinks = [
  { icon: 'dashboard', label: 'Dashboard', to: '/' },
  { icon: 'analytics', label: 'Analysis', to: '/analysis' },
  { icon: 'self_care', label: 'Wellness', to: '/wellness' },
  { icon: 'smart_toy', label: 'AI Chat', to: '/ai-chat' },
  { icon: 'calendar_today', label: 'Appointments', to: '/appointments' },
  { icon: 'forum', label: 'Messages', to: '/messages' },
  { icon: 'checklist', label: 'Study Tracker', to: '/tracker' },
  { icon: 'notifications', label: 'Notifications', to: '/notifications' },
  { icon: 'group', label: 'Directory', to: '/directory' },
];

const mentorLinks = [
  { icon: 'dashboard', label: 'Dashboard', to: '/' },
  { icon: 'calendar_today', label: 'Appointments', to: '/appointments' },
  { icon: 'forum', label: 'Messages', to: '/messages' },
  { icon: 'notifications', label: 'Notifications', to: '/notifications' },
  { icon: 'description', label: 'Referral Codes', to: '/referral' },
  { icon: 'group', label: 'Students', to: '/directory' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMentor = user?.role === 'mentor';
  const links = isMentor ? mentorLinks : studentLinks;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`${styles.sidebar} ${isMentor ? styles.mentorSidebar : styles.studentSidebar}`}>
      <div className={styles.brand}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h1 className={`${styles.brandName} font-headline`}>StressSync</h1>
          <span className={styles.roleBadge}>{isMentor ? 'Mentor' : 'Student'}</span>
        </div>
        <p className={styles.brandSub}>{isMentor ? 'Guiding Sanctuary' : 'Luminescent Sanctuary'}</p>
      </div>

      <nav className={styles.nav}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            <span className="material-symbols-outlined">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <NavLink to="/profile" className={styles.footerLink}>
          <span className="material-symbols-outlined">person</span>
          <span>Profile</span>
        </NavLink>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <span className="material-symbols-outlined">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
