import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appointmentsAPI, referralsAPI, messagesAPI, notificationsAPI, directoryAPI } from '../../api';
import styles from './MentorDashboard.module.css';

const RISK_CONFIG = {
  high:     { label: 'High Risk',     color: '#ff6b81', bg: 'rgba(255,107,129,0.12)', icon: 'emergency' },
  moderate: { label: 'Moderate',      color: '#ffc107', bg: 'rgba(255,193,7,0.12)',   icon: 'warning' },
  low:      { label: 'Low Stress',    color: '#4fdbc8', bg: 'rgba(79,219,200,0.12)',  icon: 'check_circle' },
};

function StressGauge({ score }) {
  if (score == null) return <span style={{ color: 'var(--outline)', fontSize: '0.75rem' }}>No data</span>;
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? '#ff6b81' : pct >= 40 ? '#ffc107' : '#4fdbc8';
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Stress Score</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 800, color }}>{pct}/100</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function RiskBadge({ risk }) {
  if (!risk) return null;
  const cfg = RISK_CONFIG[risk] || { label: risk, color: 'var(--outline)', bg: 'rgba(255,255,255,0.06)', icon: 'help' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
      padding: '0.2rem 0.6rem', borderRadius: 99, background: cfg.bg, color: cfg.color
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

export default function MentorDashboard() {
  const { user } = useAuth();
  const [pendingAppts, setPendingAppts]     = useState([]);
  const [referrals, setReferrals]           = useState([]);
  const [contacts, setContacts]             = useState([]);
  const [unread, setUnread]                 = useState(0);
  const [studentStress, setStudentStress]   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [stressLoading, setStressLoading]   = useState(true);
  const [expandedStudent, setExpandedStudent] = useState(null);

  useEffect(() => {
    Promise.all([
      appointmentsAPI.list('requested').then(r => setPendingAppts(r.data.appointments)),
      referralsAPI.myReferrals().then(r => setReferrals(r.data.referrals)),
      messagesAPI.contacts().then(r => setContacts(r.data.contacts.slice(0, 5))),
      notificationsAPI.list().then(r => setUnread(r.data.unreadCount)),
    ]).catch(console.error).finally(() => setLoading(false));

    directoryAPI.studentsStress()
      .then(r => setStudentStress(r.data.students))
      .catch(console.error)
      .finally(() => setStressLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    await appointmentsAPI.updateStatus(id, status);
    setPendingAppts(prev => prev.filter(a => a._id !== id));
  };

  const kickoutStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to end this mentorship?')) return;
    try {
      await directoryAPI.kickout(studentId);
      setContacts(prev => prev.filter(c => c._id !== studentId));
      setStudentStress(prev => prev.filter(s => s._id !== studentId));
      referralsAPI.myReferrals().then(r => setReferrals(r.data.referrals));
    } catch (err) { alert(err.response?.data?.message || 'Kickout failed'); }
  };

  const activeReferrals = referrals.filter(r => r.isActive);
  const usedReferrals   = referrals.filter(r => !r.isActive).length;
  const highRiskCount   = studentStress.filter(s => s.burnoutRisk === 'high').length;

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
          { icon: 'pending_actions',   label: 'Pending Requests',  value: pendingAppts.length,  color: '#ffc107' },
          { icon: 'confirmation_number', label: 'Active Codes',    value: activeReferrals.length, color: 'var(--secondary)' },
          { icon: 'people',            label: 'Students Enrolled', value: usedReferrals,          color: 'var(--primary)' },
          { icon: 'notifications',     label: 'Unread Alerts',     value: unread,                 color: 'var(--tertiary)' },
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

      {/* ── STUDENT STRESS MONITOR ── */}
      <div className={styles.stressMonitorSection}>
        <div className={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#ff6b81', fontSize: 22 }}>monitor_heart</span>
            <h2 className="font-headline" style={{ fontWeight: 800, fontSize: '1.25rem' }}>
              Student Stress Monitor
            </h2>
            {highRiskCount > 0 && (
              <span className={styles.alertPill}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>emergency</span>
                {highRiskCount} High Risk
              </span>
            )}
          </div>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            Real-time overview of your students' stress levels, burnout risk, and contributing factors.
          </p>
        </div>

        {stressLoading ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : studentStress.length === 0 ? (
          <div className={styles.empty}>
            <span className="material-symbols-outlined" style={{ fontSize: 40 }}>group_off</span>
            <p>No students enrolled yet. Share a referral code to get started.</p>
          </div>
        ) : (
          <div className={styles.stressGrid}>
            {studentStress.map(s => {
              const riskCfg = RISK_CONFIG[s.burnoutRisk] || null;
              const isExpanded = expandedStudent === s._id;
              return (
                <div
                  key={s._id}
                  className={`${styles.stressCard} ${s.burnoutRisk === 'high' ? styles.stressCardHigh : s.burnoutRisk === 'moderate' ? styles.stressCardModerate : ''}`}
                  onClick={() => setExpandedStudent(isExpanded ? null : s._id)}
                >
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
                    <div className={styles.studentAvatar} style={{ background: riskCfg ? `${riskCfg.color}22` : 'rgba(192,193,255,0.12)', color: riskCfg?.color || 'var(--primary)' }}>
                      {s.firstName?.[0]}{s.lastName?.[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.firstName} {s.lastName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '0.1rem' }}>{s.email}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
                      <RiskBadge risk={s.burnoutRisk} />
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--outline)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                    </div>
                  </div>

                  {/* Stress gauge */}
                  <StressGauge score={s.stressScore} />

                  {/* Quick facts row */}
                  {(s.mood || s.anxietyLevel) && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                      {s.mood && (
                        <span className={styles.chip}>
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>sentiment_satisfied</span>
                          {s.mood}
                        </span>
                      )}
                      {s.anxietyLevel && (
                        <span className={styles.chip} style={{ background: s.anxietyLevel === 'high' ? 'rgba(255,107,129,0.12)' : undefined, color: s.anxietyLevel === 'high' ? '#ff6b81' : undefined }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>psychology</span>
                          Anxiety: {s.anxietyLevel}
                        </span>
                      )}
                      {s.lastCheckinAt && (
                        <span className={styles.chip} style={{ marginLeft: 'auto' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
                          {new Date(s.lastCheckinAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className={styles.expandedDetail} onClick={e => e.stopPropagation()}>
                      {/* Contributing Factors */}
                      {s.contributingFactors && s.contributingFactors.length > 0 && (
                        <div className={styles.detailBlock}>
                          <div className={styles.detailLabel}>
                            <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#ffc107' }}>warning</span>
                            Contributing Factors
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {s.contributingFactors.map((f, i) => (
                              <span key={i} className={styles.factorTag}>{f}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Changes / Reason */}
                      {s.recentChanges && (
                        <div className={styles.detailBlock}>
                          <div className={styles.detailLabel}>
                            <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--primary)' }}>change_circle</span>
                            Recent Changes Reported
                          </div>
                          <p className={styles.detailText}>"{s.recentChanges}"</p>
                        </div>
                      )}

                      {/* Notes */}
                      {s.notes && (
                        <div className={styles.detailBlock}>
                          <div className={styles.detailLabel}>
                            <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--secondary)' }}>note</span>
                            Check-in Notes
                          </div>
                          <p className={styles.detailText}>"{s.notes}"</p>
                        </div>
                      )}

                      {/* Predictive Trend */}
                      {s.predictiveTrend && (
                        <div className={styles.detailBlock}>
                          <div className={styles.detailLabel}>
                            <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--tertiary)' }}>trending_up</span>
                            Predictive Trend
                          </div>
                          <p className={styles.detailText}>{s.predictiveTrend}</p>
                        </div>
                      )}

                      {/* Lifestyle Metrics */}
                      {(s.sleepHours != null || s.studyHours != null || s.exerciseHours != null) && (
                        <div className={styles.detailBlock}>
                          <div className={styles.detailLabel}>
                            <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--outline)' }}>bar_chart</span>
                            Lifestyle Metrics
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                            {s.sleepHours != null && <div className={styles.metricPill}><span>😴</span> Sleep: <b>{s.sleepHours}h</b></div>}
                            {s.studyHours != null && <div className={styles.metricPill}><span>📚</span> Study: <b>{s.studyHours}h</b></div>}
                            {s.exerciseHours != null && <div className={styles.metricPill}><span>🏃</span> Exercise: <b>{s.exerciseHours}h</b></div>}
                          </div>
                        </div>
                      )}

                      {/* No data at all */}
                      {!s.stressScore && !s.recentChanges && !s.notes && s.contributingFactors.length === 0 && (
                        <p style={{ color: 'var(--outline)', fontSize: '0.8125rem', fontStyle: 'italic' }}>
                          This student hasn't submitted a wellness check-in yet.
                        </p>
                      )}

                      <button
                        className={styles.kickoutBtn}
                        onClick={() => kickoutStudent(s._id)}
                        style={{ marginTop: '0.75rem', width: 'auto', height: 'auto', padding: '0.35rem 0.875rem', fontSize: '0.75rem', fontWeight: 700, gap: '0.3rem', display: 'flex', alignItems: 'center' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>person_remove</span>
                        End Mentorship
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {contacts.map(c => (
                <div key={c._id} className={styles.contactCard}>
                  <div className={styles.contactAvatar}>{c.firstName?.[0] ?? '?'}{c.lastName?.[0] ?? ''}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.firstName} {c.lastName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '0.1rem' }}>{c.lastMessage || 'Start conversation'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className={styles.kickoutBtn} onClick={() => kickoutStudent(c._id)} title="Kickout student">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_remove</span>
                    </button>
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
