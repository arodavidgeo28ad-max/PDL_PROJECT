import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h1 className="font-headline" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2rem' }}>Profile</h1>
      <div style={{ background: 'var(--surface-container)', borderRadius: '1.5rem', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(192,193,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', border: '3px solid rgba(192,193,255,0.3)' }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <h2 className="font-headline" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{user?.firstName} {user?.lastName}</h2>
            <p style={{ color: 'var(--secondary)', fontWeight: 600, fontSize: '0.875rem', textTransform: 'capitalize' }}>● {user?.role}</p>
          </div>
        </div>
        {[
          { label: 'Email', value: user?.email, icon: 'mail' },
          { label: 'Role', value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1), icon: user?.role === 'mentor' ? 'psychology' : 'school' },
          { label: 'User ID', value: user?._id, icon: 'badge' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--surface-container-high)', borderRadius: '0.75rem', marginBottom: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--outline)' }}>{item.label}</div>
              <div style={{ fontWeight: 600 }}>{item.value}</div>
            </div>
          </div>
        ))}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(255,178,183,0.1)', color: 'var(--tertiary)', border: '1px solid rgba(255,178,183,0.2)', borderRadius: '0.75rem', padding: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif', marginTop: '1.5rem', transition: 'all 0.2s' }}
        >
          <span className="material-symbols-outlined">logout</span>
          Sign Out
        </button>
      </div>
    </div>
  );
}
