const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const WellnessData = require('../models/WellnessData');
const StressReport = require('../models/StressReport');
const Task = require('../models/Task');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');

// GET /api/dashboard
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Latest stress report
    const latestReport = await StressReport.findOne({ userId }).sort({ createdAt: -1 });

    // Last 7 wellness entries for trend chart
    const wellnessHistory = await WellnessData.find({ userId })
      .sort({ createdAt: -1 })
      .limit(7)
      .select('sleepHours screenTime exerciseHours stressScore createdAt');

    // Task stats
    const [totalTasks, completedTasks, inProgressTasks] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, status: 'completed' }),
      Task.countDocuments({ userId, status: 'in-progress' }),
    ]);

    // Upcoming appointments
    const upcomingAppts = await Appointment.find({
      studentId: userId,
      status: 'accepted',
      dateTime: { $gte: new Date() }
    }).sort({ dateTime: 1 }).limit(3).populate('mentorId', 'firstName lastName');

    // Unread notifications count
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    // Latest wellness entry
    const latestWellness = await WellnessData.findOne({ userId }).sort({ createdAt: -1 });

    res.json({
      stressScore: latestReport?.stressScore ?? null,
      burnoutRisk: latestReport?.burnoutRisk ?? null,
      latestReport,
      wellnessHistory: wellnessHistory.reverse(),
      tasks: { total: totalTasks, completed: completedTasks, inProgress: inProgressTasks },
      upcomingAppointments: upcomingAppts,
      unreadNotifications: unreadCount,
      latestWellness
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
