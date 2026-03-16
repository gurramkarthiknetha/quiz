const express = require("express");
const router = express.Router();
const {
  generateQuiz,
  enhanceQuestions,
  extractTopics,
  generateExplanation,
} = require("../controllers/generateController");
const { generateLimiter } = require("../middleware/rateLimiter");

// Generate routes are public but rate-limited
router.use(generateLimiter);

router.post("/quiz", generateQuiz);
router.post("/enhance", enhanceQuestions);
router.post("/topics", extractTopics);
router.post("/explanation", generateExplanation);

module.exports = router;
