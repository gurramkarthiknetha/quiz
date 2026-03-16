
# Notes-to-Quiz AI Backend

A production-ready MERN stack backend for the Notes-to-Quiz AI application.

## Features

- 🔐 JWT Authentication with secure cookies
- 📝 Quiz CRUD operations
- 🎯 Quiz attempt tracking and scoring
- 🛡️ Security middleware (helmet, rate limiting, sanitization)
- ✅ Input validation with express-validator
- 🗄️ MongoDB Atlas integration with Mongoose ODM
- 📊 User statistics and history

## Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection configuration
├── controllers/
│   ├── authController.js  # Authentication logic
│   ├── quizController.js  # Quiz CRUD operations
│   ├── generateController.js # AI quiz generation (placeholder)
│   └── index.js
├── middleware/
│   ├── authMiddleware.js  # JWT verification
│   ├── errorMiddleware.js # Global error handler
│   ├── rateLimiter.js     # Rate limiting configuration
│   ├── validateMiddleware.js # Input validation rules
│   └── index.js
├── models/
│   ├── User.js            # User schema
│   ├── Quiz.js            # Quiz & Question schema
│   ├── QuizAttempt.js     # Quiz attempt tracking
│   └── index.js
├── routes/
│   ├── authRoutes.js      # /api/auth endpoints
│   ├── quizRoutes.js      # /api/quizzes endpoints
│   ├── generateRoutes.js  # /api/generate endpoints
│   └── index.js
├── utils/
│   ├── ApiError.js        # Custom error class
│   ├── asyncHandler.js    # Async error wrapper
│   ├── generateToken.js   # JWT token generation
│   └── index.js
├── .env.example           # Environment variables template
├── .gitignore
├── package.json
├── server.js              # Entry point
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Installation

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` file with:
   - MongoDB Atlas connection string
   - JWT secret key
   - Other configuration options

4. Start the server:
   ```bash
   # Development (with hot reload)
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Authentication
| Method | Endpoint          | Description           | Access  |
|--------|------------------|-----------------------|---------|
| POST   | /api/auth/register | Register new user    | Public  |
| POST   | /api/auth/login    | Login user           | Public  |
| POST   | /api/auth/logout   | Logout user          | Private |
| GET    | /api/auth/me       | Get current user     | Private |
| PUT    | /api/auth/profile  | Update profile       | Private |
| PUT    | /api/auth/password | Change password      | Private |

### Quizzes
| Method | Endpoint                    | Description              | Access  |
|--------|----------------------------|--------------------------|---------|
| GET    | /api/quizzes               | Get all quizzes          | Public  |
| GET    | /api/quizzes/my            | Get user's quizzes       | Private |
| GET    | /api/quizzes/:id           | Get quiz by ID           | Public  |
| POST   | /api/quizzes               | Create quiz              | Private |
| PUT    | /api/quizzes/:id           | Update quiz              | Private |
| DELETE | /api/quizzes/:id           | Delete quiz              | Private |
| PUT    | /api/quizzes/:id/questions | Update quiz questions    | Private |
| POST   | /api/quizzes/:id/attempt   | Submit quiz attempt      | Private |
| GET    | /api/quizzes/:id/attempts  | Get user's attempts      | Private |
| GET    | /api/quizzes/attempts/history | Get attempt history   | Private |

### AI Generation (Placeholder)
| Method | Endpoint              | Description              | Access  |
|--------|----------------------|--------------------------|---------|
| POST   | /api/generate/quiz   | Generate quiz from text  | Private |
| POST   | /api/generate/enhance| Enhance questions        | Private |
| POST   | /api/generate/topics | Extract topics           | Private |
| POST   | /api/generate/explanation | Generate explanation | Private |

## Environment Variables

See `.env.example` for all available configuration options.

**Required:**
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT tokens

## MongoDB Atlas Setup

1. Create a free account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (choose free tier)
3. Create a database user with read/write access
4. Add your IP address to the whitelist (or allow all IPs for development)
5. Get connection string: Database → Connect → Connect your application
6. Replace `<password>` with your database user's password
7. Add the connection string to your `.env` file

## Security Features

- **Helmet**: Sets various HTTP headers for security
- **Rate Limiting**: Prevents brute-force attacks
- **MongoDB Sanitization**: Prevents NoSQL injection
- **JWT in HTTP-only cookies**: Prevents XSS token theft
- **Password hashing**: bcrypt with salt rounds
- **Input validation**: express-validator

## Scripts

```bash
npm start      # Start production server
npm run dev    # Start development server with nodemon
npm test       # Run tests
npm run lint   # Run ESLint
```

## License

ISC
