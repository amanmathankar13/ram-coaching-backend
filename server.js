// ============================================================
//  RAM COACHING CLASSES — Backend Server
//  Node.js + Express + MongoDB
//  Usage: npm install && npm start
// ============================================================
const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')       // ← only ONE time
const dotenv   = require('dotenv')
const path     = require('path')

dotenv.config()
const app = express()

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.options('*', cors())

app.use(express.json())

app.use('/api/auth',      require('./routes/authRoutes'))
app.use('/api/students',  require('./routes/studentRoutes'))
app.use('/api/materials', require('./routes/materialRoutes'))
app.use('/api/dpp',       require('./routes/dppRoutes'))
app.use('/api/notices',   require('./routes/noticeRoutes'))
app.use('/api/inquiry',   require('./routes/inquiryRoutes'))

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err))

const PORT = process.env.PORT || 5000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
})