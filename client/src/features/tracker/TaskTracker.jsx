import { useState, useEffect } from 'react';
import { tasksAPI } from '../../api';
import styles from './TaskTracker.module.css';

const PRIORITIES = { high: { label: 'High', color: 'var(--tertiary)' }, medium: { label: 'Medium', color: '#ffc107' }, low: { label: 'Low', color: 'var(--secondary)' } };

export default function TaskTracker() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', subject: '', priority: 'medium', dueDate: '', estimatedHours: 1 });
  const [submitting, setSubmitting] = useState(false);

  const load = () => tasksAPI.list().then(r => setTasks(r.data.tasks)).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const stats = { total: tasks.length, completed: tasks.filter(t => t.status === 'completed').length, inProgress: tasks.filter(t => t.status === 'in-progress').length };

  const addTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try { await tasksAPI.create(form); setShowForm(false); setForm({ title: '', description: '', subject: '', priority: 'medium', dueDate: '', estimatedHours: 1 }); await load(); }
    catch (err) { alert('Failed to add task'); }
    setSubmitting(false);
  };

  const updateStatus = async (id, status) => {
    try { await tasksAPI.update(id, { status }); await load(); }
    catch (err) { console.error(err); }
  };

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try { await tasksAPI.delete(id); await load(); }
    catch (err) { console.error(err); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.overline}>Academic Flow</span>
          <h1 className={`${styles.title} font-headline`}>Study Tracker</h1>
        </div>
        <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
          <span className="material-symbols-outlined">add</span> Add Task
        </button>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        {[
          { label: 'Total', value: stats.total, color: 'var(--primary)' },
          { label: 'In Progress', value: stats.inProgress, color: '#ffc107' },
          { label: 'Completed', value: stats.completed, color: 'var(--secondary)' },
          { label: 'Completion Rate', value: stats.total ? `${Math.round((stats.completed / stats.total) * 100)}%` : '0%', color: 'var(--primary)' },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <span className={`${styles.statNum} font-headline`} style={{ color: s.color }}>{s.value}</span>
            <span className={styles.statLbl}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className={styles.formCard}>
          <h3 className="font-headline" style={{ fontWeight: 700, marginBottom: '1rem' }}>New Task</h3>
          <form onSubmit={addTask} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                <label>Task Title</label>
                <input type="text" placeholder="E.g., Complete Chapter 5 notes" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className={styles.field}>
                <label>Subject</label>
                <input type="text" placeholder="E.g., Mathematics" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label>Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Due Date</label>
                <input type="datetime-local" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label>Est. Hours</label>
                <input type="number" min="0.5" max="20" step="0.5" value={form.estimatedHours} onChange={e => setForm(f => ({ ...f, estimatedHours: e.target.value }))} />
              </div>
            </div>
            <div className={styles.field}>
              <label>Description</label>
              <textarea rows={2} placeholder="Additional notes..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className={styles.addBtn} disabled={submitting}>{submitting ? 'Adding...' : 'Add Task'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className={styles.filterRow}>
        {['all', 'todo', 'in-progress', 'completed'].map(f => (
          <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={styles.filterCount}>{f === 'all' ? tasks.length : tasks.filter(t => t.status === f).length}</span>
          </button>
        ))}
      </div>

      {/* Tasks */}
      {loading ? <div className={styles.loading}><div className={styles.spinner} /></div> : (
        <div className={styles.taskList}>
          {filtered.length === 0 ? (
            <div className={styles.empty}><span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: '0.5rem' }}>checklist</span><p>No tasks</p></div>
          ) : filtered.map(task => (
            <div key={task._id} className={`${styles.taskCard} ${task.status === 'completed' ? styles.taskCompleted : ''}`}>
              <div className={styles.taskLeft}>
                <button className={`${styles.checkbox} ${task.status === 'completed' ? styles.checkboxDone : ''}`} onClick={() => updateStatus(task._id, task.status === 'completed' ? 'todo' : 'completed')}>
                  {task.status === 'completed' && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>}
                </button>
                <div>
                  <div className={styles.taskTitle} style={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none', opacity: task.status === 'completed' ? 0.6 : 1 }}>{task.title}</div>
                  {task.subject && <div className={styles.taskSubject}>{task.subject}</div>}
                  {task.description && <div className={styles.taskDesc}>{task.description}</div>}
                  <div className={styles.taskMeta}>
                    <span className={styles.priorityBadge} style={{ color: PRIORITIES[task.priority].color, background: `${PRIORITIES[task.priority].color}18` }}>{task.priority}</span>
                    {task.dueDate && <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
                    <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>⏱ {task.estimatedHours}h</span>
                  </div>
                </div>
              </div>
              <div className={styles.taskActions}>
                {task.status !== 'in-progress' && task.status !== 'completed' && (
                  <button className={styles.startBtn} onClick={() => updateStatus(task._id, 'in-progress')}>Start</button>
                )}
                {task.status === 'in-progress' && (
                  <span className={styles.inProgressTag}>● In Progress</span>
                )}
                <button className={styles.deleteBtn} onClick={() => deleteTask(task._id)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
