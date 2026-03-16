const { QuizAttempt, Quiz, User } = require("../models");
const { asyncHandler, ApiError } = require("../utils");

/**
 * @desc    Get user's own results
 * @route   GET /api/results/me
 * @access  Private (Student)
 */
const getMyResults = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const attempts = await QuizAttempt.find({ user: req.user._id })
    .populate("quiz", "title description settings")
    .sort({ completedAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await QuizAttempt.countDocuments({ user: req.user._id });

  res.json({
    success: true,
    data: attempts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Get single result detail
 * @route   GET /api/results/:attemptId
 * @access  Private
 */
const getResultDetail = asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findById(req.params.attemptId)
    .populate("quiz")
    .populate("user", "name email avatar");

  if (!attempt) {
    throw new ApiError("Result not found", 404);
  }

  // Check if user is owner or faculty who owns the quiz
  const isOwner = attempt.user._id.toString() === req.user._id.toString();
  const quiz = await Quiz.findById(attempt.quiz._id);
  const isQuizOwner = quiz && quiz.creator.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isQuizOwner && !isAdmin) {
    throw new ApiError("Not authorized to view this result", 403);
  }

  res.json({
    success: true,
    data: attempt,
  });
});

/**
 * @desc    Get results for a specific quiz (Faculty view)
 * @route   GET /api/results/quiz/:quizId
 * @access  Private (Faculty - own quiz)
 */
const getQuizResults = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const quiz = await Quiz.findById(req.params.quizId);

  if (!quiz) {
    throw new ApiError("Quiz not found", 404);
  }

  // Only quiz owner or admin can view results
  const isOwner = quiz.creator.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new ApiError("Not authorized to view results for this quiz", 403);
  }

  const attempts = await QuizAttempt.find({ quiz: req.params.quizId })
    .populate("user", "name email avatar")
    .sort({ completedAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await QuizAttempt.countDocuments({ quiz: req.params.quizId });

  // Calculate statistics
  const allAttempts = await QuizAttempt.find({ quiz: req.params.quizId });
  const percentages = allAttempts.map((a) => a.percentage);
  const avgScore = percentages.length > 0 ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0;
  const highestScore = percentages.length > 0 ? Math.max(...percentages) : 0;
  const lowestScore = percentages.length > 0 ? Math.min(...percentages) : 0;

  res.json({
    success: true,
    data: attempts,
    statistics: {
      totalAttempts: total,
      averageScore: avgScore.toFixed(2),
      highestScore,
      lowestScore,
      passRate: percentages.length > 0 ? percentages.filter((s) => s >= 60).length / percentages.length * 100 : 0,
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Get results for a specific student (Faculty view)
 * @route   GET /api/results/student/:studentId
 * @access  Private (Faculty)
 */
const getStudentResults = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  // Faculty can see student results for quizzes they created
  const facultyQuizzes = await Quiz.find({ creator: req.user._id }).select("_id");
  const quizIds = facultyQuizzes.map((q) => q._id);

  const attempts = await QuizAttempt.find({
    user: req.params.studentId,
    quiz: { $in: quizIds },
  })
    .populate("quiz", "title description")
    .sort({ completedAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await QuizAttempt.countDocuments({
    user: req.params.studentId,
    quiz: { $in: quizIds },
  });

  const student = await User.findById(req.params.studentId).select("name email avatar");

  res.json({
    success: true,
    data: {
      student,
      attempts,
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

module.exports = {
  getMyResults,
  getResultDetail,
  getQuizResults,
  getStudentResults,
};
