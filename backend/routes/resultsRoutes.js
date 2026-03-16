const express = require("express");
const router = express.Router();
const {
  getMyResults,
  getResultDetail,
  getQuizResults,
  getStudentResults,
} = require("../controllers/resultsController");
const { protect, requireStudent, requireFaculty, authorize } = require("../middleware");

/**
 * Results Routes
 * 
 * Student routes:
 * - GET /me - Get own results
 * 
 * Faculty routes:
 * - GET /quiz/:quizId - Get results for a quiz
 * - GET /student/:studentId - Get student's results
 * 
 * Shared routes:
 * - GET /:attemptId - Get single result detail
 */

// Student routes
router.get("/me", protect, getMyResults);

// Get single result (accessible by owner, quiz owner, or admin)
router.get("/:attemptId", protect, getResultDetail);

// Faculty routes
router.get("/quiz/:quizId", protect, requireFaculty, getQuizResults);
router.get("/student/:studentId", protect, requireFaculty, getStudentResults);

module.exports = router;
