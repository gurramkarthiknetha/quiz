const express = require("express");
const router = express.Router();
const { getLeaderboard } = require("../controllers/leaderboardController");
const { protect } = require("../middleware");

// Protected leaderboard - students and faculty can view
router.get("/", protect, getLeaderboard);

module.exports = router;
