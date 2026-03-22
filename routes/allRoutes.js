// ══════════════════════════════════════════════════════════════
//  allRoutes.js — DPP (Hybrid Groq AI + Manual), Notices, Inquiries
//  Free AI: Groq (console.groq.com — free tier, 14400 req/day)
// ══════════════════════════════════════════════════════════════

const express    = require('express');
const Groq       = require('groq-sdk');
const { DPP, Notice, Inquiry } = require('../models/models');
const { protect, adminOnly, approved } = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer');

// ── DPP Router ────────────────────────────────────────────────
const dppRouter = express.Router();

// ── Helper: Generate questions via Groq (FREE — Llama 3) ─────
async function generateAIQuestions(subject, cls) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',   
    max_tokens:  1024,
    temperature: 0.7,
    messages: [{
      role:    'user',
      content: `Generate exactly 5 multiple choice questions for Class ${cls} ${subject} students preparing for JEE/NEET/Board exams in India.

Return ONLY a valid JSON array. No markdown, no explanation, no extra text:
[
  {
    "question": "question text here",
    "options": ["option A", "option B", "option C", "option D"],
    "answerIndex": 0,
    "explanation": "brief explanation why this is correct"
  }
]

Rules:
- Questions must match Class ${cls} ${subject} NCERT/JEE/NEET syllabus
- Each question must have exactly 4 options
- answerIndex must be 0, 1, 2, or 3
- Mix of easy, medium and hard difficulty
- Questions should be different each time`
    }]
  });

  const text   = completion.choices[0].message.content.trim();
  const clean  = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Groq returned empty or invalid response');
  }

  console.log(`✅ Groq generated ${parsed.length} questions for ${subject}`);
  return parsed;
}

// ── Helper: Retry with simpler prompt ─────────────────────────
async function retryAIQuestions(subject) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 800,
    messages: [{
      role:    'user',
      content: `Give 5 MCQ questions on ${subject} for Class 12 India board exam.
Return JSON array only, no other text:
[{"question":"...","options":["A","B","C","D"],"answerIndex":0,"explanation":"..."}]`
    }]
  });

  const text  = completion.choices[0].message.content.trim();
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ── GET /api/dpp?subject=Physics&class=12-PCM ─────────────────
// HYBRID: manual questions first → Groq AI → retry → empty
dppRouter.get('/', protect, approved, async (req, res) => {
  const { subject, class: cls } = req.query;
  const studentClass = cls || req.user.class || '12';
  const subjectName  = subject || 'Physics';

  try {
    // Step 1: Check if admin added manual questions today
    const today    = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const manualQuestions = await DPP.find({
      subject: subjectName,
      source:  'manual',
      date:    { $gte: today, $lt: tomorrow },
    }).limit(5);

    if (manualQuestions.length > 0) {
      console.log(`✅ Manual questions found for ${subjectName}`);
      return res.json({ questions: manualQuestions, source: 'manual' });
    }

    // Step 2: No manual questions — generate with Groq AI
    console.log(`🤖 No manual questions for ${subjectName}, generating with Groq AI...`);

    if (!process.env.GROQ_API_KEY) {
      console.log('⚠️ GROQ_API_KEY not set in Railway environment variables');
      return res.json({ questions: [], source: 'none' });
    }

    const cleanClass = studentClass.replace('-PCM','').replace('-PCB','');

    try {
      const aiQuestions = await generateAIQuestions(subjectName, cleanClass);

      const formatted = aiQuestions.map(q => ({
        subject:     subjectName,
        class:       studentClass,
        question:    q.question,
        options:     q.options,
        answerIndex: q.answerIndex,
        explanation: q.explanation || '',
        source:      'ai',
        date:        new Date(),
      }));

      return res.json({ questions: formatted, source: 'ai' });

    } catch (aiErr) {
      console.log(`⚠️ Groq generation failed: ${aiErr.message}, retrying...`);
      try {
        const retried   = await retryAIQuestions(subjectName);
        const formatted = retried.map(q => ({
          subject:     subjectName,
          class:       studentClass,
          question:    q.question,
          options:     q.options,
          answerIndex: q.answerIndex,
          explanation: q.explanation || '',
          source:      'ai',
          date:        new Date(),
        }));
        console.log(`✅ Retry successful — ${formatted.length} questions`);
        return res.json({ questions: formatted, source: 'ai' });
      } catch (retryErr) {
        console.error(`❌ Retry failed: ${retryErr.message}`);
        return res.json({ questions: [], source: 'error', error: retryErr.message });
      }
    }

  } catch (err) {
    console.error('❌ DPP route error:', err.message);
    return res.json({ questions: [], source: 'error', error: err.message });
  }
});

