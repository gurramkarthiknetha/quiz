const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.Mixed, // Accept both ObjectId and String for flexibility
    required: true,
  },
  selectedAnswer: {
    type: mongoose.Schema.Types.Mixed, // Accept String or Array for multi-select questions
    default: null,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  timeTaken: {
    type: Number, // seconds spent on this question
    default: 0,
  },
});

const securityViolationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "fullscreen_exit",
      "tab_switch",
      "window_blur",
      "right_click",
      "copy_attempt",
      "screenshot_attempt",
      "devtools_open",
      "other",
    ],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
    default: "",
  },
});

const quizAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    answers: [answerSchema],
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    totalTimeTaken: {
      type: Number, // in seconds
      default: 0,
    },
    status: {
      type: String,
      enum: ["in-progress", "completed", "abandoned"],
      default: "completed",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    // Exam security tracking
    securityViolations: [securityViolationSchema],
    violationCount: {
      type: Number,
      default: 0,
    },
    fullscreenEnforced: {
      type: Boolean,
      default: false,
    },
    autoSubmitted: {
      type: Boolean,
      default: false,
    },
    autoSubmitReason: {
      type: String,
      enum: ["max_violations", "time_limit", null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate percentage before saving
quizAttemptSchema.pre("save", function (next) {
  if (this.totalQuestions > 0) {
    this.percentage = Math.round((this.score / this.totalQuestions) * 100);
  }
  next();
});

// Index for querying user's attempts
quizAttemptSchema.index({ user: 1, quiz: 1 });
quizAttemptSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
