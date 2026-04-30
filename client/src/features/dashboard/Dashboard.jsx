import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, analysisAPI, wellnessAPI } from '../../api';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState('');

  useEffect(() => {
    if (user?.role === 'mentor') {
      window.location.href = '/';
      return;
    }
    dashboardAPI.get().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setAnalyzeMsg('');
    try {
      await analysisAPI.analyze();
      const r = await dashboardAPI.get();
      setData(r.data);
      setAnalyzeMsg('✅ Analysis complete!');
    } catch (err) {
      setAnalyzeMsg(err.response?.data?.message || 'Submit wellness data first.');
    }
    setAnalyzing(false);
  };

  const getBurnoutColor = (risk) => risk === 'low' ? 'var(--secondary)' : risk === 'moderate' ? '#ffc107' : 'var(--tertiary)';
  const getStressDash = (score) => {
    const total = 282.7;
    return total - (score / 100) * total;
  };

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <span className={styles.overline}>Overview</span>
          <h1 className={`${styles.greeting} font-headline`}>Morning, {user?.firstName}.</h1>
          <p className={styles.subtitle}>Your equilibrium is shifting toward focus. Let's optimize your study window today.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.analyzeBtn} onClick={runAnalysis} disabled={analyzing}>
            <span className="material-symbols-outlined">{analyzing ? 'hourglass_empty' : 'auto_awesome'}</span>
            {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
          </button>
          {analyzeMsg && <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{analyzeMsg}</span>}
        </div>
      </div>

      {/* Bento Grid */}
      <div className={styles.grid}>
        {/* Stress Score Ring */}
        <div className={`${styles.card} ${styles.stressCard}`}>
          <div className={styles.ambientGlow} />
          <h3 className={`${styles.cardTitle} font-headline`}>Current Stress Level</h3>
          <div className={styles.ringWrap}>
            <svg className={styles.ring} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="transparent" stroke="var(--surface-container-highest)" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="45" fill="transparent"
                stroke={data?.stressScore != null ? getBurnoutColor(data?.burnoutRisk) : 'var(--primary)'}
                strokeWidth="8"
                strokeDasharray="282.7"
                strokeDashoffset={data?.stressScore != null ? getStressDash(data.stressScore) : 200}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 12px rgba(192,193,255,0.4))', transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className={styles.ringInner}>
              <span className={`${styles.scoreNum} font-headline`}>{data?.stressScore ?? '--'}</span>
              <span className={styles.scoreLabel}>{data?.burnoutRisk ?? 'No data'}</span>
            </div>
          </div>
          <p className={styles.scoreHint}>
            {data?.latestReport?.predictiveTrend || 'Submit a wellness check-in to get your stress score.'}
          </p>
        </div>

        {/* Weekly Trend */}
        <div className={`${styles.card} ${styles.trendCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={`${styles.cardTitle} font-headline`}>Weekly Resilience Trend</h3>
            <span className={styles.badge7d}>7 Days</span>
          </div>
          <div className={styles.chartWrap}>
            {data?.wellnessHistory?.length > 0 ? (
              <svg className={styles.chart} preserveAspectRatio="none" viewBox="0 0 400 120">
                <defs>
                  <linearGradient id="chartGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#c0c1ff" />
                    <stop offset="50%" stopColor="#ffb2b7" />
                    <stop offset="100%" stopColor="#4fdbc8" />
                  </linearGradient>
                </defs>
                <polyline
                  fill="none"
                  stroke="url(#chartGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={data.wellnessHistory.map((d, i) => {
                    const x = (i / (data.wellnessHistory.length - 1 || 1)) * 380 + 10;
                    const y = 100 - ((d.stressScore || 50) / 100) * 90;
                    return `${x},${y}`;
                  }).join(' ')}
                />
              </svg>
            ) : (
              <div className={styles.noData}>No trend data yet. Submit wellness check-ins daily.</div>
            )}
            <div className={styles.chartDays}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className={`${styles.card} ${styles.statsCard}`}>
          <div className={styles.statItem}>
            <div className={styles.statIcon} style={{ background: 'rgba(192, 193, 255, 0.15)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>bedtime</span>
            </div>
            <div>
              <span className={styles.statLabel}>Deep Sleep</span>
              <h4 className={`${styles.statValue} font-headline`}>{data?.latestWellness?.sleepHours ?? '--'}h</h4>
              <p className={styles.statHint}>Target: 8h</p>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon} style={{ background: 'rgba(255, 178, 183, 0.15)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)' }}>smartphone</span>
            </div>
            <div>
              <span className={styles.statLabel}>Screen Time</span>
              <h4 className={`${styles.statValue} font-headline`}>{data?.latestWellness?.screenTime ?? '--'}h</h4>
              <p className={styles.statHint}>Target: ≤6h</p>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon} style={{ background: 'rgba(79, 219, 200, 0.15)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary)' }}>fitness_center</span>
            </div>
            <div>
              <span className={styles.statLabel}>Exercise</span>
              <h4 className={`${styles.statValue} font-headline`}>{data?.latestWellness?.exerciseHours ?? '--'}h</h4>
              <p className={styles.statHint}>Target: 1h</p>
            </div>
          </div>
        </div>

        {/* Task Progress */}
        <div className={`${styles.card} ${styles.taskCard}`}>
          <h3 className={`${styles.cardTitle} font-headline`}>Study Progress</h3>
          <div className={styles.taskStats}>
            <div className={styles.taskStat}>
              <span className={`${styles.taskNum} font-headline`}>{data?.tasks?.completed || 0}</span>
              <span className={styles.taskLbl}>Completed</span>
            </div>
            <div className={styles.taskStat}>
              <span className={`${styles.taskNum} font-headline`} style={{ color: 'var(--tertiary)' }}>{data?.tasks?.inProgress || 0}</span>
              <span className={styles.taskLbl}>In Progress</span>
            </div>
            <div className={styles.taskStat}>
              <span className={`${styles.taskNum} font-headline`}>{data?.tasks?.total || 0}</span>
              <span className={styles.taskLbl}>Total Tasks</span>
            </div>
          </div>
          <div className={styles.taskBar}>
            <div className={styles.taskBarFill} style={{ width: data?.tasks?.total ? `${(data.tasks.completed / data.tasks.total) * 100}%` : '0%' }} />
          </div>
          <Link to="/tracker" className={styles.taskLink}>View All Tasks <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span></Link>
        </div>

        {/* AI Insight */}
        <div className={`${styles.card} ${styles.aiCard}`}>
          <div className={styles.aiAvatar}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 36 }}>smart_toy</span>
          </div>
          <div className={styles.aiContent}>
            <div className={styles.aiLabel}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>auto_awesome</span> AI Wellness Insight</div>
            <h4 className={`${styles.aiInsight} font-headline`}>
              {data?.latestReport?.predictiveTrend || '"Submit your wellness data to receive personalized AI insights."'}
            </h4>
            {data?.latestReport?.recommendations?.[0] && (
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                💡 {data.latestReport.recommendations[0].title}: {data.latestReport.recommendations[0].description?.substring(0, 100)}...
              </p>
            )}
          </div>
          <Link to="/analysis" className={`btn-secondary`} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', textDecoration: 'none' }}>
            View Analysis <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className={`${styles.card} ${styles.actionsCard}`}>
          <h3 className={`${styles.cardTitle} font-headline`} style={{ marginBottom: '1rem' }}>Quick Actions</h3>
          <div className={styles.actionGrid}>
            {[
              { icon: 'self_care', label: 'Wellness Hub', to: '/wellness', color: 'var(--secondary)' },
              { icon: 'calendar_today', label: 'Book Mentor', to: '/appointments', color: 'var(--primary)' },
              { icon: 'forum', label: 'Messages', to: '/messages', color: 'var(--tertiary)' },
              { icon: 'checklist', label: 'Add Task', to: '/tracker', color: 'var(--primary)' },
            ].map(a => (
              <Link key={a.to} to={a.to} className={styles.actionItem}>
                <span className="material-symbols-outlined" style={{ color: a.color }}>{a.icon}</span>
                <span>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
