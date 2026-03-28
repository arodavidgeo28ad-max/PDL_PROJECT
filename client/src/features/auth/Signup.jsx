import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', referralCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ ...form, referralCode: role === 'student' ? form.referralCode.trim().toUpperCase() : undefined, role });
      navigate('/');
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.ambientBlur1} />
      <div className={styles.ambientBlur2} />
      <div className={styles.container}>
        <div className={styles.brandPanel}>
          <div>
            <div className={styles.logoBadge}><span className="material-symbols-outlined" style={{ color: 'var(--on-primary-fixed)', fontSize: 20 }}>spa</span></div>
            <span className={`${styles.logoText} font-headline gradient-text`}>StressSync</span>
          </div>
          <div className={styles.brandContent}>
            <h1 className={`${styles.brandHeadline} font-headline`}>Begin Your<br /><span style={{ color: 'var(--primary)' }}>Journey</span></h1>
            <p className={styles.brandSub}>Your data-driven path to tranquility starts here.</p>
          </div>
        </div>
        <div className={styles.formPanel}>
          <div className={styles.formContent}>
            <h2 className={`${styles.formTitle} font-headline`}>Create Account</h2>
            <p className={styles.formSub}>Choose your path and start your journey.</p>

            {/* Role toggle */}
            <div className={styles.roleToggle}>
              <button type="button" className={role === 'student' ? styles.roleActive : styles.roleBtn} onClick={() => setRole('student')}>
                <span className="material-symbols-outlined">school</span> Student
              </button>
              <button type="button" className={role === 'mentor' ? styles.roleActive : styles.roleBtn} onClick={() => setRole('mentor')}>
                <span className="material-symbols-outlined">psychology</span> Mentor
              </button>
            </div>

            {error && <div className={styles.errorBox}><span className="material-symbols-outlined">error</span>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.field}>
                  <label>First Name</label>
                  <input type="text" placeholder="Alex" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required />
                </div>
                <div className={styles.field}>
                  <label>Last Name</label>
                  <input type="text" placeholder="Chen" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required />
                </div>
              </div>
              <div className={styles.field}>
                <label>Email Address</label>
                <div className={styles.inputWrap}>
                  <span className="material-symbols-outlined">mail</span>
                  <input type="email" placeholder="alex@university.edu" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
              </div>

              <div className={styles.field}>
                <label>Password</label>
                <div className={styles.inputWrap}>
                  <span className="material-symbols-outlined">lock</span>
                  <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
                </div>
              </div>

              {/* Referral Code — required for students */}
              {role === 'student' && (
                <div className={styles.field}>
                  <label>Referral Code <span style={{ color: 'var(--error)' }}>*</span></label>
                  <div className={styles.inputWrap}>
                    <span className="material-symbols-outlined">key</span>
                    <input
                      type="text"
                      placeholder="SYNC-XXXX (ask your mentor)"
                      value={form.referralCode}
                      onChange={e => setForm(f => ({ ...f, referralCode: e.target.value }))}
                      required
                      style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>Your mentor will give you this code to link your account.</p>
                </div>
              )}
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Creating Account...' : 'Begin Your Journey'}
              </button>
            </form>
            <p className={styles.switchText}>Already have an account?&nbsp;<Link to="/login">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
