import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wellnessAPI, analysisAPI } from '../../api';
import styles from './WellnessHub.module.css';

const moods = [
  { value: 'great', label: 'Great', icon: '😄' },
  { value: 'good', label: 'Good', icon: '🙂' },
  { value: 'okay', label: 'Okay', icon: '😐' },
  { value: 'stressed', label: 'Stressed', icon: '😰' },
  { value: 'overwhelmed', label: 'Overwhelmed', icon: '😵' },
];

const BREATH_PHASES = ['Inhale', 'Hold', 'Exhale', 'Hold'];
const PHASE_DURATION = 4000; // 4 seconds per phase

export default function WellnessHub() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ sleepHours: 7, screenTime: 6, exerciseHours: 0.5, studyHours: 6, socialScore: 6, mood: 'okay', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Breathing exercise states
  const [breatheActive, setBreatheActive] = useState(false);
  const [breathePhase, setBreathePhase] = useState('Ready');
  const [breatheStep, setBreatheStep] = useState(0);

  // Box Breathing Cycle: Inhale → Hold → Exhale → Hold (4s each)
  useEffect(() => {
    if (!breatheActive) {
      setBreathePhase('Ready');
      setBreatheStep(0);
      return;
    }

    // Set phase immediately when activated
    setBreathePhase(BREATH_PHASES[0]);
    setBreatheStep(0);

    const interval = setInterval(() => {
      setBreatheStep(prev => {
        const next = (prev + 1) % BREATH_PHASES.length;
        setBreathePhase(BREATH_PHASES[next]);
        return next;
      });
    }, PHASE_DURATION);

    return () => clearInterval(interval);
  }, [breatheActive]);

  const handleSlider = (field, value) => setForm(f => ({ ...f, [field]: parseFloat(value) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await wellnessAPI.submit(form);
      await analysisAPI.analyze(res.data.wellness._id);
      setSuccess(true);
      setTimeout(() => navigate('/analysis'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.overline}>Mindful Sanctuary</span>
        <h1 className={`${styles.title} font-headline`}>Your Daily Equilibrium</h1>
      </div>

      <div className={styles.grid}>
        {/* Breathing Exercise */}
        <div className={styles.breatheCard}>
          <span className={styles.sectionLabel}>Guided Resonance</span>
          <div className={styles.breatheCircleWrap}>
            <div className={`${styles.breatheCircle} ${breatheActive ? styles.breatheActive : ''}`} />
            <div className={styles.breatheText}>{breathePhase}</div>
          </div>
          <button className={styles.breatheBtn} onClick={() => setBreatheActive(prev => !prev)}>
            <span className="material-symbols-outlined">{breatheActive ? 'pause' : 'play_arrow'}</span>
            {breatheActive ? 'Pause' : 'Begin Cycle'}
          </button>
        </div>

        {/* Wellness Form */}
        <div className={styles.formCard}>
          <h2 className="font-headline" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Daily Check-In</h2>
          {success && (
            <div className={styles.successBox}>
              <span className="material-symbols-outlined">check_circle</span>
              Data submitted! Redirecting to analysis...
            </div>
          )}
          {error && <div className={styles.errorBox}><span className="material-symbols-outlined">error</span>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            {[
              { key: 'sleepHours', label: 'Sleep Hours', min: 0, max: 12, step: 0.5, color: 'var(--primary)' },
              { key: 'screenTime', label: 'Screen Time (hrs)', min: 0, max: 18, step: 0.5, color: 'var(--tertiary)' },
              { key: 'exerciseHours', label: 'Exercise (hrs)', min: 0, max: 5, step: 0.25, color: 'var(--secondary)' },
              { key: 'studyHours', label: 'Study/Work (hrs)', min: 0, max: 16, step: 0.5, color: 'var(--tertiary)' },
              { key: 'socialScore', label: 'Social Interaction (1–10)', min: 1, max: 10, step: 1, color: 'var(--secondary)' },
            ].map(({ key, label, min, max, step, color }) => (
              <div key={key} className={styles.sliderField}>
                <div className={styles.sliderLabel}>
                  <span>{label}</span>
                  <strong style={{ color }}>{form[key]}{key === 'socialScore' ? '/10' : 'h'}</strong>
                </div>
                <input
                  type="range" min={min} max={max} step={step}
                  value={form[key]}
                  onChange={e => handleSlider(key, e.target.value)}
                  style={{ '--track-color': color }}
                  className={styles.slider}
                />
              </div>
            ))}

            {/* Mood */}
            <div className={styles.moodSection}>
              <label className={styles.sliderLabel}><span>Today's Mood</span></label>
              <div className={styles.moodGrid}>
                {moods.map(m => (
                  <button
                    key={m.value} type="button"
                    className={`${styles.moodBtn} ${form.mood === m.value ? styles.moodActive : ''}`}
                    onClick={() => setForm(f => ({ ...f, mood: m.value }))}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--outline)' }}>Notes (optional)</label>
              <textarea rows={3} placeholder="How are you feeling today?" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={styles.textarea} />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={submitting || success}>
              <span className="material-symbols-outlined">auto_awesome</span>
              {submitting ? 'Analyzing...' : 'Submit & Analyze'}
            </button>
          </form>
        </div>

        {/* Restorative Breaks */}
        <div className={styles.breaksSection}>
          <h3 className="font-headline" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Restorative Breaks</h3>
          <div className={styles.breakCards}>
            {[
              { icon: 'directions_walk', title: 'Quick 5-min Walk', desc: 'Boost serotonin and clear your mental workspace with active movement.', color: 'var(--secondary)' },
              { icon: 'water_drop', title: 'Hydrate & Refresh', desc: 'Dehydration mimics stress symptoms. Replenish your system now.', color: 'var(--primary)' },
              { icon: 'phonelink_off', title: 'Digital Unplug', desc: 'Step away for 10 minutes to reset your circadian rhythm.', color: 'var(--tertiary)' },
            ].map(b => (
              <div key={b.title} className={styles.breakCard}>
                <div className={styles.breakIcon} style={{ background: `${b.color}18` }}>
                  <span className="material-symbols-outlined" style={{ color: b.color }}>{b.icon}</span>
                </div>
                <h4 className="font-headline" style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{b.title}</h4>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', lineHeight: 1.5 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
