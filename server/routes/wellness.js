const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');

const mapWellness = (w) => {
  if (!w) return null;
  return {
    _id: w.id,
    id: w.id,
    userId: w.user_id,
    sleepHours: w.sleep_hours,
    screenTime: w.screen_time,
    exerciseHours: w.exercise_hours,
    studyHours: w.study_hours,
    socialScore: w.social_score,
    mood: w.mood,
    notes: w.notes,
    stressScore: w.stress_score,
    burnoutRisk: w.burnout_risk,
    resilienceScore: w.resilience_score,
    pssScore: w.pss_score,
    anxietyLevel: w.anxiety_level,
    recentChanges: w.recent_changes,
    createdAt: w.created_at
  };
};

// POST /api/wellness - submit data
router.post('/', protect, async (req, res) => {
  try {
    const { sleepHours, screenTime, exerciseHours, studyHours, socialScore, mood, notes, resilienceScore, pssScore, anxietyLevel, recentChanges } = req.body;
    
    const insertData = {
      user_id: req.user.id,
      sleep_hours: sleepHours,
      screen_time: screenTime,
      exercise_hours: exerciseHours,
      study_hours: studyHours,
      social_score: socialScore,
      mood: mood,
      notes: notes
    };

    // Store resilience score from PSS-10 quiz if provided
    if (resilienceScore !== undefined && resilienceScore !== null) {
      insertData.resilience_score = resilienceScore;
    }
    if (pssScore !== undefined && pssScore !== null) {
      insertData.pss_score = pssScore;
    }
    if (anxietyLevel) insertData.anxiety_level = anxietyLevel;
    if (recentChanges) insertData.recent_changes = recentChanges;

    const { data: wellness, error } = await supabase.from('wellness_data').insert([insertData]).select().single();

    if (error) throw error;

    // Trigger notification
    await supabase.from('notifications').insert([{
      user_id: req.user.id,
      type: 'wellness',
      title: 'Wellness Check-In Recorded',
      body: 'Your daily wellness data has been submitted. AI analysis is ready.',
      icon: 'favorite',
      action_url: '/analysis'
    }]);

    res.status(201).json({ wellness: mapWellness(wellness) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/wellness - history
router.get('/', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 7;
    const { data, error } = await supabase.from('wellness_data')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    res.json({ data: data.map(mapWellness) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/wellness/latest
router.get('/latest', protect, async (req, res) => {
  try {
    const { data, error } = await supabase.from('wellness_data')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    
    res.json({ wellness: data ? mapWellness(data) : null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
