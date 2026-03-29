// ============================================================
//  RAM COACHING CLASSES — Backend Server
//  Node.js + Express + MongoDB
//  Usage: npm install && npm start
// ============================================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Routes
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/students',  require('./routes/studentRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/timetable', require('./routes/timetableRoutes'));
app.use('/api/dpp',       require('./routes/dppRoutes'));
app.use('/api/notices',   require('./routes/noticeRoutes'));
app.use('/api/inquiry',   require('./routes/inquiryRoutes'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ramcoaching')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));