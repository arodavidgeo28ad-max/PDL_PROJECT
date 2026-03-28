const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// GET /api/directory/mentors
router.get('/mentors', protect, async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor', isActive: true })
      .select('firstName lastName email bio expertise avatar createdAt');
    res.json({ mentors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/directory/mentors/:id
router.get('/mentors/:id', protect, async (req, res) => {
  try {
    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor' })
      .select('firstName lastName email bio expertise avatar');
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });
    res.json({ mentor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/directory/my-mentor (student gets their assigned mentor)
router.get('/my-mentor', protect, async (req, res) => {
  try {
    if (!req.user.mentorId) return res.json({ mentor: null });
    const mentor = await User.findById(req.user.mentorId).select('firstName lastName email bio expertise avatar');
    res.json({ mentor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
