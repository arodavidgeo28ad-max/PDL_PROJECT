import { useState, useEffect } from 'react';
import { notificationsAPI } from '../../api';
import styles from './Notifications.module.css';

const ICON_COLORS = { analysis: 'var(--primary)', appointment: 'var(--secondary)', message: 'var(--tertiary)', wellness: 'var(--secondary)', referral: 'var(--primary)', system: 'var(--outline)' };

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => notificationsAPI.list().then(r => { setNotifications(r.data.notifications); setUnread(r.data.unreadCount); }).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await notificationsAPI.markRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnread(u => Math.max(0, u - 1));
  };

  const markAll = async () => {
    await notificationsAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.overline}>Alert Center</span>
          <h1 className={`${styles.title} font-headline`}>Notifications {unread > 0 && <span className={styles.badge}>{unread}</span>}</h1>
        </div>
        {unread > 0 && <button className={styles.markAllBtn} onClick={markAll}>Mark all as read</button>}
      </div>

      {loading ? <div className={styles.loading}><div className={styles.spinner} /></div> : (
        <div className={styles.list}>
          {notifications.length === 0 ? (
            <div className={styles.empty}><span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: '0.5rem' }}>notifications_none</span><p>All caught up!</p></div>
          ) : notifications.map(n => (
            <div key={n._id} className={`${styles.item} ${!n.read ? styles.unread : ''}`} onClick={() => !n.read && markRead(n._id)}>
              <div className={styles.iconWrap} style={{ background: `${ICON_COLORS[n.type] || 'var(--primary)'}18` }}>
                <span className="material-symbols-outlined" style={{ color: ICON_COLORS[n.type] || 'var(--primary)', fontSize: 22 }}>{n.icon}</span>
              </div>
              <div className={styles.content}>
                <div className={styles.notifTitle}>{n.title}</div>
                <div className={styles.notifBody}>{n.body}</div>
                <div className={styles.notifTime}>{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              {!n.read && <div className={styles.dot} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
