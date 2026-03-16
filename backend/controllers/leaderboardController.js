const { User } = require("../models");
const { asyncHandler, ApiError } = require("../utils");

/**
 * @desc    Get top 10 students by XP (descending)
 * @route   GET /api/leaderboard
 * @access  Private (students + faculty can view)
 */
const getLeaderboard = asyncHandler(async (req, res) => {
  const students = await User.find({ role: "student", isActive: true })
    .select("name email avatar xp level badges totalQuizzes averageScore")
    .sort({ xp: -1 })
    .limit(10);

  // Build leaderboard with rank
  const leaderboard = students.map((s, idx) => ({
    rank: idx + 1,
    _id: s._id,
    name: s.name,
    avatar: s.avatar,
    xp: s.xp,
    level: s.level,
    totalQuizzes: s.totalQuizzes,
    averageScore: s.averageScore,
    badgeCount: s.badges.length,
  }));

  res.json({
    success: true,
    data: leaderboard,
  });
});

module.exports = { getLeaderboard };
