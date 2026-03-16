require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const passport = require("passport");
const session = require("express-session");

// Database connection
const connectDB = require("./config/db");

// Passport configuration
const configurePassport = require("./config/passport");

// Routes
const { 
  authRoutes, 
  quizRoutes, 
  generateRoutes, 
  uploadRoutes,
  resultsRoutes,
  analyticsRoutes,
  adminRoutes,
  leaderboardRoutes,
  profileRoutes,
  notesRoutes,
} = require("./routes");

// Middleware
const { notFound, errorHandler, apiLimiter } = require("./middleware");

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet()); // Set security HTTP headers
app.use(mongoSanitize()); // Sanitize data to prevent NoSQL injection

// CORS Configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser middleware
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parse URL-encoded bodies

// Cookie parser
app.use(cookieParser());

// Session middleware (required for OAuth state)
app.use(
  session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Logging (development only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate limiting for all API routes
app.use("/api", apiLimiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/users", profileRoutes);
app.use("/api/notes", notesRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Notes-to-Quiz AI Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      quizzes: "/api/quizzes",
      generate: "/api/generate",
      upload: "/api/upload",
    },
  });
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         Notes-to-Quiz AI Backend Server Started           ║
╠═══════════════════════════════════════════════════════════╣
║  Mode:        ${process.env.NODE_ENV || "development"}                                 ║
║  Port:        ${PORT}                                           ║
║  URL:         http://localhost:${PORT}                          ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

module.exports = app;
