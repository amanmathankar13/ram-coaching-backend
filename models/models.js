const mongoose = require('mongoose');

// ─── Study Material ───────────────────────────────────────────
const materialSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  subject:     { type: String, enum: ['Physics','Chemistry','Maths','Biology','English','SST','General'] },
  class:       { type: String },   // e.g. '12-PCM' or 'all'
  type:        { type: String, enum: ['pdf','video','notes','dpp','formula-sheet','pyq'] },
  driveLink:   { type: String, required: true },
  isPublic:    { type: Boolean, default: false },   // free/public resource
  uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt:  { type: Date, default: Date.now },
});
const Material = mongoose.model('Material', materialSchema);

// ─── DPP Question ─────────────────────────────────────────────
const dppSchema = new mongoose.Schema({
  subject:    { type: String, required: true, enum: ['Physics','Chemistry','Maths','Biology'] },
  class:      { type: String },
  question:   { type: String, required: true },
  options:    [{ type: String }],
  answerIndex:{ type: Number },
  explanation:{ type: String },
  source:     { type: String, enum: ['manual','ai'], default: 'manual' },
  date:       { type: Date, default: Date.now },
  addedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});
const DPP = mongoose.model('DPP', dppSchema);

// ─── Notice / Announcement ────────────────────────────────────
const noticeSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  body:       { type: String, required: true },
  targetClass:{ type: String, default: 'all' },  // 'all' or specific class
  postedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postedAt:   { type: Date, default: Date.now },
  isActive:   { type: Boolean, default: true },
});
const Notice = mongoose.model('Notice', noticeSchema);

// ─── Inquiry Form ─────────────────────────────────────────────
const inquirySchema = new mongoose.Schema({
  studentName:  { type: String, required: true },
  parentName:   { type: String },
  phone:        { type: String, required: true },
  email:        { type: String },
  class:        { type: String },
  targetExam:   { type: String },
  message:      { type: String },
  status:       { type: String, enum: ['new','contacted','enrolled','closed'], default: 'new' },
  submittedAt:  { type: Date, default: Date.now },
});
const Inquiry = mongoose.model('Inquiry', inquirySchema);

module.exports = { Material, DPP, Notice, Inquiry };