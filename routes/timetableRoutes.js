// ── timetableRoutes.js ────────────────────────────────────────
const express  = require('express');
const router   = express.Router();
const { Timetable, Subject } = require('../models/models');
const { protect, adminOnly, approved } = require('../middleware/authMiddleware');

const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// ── TIMETABLE ─────────────────────────────────────────────────

// GET /api/timetable?class=12-PCM — student fetches their class timetable
router.get('/', protect, approved, async (req, res) => {
  try {
    const cls = req.query.class || req.user.class;
    const rows = await Timetable.find({ class: cls }).sort('order');
    // Sort by day order
    rows.sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/timetable/all — admin fetches all classes timetable
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const { class: cls } = req.query;
    const filter = cls ? { class: cls } : {};
    const rows = await Timetable.find(filter).sort('order');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/timetable — admin adds a timetable row
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { class: cls, day, subject, time, faculty } = req.body;
    if (!cls || !day || !subject || !time)
      return res.status(400).json({ message: 'class, day, subject and time are required.' });
    const order = DAY_ORDER.indexOf(day);
    const row = await Timetable.create({ class: cls, day, subject, time, faculty, order });
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/timetable/:id — admin edits a row
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const row = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!row) return res.status(404).json({ message: 'Row not found.' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/timetable/:id — admin deletes a row
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── SUBJECTS ──────────────────────────────────────────────────

// GET /api/timetable/subjects?class=12-PCM
router.get('/subjects', protect, approved, async (req, res) => {
  try {
    const cls = req.query.class || req.user.class;
    const subjects = await Subject.find({ class: cls }).sort('order');
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/timetable/subjects/all — admin gets all subjects
router.get('/subjects/all', protect, adminOnly, async (req, res) => {
  try {
    const { class: cls } = req.query;
    const filter = cls ? { class: cls } : {};
    const subjects = await Subject.find(filter).sort('order');
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/timetable/subjects — admin adds subject
router.post('/subjects', protect, adminOnly, async (req, res) => {
  try {
    const { class: cls, name, color, tags } = req.body;
    if (!cls || !name)
      return res.status(400).json({ message: 'class and name are required.' });
    const count = await Subject.countDocuments({ class: cls });
    const subject = await Subject.create({ class: cls, name, color: color || 'var(--accent)', tags: tags || [], order: count });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/timetable/subjects/:id — admin edits subject
router.put('/subjects/:id', protect, adminOnly, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) return res.status(404).json({ message: 'Subject not found.' });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/timetable/subjects/:id — admin deletes subject
router.delete('/subjects/:id', protect, adminOnly, async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subject deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;