import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { referralsAPI } from '../../api';
import styles from './ReferralCenter.module.css';

export default function ReferralCenter() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(user.role === 'mentor');
  const [generating, setGenerating] = useState(false);
  const [validateCode, setValidateCode] = useState('');
  const [validateResult, setValidateResult] = useState(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (user.role === 'mentor') {
      referralsAPI.myReferrals().then(r => setReferrals(r.data.referrals)).catch(console.error).finally(() => setLoading(false));
    }
  }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await referralsAPI.generate();
      setReferrals(prev => [r.data.referral, ...prev]);
    } catch (err) { alert('Failed to generate code'); }
    setGenerating(false);
  };

  const validate = async (e) => {
    e.preventDefault();
    try {
      const r = await referralsAPI.validate(validateCode);
      setValidateResult({ valid: r.data.valid, message: r.data.message });
    } catch (err) { setValidateResult({ valid: false, message: err.response?.data?.message || 'Invalid code' }); }
  };

  const copy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.overline}>Access Control</span>
        <h1 className={`${styles.title} font-headline`}>Referral Code Center</h1>
      </div>

      {user.role === 'mentor' ? (
        <div className={styles.content}>
          <div className={styles.generateCard}>
            <div>
              <h3 className="font-headline" style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>Generate Referral Code</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>Share codes with students to give them access to your mentorship.</p>
            </div>
            <button className={styles.generateBtn} onClick={generate} disabled={generating}>
              <span className="material-symbols-outlined">add</span>
              {generating ? 'Generating...' : 'Generate Code'}
            </button>
          </div>

          {loading ? <div className={styles.loading}><div className={styles.spinner} /></div> : (
            <div className={styles.codesList}>
              <h3 className="font-headline" style={{ fontWeight: 700, marginBottom: '1rem' }}>My Referral Codes ({referrals.length})</h3>
              {referrals.length === 0 ? <p style={{ color: 'var(--outline)' }}>No codes generated yet.</p> : referrals.map(r => (
                <div key={r._id} className={styles.codeCard}>
                  <div className={styles.codeDisplay}>
                    <span className={`${styles.code} font-headline`}>{r.code}</span>
                    <button className={styles.copyBtn} onClick={() => copy(r.code)}>
                      <span className="material-symbols-outlined">{copied === r.code ? 'check' : 'content_copy'}</span>
                    </button>
                  </div>
                  <div className={styles.codeMeta}>
                    <span className={`${styles.statusBadge} ${r.isActive ? styles.active : styles.used}`}>
                      {r.isActive ? '● Active' : '● Used'}
                    </span>
                    {r.studentId && <span style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>Used by: {r.studentId.firstName} {r.studentId.lastName}</span>}
                    <span style={{ fontSize: '0.8125rem', color: 'var(--outline)' }}>Generated: {new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.studentCard}>
            <div className={styles.referralIcon}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--primary)' }}>confirmation_number</span>
            </div>
            <h3 className="font-headline" style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Your Referral Code</h3>
            {user.referralCode ? (
              <div className={styles.codeDisplay} style={{ marginTop: '1rem', background: 'var(--surface-container)' }}>
                <span className={`${styles.code} font-headline`}>{user.referralCode}</span>
                <button className={styles.copyBtn} onClick={() => copy(user.referralCode)}>
                  <span className="material-symbols-outlined">{copied === user.referralCode ? 'check' : 'content_copy'}</span>
                </button>
              </div>
            ) : <p style={{ color: 'var(--on-surface-variant)' }}>No referral code associated with your account.</p>}
          </div>

          <div className={styles.validateCard}>
            <h3 className="font-headline" style={{ fontWeight: 700, marginBottom: '1rem' }}>Validate a Code</h3>
            <form onSubmit={validate} style={{ display: 'flex', gap: '0.75rem' }}>
              <input type="text" placeholder="SYNC-XXXX" value={validateCode} onChange={e => setValidateCode(e.target.value.toUpperCase())} className={styles.validateInput} />
              <button type="submit" className={styles.generateBtn}>Check</button>
            </form>
            {validateResult && (
              <div style={{ marginTop: '0.75rem', color: validateResult.valid ? 'var(--secondary)' : 'var(--tertiary)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined">{validateResult.valid ? 'check_circle' : 'cancel'}</span>
                {validateResult.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
