const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');

const mapTask = (task) => {
  if (!task) return null;
  return {
    _id: task.id,
    id: task.id,
    userId: task.user_id,
    title: task.title,
    description: task.description,
    subject: task.subject,
    priority: task.priority,
    status: task.status,
    dueDate: task.due_date,
    estimatedHours: task.estimated_hours,
    completedAt: task.completed_at,
    createdAt: task.created_at
  };
};

// GET /api/tasks
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase.from('tasks').select('*').eq('user_id', req.user.id);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: tasks, error } = await query
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ tasks: tasks.map(mapTask) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, subject, priority, dueDate, estimatedHours } = req.body;
    
    const { data: task, error } = await supabase.from('tasks').insert([{
      user_id: req.user.id,
      title,
      description,
      subject,
      priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      estimated_hours: estimatedHours
    }]).select().single();

    if (error) throw error;

    res.status(201).json({ task: mapTask(task) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', protect, async (req, res) => {
  try {
    const updates = { ...req.body };
    let sbUpdates = {};
    
    if (updates.title !== undefined) sbUpdates.title = updates.title;
    if (updates.description !== undefined) sbUpdates.description = updates.description;
    if (updates.subject !== undefined) sbUpdates.subject = updates.subject;
    if (updates.priority !== undefined) sbUpdates.priority = updates.priority;
    if (updates.status !== undefined) sbUpdates.status = updates.status;
    if (updates.dueDate !== undefined) sbUpdates.due_date = updates.dueDate ? new Date(updates.dueDate).toISOString() : null;
    if (updates.estimatedHours !== undefined) sbUpdates.estimated_hours = updates.estimatedHours;
    
    if (updates.status === 'completed') {
      sbUpdates.completed_at = new Date().toISOString();
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(sbUpdates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json({ task: mapTask(task) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
