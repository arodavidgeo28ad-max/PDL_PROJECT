import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'mentor' ? '/' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.ambientBlur1} />
      <div className={styles.ambientBlur2} />
      <div className={styles.container}>
        {/* Left branding panel */}
        <div className={styles.brandPanel}>
          <div>
            <div className={styles.logoBadge}>
              <span className="material-symbols-outlined" style={{ color: 'var(--on-primary-fixed)', fontSize: 20 }}>spa</span>
            </div>
            <span className={`${styles.logoText} font-headline gradient-text`}>StressSync</span>
          </div>
          <div className={styles.brandContent}>
            <h1 className={`${styles.brandHeadline} font-headline`}>Enter Your<br /><span style={{ color: 'var(--primary)' }}>Luminescent Sanctuary</span></h1>
            <p className={styles.brandSub}>Join a supportive ecosystem designed to balance academic rigor with emotional well-being.</p>
          </div>
          <div className={styles.trustBadge}>
            <div className={styles.avatarStack}>
              {[...Array(3)].map((_, i) => <div key={i} className={styles.avatarCircle} />)}
            </div>
            <span>Trusted by 2,000+ students & mentors</span>
          </div>
        </div>
        {/* Right form */}
        <div className={styles.formPanel}>
          <div className={styles.formContent}>
            <h2 className={`${styles.formTitle} font-headline`}>Welcome Back</h2>
            <p className={styles.formSub}>Sign in to your sanctuary.</p>
            {error && <div className={styles.errorBox}><span className="material-symbols-outlined">error</span>{error}</div>}
            <form onSubmit={handleSubmit} className={styles.form}>
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
                  <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                </div>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <p className={styles.switchText}>
              Don't have an account?&nbsp;<Link to="/signup">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
