const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const nodemailer = require('nodemailer');

// ── Helper: Generate JWT ──────────────────────────────────────
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// ── Helper: Send email ────────────────────────────────────────
async function sendMail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, port: process.env.EMAIL_PORT,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
}

// POST /api/auth/register  — Student Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, class: cls } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered.' });

    const student = await User.create({ name, email, password, phone, class: cls, role: 'student', isApproved: false });

    // Notify admin
    try {
      await sendMail({
        to: process.env.ADMIN_EMAIL,
        subject: `New Student Registration: ${name}`,
        html: `<p><b>${name}</b> (${email}, Class ${cls}) has registered. <b>Please approve from Admin Dashboard.</b></p>`
      });
    } catch {}

    res.status(201).json({
      message: 'Registration successful! Waiting for teacher approval.',
      student: { id: student._id, name: student.name, isApproved: false }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login  — Student or Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials.' });

    if (user.role === 'student' && !user.isApproved) {
      return res.status(403).json({ message: 'Account pending teacher approval.', pending: true });
    }

    const token = signToken(user._id);
    res.json({ token, user: { id: user._id, name: user.name, role: user.role, class: user.class } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me  — Get current user
router.get('/me', require('../middleware/authMiddleware').protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
