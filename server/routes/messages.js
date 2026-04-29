const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');

const mapMessage = (msg) => {
  if (!msg) return null;
  return {
    _id: msg.id,
    id: msg.id,
    senderId: msg.sender_profiles ? {
      _id: msg.sender_profiles.id,
      firstName: msg.sender_profiles.first_name,
      lastName: msg.sender_profiles.last_name,
      avatar: msg.sender_profiles.avatar
    } : msg.sender_id,
    receiverId: msg.receiver_id,
    content: msg.content,
    read: msg.read,
    readAt: msg.read_at,
    createdAt: msg.created_at
  };
};

// GET /api/messages/conversation/:userId
router.get('/conversation/:userId', protect, async (req, res) => {
  try {
    const otherId = req.params.userId;
    
    // Authorization check
    if (req.user.role === 'student') {
      if (otherId !== req.user.mentorId) return res.status(403).json({ message: 'Access denied: You can only message your assigned mentor.' });
    } else if (req.user.role === 'mentor') {
      const { data: isStudent } = await supabase.from('profiles').select('id').eq('id', otherId).eq('mentor_id', req.user.id).single();
      if (!isStudent) return res.status(403).json({ message: 'Access denied: You can only message your assigned students.' });
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender_profiles:profiles!sender_id(id, first_name, last_name, avatar)')
      .or(`and(sender_id.eq.${req.user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${req.user.id})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Mark as read
    await supabase
      .from('messages')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('sender_id', otherId)
      .eq('receiver_id', req.user.id)
      .eq('read', false);

    res.json({ messages: (messages || []).map(mapMessage) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/contacts - list conversation partners
router.get('/contacts', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    let contacts = [];

    if (req.user.role === 'student') {
      // Students can only message their assigned mentor
      if (req.user.mentorId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar, role')
          .eq('id', req.user.mentorId)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) contacts = [data];
      }
    } else {
      // Mentors see only their assigned students
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar, role')
        .eq('role', 'student')
        .eq('mentor_id', userId);
      if (error) throw error;
      contacts = data || [];
    }

    // Add last message & unread count
    const contactsWithMeta = await Promise.all(contacts.map(async (c) => {
      const { data: lastMsgData } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${c.id}),and(sender_id.eq.${c.id},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', c.id)
        .eq('receiver_id', userId)
        .eq('read', false);

      return { 
        _id: c.id,
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        avatar: c.avatar,
        role: c.role,
        lastMessage: lastMsgData?.content, 
        lastMessageAt: lastMsgData?.created_at, 
        unreadCount: unreadCount || 0 
      };
    }));

    // Sort by most recently active conversation
    contactsWithMeta.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });

    res.json({ contacts: contactsWithMeta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages
router.post('/', protect, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    // Authorization check
    if (req.user.role === 'student') {
      if (receiverId !== req.user.mentorId) return res.status(403).json({ message: 'Access denied: You can only message your assigned mentor.' });
    } else if (req.user.role === 'mentor') {
      const { data: isStudent } = await supabase.from('profiles').select('id').eq('id', receiverId).eq('mentor_id', req.user.id).single();
      if (!isStudent) return res.status(403).json({ message: 'Access denied: You can only message your assigned students.' });
    }
    
    const { data: messageRaw, error } = await supabase.from('messages').insert([{
      sender_id: req.user.id,
      receiver_id: receiverId,
      content: content
    }]).select('*, sender_profiles:profiles!sender_id(id, first_name, last_name, avatar)').single();

    if (error) throw error;

    await supabase.from('notifications').insert([{
      user_id: receiverId,
      type: 'message',
      title: `New message from ${req.user.firstName}`,
      body: content.length > 60 ? content.substring(0, 60) + '...' : content,
      icon: 'forum',
      action_url: `/messages`
    }]);

    res.status(201).json({ message: mapMessage(messageRaw) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
