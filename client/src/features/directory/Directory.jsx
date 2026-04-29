import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { directoryAPI, appointmentsAPI } from '../../api';
import styles from './Directory.module.css';

export default function Directory() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myMentor, setMyMentor] = useState(null);
  const [bookingMentor, setBookingMentor] = useState(null);
  const [form, setForm] = useState({ dateTime: '', reason: '', urgency: 'routine' });
  const [submitting, setSubmitting] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadData();
  }, [user.role, user.mentorId]);

  const loadData = () => {
    setLoading(true);
    const loads = [];
    if (user.role === 'mentor') {
      loads.push(directoryAPI.students().then(r => setStudents(r.data.students)));
    } else {
      loads.push(directoryAPI.mentors().then(r => setMentors(r.data.mentors)));
      loads.push(directoryAPI.myMentor().then(r => setMyMentor(r.data.mentor)));
    }
    Promise.all(loads).catch(console.error).finally(() => setLoading(false));
  };

  const bookAppointment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await appointmentsAPI.book({ mentorId: bookingMentor._id, ...form });
      setBookingMentor(null);
      alert('Appointment request sent!');
    } catch (err) { alert(err.response?.data?.message || 'Booking failed'); }
    setSubmitting(false);
  };

  const kickoutStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to end this mentorship? The student will be notified.')) return;
    try {
      await directoryAPI.kickout(studentId);
      setStudents(prev => prev.filter(s => s._id !== studentId));
    } catch (err) { alert(err.response?.data?.message || 'Kickout failed'); }
  };

  const joinMentor = async (e) => {
    e.preventDefault();
    setJoining(true);
    try {
      await directoryAPI.join(joinCode);
      setShowJoinModal(false);
      setJoinCode('');
      // Force refresh auth context or just data
      window.location.reload(); // Simplest way to refresh user object with new mentorId
    } catch (err) { alert(err.response?.data?.message || 'Failed to join mentor'); }
    setJoining(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className={styles.overline}>{user.role === 'mentor' ? 'Mentorship' : 'Community'}</span>
            <h1 className={`${styles.title} font-headline`}>{user.role === 'mentor' ? 'My Students' : 'Mentor Directory'}</h1>
          </div>
          {user.role === 'student' && (
            <button className={styles.bookBtn} style={{ background: 'var(--primary)', color: 'var(--on-primary-fixed)' }} onClick={() => setShowJoinModal(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span> {user.mentorId ? 'Join New Mentor' : 'Join a Mentor'}
            </button>
          )}
        </div>
      </div>

      {user.role === 'student' && myMentor && (
        <div className={styles.myMentorCard}>
          <div className={styles.myMentorAvatar}>{myMentor.firstName[0]}{myMentor.lastName[0]}</div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--secondary)' }}>Your Assigned Mentor</span>
            <h3 className="font-headline" style={{ fontWeight: 700, fontSize: '1.25rem' }}>{myMentor.firstName} {myMentor.lastName}</h3>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>{myMentor.email}</p>
          </div>
          <button className={styles.bookBtn} onClick={() => setBookingMentor(myMentor)}>Book Session</button>
        </div>
      )}

      {loading ? <div className={styles.loading}><div className={styles.spinner} /></div> : (
        <div className={styles.grid}>
          {user.role === 'mentor' ? (
            students.map(s => (
              <div key={s._id} className={styles.mentorCard}>
                <div className={styles.mentorHeader}>
                  <div className={styles.mentorAvatar}>{s.firstName[0]}{s.lastName[0]}</div>
                  <div>
                    <h3 className="font-headline" style={{ fontWeight: 700 }}>{s.firstName} {s.lastName}</h3>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.8125rem' }}>{s.email}</p>
                  </div>
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button className={styles.bookBtn} style={{ flex: 1, background: 'rgba(255,107,129,0.1)', color: '#ff6b81' }} onClick={() => kickoutStudent(s._id)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_remove</span> Kickout
                  </button>
                  <button className={styles.bookBtn} style={{ flex: 1 }} onClick={() => window.location.href = '/messages'}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>mail</span> Message
                  </button>
                </div>
              </div>
            ))
          ) : (
            mentors.map(m => (
              <div key={m._id} className={styles.mentorCard}>
                <div className={styles.mentorHeader}>
                  <div className={styles.mentorAvatar}>{m.firstName[0]}{m.lastName[0]}</div>
                  <div>
                    <h3 className="font-headline" style={{ fontWeight: 700 }}>{m.firstName} {m.lastName}</h3>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.8125rem' }}>{m.email}</p>
                  </div>
                </div>
                {m.bio && <p className={styles.bio}>{m.bio}</p>}
                {m.expertise?.length > 0 && (
                  <div className={styles.expertise}>
                    {m.expertise.map(e => <span key={e} className={styles.expertiseTag}>{e}</span>)}
                  </div>
                )}
                {user.role === 'student' && (
                  <button className={styles.bookBtn} onClick={() => setBookingMentor(m)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>calendar_today</span> Book Appointment
                  </button>
                )}
              </div>
            ))
          )}
          {((user.role === 'mentor' && students.length === 0) || (user.role === 'student' && mentors.length === 0)) && !loading && (
            <div className={styles.empty}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--outline)', marginBottom: '1rem' }}>
                {user.role === 'mentor' ? 'group_off' : 'person_search'}
              </span>
              <p>{user.role === 'mentor' ? 'No students enrolled yet.' : 'You are not currently assigned to any mentor.'}</p>
              {user.role === 'student' && !user.mentorId && (
                <button className={styles.bookBtn} style={{ marginTop: '1.5rem', background: 'var(--primary)', color: 'var(--on-primary-fixed)' }} onClick={() => setShowJoinModal(true)}>
                  Enter Referral Code to Join
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Join Mentor Modal */}
      {showJoinModal && (
        <div className={styles.overlay} onClick={() => setShowJoinModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className="font-headline" style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '1rem' }}>Join Mentorship</h3>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Please enter the unique referral code provided by your mentor to join their group.
            </p>
            <form onSubmit={joinMentor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.field}>
                <label>Referral Code</label>
                <input 
                  type="text" 
                  placeholder="SYNC-XXXX" 
                  value={joinCode} 
                  onChange={e => setJoinCode(e.target.value.toUpperCase())} 
                  required 
                  style={{ textAlign: 'center', letterSpacing: '0.2em', fontWeight: 800, fontSize: '1.125rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className={styles.bookBtn} style={{ flex: 1 }} disabled={joining}>
                  {joining ? 'Validating...' : 'Join Now'}
                </button>
                <button type="button" onClick={() => setShowJoinModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingMentor && (
        <div className={styles.overlay} onClick={() => setBookingMentor(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className="font-headline" style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem' }}>Book with {bookingMentor.firstName}</h3>
            <form onSubmit={bookAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.field}><label>Date & Time</label><input type="datetime-local" value={form.dateTime} onChange={e => setForm(f => ({ ...f, dateTime: e.target.value }))} required /></div>
              <div className={styles.field}><label>Urgency</label><select value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}><option value="routine">Routine</option><option value="urgent">Urgent</option><option value="crisis">Crisis</option></select></div>
              <div className={styles.field}><label>Reason</label><textarea rows={3} placeholder="What would you like to discuss?" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required /></div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className={styles.bookBtn} style={{ flex: 1 }} disabled={submitting}>{submitting ? 'Sending...' : 'Send Request'}</button>
                <button type="button" onClick={() => setBookingMentor(null)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
