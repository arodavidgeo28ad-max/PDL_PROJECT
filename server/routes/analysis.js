const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { analyzeWellness } = require('../services/aiEngine');
const supabase = require('../config/supabase');

// Map stress report and nested wellness data to Mongoose-like camelCase
const mapStressReport = (sr) => {
  if (!sr) return null;
  const mapped = {
    _id: sr.id,
    id: sr.id,
    userId: sr.user_id,
    wellnessDataId: sr.wellness_data_id,
    stressScore: sr.stress_score,
    burnoutRisk: sr.burnout_risk,
    burnoutPercentage: sr.burnout_percentage,
    contributingFactors: sr.contributing_factors || [],
    predictiveTrend: sr.predictive_trend,
    recommendations: sr.recommendations,
    createdAt: sr.created_at
  };
  
  if (sr.wellness_data && Array.isArray(sr.wellness_data)) {
    const wd = sr.wellness_data[0];
    mapped.wellnessDataId = {
      _id: wd.id,
      sleepHours: wd.sleep_hours,
      screenTime: wd.screen_time,
      exerciseHours: wd.exercise_hours,
      studyHours: wd.study_hours,
      socialScore: wd.social_score,
      mood: wd.mood,
      createdAt: wd.created_at
    };
  } else if (sr.wellness_data) {
     const wd = sr.wellness_data;
     mapped.wellnessDataId = {
      _id: wd.id,
      sleepHours: wd.sleep_hours,
      screenTime: wd.screen_time,
      exerciseHours: wd.exercise_hours,
      studyHours: wd.study_hours,
      socialScore: wd.social_score,
      mood: wd.mood,
      createdAt: wd.created_at
    };
  }
  
  return mapped;
};

// POST /api/analysis/analyze
router.post('/analyze', protect, async (req, res) => {
  try {
    const { wellnessDataId } = req.body;
    let wellnessRecord;
    
    if (wellnessDataId) {
      const { data } = await supabase.from('wellness_data').select('*').eq('id', wellnessDataId).single();
      wellnessRecord = data;
    } else {
      const { data } = await supabase.from('wellness_data').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(1).single();
      wellnessRecord = data;
    }
    
    if (!wellnessRecord) return res.status(404).json({ message: 'No wellness data found. Please submit a check-in first.' });

    // Map snake to camel for AI engine which expects Mongoose-like doc
    const wellnessForAi = {
      sleepHours: wellnessRecord.sleep_hours,
      screenTime: wellnessRecord.screen_time,
      exerciseHours: wellnessRecord.exercise_hours,
      studyHours: wellnessRecord.study_hours,
      socialScore: wellnessRecord.social_score,
      mood: wellnessRecord.mood,
      anxietyLevel: wellnessRecord.anxiety_level,
      recentChanges: wellnessRecord.recent_changes
    };

    // Map resilience_score (0-100) back to PSS score (0-40) for AI engine
    if (wellnessRecord.resilience_score !== null && wellnessRecord.resilience_score !== undefined) {
      wellnessForAi.pssScore = Math.round(((100 - wellnessRecord.resilience_score) / 100) * 40);
    }

    const result = analyzeWellness(wellnessForAi);

    // Store report
    const { data: storedReport, error: reportError } = await supabase.from('stress_reports').insert([{
      user_id: req.user.id,
      wellness_data_id: wellnessRecord.id,
      stress_score: result.stressScore,
      burnout_risk: result.burnoutRisk,
      burnout_percentage: result.burnoutPercentage,
      contributing_factors: result.contributingFactors,
      predictive_trend: result.predictiveTrend,
      recommendations: result.recommendations
    }]).select().single();
    
    if (reportError) throw reportError;

    // Update wellness record with computed stress
    await supabase.from('wellness_data').update({
      stress_score: result.stressScore,
      burnout_risk: result.burnoutRisk
    }).eq('id', wellnessRecord.id);

    // Notification for high stress
    if (result.burnoutRisk === 'high') {
      await supabase.from('notifications').insert([{
        user_id: req.user.id,
        type: 'analysis',
        title: '⚠️ High Stress Detected',
        body: `Your stress score is ${result.stressScore}/100. We recommend booking a mentor session immediately.`,
        icon: 'warning',
        action_url: '/appointments'
      }]);
    } else if (result.burnoutRisk === 'moderate') {
      await supabase.from('notifications').insert([{
        user_id: req.user.id,
        type: 'analysis',
        title: 'Moderate Stress Detected',
        body: `Stress score: ${result.stressScore}/100. Check your AI recommendations.`,
        icon: 'analytics',
        action_url: '/analysis'
      }]);
    }

    res.json({ report: mapStressReport(storedReport) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analysis/history
router.get('/history', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const { data, error } = await supabase
      .from('stress_reports')
      .select('*, wellness_data!inner(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    const reports = data.map(mapStressReport);
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analysis/latest
router.get('/latest', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stress_reports')
      .select('*, wellness_data!inner(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    
    res.json({ report: mapStressReport(data) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
