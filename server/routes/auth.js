const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

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

    const { data: existing, error: existError } = await supabase.from('profiles').select('id').eq('email', email).single();
    // PGRST116 = no rows found, which is expected (means email is available)
    if (existError && existError.code !== 'PGRST116') throw existError;
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    let mentorId = null;

    // Students MUST provide a valid referral code to register
    if (role === 'student') {
      if (!referralCode) {
        return res.status(400).json({ message: 'A referral code from your mentor is required to register as a student.' });
      }
      const { data: referral } = await supabase.from('referrals').select('*').eq('code', referralCode.toUpperCase().trim()).eq('is_active', true).single();
      if (!referral) {
        return res.status(400).json({ message: 'Invalid or expired referral code. Please ask your mentor for a valid code.' });
      }
      mentorId = referral.mentor_id;

      // Mark referral as used (we'll update studentId after user creation)
      await supabase.from('referrals').update({ is_active: false }).eq('id', referral.id);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { data: user, error: userError } = await supabase.from('profiles').insert([{
      first_name: firstName,
      last_name: lastName,
      email,
      password_hash,
      role,
      mentor_id: mentorId
    }]).select().single();

    if (userError) throw userError;

    // Link referral to the new student
    if (role === 'student' && mentorId) {
      await supabase.from('referrals').update({ student_id: user.id }).eq('code', referralCode.toUpperCase().trim());
    }

    // Welcome notification
    await supabase.from('notifications').insert([{
      user_id: user.id,
      type: 'system',
      title: role === 'mentor' ? 'Welcome to StressSync Mentorship!' : 'Welcome to StressSync!',
      body: role === 'mentor' 
        ? `Hi ${firstName}, your Mentor Dashboard is ready. You can now generate referral codes and accept students.`
        : `Hi ${firstName}, your Luminescent Sanctuary is ready. Start by submitting your first wellness check-in.`,
      icon: role === 'mentor' ? 'psychology' : 'spa'
    }]);

    const token = signToken(user.id);
    res.status(201).json({
      token,
      user: { _id: user.id, firstName, lastName, email, role, mentorId }
    });
  } catch (err) {
    console.error('Registration error:', err);
    const message = err.message || 'Server error';
    res.status(500).json({ message });
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
    const { data: user } = await supabase.from('profiles').select('*').eq('email', email).single();
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    
    const token = signToken(user.id);
    res.json({
      token,
      user: { _id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role, mentorId: user.mentor_id }
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
