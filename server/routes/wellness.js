const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const WellnessData = require('../models/WellnessData');
const Notification = require('../models/Notification');

// POST /api/wellness - submit data
router.post('/', protect, async (req, res) => {
  try {
    const { sleepHours, screenTime, exerciseHours, studyHours, socialScore, mood, notes } = req.body;
    const wellness = await WellnessData.create({
      userId: req.user._id,
      sleepHours, screenTime, exerciseHours, studyHours, socialScore, mood, notes
    });

    // Trigger notification
    await Notification.create({
      userId: req.user._id,
      type: 'wellness',
      title: 'Wellness Check-In Recorded',
      body: 'Your daily wellness data has been submitted. AI analysis is ready.',
      icon: 'favorite',
      actionUrl: '/analysis'
    });

    res.status(201).json({ wellness });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/wellness - history
router.get('/', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 7;
    const data = await WellnessData.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/wellness/latest
router.get('/latest', protect, async (req, res) => {
  try {
    const latest = await WellnessData.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ wellness: latest });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
