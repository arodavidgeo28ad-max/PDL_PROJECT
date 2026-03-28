const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Notification = require('../models/Notification');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /api/auth/register
router.post('/register', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['student', 'mentor']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { firstName, lastName, email, password, role, referralCode } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    let mentorId = null;

    // Students MUST provide a valid referral code to register
    if (role === 'student') {
      if (!referralCode) {
        return res.status(400).json({ message: 'A referral code from your mentor is required to register as a student.' });
      }
      const referral = await Referral.findOne({ code: referralCode.toUpperCase().trim(), isActive: true });
      if (!referral) {
        return res.status(400).json({ message: 'Invalid or expired referral code. Please ask your mentor for a valid code.' });
      }
      mentorId = referral.mentorId;
      // Mark referral as used
      referral.isActive = false;
      referral.studentId = null; // will be set after user creation
      await referral.save();
    }

    const user = await User.create({ firstName, lastName, email, password, role, mentorId });

    // Link referral to the new student
    if (role === 'student' && mentorId) {
      await Referral.findOneAndUpdate(
        { code: referralCode.toUpperCase().trim() },
        { studentId: user._id }
      );
    }

    // Welcome notification (Role-specific)
    await Notification.create({
      userId: user._id,
      type: 'system',
      title: role === 'mentor' ? 'Welcome to StressSync Mentorship!' : 'Welcome to StressSync!',
      body: role === 'mentor' 
        ? `Hi ${firstName}, your Mentor Dashboard is ready. You can now generate referral codes and accept students.`
        : `Hi ${firstName}, your Luminescent Sanctuary is ready. Start by submitting your first wellness check-in.`,
      icon: role === 'mentor' ? 'psychology' : 'spa'
    });

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { _id: user._id, firstName, lastName, email, role, mentorId }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = signToken(user._id);
    res.json({
      token,
      user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, mentorId: user.mentorId }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
const { protect } = require('../middleware/auth');
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
