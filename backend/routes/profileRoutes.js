const express = require("express");
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
  getMyGamification,
} = require("../controllers/profileController");
const { protect } = require("../middleware");

/**
 * User Profile Routes
 *
 * - GET  /me              → Get own profile with gamification data
 * - PUT  /me              → Update name, avatar, password
 * - GET  /me/gamification → Get gamification stats only
 */

router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);
router.get("/me/gamification", protect, getMyGamification);

module.exports = router;
