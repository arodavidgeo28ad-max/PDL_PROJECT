import { useState, useEffect } from 'react';
import { analysisAPI } from '../../api';
import styles from './AIAnalysis.module.css';

const getRiskColor = (risk) => risk === 'low' ? 'var(--secondary)' : risk === 'moderate' ? '#ffc107' : 'var(--tertiary)';

export default function AIAnalysis() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    analysisAPI.latest().then(r => setReport(r.data.report)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const r = await analysisAPI.analyze();
      setReport(r.data.report);
    } catch (err) {
      alert(err.response?.data?.message || 'No wellness data found. Submit a check-in first.');
    }
    setAnalyzing(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.overline}>Intelligent Diagnostics</span>
        <h1 className={`${styles.title} font-headline`}>Stress Analysis & Prediction</h1>
        <p className={styles.subtitle}>Our AI evaluates your biometric and behavioral data to forecast burnout risks and pinpoint stressors.</p>
      </div>

      <div className={styles.grid}>
        {/* Burnout Risk */}
        <div className={`${styles.card} ${styles.burnoutCard}`}>
          <div className={styles.burnoutGlow} style={{ background: report ? getRiskColor(report.burnoutRisk) + '1a' : 'rgba(255,178,183,0.1)' }} />
          <div className={styles.burnoutContent}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--outline)', marginBottom: '0.5rem' }}>Burnout Risk Prediction</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
              <span className={`${styles.burnoutPct} font-headline`} style={{ color: report ? getRiskColor(report.burnoutRisk) : 'var(--outline)' }}>
                {report ? `${report.burnoutPercentage}%` : '--'}
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 600, color: report ? getRiskColor(report.burnoutRisk) : 'var(--outline)' }}>
                {report ? (report.burnoutRisk.charAt(0).toUpperCase() + report.burnoutRisk.slice(1)) + ' Risk' : 'No Data'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '5rem', marginTop: '1rem' }}>
              {report ? [30, 45, 25, report.burnoutPercentage, 35].map((h, i) => (
                <div key={i} style={{ flex: 1, background: i === 3 ? getRiskColor(report.burnoutRisk) : 'var(--surface-container-high)', borderRadius: '0.25rem 0.25rem 0 0', height: `${h}%`, transition: 'height 0.8s ease', boxShadow: i === 3 ? `0 0 20px ${getRiskColor(report.burnoutRisk)}40` : 'none' }} />
              )) : [40, 55, 30, 70, 45].map((h, i) => (
                <div key={i} style={{ flex: 1, background: 'var(--surface-container-high)', borderRadius: '0.25rem 0.25rem 0 0', height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Biometric Inputs Panel */}
        <div className={`${styles.card} ${styles.inputsCard}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="font-headline" style={{ fontSize: '1.125rem', fontWeight: 700 }}>Biometric Inputs</h2>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>tune</span>
          </div>
          {report?.wellnessDataId ? [
            { label: 'Sleep Hours', value: report.wellnessDataId.sleepHours, max: 12, color: 'var(--primary)', unit: 'h' },
            { label: 'Screen Time', value: report.wellnessDataId.screenTime, max: 18, color: 'var(--tertiary)', unit: 'h' },
            { label: 'Exercise', value: report.wellnessDataId.exerciseHours, max: 5, color: 'var(--secondary)', unit: 'h' },
            { label: 'Study/Work', value: report.wellnessDataId.studyHours, max: 16, color: 'var(--tertiary)', unit: 'h' },
            { label: 'Social Score', value: report.wellnessDataId.socialScore, max: 10, color: 'var(--secondary)', unit: '/10' },
          ].map(item => (
            <div key={item.label} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--on-surface-variant)' }}>{item.label}</span>
                <strong style={{ color: item.color }}>{item.value}{item.unit}</strong>
              </div>
              <div style={{ height: '6px', background: 'var(--surface-container-highest)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '3px', background: item.color, width: `${(item.value / item.max) * 100}%`, boxShadow: `0 0 10px ${item.color}60`, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          )) : <p style={{ color: 'var(--outline)', fontSize: '0.875rem' }}>No wellness data yet. Submit a check-in.</p>}
          <button className={styles.analyzeBtn} onClick={runAnalysis} disabled={analyzing} style={{ marginTop: '1.5rem' }}>
            <span className="material-symbols-outlined">{analyzing ? 'hourglass_empty' : 'bolt'}</span>
            {analyzing ? 'Analyzing...' : 'Run New Analysis'}
          </button>
        </div>

        {/* Top Factors */}
        {report && (
          <div className={`${styles.card} ${styles.factorsCard}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontVariationSettings: "'FILL' 1" }}>bolt</span>
              <h2 className="font-headline" style={{ fontSize: '1.375rem', fontWeight: 700 }}>Top Contributing Factors</h2>
            </div>
            <div className={styles.factorGrid}>
              {report.contributingFactors.map((f, i) => (
                <div key={i} className={styles.factorCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: '2rem' }}>{f.icon}</span>
                    <span style={{ color: 'var(--tertiary)', fontWeight: 700, fontSize: '1.125rem' }}>+{f.impact}</span>
                  </div>
                  <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{f.factor}</h4>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.8125rem', lineHeight: 1.5 }}>{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {report?.recommendations?.length > 0 && (
          <div className={`${styles.card} ${styles.recsCard}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(79,219,200,0.1)', padding: '1rem', borderRadius: '50%' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '2rem' }}>lightbulb</span>
              </div>
              <div>
                <h3 className="font-headline" style={{ fontWeight: 700, fontSize: '1.125rem' }}>Wellness Recommendations</h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>Personalized based on your biometric data</p>
              </div>
            </div>
            <div className={styles.recsList}>
              {report.recommendations.map((r, i) => (
                <div key={i} className={styles.recItem}>
                  <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: 'rgba(192,193,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>{r.icon}</span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{r.title}</h4>
                      <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.1rem 0.5rem', borderRadius: '9999px', background: r.priority === 'immediate' ? 'rgba(255,178,183,0.15)' : 'rgba(192,193,255,0.1)', color: r.priority === 'immediate' ? 'var(--tertiary)' : 'var(--primary)' }}>{r.priority}</span>
                    </div>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.8125rem', lineHeight: 1.5 }}>{r.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && !report && (
          <div className={`${styles.card} ${styles.emptyCard}`}>
            <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--outline)', marginBottom: '1rem' }}>analytics</span>
            <h3 className="font-headline" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Analysis Yet</h3>
            <p style={{ color: 'var(--on-surface-variant)', marginBottom: '1.5rem' }}>Submit your wellness data to get AI-powered stress analysis.</p>
            <button className={styles.analyzeBtn} onClick={runAnalysis} disabled={analyzing}>
              <span className="material-symbols-outlined">auto_awesome</span>
              Run Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
