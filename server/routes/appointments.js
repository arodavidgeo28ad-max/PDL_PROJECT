const express = require('express');
const router = express.Router();
const { protect, mentorOnly } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const User = require('../models/User');

// GET /api/appointments - list (student sees own, mentor sees for them)
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (req.user.role === 'student') {
      query.studentId = req.user._id;
    } else {
      query.mentorId = req.user._id;
    }
    if (status) query.status = status;
    const appointments = await Appointment.find(query)
      .sort({ dateTime: -1 })
      .populate('studentId', 'firstName lastName email avatar')
      .populate('mentorId', 'firstName lastName email avatar expertise');
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/appointments - book (student only)
router.post('/', protect, async (req, res) => {
  try {
    const { mentorId, dateTime, reason, urgency } = req.body;
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can book appointments' });

    const appt = await Appointment.create({
      studentId: req.user._id,
      mentorId,
      dateTime: new Date(dateTime),
      reason,
      urgency: urgency || 'routine'
    });

    // Notify the mentor
    await Notification.create({
      userId: mentorId,
      type: 'appointment',
      title: 'New Appointment Request',
      body: `${req.user.firstName} ${req.user.lastName} has requested a meeting: "${reason}"`,
      icon: 'calendar_today',
      actionUrl: '/mentor/dashboard'
    });

    const populated = await appt.populate(['studentId', 'mentorId']);
    res.status(201).json({ appointment: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/appointments/:id/status - accept/decline/complete (mentor)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    appt.status = status;
    if (status === 'accepted') {
      appt.meetingLink = `https://meet.stresssync.app/${appt._id}`;
    }
    await appt.save();

    // Notify student
    const statusMessages = {
      accepted: 'Your appointment has been confirmed! Meeting link is ready.',
      declined: 'Your appointment request was declined. Please try another time slot.',
      completed: 'Your session has been marked complete. Great work!'
    };
    if (statusMessages[status]) {
      await Notification.create({
        userId: appt.studentId,
        type: 'appointment',
        title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        body: statusMessages[status],
        icon: status === 'accepted' ? 'check_circle' : 'cancel',
        actionUrl: '/appointments'
      });
    }

    res.json({ appointment: appt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
