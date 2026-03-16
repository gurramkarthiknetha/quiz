const express = require("express");
const router = express.Router();
const { getSystemAnalytics } = require("../controllers/analyticsController");
const { protect, requireAdmin } = require("../middleware");
const { User, Quiz, QuizAttempt, ROLES, APPROVAL_STATUS } = require("../models");
const { asyncHandler, ApiError } = require("../utils");

/**
 * Admin Routes
 * All routes require admin role
 * 
 * - GET /analytics - System-wide analytics
 * - DELETE /users/:userId - Delete user
 * - GET /dashboard - Admin dashboard data
 * - GET /pending-faculty - Get pending faculty registrations
 * - PUT /faculty/:userId/approve - Approve faculty
 * - PUT /faculty/:userId/reject - Reject faculty
 */

// System analytics
router.get("/analytics", protect, requireAdmin, getSystemAnalytics);

/**
 * @desc    Get pending faculty registrations
 * @route   GET /api/admin/pending-faculty
 * @access  Private (Admin)
 */
router.get(
  "/pending-faculty",
  protect,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const pendingFaculty = await User.find({
      role: ROLES.FACULTY,
      approvalStatus: APPROVAL_STATUS.PENDING,
    })
      .select("name email avatar createdAt authProvider")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pendingFaculty.length,
      data: pendingFaculty,
    });
  })
);

/**
 * @desc    Approve faculty registration
 * @route   PUT /api/admin/faculty/:userId/approve
 * @access  Private (Admin)
 */
router.put(
  "/faculty/:userId/approve",
  protect,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { note } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    if (user.role !== ROLES.FACULTY) {
      throw new ApiError("This user is not a faculty member", 400);
    }

    if (user.approvalStatus === APPROVAL_STATUS.APPROVED) {
      throw new ApiError("This faculty member is already approved", 400);
    }

    user.approvalStatus = APPROVAL_STATUS.APPROVED;
    user.approvalNote = note || "Approved by admin";
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Faculty registration approved successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
      },
    });
  })
);

/**
 * @desc    Reject faculty registration
 * @route   PUT /api/admin/faculty/:userId/reject
 * @access  Private (Admin)
 */
router.put(
  "/faculty/:userId/reject",
  protect,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new ApiError("Please provide a reason for rejection", 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    if (user.role !== ROLES.FACULTY) {
      throw new ApiError("This user is not a faculty member", 400);
    }

    if (user.approvalStatus === APPROVAL_STATUS.REJECTED) {
      throw new ApiError("This faculty member is already rejected", 400);
    }

    user.approvalStatus = APPROVAL_STATUS.REJECTED;
    user.approvalNote = reason;
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Faculty registration rejected",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
      },
    });
  })
);

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/admin/users/:userId
 * @access  Private (Admin)
 */
router.delete(
  "/users/:userId",
  protect,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Prevent self-deletion
    if (req.user._id.toString() === userId) {
      throw new ApiError("Cannot delete your own account", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    // Delete user's quizzes
    await Quiz.deleteMany({ creator: userId });

    // Delete user's quiz attempts
    await QuizAttempt.deleteMany({ user: userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: "User and associated data deleted successfully",
    });
  })
);

/**
 * @desc    Get admin dashboard summary
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin)
 */
router.get(
  "/dashboard",
  protect,
  requireAdmin,
  asyncHandler(async (req, res) => {
    // Quick counts for dashboard
    const [
      totalUsers,
      totalQuizzes,
      totalAttempts,
      pendingFacultyCount,
      recentUsers,
      recentQuizzes,
    ] = await Promise.all([
      User.countDocuments(),
      Quiz.countDocuments(),
      QuizAttempt.countDocuments(),
      User.countDocuments({ role: ROLES.FACULTY, approvalStatus: APPROVAL_STATUS.PENDING }),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email role createdAt avatar approvalStatus"),
      Quiz.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("creator", "name email")
        .select("title createdAt isPublic"),
    ]);

    // User role distribution
    const roleDistribution = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        counts: {
          users: totalUsers,
          quizzes: totalQuizzes,
          attempts: totalAttempts,
          pendingFaculty: pendingFacultyCount,
        },
        roleDistribution: roleDistribution.reduce(
          (acc, r) => ({ ...acc, [r._id]: r.count }),
          {}
        ),
        recentUsers,
        recentQuizzes,
      },
    });
  })
);

module.exports = router;
