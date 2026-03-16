const express = require("express");
const passport = require("passport");
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updatePassword,
  googleCallback,
  getRole,
  updateUserRole,
  getAllUsers,
  deactivateUser,
  activateUser,
} = require("../controllers/authController");
const { protect, requireAdmin } = require("../middleware");
const { authLimiter } = require("../middleware/rateLimiter");

// Public routes (with rate limiting)
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

// Google OAuth routes
router.get(
  "/google",
  (req, res, next) => {
    // Store role preference in session before OAuth redirect
    if (req.query.role && ['student', 'faculty'].includes(req.query.role)) {
      req.session.pendingRole = req.query.role;
    }
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CORS_ORIGIN}/login?error=Google authentication failed`,
    session: false,
  }),
  googleCallback
);

// Protected routes
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.get("/role", protect, getRole);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, updatePassword);

// Admin only routes
router.get("/users", protect, requireAdmin, getAllUsers);
router.put("/users/:userId/role", protect, requireAdmin, updateUserRole);
router.put("/users/:userId/deactivate", protect, requireAdmin, deactivateUser);
router.put("/users/:userId/activate", protect, requireAdmin, activateUser);

module.exports = router;
