import { useNavigate } from 'react-router-dom';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: '2rem' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: 'var(--tertiary)', marginBottom: '1rem' }}>block</span>
      <h1 className="font-headline" style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Access Denied</h1>
      <p style={{ color: 'var(--on-surface-variant)', maxWidth: '400px', marginBottom: '2rem' }}>
        You do not have permission to view this page. This feature is restricted to specific user roles.
      </p>
      <button className="btn-primary" onClick={() => navigate('/')}>Return to Dashboard</button>
    </div>
  );
}
