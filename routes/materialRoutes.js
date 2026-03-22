// ── materialRoutes.js ─────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const { Material } = require('../models/models');
const { protect, adminOnly, approved } = require('../middleware/authMiddleware');

// GET /api/materials/public  — Free resources (no login needed)
router.get('/public', async (req, res) => {
  const materials = await Material.find({ isPublic: true }).select('-driveLink');
  res.json(materials);
});

// GET /api/materials/mine  — Approved student's materials
router.get('/mine', protect, approved, async (req, res) => {
  try {
    const User = require('../models/User')
    const student = await User.findById(req.user._id).populate('allowedMaterials')

    // Get materials explicitly assigned to this student
    const studentMaterials = student.allowedMaterials || []

    // Get materials assigned to student's class OR all classes
    const classMaterials = await Material.find({
      $or: [
        { class: req.user.class },
        { class: 'all' },
      ]
    })

    // Merge both, remove duplicates by _id
    const seen = new Set()
    const merged = [...studentMaterials, ...classMaterials].filter(m => {
      const id = m._id.toString()
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })

    res.json(merged)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/materials  — All materials (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  const materials = await Material.find();
  res.json(materials);
});

// POST /api/materials  — Upload new material (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  const material = await Material.create({ ...req.body, uploadedBy: req.user._id });
  res.status(201).json(material);
});

// DELETE /api/materials/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  await Material.findByIdAndDelete(req.params.id);
  res.json({ message: 'Material deleted.' });
});

module.exports = router;
