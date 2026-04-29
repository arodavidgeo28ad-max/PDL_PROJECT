import styles from './TopBar.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <span className={`${styles.logo} font-headline gradient-text`}>StressSync</span>
      </div>
      <div className={styles.right}>
        <Link to="/notifications" className={styles.iconBtn}>
          <span className="material-symbols-outlined">notifications</span>
        </Link>
        <div className={styles.userProfile}>
          <div className={styles.roleBadge} style={{ background: user?.role === 'mentor' ? 'rgba(79, 219, 200, 0.15)' : 'rgba(192, 193, 255, 0.15)', color: user?.role === 'mentor' ? 'var(--secondary)' : 'var(--primary)' }}>
            {user?.role?.toUpperCase()}
          </div>
          <div className={styles.avatar}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
