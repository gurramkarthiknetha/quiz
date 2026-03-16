const { User } = require("../models");
const { asyncHandler, ApiError } = require("../utils");

/**
 * @desc    Get current user's full profile (with gamification data)
 * @route   GET /api/users/me
 * @access  Private
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "name email avatar role authProvider xp level badges totalQuizzes averageScore highScoreCount streakCount createdAt"
  );

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  // Calculate XP progress
  const xpProgress = user.getXpProgress();

  res.json({
    success: true,
    data: {
      ...user.toObject(),
      xpProgress,
      badgeCount: user.badges.length,
    },
  });
});

/**
 * @desc    Update current user's profile
 * @route   PUT /api/users/me
 * @access  Private
 *
 * Allowed updates: name, avatar
 * Password change: only for local auth users (requires currentPassword)
 * Role changes: NOT allowed
 */
const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, avatar, currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  // Update name if provided
  if (name !== undefined) {
    if (!name.trim()) {
      throw new ApiError("Name cannot be empty", 400);
    }
    if (name.length > 50) {
      throw new ApiError("Name cannot exceed 50 characters", 400);
    }
    user.name = name.trim();
  }

  // Update avatar if provided
  if (avatar !== undefined) {
    user.avatar = avatar;
  }

  // Change password (only for local auth)
  if (newPassword) {
    if (user.authProvider === "google") {
      throw new ApiError("Cannot change password for Google OAuth accounts", 400);
    }
    if (!currentPassword) {
      throw new ApiError("Current password is required to change password", 400);
    }
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      throw new ApiError("Current password is incorrect", 401);
    }
    if (newPassword.length < 6) {
      throw new ApiError("New password must be at least 6 characters", 400);
    }
    user.password = newPassword;
  }

  await user.save();

  // Return updated profile without password
  const updatedUser = await User.findById(user._id).select(
    "name email avatar role authProvider xp level badges totalQuizzes averageScore highScoreCount streakCount createdAt"
  );

  res.json({
    success: true,
    data: {
      ...updatedUser.toObject(),
      xpProgress: updatedUser.getXpProgress(),
      badgeCount: updatedUser.badges.length,
    },
    message: "Profile updated successfully",
  });
});

/**
 * @desc    Get user's gamification stats
 * @route   GET /api/users/me/gamification
 * @access  Private
 */
const getMyGamification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "xp level badges totalQuizzes averageScore highScoreCount streakCount"
  );

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  res.json({
    success: true,
    data: {
      xp: user.xp,
      level: user.level,
      xpProgress: user.getXpProgress(),
      badges: user.badges,
      badgeCount: user.badges.length,
      totalQuizzes: user.totalQuizzes,
      averageScore: user.averageScore,
      highScoreCount: user.highScoreCount,
      streakCount: user.streakCount,
    },
  });
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  getMyGamification,
};
