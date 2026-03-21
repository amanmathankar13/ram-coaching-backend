// ── dppRoutes.js ──────────────────────────────────────────────
const express = require('express');
const dppRouter = express.Router();
const { DPP } = require('../models/models');
const { protect, adminOnly, approved } = require('../middleware/authMiddleware');

// GET /api/dpp?subject=Physics  — Today's DPP (public/student)
dppRouter.get('/', protect, approved, async (req, res) => {
  const { subject } = req.query;
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  const filter = { date: { $gte: today, $lt: tomorrow } };
  if (subject) filter.subject = subject;
  const questions = await DPP.find(filter).limit(5);
  res.json(questions);
});

// POST /api/dpp  — Add DPP question (admin)
dppRouter.post('/', protect, adminOnly, async (req, res) => {
  const q = await DPP.create({ ...req.body, addedBy: req.user._id });
  res.status(201).json(q);
});

// DELETE /api/dpp/:id
dppRouter.delete('/:id', protect, adminOnly, async (req, res) => {
  await DPP.findByIdAndDelete(req.params.id);
  res.json({ message: 'Question deleted.' });
});

// ── noticeRoutes.js ───────────────────────────────────────────
const noticeRouter = express.Router();
const { Notice } = require('../models/models');

// GET /api/notices  — Notices for logged-in student
noticeRouter.get('/', protect, approved, async (req, res) => {
  const cls = req.user.class || '';
  const notices = await Notice.find({
    isActive: true,
    $or: [{ targetClass: 'all' }, { targetClass: cls }]
  }).sort('-postedAt').limit(20);
  res.json(notices);
});

// POST /api/notices  — Post notice (admin)
noticeRouter.post('/', protect, adminOnly, async (req, res) => {
  const notice = await Notice.create({ ...req.body, postedBy: req.user._id });
  res.status(201).json(notice);
});

// DELETE /api/notices/:id
noticeRouter.delete('/:id', protect, adminOnly, async (req, res) => {
  await Notice.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ message: 'Notice removed.' });
});

// ── inquiryRoutes.js ──────────────────────────────────────────
const inquiryRouter = express.Router();
const { Inquiry } = require('../models/models');
const nodemailer = require('nodemailer');

// POST /api/inquiry  — Public inquiry form submission
inquiryRouter.post('/', async (req, res) => {
  try {
    const inquiry = await Inquiry.create(req.body);
    // Notify admin
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST, port: process.env.EMAIL_PORT,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });
      await transporter.sendMail({
        from: process.env.EMAIL_FROM, to: process.env.ADMIN_EMAIL,
        subject: `New Inquiry: ${inquiry.studentName}`,
        html: `<p><b>${inquiry.studentName}</b> (Class: ${inquiry.class}, Phone: ${inquiry.phone}) has submitted an admission inquiry.<br><b>Message:</b> ${inquiry.message}</p>`
      });
    } catch {}
    res.status(201).json({ message: 'Inquiry submitted! We will contact you within 24 hours.', id: inquiry._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/inquiry  — All inquiries (admin)
inquiryRouter.get('/', protect, adminOnly, async (req, res) => {
  const inquiries = await Inquiry.find().sort('-submittedAt');
  res.json(inquiries);
});

// PATCH /api/inquiry/:id  — Update inquiry status
inquiryRouter.patch('/:id', protect, adminOnly, async (req, res) => {
  const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(inquiry);
});

module.exports = { dppRouter, noticeRouter, inquiryRouter };
