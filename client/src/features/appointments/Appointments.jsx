import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appointmentsAPI, directoryAPI } from '../../api';
import styles from './Appointments.module.css';

const STATUS_COLORS = { requested: '#ffc107', accepted: 'var(--secondary)', completed: 'var(--outline)', declined: 'var(--tertiary)', cancelled: 'var(--tertiary)' };

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('requested');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ mentorId: '', dateTime: '', reason: '', urgency: 'routine' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await appointmentsAPI.list();
      setAppointments(r.data.appointments);
      if (user.role === 'student') {
        const d = await directoryAPI.mentors();
        setMentors(d.data.mentors);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = appointments.filter(a => a.status === tab);

  const bookAppointment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await appointmentsAPI.book(form);
      setShowForm(false);
      setForm({ mentorId: '', dateTime: '', reason: '', urgency: 'routine' });
      await load();
    } catch (err) { alert(err.response?.data?.message || 'Booking failed'); }
    setSubmitting(false);
  };

  const updateStatus = async (id, status) => {
    try {
      await appointmentsAPI.updateStatus(id, status);
      await load();
    } catch (err) { alert('Failed to update status'); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.overline}>Schedule Overview</span>
          <h1 className={`${styles.title} font-headline`}>{user.role === 'mentor' ? 'Mentor Appointments' : 'My Appointments'}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className={styles.tabs}>
            {['requested', 'accepted', 'completed', 'declined'].map(s => (
              <button key={s} className={`${styles.tab} ${tab === s ? styles.tabActive : ''}`} onClick={() => setTab(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          {user.role === 'student' && (
            <button className={styles.bookBtn} onClick={() => setShowForm(!showForm)}>
              <span className="material-symbols-outlined">add</span>
              Book Appointment
            </button>
          )}
        </div>
      </div>

      {/* Booking Form */}
      {showForm && user.role === 'student' && (
        <div className={styles.formCard}>
          <h3 className="font-headline" style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Request an Appointment</h3>
          <form onSubmit={bookAppointment} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Select Mentor</label>
                <select value={form.mentorId} onChange={e => setForm(f => ({ ...f, mentorId: e.target.value }))} required>
                  <option value="">Choose a mentor...</option>
                  {mentors.map(m => <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>Date & Time</label>
                <input type="datetime-local" value={form.dateTime} onChange={e => setForm(f => ({ ...f, dateTime: e.target.value }))} required />
              </div>
              <div className={styles.field}>
                <label>Urgency</label>
                <select value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}>
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="crisis">Crisis</option>
                </select>
              </div>
            </div>
            <div className={styles.field}>
              <label>Reason for Meeting</label>
              <textarea rows={3} placeholder="Describe what you'd like to discuss..." value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className={styles.bookBtn} disabled={submitting}>{submitting ? 'Booking...' : 'Confirm Booking'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Appointments List */}
      {loading ? <div className={styles.loading}><div className={styles.spinner} /></div> : (
        <div className={styles.list}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: '0.5rem' }}>calendar_today</span>
              <p>No {tab} appointments</p>
            </div>
          ) : filtered.map(appt => (
            <div key={appt._id} className={styles.apptCard}>
              <div className={styles.apptLeft}>
                <div className={styles.apptAvatar}>
                  {user.role === 'student'
                    ? `${appt.mentorId?.firstName?.[0]}${appt.mentorId?.lastName?.[0]}`
                    : `${appt.studentId?.firstName?.[0]}${appt.studentId?.lastName?.[0]}`}
                </div>
                <div>
                  <h4 className="font-headline" style={{ fontWeight: 700 }}>
                    {user.role === 'student'
                      ? `${appt.mentorId?.firstName} ${appt.mentorId?.lastName}`
                      : `${appt.studentId?.firstName} ${appt.studentId?.lastName}`}
                  </h4>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
                    {new Date(appt.dateTime).toLocaleString()}
                  </p>
                  <span className={styles.urgencyBadge} style={{ background: appt.urgency === 'urgent' ? 'rgba(255,178,183,0.15)' : 'rgba(79,219,200,0.15)', color: appt.urgency === 'urgent' ? 'var(--tertiary)' : 'var(--secondary)' }}>
                    {appt.urgency}
                  </span>
                </div>
              </div>
              <div className={styles.apptRight}>
                <div className={styles.reasonBox}><p style={{ fontSize: '0.875rem' }}>"{appt.reason}"</p></div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                  <span className={styles.statusBadge} style={{ color: STATUS_COLORS[appt.status] }}>● {appt.status}</span>
                  {user.role === 'mentor' && appt.status === 'requested' && (
                    <>
                      <button className={styles.acceptBtn} onClick={() => updateStatus(appt._id, 'accepted')}>Accept</button>
                      <button className={styles.declineBtn} onClick={() => updateStatus(appt._id, 'declined')}>Decline</button>
                    </>
                  )}
                  {user.role === 'mentor' && appt.status === 'accepted' && (
                    <button className={styles.acceptBtn} onClick={() => updateStatus(appt._id, 'completed')}>Mark Complete</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