// ── GET /api/dpp/report?days=7 — Student's weekly DPP report ──
dppRouter.get('/report', protect, approved, async (req, res) => {
  try {
    const days   = parseInt(req.query.days) || 7;
    const report = [];

    for (let i = days - 1; i >= 0; i--) {
      const day  = new Date(); day.setHours(0,0,0,0); day.setDate(day.getDate() - i);
      const next = new Date(day); next.setDate(next.getDate() + 1);

      const subjects    = ['Physics','Chemistry','Maths','Biology'];
      const subjectData = [];
      let dayTotal  = 0;
      let attempted = false;

      for (const subject of subjects) {
        const questions = await DPP.find({
          subject,
          date: { $gte: day, $lt: next },
        }).limit(5);

        subjectData.push({
          subject,
          attempted:      questions.length > 0,
          totalQuestions: questions.length,
          correct:        0,
        });

        if (questions.length > 0) {
          attempted  = true;
          dayTotal  += questions.length;
        }
      }

      report.push({
        date:           day,
        attempted,
        subjects:       subjectData,
        totalQuestions: dayTotal,
        correct:        0,
      });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/dpp/all — All manual questions (admin only) ──────
dppRouter.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const { subject, class: cls } = req.query;
    const filter = { source: 'manual' };
    if (subject) filter.subject = subject;
    if (cls)     filter.class   = cls;
    const questions = await DPP.find(filter).sort('-date').limit(100);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/dpp — Admin adds manual question ────────────────
dppRouter.post('/', protect, adminOnly, async (req, res) => {
  try {
    const q = await DPP.create({
      ...req.body,
      source:  'manual',
      addedBy: req.user._id,
      date:    req.body.date || new Date(),
    });
    res.status(201).json(q);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/dpp/:id — Admin deletes question ──────────────
dppRouter.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await DPP.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Notice Router ─────────────────────────────────────────────
const noticeRouter = express.Router();

noticeRouter.get('/', protect, approved, async (req, res) => {
  try {
    const cls = req.user.class || '';
    const notices = await Notice.find({
      isActive: true,
      $or: [{ targetClass: 'all' }, { targetClass: cls }]
    }).sort('-postedAt').limit(20);
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

noticeRouter.post('/', protect, adminOnly, async (req, res) => {
  try {
    const notice = await Notice.create({ ...req.body, postedBy: req.user._id });
    res.status(201).json(notice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

noticeRouter.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Notice.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Notice removed.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Inquiry Router ────────────────────────────────────────────
const inquiryRouter = express.Router();

inquiryRouter.post('/', async (req, res) => {
  try {
    const inquiry = await Inquiry.create(req.body);
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });
      await transporter.sendMail({
        from:    process.env.EMAIL_FROM,
        to:      process.env.ADMIN_EMAIL,
        subject: `New Inquiry: ${inquiry.studentName}`,
        html:    `<p><b>${inquiry.studentName}</b> (Class: ${inquiry.class}, Phone: ${inquiry.phone}) submitted an inquiry.<br><b>Message:</b> ${inquiry.message}</p>`
      });
    } catch {}
    res.status(201).json({ message: 'Inquiry submitted! We will contact you within 24 hours.', id: inquiry._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

inquiryRouter.get('/', protect, adminOnly, async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort('-submittedAt');
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

inquiryRouter.patch('/:id', protect, adminOnly, async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(inquiry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = { dppRouter, noticeRouter, inquiryRouter };