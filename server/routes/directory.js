const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');

// Helper to map snake_case to camelCase
const mapProfile = (p) => ({
  _id: p.id,
  id: p.id,
  firstName: p.first_name,
  lastName: p.last_name,
  email: p.email,
  bio: p.bio,
  expertise: p.expertise,
  avatar: p.avatar,
  createdAt: p.created_at
});

// GET /api/directory/mentors
router.get('/mentors', protect, async (req, res) => {
  try {
    let query = supabase
      .from('profiles')
      .select('id, first_name, last_name, email, bio, expertise, avatar, created_at')
      .eq('role', 'mentor')
      .eq('is_active', true);

    // Students should only see their assigned mentor, not all mentors
    if (req.user.role === 'student') {
      if (req.user.mentorId) {
        query = query.eq('id', req.user.mentorId);
      } else {
        // If student has no mentor, return empty list
        return res.json({ mentors: [] });
      }
    }
      
    const { data, error } = await query;
    if (error) throw error;
    
    // Map to camelCase
    const mentors = data.map(mapProfile);
    res.json({ mentors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/directory/mentors/:id
router.get('/mentors/:id', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, bio, expertise, avatar, created_at')
      .eq('id', req.params.id)
      .eq('role', 'mentor')
      .single();
      
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
    
    if (!data) return res.status(404).json({ message: 'Mentor not found' });
    
    const mentor = mapProfile(data);
    res.json({ mentor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/directory/my-mentor (student gets their assigned mentor)
router.get('/my-mentor', protect, async (req, res) => {
  try {
    if (!req.user.mentorId) return res.json({ mentor: null });
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, bio, expertise, avatar, created_at')
      .eq('id', req.user.mentorId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) return res.json({ mentor: null });
    
    const mentor = mapProfile(data);
    res.json({ mentor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/directory/students (mentor gets their assigned students)
router.get('/students', protect, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') return res.status(403).json({ message: 'Forbidden: Students only accessible to mentors' });
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, bio, avatar, created_at')
      .eq('mentor_id', req.user.id)
      .eq('role', 'student')
      .eq('is_active', true);
      
    if (error) throw error;
    
    const students = data.map(mapProfile);
    res.json({ students });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/directory/students-stress (mentor sees each student's latest stress data)
router.get('/students-stress', protect, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') return res.status(403).json({ message: 'Forbidden: Only mentors can access this' });

    // Get all students assigned to this mentor
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar')
      .eq('mentor_id', req.user.id)
      .eq('role', 'student')
      .eq('is_active', true);

    if (studentsError) throw studentsError;
    if (!students || students.length === 0) return res.json({ students: [] });

    const studentIds = students.map(s => s.id);

    // Get latest stress report per student
    const { data: stressReports, error: stressError } = await supabase
      .from('stress_reports')
      .select('user_id, stress_score, burnout_risk, burnout_percentage, contributing_factors, predictive_trend, created_at')
      .in('user_id', studentIds)
      .order('created_at', { ascending: false });

    if (stressError) throw stressError;

    // Get latest wellness entry per student (for notes/mood/reason)
    const { data: wellnessEntries, error: wellnessError } = await supabase
      .from('wellness_data')
      .select('user_id, mood, notes, anxiety_level, recent_changes, sleep_hours, study_hours, exercise_hours, created_at')
      .in('user_id', studentIds)
      .order('created_at', { ascending: false });

    if (wellnessError) throw wellnessError;

    // Build map: latest report per student
    const latestReportMap = {};
    for (const report of (stressReports || [])) {
      if (!latestReportMap[report.user_id]) {
        latestReportMap[report.user_id] = report;
      }
    }

    // Build map: latest wellness entry per student
    const latestWellnessMap = {};
    for (const entry of (wellnessEntries || [])) {
      if (!latestWellnessMap[entry.user_id]) {
        latestWellnessMap[entry.user_id] = entry;
      }
    }

    // Merge
    const result = students.map(s => {
      const report = latestReportMap[s.id] || null;
      const wellness = latestWellnessMap[s.id] || null;
      return {
        _id: s.id,
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        email: s.email,
        avatar: s.avatar,
        stressScore: report?.stress_score ?? null,
        burnoutRisk: report?.burnout_risk ?? null,
        burnoutPercentage: report?.burnout_percentage ?? null,
        contributingFactors: report?.contributing_factors || [],
        predictiveTrend: report?.predictive_trend ?? null,
        lastReportAt: report?.created_at ?? null,
        mood: wellness?.mood ?? null,
        notes: wellness?.notes ?? null,
        anxietyLevel: wellness?.anxiety_level ?? null,
        recentChanges: wellness?.recent_changes ?? null,
        sleepHours: wellness?.sleep_hours ?? null,
        studyHours: wellness?.study_hours ?? null,
        exerciseHours: wellness?.exercise_hours ?? null,
        lastCheckinAt: wellness?.created_at ?? null,
      };
    });

    res.json({ students: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/directory/kickout/:id
router.post('/kickout/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') return res.status(403).json({ message: 'Forbidden' });
    
    // Verify student is assigned to this mentor
    const { data: student, error: fetchError } = await supabase
      .from('profiles')
      .select('id, mentor_id, first_name')
      .eq('id', req.params.id)
      .single();
      
    if (fetchError || !student) return res.status(404).json({ message: 'Student not found' });
    if (student.mentor_id !== req.user.id) return res.status(403).json({ message: 'Student not assigned to you' });
    
    // Unassign
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ mentor_id: null })
      .eq('id', req.params.id);
      
    if (updateError) throw updateError;

    // Notify student
    await supabase.from('notifications').insert([{
      user_id: req.params.id,
      type: 'system',
      title: 'Mentorship Ended',
      body: `Your mentorship with ${req.user.firstName} ${req.user.lastName} has ended.`,
      icon: 'heart_broken'
    }]);
    
    res.json({ message: 'Student successfully unassigned' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/directory/join
router.post('/join', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can join mentors' });
    
    const { referralCode } = req.body;
    if (!referralCode) return res.status(400).json({ message: 'Referral code is required' });
    
    // Validate code
    const { data: referral, error: refError } = await supabase
      .from('referrals')
      .select('*')
      .eq('code', referralCode.toUpperCase().trim())
      .eq('is_active', true)
      .single();
      
    if (refError || !referral) return res.status(400).json({ message: 'Invalid or expired referral code' });
    
    // Link student to mentor
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ mentor_id: referral.mentor_id })
      .eq('id', req.user.id);
      
    if (updateError) throw updateError;
    
    // Mark referral as used
    await supabase.from('referrals').update({ 
      is_active: false,
      student_id: req.user.id 
    }).eq('id', referral.id);
    
    // Notify mentor
    const { data: mentor } = await supabase.from('profiles').select('first_name, last_name').eq('id', referral.mentor_id).single();
    await supabase.from('notifications').insert([{
      user_id: referral.mentor_id,
      type: 'system',
      title: 'New Student Enrolled',
      body: `${req.user.firstName} ${req.user.lastName} has joined your mentorship using code ${referralCode}.`,
      icon: 'person_add'
    }]);
    
    res.json({ message: 'Successfully joined mentorship', mentor: { id: referral.mentor_id, firstName: mentor.first_name, lastName: mentor.last_name } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
