const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const { data: user } = await supabase.from('profiles').select('id, first_name, last_name, email, role, mentor_id, avatar, bio, expertise').eq('id', decoded.id).single();
    
    if (!user) return res.status(401).json({ message: 'User not found' });
    
    // Map properties to match what Mongoose used to return
    req.user = {
      _id: user.id,
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      mentorId: user.mentor_id,
      avatar: user.avatar,
      bio: user.bio,
      expertise: user.expertise
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token verification failed' });
  }
};

const mentorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'mentor') return next();
  res.status(403).json({ message: 'Access restricted to mentors' });
};

module.exports = { protect, mentorOnly };
