# 🏫 Ram Coaching Classes — Full Stack Website


---

## 📁 Project Structure

```
ram-coaching-backend/      ← Node.js + Express API
  ├── server.js            ← Entry point
  ├── .env.example         ← Copy to .env and fill in values
  ├── models/
  │   ├── User.js          ← Student & Admin model
  │   └── models.js        ← Material, DPP, Notice, Inquiry models
  ├── routes/
  │   ├── authRoutes.js    ← Register, Login, /me
  │   ├── studentRoutes.js ← Approve/reject, manage materials
  │   ├── materialRoutes.js← Upload, assign, download
  │   ├── dppRoutes.js     ← Daily practice problems
  │   ├── noticeRoutes.js  ← Announcements
  │   └── inquiryRoutes.js ← Admission inquiry form
  └── middleware/
      └── authMiddleware.js← JWT protect, adminOnly, approved

ram-coaching-frontend/     ← React + Vite (see Frontend Setup below)
```

---

## 🚀 Backend Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### Steps

```bash
cd ram-coaching-backend
cp .env.example .env        # Edit with your values
npm install
npm run dev                 # Runs on http://localhost:5000
```

### Environment Variables (.env)
```
MONGO_URI=mongodb://localhost:27017/ramcoaching
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
ADMIN_EMAIL=admin@ramcoaching.in
```

---

## 🔐 API Endpoints

### Auth
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | /api/auth/register | Public | Student registration |
| POST | /api/auth/login | Public | Login (student/admin) |
| GET | /api/auth/me | Protected | Current user info |

### Students (Admin Only)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/students | List all students |
| GET | /api/students?class=12-PCM | Filter by class |
| GET | /api/students?approved=false | Pending approvals |
| PATCH | /api/students/:id/approve | Approve student |
| PATCH | /api/students/:id/reject | Revoke access |
| PATCH | /api/students/:id/materials | Assign/remove materials |

### Materials
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/materials/public | Public | Free resources |
| GET | /api/materials/mine | Approved Student | My materials |
| GET | /api/materials | Admin | All materials |
| POST | /api/materials | Admin | Upload material |
| DELETE | /api/materials/:id | Admin | Delete material |

### DPP
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/dpp?subject=Physics | Approved Student | Today's DPP |
| POST | /api/dpp | Admin | Add question |
| DELETE | /api/dpp/:id | Admin | Delete question |

### Notices
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/notices | Approved Student | My class notices |
| POST | /api/notices | Admin | Post notice |
| DELETE | /api/notices/:id | Admin | Remove notice |

### Inquiry
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | /api/inquiry | Public | Submit inquiry form |
| GET | /api/inquiry | Admin | All inquiries |
| PATCH | /api/inquiry/:id | Admin | Update status |

---

## 💻 Frontend Setup (React + Vite)

```bash
# Create React app
npm create vite@latest ram-coaching-frontend -- --template react
cd ram-coaching-frontend
npm install axios react-router-dom

# Set API base URL
echo "VITE_API_URL=http://localhost:5000/api" > .env

npm run dev    # Runs on http://localhost:3000
```

### Connecting Frontend to Backend
```javascript
// src/api.js
import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Add JWT to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

// Usage in component:
// const { data } = await api.get('/materials/mine');
// const { data } = await api.post('/auth/login', { email, password });
```

---

## 🗃 MongoDB Collections

| Collection | Purpose |
|-----------|---------|
| users | Students & Admin accounts |
| materials | Study PDFs, videos, notes |
| dpps | Daily practice questions |
| notices | Announcements |
| inquiries | Admission form submissions |

---

## 🎨 Website Pages (Frontend)

| Page | Route | Description |
|------|-------|-------------|
| Home | / | Hero, stats, countdown, wall of fame |
| Classes | /classes | 9–12 syllabus, schedule, subjects |
| JEE | /jee | Strategy, chapters, batches |
| NEET | /neet | Strategy, chapters, batches |
| DPP | /dpp | Daily 5 questions, auto-graded |
| Resources | /resources | Free PYQs, formula sheets |
| Results | /results | Wall of fame, toppers |
| Contact | /contact | Map, phone, FAQ |
| Inquiry | /inquiry | Admission form |
| Login | /login | Student / Admin login |
| Register | /register | New student registration |
| Student Dashboard | /dashboard | Materials, DPP, schedule, progress |
| Admin Dashboard | /admin | Approvals, students, materials, notices |

---

## 🌐 Deployment

### Backend (Railway / Render / VPS)
```bash
# Set environment variables in dashboard
# Deploy from GitHub or CLI
```

### Frontend (Vercel / Netlify)
```bash
npm run build
# Upload dist/ folder or connect GitHub repo
```

### MongoDB Atlas (Free Tier)
1. Create cluster at mongodb.com/atlas
2. Get connection string
3. Set in MONGO_URI env variable

---

## 📱 Features Summary

✅ Dark/Light mode toggle  
✅ News ticker with announcements  
✅ Exam countdown (JEE, NEET, Board)  
✅ Class-wise pages with syllabus  
✅ DPP with auto-grading & scoring  
✅ Student registration with approval flow  
✅ Material access control per student  
✅ Admin dashboard (approve/reject/manage)  
✅ Student dashboard (materials, DPP, progress)  
✅ Syllabus chapter tracker  
✅ Wall of Fame & Student of the Month  
✅ Inquiry form with email notification  
✅ WhatsApp floating button  
✅ FAQ accordion  
✅ Google Map embed  
✅ Mobile responsive design  
✅ SEO-ready structure  

---

