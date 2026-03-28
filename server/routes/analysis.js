const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { analyzeWellness } = require('../services/aiEngine');
const WellnessData = require('../models/WellnessData');
const StressReport = require('../models/StressReport');
const Notification = require('../models/Notification');

// POST /api/analysis/analyze
router.post('/analyze', protect, async (req, res) => {
  try {
    const { wellnessDataId } = req.body;
    let wellness;
    if (wellnessDataId) {
      wellness = await WellnessData.findById(wellnessDataId);
    } else {
      wellness = await WellnessData.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    }
    if (!wellness) return res.status(404).json({ message: 'No wellness data found. Please submit a check-in first.' });

    const result = analyzeWellness(wellness);

    // Store report
    const report = await StressReport.create({
      userId: req.user._id,
      wellnessDataId: wellness._id,
      ...result
    });

    // Update wellness record with computed stress
    wellness.stressScore = result.stressScore;
    wellness.burnoutRisk = result.burnoutRisk;
    await wellness.save();

    // Notification for high stress
    if (result.burnoutRisk === 'high') {
      await Notification.create({
        userId: req.user._id,
        type: 'analysis',
        title: '⚠️ High Stress Detected',
        body: `Your stress score is ${result.stressScore}/100. We recommend booking a mentor session immediately.`,
        icon: 'warning',
        actionUrl: '/appointments'
      });
    } else if (result.burnoutRisk === 'moderate') {
      await Notification.create({
        userId: req.user._id,
        type: 'analysis',
        title: 'Moderate Stress Detected',
        body: `Stress score: ${result.stressScore}/100. Check your AI recommendations.`,
        icon: 'analytics',
        actionUrl: '/analysis'
      });
    }

    res.json({ report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analysis/history
router.get('/history', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const reports = await StressReport.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('wellnessDataId', 'sleepHours screenTime exerciseHours studyHours socialScore mood createdAt');
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analysis/latest
router.get('/latest', protect, async (req, res) => {
  try {
    const report = await StressReport.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('wellnessDataId');
    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
