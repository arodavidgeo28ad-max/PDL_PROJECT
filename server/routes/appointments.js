const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');

const mapAppointment = (appt) => {
  if (!appt) return null;
  return {
    _id: appt.id,
    id: appt.id,
    studentId: appt.student_profiles ? {
      _id: appt.student_profiles.id,
      firstName: appt.student_profiles.first_name,
      lastName: appt.student_profiles.last_name,
      email: appt.student_profiles.email,
      avatar: appt.student_profiles.avatar
    } : appt.student_id,
    mentorId: appt.mentor_profiles ? {
      _id: appt.mentor_profiles.id,
      firstName: appt.mentor_profiles.first_name,
      lastName: appt.mentor_profiles.last_name,
      email: appt.mentor_profiles.email,
      avatar: appt.mentor_profiles.avatar,
      expertise: appt.mentor_profiles.expertise
    } : appt.mentor_id,
    dateTime: appt.date_time,
    status: appt.status,
    reason: appt.reason,
    urgency: appt.urgency,
    meetingLink: appt.meeting_link,
    notes: appt.notes,
    createdAt: appt.created_at
  };
};

// GET /api/appointments - list (student sees own, mentor sees for them)
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase.from('appointments').select('*, student_profiles:profiles!student_id(id, first_name, last_name, email, avatar), mentor_profiles:profiles!mentor_id(id, first_name, last_name, email, avatar, expertise)');

    if (req.user.role === 'student') {
      query = query.eq('student_id', req.user.id);
    } else {
      query = query.eq('mentor_id', req.user.id);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    const { data: appointments, error } = await query.order('date_time', { ascending: false });

    if (error) throw error;

    res.json({ appointments: appointments.map(mapAppointment) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/appointments - book (student only)
router.post('/', protect, async (req, res) => {
  try {
    const { mentorId, dateTime, reason, urgency } = req.body;
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can book appointments' });

    const { data: appt, error } = await supabase.from('appointments').insert([{
      student_id: req.user.id,
      mentor_id: mentorId,
      date_time: new Date(dateTime).toISOString(),
      reason,
      urgency: urgency || 'routine'
    }]).select('*, student_profiles:profiles!student_id(id, first_name, last_name, email, avatar), mentor_profiles:profiles!mentor_id(id, first_name, last_name, email, avatar, expertise)').single();

    if (error) throw error;

    // Notify the mentor
    await supabase.from('notifications').insert([{
      user_id: mentorId,
      type: 'appointment',
      title: 'New Appointment Request',
      body: `${req.user.firstName} ${req.user.lastName} has requested a meeting: "${reason}"`,
      icon: 'calendar_today',
      action_url: '/mentor/dashboard'
    }]);

    res.status(201).json({ appointment: mapAppointment(appt) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/appointments/:id/status - accept/decline/complete (mentor)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    const { data: currentAppt, error: findError } = await supabase.from('appointments').select('student_id').eq('id', req.params.id).single();
    if (findError || !currentAppt) return res.status(404).json({ message: 'Appointment not found' });

    let meeting_link = null;
    if (status === 'accepted') {
      meeting_link = `https://meet.stresssync.app/${req.params.id}`;
    }

    const { data: appt, error: updateError } = await supabase.from('appointments').update({
      status,
      meeting_link
    }).eq('id', req.params.id).select('*, student_profiles:profiles!student_id(id, first_name, last_name, email, avatar), mentor_profiles:profiles!mentor_id(id, first_name, last_name, email, avatar, expertise)').single();

    if (updateError) throw updateError;

    // Notify student
    const statusMessages = {
      accepted: 'Your appointment has been confirmed! Meeting link is ready.',
      declined: 'Your appointment request was declined. Please try another time slot.',
      completed: 'Your session has been marked complete. Great work!'
    };
    if (statusMessages[status]) {
      await supabase.from('notifications').insert([{
        user_id: currentAppt.student_id,
        type: 'appointment',
        title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        body: statusMessages[status],
        icon: status === 'accepted' ? 'check_circle' : 'cancel',
        action_url: '/appointments'
      }]);
    }

    res.json({ appointment: mapAppointment(appt) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
