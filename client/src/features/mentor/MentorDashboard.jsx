import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appointmentsAPI, referralsAPI, messagesAPI, notificationsAPI } from '../../api';
import styles from './MentorDashboard.module.css';

export default function MentorDashboard() {
  const { user } = useAuth();
  const [pendingAppts, setPendingAppts] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      appointmentsAPI.list('requested').then(r => setPendingAppts(r.data.appointments)),
      referralsAPI.myReferrals().then(r => setReferrals(r.data.referrals)),
      messagesAPI.contacts().then(r => setContacts(r.data.contacts.slice(0, 5))),
      notificationsAPI.list().then(r => setUnread(r.data.unreadCount)),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    const { appointmentsAPI: api } = await import('../../api');
    await api.updateStatus(id, status);
    setPendingAppts(prev => prev.filter(a => a._id !== id));
  };

  const activeReferrals = referrals.filter(r => r.isActive);
  const usedReferrals = referrals.filter(r => !r.isActive).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.overline}>Mentor Portal</span>
          <h1 className={`${styles.greeting} font-headline`}>Welcome back, {user?.firstName}.</h1>
          <p className={styles.subtitle}>Luminescent Sanctuary — Mentor Dashboard</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        {[
          { icon: 'pending_actions', label: 'Pending Requests', value: pendingAppts.length, color: '#ffc107' },
          { icon: 'confirmation_number', label: 'Active Codes', value: activeReferrals.length, color: 'var(--secondary)' },
          { icon: 'people', label: 'Students Enrolled', value: usedReferrals, color: 'var(--primary)' },
          { icon: 'notifications', label: 'Unread Alerts', value: unread, color: 'var(--tertiary)' },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: `${s.color}18` }}>
              <span className="material-symbols-outlined" style={{ color: s.color }}>{s.icon}</span>
            </div>
            <span className={`${styles.statNum} font-headline`}>{loading ? '...' : s.value}</span>
            <span className={styles.statLbl}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {/* Pending Appointment Requests */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className="font-headline" style={{ fontWeight: 700, fontSize: '1.125rem' }}>
              Appointment Requests
              {pendingAppts.length > 0 && <span className={styles.badge}>{pendingAppts.length}</span>}
            </h3>
          </div>
          {loading ? <div className={styles.loading}><div className={styles.spinner} /></div> : pendingAppts.length === 0 ? (
            <div className={styles.empty}><span className="material-symbols-outlined" style={{ fontSize: 36 }}>check_circle</span><p>No pending requests</p></div>
          ) : pendingAppts.map(appt => (
            <div key={appt._id} className={styles.apptCard}>
              <div className={styles.apptAvatar}>{appt.studentId?.firstName?.[0]}{appt.studentId?.lastName?.[0]}</div>
              <div className={styles.apptInfo}>
                <div style={{ fontWeight: 700 }}>{appt.studentId?.firstName} {appt.studentId?.lastName}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                  {new Date(appt.dateTime).toLocaleString()}
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: 9999, background: appt.urgency === 'urgent' ? 'rgba(255,178,183,0.15)' : 'rgba(79,219,200,0.15)', color: appt.urgency === 'urgent' ? 'var(--tertiary)' : 'var(--secondary)', display: 'inline-block', marginTop: '0.25rem' }}>{appt.urgency}</span>
                <div style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', marginTop: '0.5rem', fontStyle: 'italic' }}>"{appt.reason}"</div>
              </div>
              <div className={styles.apptActions}>
                <button className={styles.acceptBtn} onClick={() => updateStatus(appt._id, 'accepted')}>Accept</button>
                <button className={styles.declineBtn} onClick={() => updateStatus(appt._id, 'declined')}>Decline</button>
              </div>
            </div>
          ))}
        </div>

        {/* Referral Codes */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className="font-headline" style={{ fontWeight: 700, fontSize: '1.125rem' }}>My Referral Codes</h3>
          </div>
          {loading ? <div className={styles.loading}><div className={styles.spinner} /></div> : referrals.slice(0, 5).map(r => (
            <div key={r._id} className={styles.codeItem}>
              <span className={`${styles.code} font-headline`}>{r.code}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: r.isActive ? 'var(--secondary)' : 'var(--outline)' }}>
                {r.isActive ? '● Active' : '● Used'}
              </span>
              <button onClick={() => { navigator.clipboard.writeText(r.code); }} style={{ background: 'transparent', border: 'none', color: 'var(--outline)', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_copy</span>
              </button>
            </div>
          ))}
          {referrals.length === 0 && !loading && <p style={{ color: 'var(--outline)', fontSize: '0.875rem' }}>No referral codes yet. Go to Referral Center to generate some.</p>}
        </div>

        {/* Recent Messages */}
        <div className={styles.section} style={{ gridColumn: 'span 2' }}>
          <div className={styles.sectionHeader}>
            <h3 className="font-headline" style={{ fontWeight: 700, fontSize: '1.125rem' }}>Recent Conversations</h3>
          </div>
          {loading ? <div className={styles.loading}><div className={styles.spinner} /></div> : contacts.length === 0 ? (
            <div className={styles.empty}><span className="material-symbols-outlined" style={{ fontSize: 36 }}>forum</span><p>No conversations yet</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {contacts.map(c => (
                <div key={c._id} className={styles.contactCard}>
                  <div className={styles.contactAvatar}>{c.firstName[0]}{c.lastName[0]}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.firstName} {c.lastName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '0.1rem' }}>{c.lastMessage || 'Start conversation'}</div>
                  </div>
                  {c.unreadCount > 0 && <span className={styles.unreadBadge}>{c.unreadCount}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
