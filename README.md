<p align="center">
  <img src="https://img.shields.io/badge/MERN-Stack-green?style=for-the-badge&logo=mongodb&logoColor=white" alt="MERN Stack" />
  <img src="https://img.shields.io/badge/AI-Powered-blue?style=for-the-badge&logo=openai&logoColor=white" alt="AI Powered" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License" />
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-React-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

# 📝 Notes-to-Quiz AI

> An intelligent, full-stack quiz generation platform that transforms study notes into comprehensive, interactive quizzes using AI — built with the MERN stack, Role-Based Access Control, and Google OAuth 2.0 authentication.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [API Reference](#api-reference)
- [RBAC & Authentication](#rbac--authentication)
- [Deployment Notes](#deployment-notes)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Notes-to-Quiz AI** is an end-to-end educational platform where faculty can upload study material (PDF or text), generate AI-powered quizzes using OpenAI's GPT-4o-mini, and publish them for students. Students can browse quizzes, attempt them in a secure exam environment, and track their progress through gamification features like XP, badges, and leaderboards.

The platform implements a three-tier **Role-Based Access Control** system (Student, Faculty, Admin) with **Google OAuth 2.0** and **JWT-based** authentication, ensuring secure and role-appropriate access to all features.

---

## Features

### 🤖 AI-Powered Quiz Generation
- **Smart Question Generation** — Automatically generates diverse question types (MCQ, True/False, Short Answer, Fill in the Blanks) from uploaded content
- **Difficulty Distribution** — Customize the mix of Easy, Medium, and Hard questions
- **Bloom's Taxonomy Mode** — Generate questions aligned with cognitive learning levels (Remember, Understand, Apply, Analyze, Evaluate, Create)
- **Topic Extraction** — AI automatically identifies and tags key topics
- **Question Enhancement** — Regenerate or improve individual questions via AI

### 📄 Multiple Input Methods
- **PDF Upload** — Upload PDF documents; text is auto-extracted via `pdf-parse`
- **Text Paste** — Directly paste study notes
- **Drag & Drop** — Intuitive file upload interface

### ⚙️ Quiz Customization
- **Adjustable Question Count** — Generate 1–50 questions per quiz
- **Question Type Selection** — Choose which types to include
- **Exam Mode Presets** — General, UPSC, JEE, College, School
- **Time Limits** — Optional timed quizzes for exam simulation
- **Real-time Preview** — Review and edit questions before publishing

### 🔒 Role-Based Access Control (RBAC)
- **Three roles**: Student, Faculty, Admin
- **Faculty Approval Workflow** — Faculty registrations require admin approval
- **Admin Dashboard** — Full platform management (users, analytics, approvals)
- **Resource Ownership** — Faculty can only manage their own quizzes and notes
- **Route-level Authorization** — Every API endpoint and frontend route is role-protected

### 🔐 Authentication
- **JWT Authentication** — Secure token-based auth with HTTP-only cookies
- **Google OAuth 2.0** — One-click sign-in via Google with role selection
- **Dual Auth Support** — Local (email/password) and Google OAuth coexist seamlessly
- **Session Management** — OAuth state maintained via express-session

### 🎮 Gamification
- **XP System** — Earn experience points for completing quizzes
- **Leveling** — Level up as XP accumulates
- **Badges** — Earn achievements (e.g., First Quiz, High Achiever, Streak Master)
- **Leaderboard** — Compete with other students on global rankings
- **Streak Tracking** — Maintain daily quiz-taking streaks

### 📊 Analytics & Results
- **Score Analysis** — Detailed breakdown per attempt with explanations
- **Performance History** — Track progress over time
- **Weak Topics** — Identify areas needing improvement
- **Faculty Analytics** — Class-wide performance insights per quiz
- **Admin Analytics** — Platform-wide usage statistics

### 🛡️ Exam Security
- **Fullscreen Enforcement** — Optional fullscreen mode during exams
- **Tab Switch Detection** — Monitors window focus/blur events
- **Copy Prevention** — Blocks right-click and copy attempts
- **Security Violation Logging** — Records all infractions with timestamps
- **Auto-Submit** — Configurable auto-submission on excessive violations

### ☁️ Cloud Storage
- **Cloudinary Integration** — Secure PDF and file storage
- **MongoDB Atlas** — Cloud-hosted database for reliable persistence

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | UI framework |
| | Vite | Build tool & dev server (port 8080) |
| | Tailwind CSS | Utility-first styling |
| | shadcn/ui + Radix UI | Component library |
| | TanStack React Query | Server state management |
| | React Router v6 | Client-side routing |
| | Axios | HTTP client |
| | Recharts | Data visualization |
| | Zod + React Hook Form | Form validation |
| **Backend** | Node.js + Express.js | Server framework (port 3000) |
| | Mongoose ODM | MongoDB object modeling |
| | OpenAI API (GPT-4o-mini) | AI quiz generation |
| | Passport.js | Google OAuth 2.0 strategy |
| | JSON Web Tokens | Authentication |
| | Multer | File upload handling |
| | pdf-parse | PDF text extraction |
| **Database** | MongoDB Atlas | Cloud NoSQL database |
| **Storage** | Cloudinary | PDF/file cloud storage |
| **Security** | Helmet.js | HTTP security headers |
| | express-rate-limit | API rate limiting |
| | express-mongo-sanitize | NoSQL injection prevention |
| | bcryptjs | Password hashing |
| | express-validator | Input validation |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│              React 18 + TypeScript + Vite                │
│                    Port: 8080                            │
└────────────────────────┬────────────────────────────────┘
                         │  HTTP / REST API
                         │  (Axios + JWT Bearer Token)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Backend API Server                       │
│              Node.js + Express.js                         │
│                    Port: 3000                             │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐   │
│  │   Auth    │  │   RBAC   │  │   Rate Limiting     │   │
│  │ (JWT +   │  │ Middleware│  │   (express-rate-     │   │
│  │  OAuth)  │  │          │  │    limit)            │   │
│  └──────────┘  └──────────┘  └─────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Route Handlers                       │   │
│  │  Auth │ Quiz │ Generate │ Upload │ Results │ ...  │   │
│  └──────────────────────────────────────────────────┘   │
└────────┬──────────────────┬─────────────────────────────┘
         │                  │
         ▼                  ▼
┌────────────────┐  ┌───────────────┐  ┌──────────────┐
│  MongoDB Atlas │  │  OpenAI API   │  │  Cloudinary  │
│  (Database)    │  │  (GPT-4o-mini)│  │  (File CDN)  │
└────────────────┘  └───────────────┘  └──────────────┘
```

### Authentication Flow

```
Local Registration/Login:
  Client → POST /api/auth/register or /login → JWT issued → Stored in localStorage + HTTP-only cookie

Google OAuth Flow:
  Client → GET /api/auth/google?role=student
         → Google Consent Screen
         → GET /api/auth/google/callback
         → User created/linked → JWT issued
         → Redirect to /auth/callback?token=xxx
```

### RBAC Authorization Flow

```
Request → Auth Middleware (verify JWT) → RBAC Middleware (check role) → Controller
                                              │
                          ┌───────────────────┼───────────────────┐
                          ▼                   ▼                   ▼
                      Student              Faculty              Admin
                    (quiz-taker)         (quiz-creator)      (platform mgr)
```

---

## Folder Structure

```
notes-to-quiz-ai/
├── README.md
│
├── backend/                        # Express.js API server
│   ├── server.js                   # App entry point & middleware setup
│   ├── package.json
│   ├── .env                        # Environment variables (not committed)
│   │
│   ├── config/
│   │   ├── db.js                   # MongoDB Atlas connection
│   │   ├── cloudinary.js           # Cloudinary SDK configuration
│   │   └── passport.js             # Google OAuth 2.0 strategy
│   │
│   ├── controllers/
│   │   ├── authController.js       # Register, login, OAuth, profile
│   │   ├── quizController.js       # CRUD operations for quizzes
│   │   ├── generateController.js   # AI quiz generation (OpenAI)
│   │   ├── uploadController.js     # PDF upload & text extraction
│   │   ├── resultsController.js    # Quiz attempt results
│   │   ├── analyticsController.js  # Performance analytics
│   │   ├── leaderboardController.js# XP-based leaderboard
│   │   ├── profileController.js    # User profile & gamification
│   │   ├── notesController.js      # Study notes CRUD
│   │   └── index.js                # Barrel export
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT verification (protect, optionalAuth)
│   │   ├── rbacMiddleware.js       # Role-based authorization guards
│   │   ├── rateLimiter.js          # API, auth, and generation rate limits
│   │   ├── uploadMiddleware.js     # Multer file upload config
│   │   ├── validateMiddleware.js   # express-validator request validation
│   │   ├── errorMiddleware.js      # Global error handler
│   │   └── index.js                # Barrel export
│   │
│   ├── models/
│   │   ├── User.js                 # User schema (roles, OAuth, gamification)
│   │   ├── Quiz.js                 # Quiz schema (questions, settings)
│   │   ├── QuizAttempt.js          # Attempt schema (answers, security logs)
│   │   ├── Note.js                 # Study note schema (with attachments)
│   │   └── index.js                # Barrel export
│   │
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth/*
│   │   ├── quizRoutes.js           # /api/quizzes/*
│   │   ├── generateRoutes.js       # /api/generate/*
│   │   ├── uploadRoutes.js         # /api/upload/*
│   │   ├── resultsRoutes.js        # /api/results/*
│   │   ├── analyticsRoutes.js      # /api/analytics/*
│   │   ├── adminRoutes.js          # /api/admin/*
│   │   ├── leaderboardRoutes.js    # /api/leaderboard/*
│   │   ├── profileRoutes.js        # /api/users/*
│   │   ├── notesRoutes.js          # /api/notes/*
│   │   └── index.js                # Barrel export
│   │
│   ├── scripts/
│   │   ├── addAdmins.js            # Seed admin users
│   │   └── makeAdmin.js            # Promote user to admin
│   │
│   └── utils/
│       ├── ApiError.js             # Custom error class
│       ├── asyncHandler.js         # Async error wrapper
│       ├── generateToken.js        # JWT token generator
│       └── index.js                # Barrel export
│
└── frontend/                       # React + TypeScript SPA
    ├── index.html                  # HTML entry point
    ├── vite.config.ts              # Vite config (port 8080)
    ├── tailwind.config.ts          # Tailwind CSS config
    ├── package.json
    ├── .env                        # Frontend env variables (not committed)
    │
    └── src/
        ├── App.tsx                 # Root component with routing
        ├── main.tsx                # React DOM entry
        │
        ├── components/
        │   ├── Layout.tsx          # App shell with sidebar
        │   ├── AppSidebar.tsx      # Role-aware navigation sidebar
        │   ├── ProtectedRoute.tsx  # Auth & role route guards
        │   ├── InteractiveQuiz.tsx # Quiz-taking interface
        │   ├── QuizCard.tsx        # Quiz display card
        │   ├── QuizSettingsPanel.tsx# Quiz configuration UI
        │   ├── FileUpload.tsx      # PDF/text upload component
        │   ├── ExamSecurityOverlay.tsx # Fullscreen exam overlay
        │   ├── NavLink.tsx         # Navigation link component
        │   ├── gamification/
        │   │   ├── XPCard.tsx      # XP progress display
        │   │   ├── BadgeSection.tsx # Badge gallery
        │   │   └── LeaderboardPreview.tsx # Leaderboard widget
        │   └── ui/                 # shadcn/ui component library
        │
        ├── pages/
        │   ├── Index.tsx           # Landing page
        │   ├── Login.tsx           # Login (email + Google OAuth)
        │   ├── Register.tsx        # Registration with role selection
        │   ├── AuthCallback.tsx    # OAuth callback handler
        │   ├── PendingApproval.tsx # Faculty approval pending page
        │   ├── Unauthorized.tsx    # 403 access denied page
        │   ├── QuizPreview.tsx     # Preview generated questions
        │   ├── QuizMode.tsx        # Quiz configuration before start
        │   ├── QuizAttempt.tsx     # Active quiz session
        │   ├── student/
        │   │   ├── Dashboard.tsx   # Student home
        │   │   ├── BrowseQuizzes.tsx # Browse available quizzes
        │   │   ├── BrowseNotes.tsx # Browse study notes
        │   │   ├── Results.tsx     # Attempt history
        │   │   ├── ResultDetail.tsx# Detailed result view
        │   │   └── MyProfile.tsx   # Profile & gamification stats
        │   ├── faculty/
        │   │   ├── Dashboard.tsx   # Faculty home
        │   │   ├── CreateQuiz.tsx  # Quiz creation workflow
        │   │   ├── EditQuiz.tsx    # Edit existing quiz
        │   │   ├── MyQuizzes.tsx   # Manage own quizzes
        │   │   ├── QuizResults.tsx # View student attempts
        │   │   ├── AttemptDetail.tsx# Individual attempt review
        │   │   ├── MyNotes.tsx     # Manage study notes
        │   │   └── CreateEditNote.tsx # Note editor
        │   └── admin/
        │       ├── Dashboard.tsx   # Admin overview & stats
        │       ├── Users.tsx       # User management
        │       └── PendingFaculty.tsx # Faculty approval queue
        │
        ├── context/
        │   ├── AuthContext.tsx      # Auth state & methods
        │   └── QuizContext.tsx      # Quiz generation state
        │
        ├── services/
        │   └── api.ts              # Axios API client & endpoints
        │
        ├── hooks/
        │   ├── use-toast.ts        # Toast notification hook
        │   ├── use-mobile.tsx      # Mobile detection hook
        │   └── useExamSecurity.ts  # Exam proctoring hook
        │
        ├── types/
        │   └── quiz.ts             # TypeScript type definitions
        │
        └── lib/
            └── utils.ts            # Utility functions (cn, etc.)
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
|------------|---------|
| Node.js | >= 18.0.0 |
| npm / yarn / bun | Latest |
| MongoDB Atlas account | — |
| OpenAI API key | — |
| Google Cloud OAuth credentials | — |
| Cloudinary account | Optional (for PDF storage) |

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/notes-to-quiz-ai.git
cd notes-to-quiz-ai

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

#### Backend (`backend/.env`)

```env
# Server
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-secure-random-jwt-secret-min-32-chars
JWT_EXPIRE=30d

# CORS
CORS_ORIGIN=http://localhost:8080

# OpenAI
OPENAI_API_KEY=sk-proj-your-openai-api-key

# Cloudinary
CLOUD_NAME=your-cloudinary-cloud-name
CLOUD_API_KEY=your-cloudinary-api-key
CLOUD_API_SECRET=your-cloudinary-api-secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Admin emails (comma-separated)
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

#### Frontend (`frontend/.env`)

```env
VITE_SERVER_URI=http://localhost:3000
VITE_CLOUD_NAME=your-cloudinary-cloud-name
```

### Running Locally

```bash
# Terminal 1 — Start the backend server
cd backend
npm run dev          # Runs with nodemon on http://localhost:3000

# Terminal 2 — Start the frontend dev server
cd frontend
npm run dev          # Runs with Vite on http://localhost:8080
```

Open **http://localhost:8080** in your browser.

### Admin Setup

To promote a user to admin, use the included scripts:

```bash
cd backend

# Option 1: Add admin emails to .env ADMIN_EMAILS — auto-assigned on registration
# Option 2: Manually promote an existing user
npm run makeadmin -- <user-email>
```

---

## API Reference

The backend exposes a RESTful API at `http://localhost:3000`. All protected routes require a `Bearer` token in the `Authorization` header.

### Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/register` | Public | Register new user (student/faculty) |
| `POST` | `/login` | Public | Login with email & password |
| `GET` | `/google` | Public | Initiate Google OAuth flow |
| `GET` | `/google/callback` | Public | Google OAuth callback |
| `POST` | `/logout` | Protected | Logout & clear session |
| `GET` | `/me` | Protected | Get current user profile |
| `GET` | `/role` | Protected | Get current user's role |
| `PUT` | `/profile` | Protected | Update user profile |
| `PUT` | `/password` | Protected | Change password |

### Quizzes (`/api/quizzes`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/` | Public/Optional Auth | List all public quizzes |
| `GET` | `/my` | Faculty | Get faculty's own quizzes |
| `GET` | `/:id` | Public/Optional Auth | Get quiz by ID |
| `POST` | `/` | Faculty | Create new quiz |
| `PUT` | `/:id` | Faculty | Update quiz |
| `DELETE` | `/:id` | Faculty | Delete quiz |
| `PUT` | `/:id/questions` | Faculty | Update quiz questions |
| `POST` | `/:id/attempt` | Protected | Submit quiz attempt |
| `GET` | `/:id/attempts` | Faculty | Get quiz attempt results |
| `GET` | `/attempts/history` | Protected | Get user's attempt history |

### AI Generation (`/api/generate`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/quiz` | Rate Limited | Generate quiz from text via AI |
| `POST` | `/enhance` | Rate Limited | Enhance/improve existing questions |
| `POST` | `/topics` | Rate Limited | Extract topics from content |
| `POST` | `/explanation` | Rate Limited | Generate explanation for a question |

### File Upload (`/api/upload`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/pdf` | Public | Upload PDF & extract text |
| `POST` | `/text` | Public | Upload raw text content |
| `GET` | `/:publicId` | Public | Retrieve uploaded file |
| `DELETE` | `/:publicId` | Protected | Delete uploaded file |

### Results (`/api/results`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/me` | Protected | Get own results |
| `GET` | `/:attemptId` | Protected | Get attempt detail |
| `GET` | `/quiz/:quizId` | Faculty | Get all results for a quiz |
| `GET` | `/student/:studentId` | Faculty | Get a student's results |

### Analytics (`/api/analytics`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/me` | Protected | Personal analytics overview |
| `GET` | `/weak-topics` | Protected | Weak topics analysis |
| `GET` | `/performance-history` | Protected | Performance over time |
| `GET` | `/quiz/:quizId` | Faculty | Quiz-specific analytics |
| `GET` | `/class` | Faculty | Class-wide analytics |

### Admin (`/api/admin`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/dashboard` | Admin | Dashboard summary statistics |
| `GET` | `/analytics` | Admin | System-wide analytics |
| `GET` | `/pending-faculty` | Admin | Pending faculty registrations |
| `PUT` | `/faculty/:userId/approve` | Admin | Approve faculty account |
| `PUT` | `/faculty/:userId/reject` | Admin | Reject faculty account |
| `DELETE` | `/users/:userId` | Admin | Delete user and data |

### Leaderboard (`/api/leaderboard`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/` | Protected | Get global leaderboard |

### Profile & Gamification (`/api/users`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/me` | Protected | Get profile with gamification data |
| `PUT` | `/me` | Protected | Update profile |
| `GET` | `/me/gamification` | Protected | Get gamification stats only |

### Notes (`/api/notes`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/` | Protected | Get published notes |
| `GET` | `/subjects` | Protected | Get list of subjects |
| `GET` | `/my` | Faculty | Get faculty's own notes |
| `GET` | `/:id` | Protected | Get single note |
| `POST` | `/` | Faculty | Create note (with file upload) |
| `PUT` | `/:id` | Faculty | Update note |
| `PATCH` | `/:id/publish` | Faculty | Toggle publish status |
| `DELETE` | `/:id` | Protected | Delete note |

---

## RBAC & Authentication

### Role Hierarchy

| Role | Capabilities |
|------|-------------|
| **Student** | Browse quizzes & notes, attempt quizzes, view results & analytics, earn XP/badges, access leaderboard |
| **Faculty** | Everything students can do **+** create/edit/delete quizzes & notes, view student results, access class analytics |
| **Admin** | Full platform access **+** approve/reject faculty, manage users, view system-wide analytics, delete users |

### Faculty Approval Workflow

1. User registers with the "Faculty" role
2. Account is created with `approvalStatus: "pending"`
3. User sees a "Pending Approval" page and cannot access faculty features
4. Admin reviews pending faculty on the admin dashboard
5. Admin approves or rejects (with reason) the faculty account
6. On approval, faculty gets full access; on rejection, they are notified

### Auth Providers

- **Local** — Email + bcrypt-hashed password + JWT token
- **Google OAuth 2.0** — Passport.js strategy with PKCE; accounts auto-link if email matches

### Security Layers

| Layer | Implementation |
|-------|---------------|
| Authentication | JWT (Bearer tokens + HTTP-only cookies) |
| Authorization | Role-based middleware (`authorize()`, `requireFaculty`, `requireAdmin`) |
| Input Validation | express-validator + Zod (frontend) |
| Injection Prevention | express-mongo-sanitize |
| HTTP Security | Helmet.js (CSP, HSTS, etc.) |
| Rate Limiting | Tiered limits — API (1000/15min), Auth (10/hr), Generate (20/hr) |
| Password Security | bcryptjs with salt rounds |

---

## Deployment Notes

### Backend Deployment

The backend is a standard Node.js/Express app suitable for deployment on:

- **Railway** / **Render** / **Fly.io** — Set environment variables in the dashboard
- **AWS EC2** / **DigitalOcean** — Use PM2 for process management
- **Docker** — Containerize with a simple Dockerfile

```bash
# Production start
NODE_ENV=production node server.js
```

Key deployment considerations:
- Set `NODE_ENV=production` for security headers and optimizations
- Ensure `CORS_ORIGIN` is set to your frontend's production URL
- Update `GOOGLE_CALLBACK_URL` to your production domain
- MongoDB Atlas IP whitelist should include your server's IP
- Use HTTPS in production (set `cookie.secure: true`)

### Frontend Deployment

```bash
cd frontend
npm run build        # Outputs to dist/
```

Deploy the `dist/` folder to any static hosting:
- **Vercel** / **Netlify** — Connect your repo for auto-deploys
- **AWS S3 + CloudFront** — For CDN-distributed hosting
- **Nginx** — Serve static files with SPA fallback

Ensure the `VITE_SERVER_URI` environment variable points to your production backend URL at build time.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [OpenAI](https://openai.com/) for the GPT API
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Cloudinary](https://cloudinary.com/) for file storage
- [MongoDB Atlas](https://www.mongodb.com/atlas) for database hosting

