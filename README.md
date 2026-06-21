# StackUp AI

> Stack your skills. Track your growth. Land your dream job.

AI-powered placement preparation and career growth platform for engineering students, freshers, and placement aspirants.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React + Vite + Tailwind CSS         |
| Backend    | Node.js + Express.js                |
| Database   | MongoDB Atlas + Mongoose            |
| Auth       | JWT (JSON Web Tokens)               |
| AI         | Google Gemini (gemini-1.5-flash)    |
| Deployment | Vercel (FE) + Render (BE)           |

---

## Project Structure

```
stackup-ai/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── backend/           # Node.js + Express API
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── utils/
    ├── uploads/
    └── server.js
```

---

## Quick Start

### 1. Clone and install

```bash
# Backend
cd backend
cp .env.example .env      # fill in your values
npm install
npm run dev               # starts on :5000

# Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev               # starts on :5173
```

### 2. Environment variables

**backend/.env**
```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/stackup-ai
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**frontend/.env.local**
```
VITE_API_URL=http://localhost:5000/api
```

---

## API Endpoints

| Method | Endpoint                  | Auth | Description                    |
|--------|---------------------------|------|--------------------------------|
| POST   | /api/auth/register        | No   | Register new user              |
| POST   | /api/auth/login           | No   | Login and get JWT              |
| GET    | /api/auth/profile         | Yes  | Get current user profile       |
| GET    | /api/dashboard            | Yes  | Get dashboard statistics       |
| GET    | /api/applications         | Yes  | List applications (filterable) |
| POST   | /api/applications         | Yes  | Create application             |
| PUT    | /api/applications/:id     | Yes  | Update application             |
| DELETE | /api/applications/:id     | Yes  | Delete application             |
| GET    | /api/dsa                  | Yes  | List DSA progress              |
| POST   | /api/dsa                  | Yes  | Add DSA topic                  |
| PUT    | /api/dsa/:id              | Yes  | Update DSA topic               |
| DELETE | /api/dsa/:id              | Yes  | Delete DSA topic               |
| GET    | /api/aptitude             | Yes  | List aptitude progress         |
| POST   | /api/aptitude             | Yes  | Add aptitude category          |
| PUT    | /api/aptitude/:id         | Yes  | Update aptitude category       |
| DELETE | /api/aptitude/:id         | Yes  | Delete aptitude category       |
| POST   | /api/ai/resume-analyze    | Yes  | Analyze PDF resume with AI     |
| POST   | /api/ai/interview         | Yes  | Generate interview questions   |

---

## Features

- 🔐 JWT Authentication with protected routes
- 📋 Placement Tracker — full CRUD for job applications
- 💻 DSA Tracker — progress by topic with visual bars
- 📊 Aptitude Tracker — score and accuracy tracking
- 🤖 AI Resume Analyzer — PDF upload → Gemini analysis
- 🎯 AI Interview Generator — company/role → tailored questions
- 📈 Dashboard — unified stats and progress overview
- 🌙 Dark theme, fully responsive, mobile-friendly

---

## Deployment

### Backend → Render
- Build command: `npm install`
- Start command: `node server.js`
- Add all env vars in Render dashboard

### Frontend → Vercel
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` to your Render backend URL
