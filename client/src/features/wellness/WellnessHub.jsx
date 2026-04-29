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
const PHASE_DURATION = 4000;

// PSS-10 Perceived Stress Scale Questions
const PSS_QUESTIONS = [
  { id: 1, text: 'Been upset because of something that happened unexpectedly?', reverse: false },
  { id: 2, text: 'Felt that you were unable to control important things in your life?', reverse: false },
  { id: 3, text: 'Felt nervous and "stressed"?', reverse: false },
  { id: 4, text: 'Felt confident about your ability to handle your personal problems?', reverse: true },
  { id: 5, text: 'Felt that things were going your way?', reverse: true },
  { id: 6, text: 'Found that you could NOT cope with all the things you had to do?', reverse: false },
  { id: 7, text: 'Been able to control irritations in your life?', reverse: true },
  { id: 8, text: 'Felt that you were on top of things?', reverse: true },
  { id: 9, text: 'Been angered because of things that happened that were out of your control?', reverse: false },
  { id: 10, text: 'Felt difficulties were piling up so high that you could not overcome them?', reverse: false },
];

const PSS_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Almost Never' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Fairly Often' },
  { value: 4, label: 'Very Often' },
];

export default function WellnessHub() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ sleepHours: 7, screenTime: 6, exerciseHours: 0.5, studyHours: 6, socialScore: 6, mood: 'okay', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Quiz states
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizStep, setQuizStep] = useState(0); // 0 = intro, 1-10 = questions, 11 = complete
  const [quizScore, setQuizScore] = useState(null);

  // Breathing exercise states
  const [breatheActive, setBreatheActive] = useState(false);
  const [breathePhase, setBreathePhase] = useState('Ready');
  const [breatheStep, setBreatheStep] = useState(0);

  useEffect(() => {
    if (!breatheActive) {
      setBreathePhase('Ready');
      setBreatheStep(0);
      return;
    }
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

  // PSS scoring: reverse-scored items (4,5,7,8) are scored 4-value
  const calculatePSSScore = () => {
    let total = 0;
    PSS_QUESTIONS.forEach(q => {
      const answer = quizAnswers[q.id] ?? 0;
      total += q.reverse ? (4 - answer) : answer;
    });
    return total; // 0-40
  };

  const handleQuizAnswer = (questionId, value) => {
    const newAnswers = { ...quizAnswers, [questionId]: value };
    setQuizAnswers(newAnswers);

    // Auto-advance to next question after a brief delay
    setTimeout(() => {
      if (quizStep < 10) {
        setQuizStep(quizStep + 1);
      } else {
        // Calculate and store score
        let total = 0;
        PSS_QUESTIONS.forEach(q => {
          const answer = newAnswers[q.id] ?? 0;
          total += q.reverse ? (4 - answer) : answer;
        });
        setQuizScore(total);
        setQuizStep(11);
      }
    }, 300);
  };

  const getScoreLabel = (score) => {
    if (score <= 13) return { label: 'Low Stress', color: 'var(--secondary)', emoji: '🟢' };
    if (score <= 26) return { label: 'Moderate Stress', color: '#f0a050', emoji: '🟡' };
    return { label: 'High Perceived Stress', color: 'var(--tertiary)', emoji: '🔴' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      // Map PSS score (0-40) to resilience_score (0-100): lower PSS = higher resilience
      const resilience = quizScore !== null ? Math.round(((40 - quizScore) / 40) * 100) : null;
      const payload = { ...form };
      if (resilience !== null) payload.resilienceScore = resilience;
      if (quizScore !== null) payload.pssScore = quizScore;

      const res = await wellnessAPI.submit(payload);
      await analysisAPI.analyze(res.data.wellness._id);
      setSuccess(true);
      setTimeout(() => navigate('/analysis'), 1800);
    } catch (err) {
      console.error('Submission error:', err);
      const serverMsg = err.response?.data?.message || err.response?.data?.error?.message;
      setError(serverMsg || 'Failed to submit. Please check your connection or database schema.');
    }
    setSubmitting(false);
  };

  const currentQuestion = PSS_QUESTIONS[quizStep - 1];

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

            {/* Quiz Score Badge */}
            {quizScore !== null && (
              <div className={styles.quizBadge}>
                <span className="material-symbols-outlined" style={{ color: getScoreLabel(quizScore).color }}>psychology</span>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--outline)' }}>PSS-10 Score</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: getScoreLabel(quizScore).color, fontSize: '1.125rem' }}>{quizScore}/40</strong>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>— {getScoreLabel(quizScore).label}</span>
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={submitting || success}>
              <span className="material-symbols-outlined">auto_awesome</span>
              {submitting ? 'Analyzing...' : 'Submit & Analyze'}
            </button>
          </form>
        </div>

        {/* PSS-10 Stress Resilience Quiz */}
        <div className={styles.quizCard}>
          <div className={styles.quizHeader}>
            <div className={styles.quizIconWrap}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--primary)' }}>quiz</span>
            </div>
            <div>
              <span className={styles.sectionLabel}>Perceived Stress Scale</span>
              <h3 className="font-headline" style={{ fontWeight: 700, fontSize: '1.25rem', marginTop: '0.25rem' }}>Weekly Resilience Quiz</h3>
            </div>
          </div>

          {quizStep === 0 && (
            <div className={styles.quizIntro}>
              <p style={{ color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                The PSS-10 measures your <strong style={{ color: 'var(--on-surface)' }}>perceived stress</strong> over the last month. 
                It takes ~2 minutes and directly factors into your AI stress analysis.
              </p>
              <div className={styles.quizMeta}>
                <div className={styles.quizMetaItem}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>help_outline</span>
                  <span>10 questions</span>
                </div>
                <div className={styles.quizMetaItem}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>timer</span>
                  <span>~2 minutes</span>
                </div>
                <div className={styles.quizMetaItem}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>science</span>
                  <span>Validated scale</span>
                </div>
              </div>
              <button className={styles.quizStartBtn} onClick={() => setQuizStep(1)}>
                <span className="material-symbols-outlined">play_arrow</span>
                Begin Assessment
              </button>
            </div>
          )}

          {quizStep >= 1 && quizStep <= 10 && currentQuestion && (
            <div className={styles.quizQuestion}>
              <div className={styles.quizProgress}>
                <div className={styles.quizProgressBar} style={{ width: `${(quizStep / 10) * 100}%` }} />
              </div>
              <div className={styles.quizStepLabel}>
                Question {quizStep} of 10
              </div>
              <p className={styles.quizQuestionText}>
                <span style={{ color: 'var(--outline)', fontSize: '0.8125rem' }}>In the <strong>LAST MONTH</strong>, how often have you:</span><br />
                {currentQuestion.text}
              </p>
              <div className={styles.quizOptions}>
                {PSS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.quizOption} ${quizAnswers[currentQuestion.id] === opt.value ? styles.quizOptionActive : ''}`}
                    onClick={() => handleQuizAnswer(currentQuestion.id, opt.value)}
                  >
                    <span className={styles.quizOptionDot}>
                      {quizAnswers[currentQuestion.id] === opt.value && <span className={styles.quizOptionDotFill} />}
                    </span>
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className={styles.quizNav}>
                <button
                  type="button"
                  className={styles.quizNavBtn}
                  disabled={quizStep <= 1}
                  onClick={() => setQuizStep(s => s - 1)}
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Previous
                </button>
                <button
                  type="button"
                  className={styles.quizNavBtn}
                  disabled={quizAnswers[currentQuestion.id] === undefined}
                  onClick={() => {
                    if (quizStep < 10) {
                      setQuizStep(s => s + 1);
                    } else {
                      const score = calculatePSSScore();
                      setQuizScore(score);
                      setQuizStep(11);
                    }
                  }}
                >
                  {quizStep === 10 ? 'Finish' : 'Next'}
                  <span className="material-symbols-outlined">{quizStep === 10 ? 'check' : 'arrow_forward'}</span>
                </button>
              </div>
            </div>
          )}

          {quizStep === 11 && quizScore !== null && (
            <div className={styles.quizResult}>
              <div className={styles.quizScoreCircle} style={{ borderColor: getScoreLabel(quizScore).color }}>
                <span className={styles.quizScoreNumber} style={{ color: getScoreLabel(quizScore).color }}>
                  {quizScore}
                </span>
                <span className={styles.quizScoreMax}>/40</span>
              </div>
              <div className={styles.quizResultLabel} style={{ color: getScoreLabel(quizScore).color }}>
                {getScoreLabel(quizScore).emoji} {getScoreLabel(quizScore).label}
              </div>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', lineHeight: 1.6, textAlign: 'center', maxWidth: 360, margin: '0 auto 1.5rem' }}>
                {quizScore <= 13
                  ? 'Your perceived stress is low. You feel in control and manage life events well.'
                  : quizScore <= 26
                  ? 'You experience moderate stress. Some areas may benefit from attention and coping strategies.'
                  : 'Your perceived stress is elevated. Consider reaching out to your mentor or using the breathing exercise.'}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className={styles.quizRetakeBtn} onClick={() => { setQuizAnswers({}); setQuizScore(null); setQuizStep(0); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
                  Retake
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--outline)', marginTop: '1rem' }}>
                ✓ Score will be included in your next wellness submission
              </p>
            </div>
          )}
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
