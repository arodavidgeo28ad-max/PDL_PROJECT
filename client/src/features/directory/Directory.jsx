import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { directoryAPI, appointmentsAPI } from '../../api';
import styles from './Directory.module.css';

export default function Directory() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myMentor, setMyMentor] = useState(null);
  const [bookingMentor, setBookingMentor] = useState(null);
  const [form, setForm] = useState({ dateTime: '', reason: '', urgency: 'routine' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loads = [directoryAPI.mentors().then(r => setMentors(r.data.mentors))];
    if (user.role === 'student') loads.push(directoryAPI.myMentor().then(r => setMyMentor(r.data.mentor)));
    Promise.all(loads).catch(console.error).finally(() => setLoading(false));
  }, []);

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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.overline}>Community</span>
        <h1 className={`${styles.title} font-headline`}>Mentor Directory</h1>
      </div>

      {myMentor && (
        <div className={styles.myMentorCard}>
          <div className={styles.myMentorAvatar}>{myMentor.firstName[0]}{myMentor.lastName[0]}</div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--secondary)' }}>Your Assigned Mentor</span>
            <h3 className="font-headline" style={{ fontWeight: 700, fontSize: '1.25rem' }}>{myMentor.firstName} {myMentor.lastName}</h3>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>{myMentor.email}</p>
          </div>
          <button className={styles.bookBtn} onClick={() => setBookingMentor(myMentor)}>Book Session</button>
        </div>
      )}

      {loading ? <div className={styles.loading}><div className={styles.spinner} /></div> : (
        <div className={styles.grid}>
          {mentors.map(m => (
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
          ))}
          {mentors.length === 0 && <div className={styles.empty}><p>No mentors found in the directory.</p></div>}
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
