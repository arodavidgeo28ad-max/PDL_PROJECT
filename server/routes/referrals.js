const express = require('express');
const router = express.Router();
const { protect, mentorOnly } = require('../middleware/auth');
const supabase = require('../config/supabase');

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
      const { data } = await supabase.from('referrals').select('id').eq('code', code).single();
      if (!data) exists = false;
    }
    
    const { data: referral, error } = await supabase.from('referrals').insert([{
      mentor_id: req.user.id,
      code: code
    }]).select().single();

    if (error) throw error;

    res.status(201).json({ referral: {
      _id: referral.id,
      id: referral.id,
      mentorId: referral.mentor_id,
      code: referral.code,
      isActive: referral.is_active,
      createdAt: referral.created_at
    }});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/referrals/my (mentor gets their codes)
router.get('/my', protect, mentorOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('*, student_profiles:profiles!student_id(id, first_name, last_name, email)')
      .eq('mentor_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const referrals = data.map(ref => ({
      _id: ref.id,
      id: ref.id,
      mentorId: ref.mentor_id,
      code: ref.code,
      isActive: ref.is_active,
      createdAt: ref.created_at,
      studentId: ref.student_profiles ? {
        _id: ref.student_profiles.id,
        firstName: ref.student_profiles.first_name,
        lastName: ref.student_profiles.last_name,
        email: ref.student_profiles.email
      } : ref.student_id
    }));

    res.json({ referrals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/referrals/validate
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ valid: false, message: 'Code is required' });
    
    const { data: referral, error } = await supabase
      .from('referrals')
      .select('id')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !referral) {
      return res.status(400).json({ valid: false, message: 'Invalid or expired code' });
    }
    
    res.json({ valid: true, message: 'Valid referral code' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
