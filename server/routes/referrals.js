const express = require('express');
const router = express.Router();
const { protect, mentorOnly } = require('../middleware/auth');
const Referral = require('../models/Referral');

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'SYNC-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

// POST /api/referrals/generate (mentor only)
router.post('/generate', protect, mentorOnly, async (req, res) => {
  try {
    let code;
    let exists = true;
    while (exists) {
      code = generateCode();
      exists = await Referral.findOne({ code });
    }
    const referral = await Referral.create({ mentorId: req.user._id, code });
    res.status(201).json({ referral });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/referrals/my (mentor gets their codes)
router.get('/my', protect, mentorOnly, async (req, res) => {
  try {
    const referrals = await Referral.find({ mentorId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('studentId', 'firstName lastName email');
    res.json({ referrals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/referrals/validate
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    const referral = await Referral.findOne({ code: code?.toUpperCase(), isActive: true });
    if (!referral) return res.status(400).json({ valid: false, message: 'Invalid or expired code' });
    res.json({ valid: true, message: 'Valid referral code' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
