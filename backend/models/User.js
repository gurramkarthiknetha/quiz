const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define roles as constants for consistency
const ROLES = {
  STUDENT: "student",
  FACULTY: "faculty",
  ADMIN: "admin",
};

// Approval status for faculty accounts
const APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// Define faculty email domains (customize as needed)
const FACULTY_EMAIL_DOMAINS = ["faculty.edu", "gmail.com", "professor.edu", "staff.university.edu"];

// Get admin emails from environment variable
const getAdminEmails = () => {
  const adminEmails = process.env.ADMIN_EMAILS || "";
  return adminEmails.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: function () {
        // Password is required only if not using OAuth
        return !this.googleId;
      },
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password by default
    },
    avatar: {
      type: String,
      default: "",
    },
    // Role-Based Access Control
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT,
    },
    // Faculty approval status
    approvalStatus: {
      type: String,
      enum: Object.values(APPROVAL_STATUS),
      default: APPROVAL_STATUS.APPROVED, // Students are auto-approved
    },
    approvalNote: {
      type: String,
      default: "",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    // Google OAuth fields
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    // Email verification (for security)
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
    quizzesCreated: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
      },
    ],
    quizzesTaken: [
      {
        quiz: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Quiz",
        },
        score: Number,
        totalQuestions: Number,
        completedAt: Date,
        timeTaken: Number, // in seconds
      },
    ],
    // ==================== GAMIFICATION FIELDS ====================
    // XP System
    xp: {
      type: Number,
      default: 0,
    },
    // Level: computed as Math.floor(xp / 100) + 1
    level: {
      type: Number,
      default: 1,
    },
    // Badges earned by the student (simple string array + detailed array)
    badges: [
      {
        badgeId: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        icon: {
          type: String,
          default: "🏆",
        },
        description: {
          type: String,
          default: "",
        },
        earnedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Aggregated stats for quick access
    totalQuizzes: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    // Count of quizzes with score >= 80% (for "High Achiever" badge)
    highScoreCount: {
      type: Number,
      default: 0,
    },
    // Track quiz streaks
    streakCount: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to check if email is admin
userSchema.statics.isAdminEmail = function (email) {
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
};

// Static method to determine role based on email
userSchema.statics.determineRoleByEmail = function (email) {
  // Check if admin email first
  if (this.isAdminEmail(email)) {
    return ROLES.ADMIN;
  }
  const domain = email.split("@")[1];
  if (FACULTY_EMAIL_DOMAINS.includes(domain)) {
    return ROLES.FACULTY;
  }
  return ROLES.STUDENT;
};

// Static method to determine approval status based on role
userSchema.statics.getInitialApprovalStatus = function (role) {
  // Faculty accounts require approval, others are auto-approved
  if (role === ROLES.FACULTY) {
    return APPROVAL_STATUS.PENDING;
  }
  return APPROVAL_STATUS.APPROVED;
};

// Instance method to check if user can login (approved or not faculty)
userSchema.methods.canLogin = function () {
  // Admins and students can always login
  if (this.role !== ROLES.FACULTY) {
    return true;
  }
  // Faculty must be approved
  return this.approvalStatus === APPROVAL_STATUS.APPROVED;
};
userSchema.statics.determineRoleByEmail = function (email) {
  const domain = email.split("@")[1];
  if (FACULTY_EMAIL_DOMAINS.includes(domain)) {
    return ROLES.FACULTY;
  }
  return ROLES.STUDENT;
};

// Instance method to check if user has specific role
userSchema.methods.hasRole = function (role) {
  return this.role === role;
};

// Instance method to check if user is faculty
userSchema.methods.isFaculty = function () {
  return this.role === ROLES.FACULTY;
};

// Instance method to check if user is student
userSchema.methods.isStudent = function () {
  return this.role === ROLES.STUDENT;
};

// Instance method to check if user is admin
userSchema.methods.isAdmin = function () {
  return this.role === ROLES.ADMIN;
};

// Instance method to check if faculty is pending approval
userSchema.methods.isPendingApproval = function () {
  return this.role === ROLES.FACULTY && this.approvalStatus === APPROVAL_STATUS.PENDING;
};

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Skip if password is not modified or if using OAuth
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update last login timestamp
userSchema.methods.updateLastLogin = async function () {
  this.lastLoginAt = new Date();
  return this.save();
};

// ==================== GAMIFICATION METHODS ====================

// Badge definitions
const BADGES = {
  QUIZ_MASTER: {
    id: "quiz_master",
    name: "Quiz Master",
    icon: "🥇",
    description: "Score 90% or higher on a quiz",
  },
  PERFECT_SCORE: {
    id: "perfect_score",
    name: "Perfect Score",
    icon: "💯",
    description: "Achieve 100% on a quiz",
  },
  CONSISTENT_LEARNER: {
    id: "consistent_learner",
    name: "Consistent Learner",
    icon: "🔥",
    description: "Complete 5 quizzes",
  },
  HIGH_ACHIEVER: {
    id: "high_achiever",
    name: "High Achiever",
    icon: "🏆",
    description: "Score 80% or higher on 3 quizzes",
  },
  FIRST_STEP: {
    id: "first_step",
    name: "First Step",
    icon: "🎯",
    description: "Complete your first quiz",
  },
};

/**
 * Calculate level from XP: level = Math.floor(xp / 100) + 1
 */
userSchema.methods.calculateLevel = function () {
  return Math.floor(this.xp / 100) + 1;
};

/**
 * Get XP progress info for frontend progress bar
 */
userSchema.methods.getXpProgress = function () {
  const currentLevel = this.calculateLevel();
  const xpForCurrentLevel = (currentLevel - 1) * 100;
  const xpForNextLevel = currentLevel * 100;
  const xpInCurrentLevel = this.xp - xpForCurrentLevel;
  const xpNeeded = 100; // Always 100 XP per level
  return {
    currentXp: this.xp,
    currentLevel,
    xpInCurrentLevel,
    xpNeededForNextLevel: xpNeeded,
    progressPercent: Math.min(100, Math.round((xpInCurrentLevel / xpNeeded) * 100)),
    xpToNextLevel: xpForNextLevel - this.xp,
  };
};

/**
 * Award XP for quiz completion and update level
 * +10 XP per attempt
 * +20 XP bonus if score >= 80%
 * +50 XP bonus if score = 100%
 */
userSchema.methods.awardQuizXp = function (percentage) {
  let xpEarned = 10; // Base XP for attempt
  if (percentage >= 80) xpEarned += 20;
  if (percentage === 100) xpEarned += 50;

  this.xp += xpEarned;
  this.level = this.calculateLevel();
  return xpEarned;
};

/**
 * Update aggregated quiz stats (totalQuizzes, averageScore, highScoreCount)
 */
userSchema.methods.updateQuizStats = function (percentage) {
  const prevTotal = this.totalQuizzes || 0;
  const prevAvg = this.averageScore || 0;
  this.totalQuizzes = prevTotal + 1;
  this.averageScore = Math.round(((prevAvg * prevTotal) + percentage) / this.totalQuizzes);
  if (percentage >= 80) {
    this.highScoreCount = (this.highScoreCount || 0) + 1;
  }
};

/**
 * Check and award badges. Returns array of newly awarded badges.
 * No duplicate badges (checks hasBadge before adding).
 */
userSchema.methods.checkAndAwardBadges = function (percentage) {
  const newBadges = [];

  // First Step (1 quiz completed)
  if (this.totalQuizzes === 1 && !this.hasBadge("first_step")) {
    newBadges.push(BADGES.FIRST_STEP);
  }

  // Quiz Master (score >= 90%)
  if (percentage >= 90 && !this.hasBadge("quiz_master")) {
    newBadges.push(BADGES.QUIZ_MASTER);
  }

  // Perfect Score (score === 100%)
  if (percentage === 100 && !this.hasBadge("perfect_score")) {
    newBadges.push(BADGES.PERFECT_SCORE);
  }

  // Consistent Learner (5 quizzes)
  if (this.totalQuizzes >= 5 && !this.hasBadge("consistent_learner")) {
    newBadges.push(BADGES.CONSISTENT_LEARNER);
  }

  // High Achiever (3 quizzes with >= 80%)
  if (this.highScoreCount >= 3 && !this.hasBadge("high_achiever")) {
    newBadges.push(BADGES.HIGH_ACHIEVER);
  }

  // Persist new badges
  newBadges.forEach((badge) => {
    this.badges.push({
      badgeId: badge.id,
      name: badge.name,
      icon: badge.icon,
      description: badge.description,
      earnedAt: new Date(),
    });
  });

  return newBadges;
};

/**
 * Check if user already has a specific badge
 */
userSchema.methods.hasBadge = function (badgeId) {
  return this.badges.some((b) => b.badgeId === badgeId);
};

const User = mongoose.model("User", userSchema);

module.exports = { User, ROLES, APPROVAL_STATUS, FACULTY_EMAIL_DOMAINS };
