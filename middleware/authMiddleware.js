const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authenticated. Please login.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ message: 'User no longer exists.' });
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Only admins
exports.adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
  next();
};

// Only approved students (or admins)
exports.approved = (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (!req.user.isApproved) return res.status(403).json({ message: 'Account pending teacher approval.' });
  next();
};
