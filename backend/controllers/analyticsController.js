const { QuizAttempt, Quiz, User } = require("../models");
const { asyncHandler, ApiError } = require("../utils");

/**
 * @desc    Get user's own analytics (Student)
 * @route   GET /api/analytics/me
 * @access  Private (Student)
 */
const getMyAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get all attempts
  const attempts = await QuizAttempt.find({ user: userId })
    .populate("quiz", "title topics settings")
    .sort({ completedAt: -1 });

  // Calculate overall statistics
  const totalQuizzesTaken = attempts.length;
  const scores = attempts.map((a) => a.score);
  const averageScore = scores.length > 0 
    ? scores.reduce((a, b) => a + b, 0) / scores.length 
    : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const totalTimeTaken = attempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0);

  // Topic-wise performance
  const topicPerformance = {};
  attempts.forEach((attempt) => {
    const quiz = attempt.quiz;
    if (quiz && quiz.topics) {
      quiz.topics.forEach((topic) => {
        if (!topicPerformance[topic]) {
          topicPerformance[topic] = { total: 0, score: 0, count: 0 };
        }
        topicPerformance[topic].total += 100;
        topicPerformance[topic].score += attempt.score;
        topicPerformance[topic].count += 1;
      });
    }
  });

  // Calculate average per topic
  const topicAnalytics = Object.entries(topicPerformance).map(([topic, data]) => ({
    topic,
    averageScore: (data.score / data.count).toFixed(2),
    attempts: data.count,
  }));

  // Recent performance trend (last 10 quizzes)
  const recentAttempts = attempts.slice(0, 10);
  const performanceTrend = recentAttempts.map((a) => ({
    date: a.completedAt,
    score: a.score,
    quizTitle: a.quiz?.title || "Unknown",
  })).reverse();

  res.json({
    success: true,
    data: {
      overview: {
        totalQuizzesTaken,
        averageScore: averageScore.toFixed(2),
        highestScore,
        totalTimeTaken,
        passRate: scores.filter((s) => s >= 60).length / totalQuizzesTaken * 100 || 0,
      },
      topicAnalytics,
      performanceTrend,
    },
  });
});

/**
 * @desc    Get weak topics (Student)
 * @route   GET /api/analytics/weak-topics
 * @access  Private (Student)
 */
const getWeakTopics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const attempts = await QuizAttempt.find({ user: userId })
    .populate("quiz", "topics")
    .select("score answers quiz");

  // Analyze topic-wise performance
  const topicStats = {};
  
  attempts.forEach((attempt) => {
    if (attempt.quiz && attempt.quiz.topics) {
      attempt.quiz.topics.forEach((topic) => {
        if (!topicStats[topic]) {
          topicStats[topic] = { totalScore: 0, count: 0 };
        }
        topicStats[topic].totalScore += attempt.score;
        topicStats[topic].count += 1;
      });
    }
  });

  // Find weak topics (below 60% average)
  const weakTopics = Object.entries(topicStats)
    .map(([topic, stats]) => ({
      topic,
      averageScore: stats.totalScore / stats.count,
      attemptCount: stats.count,
    }))
    .filter((t) => t.averageScore < 60)
    .sort((a, b) => a.averageScore - b.averageScore);

  res.json({
    success: true,
    data: weakTopics,
  });
});

/**
 * @desc    Get performance history (Student)
 * @route   GET /api/analytics/performance-history
 * @access  Private (Student)
 */
const getPerformanceHistory = asyncHandler(async (req, res) => {
  const { period = "30d" } = req.query;
  const userId = req.user._id;

  // Calculate date range
  const now = new Date();
  let startDate;
  switch (period) {
    case "7d":
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
      break;
    case "all":
      startDate = new Date(0);
      break;
    default:
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
  }

  const attempts = await QuizAttempt.find({
    user: userId,
    completedAt: { $gte: startDate },
  })
    .populate("quiz", "title")
    .sort({ completedAt: 1 });

  const history = attempts.map((a) => ({
    date: a.completedAt,
    score: a.score,
    quizTitle: a.quiz?.title || "Unknown",
    timeTaken: a.timeTaken,
  }));

  res.json({
    success: true,
    data: history,
  });
});

/**
 * @desc    Get quiz analytics (Faculty)
 * @route   GET /api/analytics/quiz/:quizId
 * @access  Private (Faculty - own quiz)
 */
