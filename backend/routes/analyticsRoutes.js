const express = require("express");
const router = express.Router();
const {
  getMyAnalytics,
  getWeakTopics,
  getPerformanceHistory,
  getQuizAnalytics,
  getClassAnalytics,
} = require("../controllers/analyticsController");
const { protect, requireStudent, requireFaculty } = require("../middleware");

/**
 * Analytics Routes
 * 
 * Student routes:
 * - GET /me - Get own analytics overview
 * - GET /weak-topics - Get weak topics analysis
 * - GET /performance-history - Get performance over time
 * 
 * Faculty routes:
 * - GET /quiz/:quizId - Get analytics for a specific quiz
 * - GET /class - Get overall class analytics
 */

// Student routes
router.get("/me", protect, getMyAnalytics);
router.get("/weak-topics", protect, getWeakTopics);
router.get("/performance-history", protect, getPerformanceHistory);

// Faculty routes
router.get("/quiz/:quizId", protect, requireFaculty, getQuizAnalytics);
router.get("/class", protect, requireFaculty, getClassAnalytics);

module.exports = router;
