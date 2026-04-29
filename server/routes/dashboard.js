const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');

// Map stress report
const mapStressReport = (sr) => {
  if (!sr) return null;
  return {
    _id: sr.id,
    id: sr.id,
    userId: sr.user_id,
    wellnessDataId: sr.wellness_data_id,
    stressScore: sr.stress_score,
    burnoutRisk: sr.burnout_risk,
    recommendations: sr.recommendations,
    createdAt: sr.created_at
  };
};

const mapWellnessData = (wd) => {
  if (!wd) return null;
  return {
    _id: wd.id,
    id: wd.id,
    userId: wd.user_id,
    sleepHours: wd.sleep_hours,
    screenTime: wd.screen_time,
    exerciseHours: wd.exercise_hours,
    studyHours: wd.study_hours,
    socialScore: wd.social_score,
    mood: wd.mood,
    stressScore: wd.stress_score,
    createdAt: wd.created_at
  };
};

// GET /api/dashboard
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Latest stress report
    const { data: latestReportRaw } = await supabase
      .from('stress_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const latestReport = latestReportRaw ? mapStressReport(latestReportRaw) : null;

    // Last 7 wellness entries for trend chart
    const { data: wellnessHistoryRaw } = await supabase
      .from('wellness_data')
      .select('id, sleep_hours, screen_time, exercise_hours, stress_score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(7);

    let wellnessHistory = [];
    if (wellnessHistoryRaw) {
      wellnessHistory = wellnessHistoryRaw.map(mapWellnessData).reverse();
    }

    // Task stats
    const { count: totalTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    const { count: completedTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed');
    const { count: inProgressTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'in-progress');

    // Upcoming appointments
    const { data: upcomingApptsRaw } = await supabase
      .from('appointments')
      .select('id, date_time, status, notes, mentor_id, profiles:mentor_id(first_name, last_name)')
      .eq('student_id', userId)
      .eq('status', 'accepted')
      .gte('date_time', new Date().toISOString())
      .order('date_time', { ascending: true })
      .limit(3);

    const upcomingAppointments = (upcomingApptsRaw || []).map(appt => ({
      _id: appt.id,
      id: appt.id,
      dateTime: appt.date_time,
      status: appt.status,
      notes: appt.notes,
      mentorId: appt.profiles ? {
        _id: appt.mentor_id,
        firstName: appt.profiles.first_name,
        lastName: appt.profiles.last_name
      } : { _id: appt.mentor_id }
    }));

    // Unread notifications count
    const { count: unreadCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('read', false);

    // Latest wellness entry
    const { data: latestWellnessRaw } = await supabase
      .from('wellness_data')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const latestWellness = latestWellnessRaw ? mapWellnessData(latestWellnessRaw) : null;

    res.json({
      stressScore: latestReport?.stressScore ?? null,
      burnoutRisk: latestReport?.burnoutRisk ?? null,
      latestReport,
      wellnessHistory,
      tasks: { total: totalTasks || 0, completed: completedTasks || 0, inProgress: inProgressTasks || 0 },
      upcomingAppointments,
      unreadNotifications: unreadCount || 0,
      latestWellness
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