const getQuizAnalytics = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.quizId);

  if (!quiz) {
    throw new ApiError("Quiz not found", 404);
  }

  // Check ownership
  if (quiz.creator.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError("Not authorized to view analytics for this quiz", 403);
  }

  const attempts = await QuizAttempt.find({ quiz: req.params.quizId })
    .populate("user", "name email");

  const scores = attempts.map((a) => a.score);
  const timeTaken = attempts.map((a) => a.timeTaken || 0);

  // Score distribution
  const scoreDistribution = {
    "0-20": 0,
    "21-40": 0,
    "41-60": 0,
    "61-80": 0,
    "81-100": 0,
  };

  scores.forEach((score) => {
    if (score <= 20) scoreDistribution["0-20"]++;
    else if (score <= 40) scoreDistribution["21-40"]++;
    else if (score <= 60) scoreDistribution["41-60"]++;
    else if (score <= 80) scoreDistribution["61-80"]++;
    else scoreDistribution["81-100"]++;
  });

  // Question-wise analysis
  const questionAnalysis = quiz.questions.map((q, index) => {
    let correctCount = 0;
    attempts.forEach((attempt) => {
      const answer = attempt.answers?.find((a) => a.questionId?.toString() === q._id?.toString());
      if (answer && answer.isCorrect) {
        correctCount++;
      }
    });
    return {
      questionIndex: index + 1,
      question: q.question?.substring(0, 100) + "...",
      correctRate: attempts.length > 0 ? (correctCount / attempts.length * 100).toFixed(2) : 0,
    };
  });

  res.json({
    success: true,
    data: {
      overview: {
        totalAttempts: attempts.length,
        averageScore: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0,
        highestScore: scores.length > 0 ? Math.max(...scores) : 0,
        lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
        averageTime: timeTaken.length > 0 ? Math.round(timeTaken.reduce((a, b) => a + b, 0) / timeTaken.length) : 0,
        passRate: scores.filter((s) => s >= 60).length / scores.length * 100 || 0,
      },
      scoreDistribution,
      questionAnalysis,
      recentAttempts: attempts.slice(0, 10).map((a) => ({
        student: a.user,
        score: a.score,
        timeTaken: a.timeTaken,
        completedAt: a.completedAt,
      })),
    },
  });
});

/**
 * @desc    Get class/overall analytics (Faculty)
 * @route   GET /api/analytics/class
 * @access  Private (Faculty)
 */
const getClassAnalytics = asyncHandler(async (req, res) => {
  const { quizId } = req.query;
  const facultyId = req.user._id;

  // Get all quizzes created by faculty
  const quizQuery = { creator: facultyId };
  if (quizId) {
    quizQuery._id = quizId;
  }

  const quizzes = await Quiz.find(quizQuery).select("_id title");
  const quizIds = quizzes.map((q) => q._id);

  // Get all attempts for faculty's quizzes
  const attempts = await QuizAttempt.find({ quiz: { $in: quizIds } })
    .populate("user", "name email")
    .populate("quiz", "title");

  // Overall stats
  const totalStudents = [...new Set(attempts.map((a) => a.user._id.toString()))].length;
  const scores = attempts.map((a) => a.score);

  // Per-quiz summary
  const quizSummary = await Promise.all(
    quizzes.map(async (quiz) => {
      const quizAttempts = attempts.filter((a) => a.quiz._id.toString() === quiz._id.toString());
      const quizScores = quizAttempts.map((a) => a.score);
      return {
        quizId: quiz._id,
        title: quiz.title,
        totalAttempts: quizAttempts.length,
        averageScore: quizScores.length > 0 
          ? (quizScores.reduce((a, b) => a + b, 0) / quizScores.length).toFixed(2) 
          : 0,
        passRate: quizScores.filter((s) => s >= 60).length / quizScores.length * 100 || 0,
      };
    })
  );

  // Top performers
  const studentScores = {};
  attempts.forEach((a) => {
    const id = a.user._id.toString();
    if (!studentScores[id]) {
      studentScores[id] = { user: a.user, scores: [], count: 0 };
    }
    studentScores[id].scores.push(a.score);
    studentScores[id].count++;
  });

  const topPerformers = Object.values(studentScores)
    .map((s) => ({
      student: s.user,
      averageScore: (s.scores.reduce((a, b) => a + b, 0) / s.scores.length).toFixed(2),
      quizzesTaken: s.count,
    }))
    .sort((a, b) => parseFloat(b.averageScore) - parseFloat(a.averageScore))
    .slice(0, 10);

  res.json({
    success: true,
    data: {
      overview: {
        totalQuizzes: quizzes.length,
        totalStudents,
        totalAttempts: attempts.length,
        averageScore: scores.length > 0 
          ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) 
          : 0,
      },
      quizSummary,
      topPerformers,
    },
  });
});

/**
 * @desc    Get system-wide analytics (Admin)
 * @route   GET /api/admin/analytics
 * @access  Private (Admin)
 */
const getSystemAnalytics = asyncHandler(async (req, res) => {
  // User statistics
  const totalUsers = await User.countDocuments();
  const usersByRole = await User.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } },
  ]);

  const activeUsers = await User.countDocuments({
    lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  });

  // Quiz statistics
  const totalQuizzes = await Quiz.countDocuments();
  const publicQuizzes = await Quiz.countDocuments({ isPublic: true });

  // Attempt statistics
  const totalAttempts = await QuizAttempt.countDocuments();
  const avgScore = await QuizAttempt.aggregate([
    { $group: { _id: null, avgScore: { $avg: "$score" } } },
  ]);

  // Recent activity (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentSignups = await User.countDocuments({ createdAt: { $gte: weekAgo } });
  const recentAttempts = await QuizAttempt.countDocuments({ completedAt: { $gte: weekAgo } });

  // Daily activity trend (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dailyAttempts = await QuizAttempt.aggregate([
    { $match: { completedAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        byRole: usersByRole.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
        activeLastMonth: activeUsers,
        recentSignups,
      },
      quizzes: {
        total: totalQuizzes,
        public: publicQuizzes,
        private: totalQuizzes - publicQuizzes,
      },
      attempts: {
        total: totalAttempts,
        averageScore: avgScore[0]?.avgScore?.toFixed(2) || 0,
        recentWeek: recentAttempts,
      },
      activityTrend: dailyAttempts,
    },
  });
});

module.exports = {
  getMyAnalytics,
  getWeakTopics,
  getPerformanceHistory,
  getQuizAnalytics,
  getClassAnalytics,
  getSystemAnalytics,
};
