const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Message = require('../models/Message');

// GET /api/messages/conversation/:userId
router.get('/conversation/:userId', protect, async (req, res) => {
  try {
    const otherId = req.params.userId;
    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: otherId },
        { senderId: otherId, receiverId: req.user._id }
      ]
    }).sort({ createdAt: 1 }).populate('senderId', 'firstName lastName avatar');

    // Mark as read
    await Message.updateMany(
      { senderId: otherId, receiverId: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/contacts - list conversation partners
router.get('/contacts', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    // Contacts should include anyone they can talk to, allowing them to START a conversation.
    // Students can talk to mentors. Mentors can talk to students.
    const User = require('../models/User');
    let contacts = [];
    if (req.user.role === 'student') {
      contacts = await User.find({ role: 'mentor' }).select('firstName lastName avatar role');
    } else {
      contacts = await User.find({ role: 'student' }).select('firstName lastName avatar role');
    }

    // Add last message & unread count
    const contactsWithMeta = await Promise.all(contacts.map(async (c) => {
      const lastMsg = await Message.findOne({
        $or: [
          { senderId: userId, receiverId: c._id },
          { senderId: c._id, receiverId: userId }
        ]
      }).sort({ createdAt: -1 });

      const unread = await Message.countDocuments({ senderId: c._id, receiverId: userId, read: false });
      return { ...c.toObject(), lastMessage: lastMsg?.content, lastMessageAt: lastMsg?.createdAt, unreadCount: unread };
    }));

    // Sort by most recently active conversation
    contactsWithMeta.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });

    res.json({ contacts: contactsWithMeta });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages
router.post('/', protect, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const message = await Message.create({ senderId: req.user._id, receiverId, content });
    const populated = await message.populate('senderId', 'firstName lastName avatar');

    const Notification = require('../models/Notification');
    await Notification.create({
      userId: receiverId,
      type: 'message',
      title: `New message from ${req.user.firstName}`,
      body: content.length > 60 ? content.substring(0, 60) + '...' : content,
      icon: 'forum',
      actionUrl: `/messages`
    });

    res.status(201).json({ message: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
