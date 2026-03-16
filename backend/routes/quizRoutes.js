const express = require("express");
const router = express.Router();
const {
  createQuiz,
  getQuizzes,
  getMyQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  updateQuestions,
  submitQuizAttempt,
  getQuizAttempts,
  getUserAttemptHistory,
} = require("../controllers/quizController");
const { protect, optionalAuth, requireFaculty } = require("../middleware");

/**
 * Quiz Routes with RBAC
 * 
 * Public routes:
 * - GET / - Get all public quizzes
 * - GET /:id - Get single quiz
 * 
 * Student routes:
 * - POST /:id/attempt - Submit quiz attempt
 * - GET /attempts/history - Get user's attempt history
 * 
 * Faculty routes:
 * - GET /my - Get faculty's created quizzes
 * - POST / - Create new quiz
 * - PUT /:id - Update quiz (ownership checked in controller)
 * - DELETE /:id - Delete quiz (ownership checked in controller)
 * - PUT /:id/questions - Update quiz questions
 * - GET /:id/attempts - Get quiz attempts (for faculty's quizzes)
 */

// User's quizzes and attempt history (must be before /:id routes)
router.get("/my", protect, requireFaculty, getMyQuizzes);
router.get("/attempts/history", protect, getUserAttemptHistory);

// Public/Semi-public routes
router.get("/", optionalAuth, getQuizzes);
router.get("/:id", optionalAuth, getQuizById);

// Faculty routes - CRUD operations (ownership checked in controller)
router.post("/", protect, requireFaculty, createQuiz);
router.put("/:id", protect, requireFaculty, updateQuiz);
router.delete("/:id", protect, requireFaculty, deleteQuiz);

// Questions management (faculty only)
router.put("/:id/questions", protect, requireFaculty, updateQuestions);

// Quiz attempts - Students can submit, Faculty can view attempts for their quizzes
router.post("/:id/attempt", protect, submitQuizAttempt);
router.get("/:id/attempts", protect, requireFaculty, getQuizAttempts);

module.exports = router;
