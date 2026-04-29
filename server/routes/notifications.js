const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');

const mapNotification = (notif) => {
  if (!notif) return null;
  return {
    _id: notif.id,
    id: notif.id,
    userId: notif.user_id,
    type: notif.type,
    title: notif.title,
    body: notif.body,
    icon: notif.icon,
    actionUrl: notif.action_url,
    read: notif.read,
    createdAt: notif.created_at
  };
};

// GET /api/notifications
router.get('/', protect, async (req, res) => {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) throw error;
    
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('read', false);

    res.json({ notifications: notifications.map(mapNotification), unreadCount: unreadCount || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const { data: notif, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    
    res.json({ notification: mapNotification(notif) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/notifications/read-all/mark
router.patch('/read-all/mark', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', req.user.id)
      .eq('read', false);
      
    if (error) throw error;
    
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
