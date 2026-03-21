const express    = require('express')
const router     = express.Router()
const User       = require('../models/User')
const nodemailer = require('nodemailer')
const { protect, adminOnly } = require('../middleware/authMiddleware')

// ── Email helper ──────────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  })
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  })
}

// GET /api/students — All students (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  const { class: cls, approved } = req.query
  const filter = { role: 'student' }
  if (cls)                  filter.class      = cls
  if (approved !== undefined) filter.isApproved = approved === 'true'
  const students = await User.find(filter).populate('allowedMaterials', 'title subject')
  res.json(students)
})

// PATCH /api/students/:id/approve — Approve student + send welcome email
router.patch('/:id/approve', protect, adminOnly, async (req, res) => {
  const student = await User.findByIdAndUpdate(
    req.params.id,
    { isApproved: true, approvedBy: req.user._id, approvedAt: new Date() },
    { new: true }
  )
  if (!student) return res.status(404).json({ message: 'Student not found' })

  // Send welcome email to student
  try {
    await sendMail({
      to:      student.email,
      subject: '🎉 Welcome to Ram Coaching Classes — Account Approved!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          
          <div style="background: linear-gradient(135deg, #d44808, #f08030); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">Ram Coaching Classes</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Pimpri, Pune</p>
          </div>

          <div style="background: #ffffff; padding: 32px; border: 1px solid #e8e8e8; border-top: none;">
            <h2 style="color: #1a1a1a; margin: 0 0 16px;">
              Congratulations, ${student.name}! 🎉
            </h2>
            <p style="color: #444; line-height: 1.7; font-size: 15px;">
              Your account has been <strong style="color: #10b981;">approved</strong> by our team. 
              You can now login to your student dashboard and access all your study materials.
            </p>

            <div style="background: #f8f8fc; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 8px; color: #555; font-size: 14px;"><strong>Your Account Details:</strong></p>
              <p style="margin: 0 0 4px; color: #333; font-size: 14px;">👤 Name: <strong>${student.name}</strong></p>
              <p style="margin: 0 0 4px; color: #333; font-size: 14px;">📚 Class: <strong>${student.class}</strong></p>
              <p style="margin: 0; color: #333; font-size: 14px;">✉️ Email: <strong>${student.email}</strong></p>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login"
                style="background: #6c63ff; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
                Login to Dashboard →
              </a>
            </div>

            <p style="color: #444; line-height: 1.7; font-size: 14px;">
              In your dashboard you can access:
            </p>
            <ul style="color: #555; font-size: 14px; line-height: 2;">
              <li>📄 Study Materials & Notes assigned by your teacher</li>
              <li>📝 Daily Practice Problems (DPP)</li>
              <li>📅 Your Class Schedule</li>
              <li>📊 Syllabus Progress Tracker</li>
              <li>🔔 Notices & Announcements</li>
            </ul>
          </div>

          <div style="background: #f4f4fc; padding: 20px 32px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: #888; font-size: 13px; margin: 0 0 4px;">
              📍 Ram Coaching Classes, Tawanagar, Madhya Pradesh – 461551
            </p>
            <p style="color: #888; font-size: 13px; margin: 0 0 4px;">
              📞 +91 98765 43210 &nbsp;|&nbsp; ✉️ info@ramcoaching.in
            </p>
            <p style="color: #aaa; font-size: 12px; margin: 12px 0 0;">
              This is an automated email. Please do not reply to this email.
            </p>
          </div>

        </div>
      `
    })
    console.log(`✅ Welcome email sent to ${student.email}`)
  } catch (err) {
    console.error(`❌ Email failed for ${student.email}:`, err.message)
    // Don't block the approval if email fails
  }

  res.json({ message: `${student.name} approved. Welcome email sent.`, student })
})

// PATCH /api/students/:id/reject — Reject / revoke access
router.patch('/:id/reject', protect, adminOnly, async (req, res) => {
  const student = await User.findByIdAndUpdate(
    req.params.id,
    { isApproved: false },
    { new: true }
  )
  res.json({ message: `${student.name} access revoked.`, student })
})

// PATCH /api/students/:id/materials — Assign/revoke materials
router.patch('/:id/materials', protect, adminOnly, async (req, res) => {
  const { materialIds, action } = req.body
  const update = action === 'add'
    ? { $addToSet: { allowedMaterials: { $each: materialIds } } }
    : { $pull:     { allowedMaterials: { $in: materialIds } } }
  const student = await User.findByIdAndUpdate(req.params.id, update, { new: true })
    .populate('allowedMaterials')
  res.json(student)
})

module.exports = router
