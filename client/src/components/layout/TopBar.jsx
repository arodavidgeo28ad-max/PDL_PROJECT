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
        <div className={styles.avatar}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </span>
        </div>
      </div>
    </header>
  );
}
