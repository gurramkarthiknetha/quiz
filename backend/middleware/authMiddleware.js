const jwt = require("jsonwebtoken");
const { asyncHandler, ApiError } = require("../utils");
const { User } = require("../models");

/**
 * Protect routes - Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // Also check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError("Not authorized, no token provided", 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      throw new ApiError("User not found", 401);
    }

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new ApiError("Not authorized, invalid token", 401);
    }
    if (error.name === "TokenExpiredError") {
      throw new ApiError("Not authorized, token expired", 401);
    }
    throw error;
  }
});

/**
 * Optional authentication - Attaches user if token exists but doesn't require it
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      // Token invalid, continue without user
      req.user = null;
    }
  }

  next();
});

module.exports = { protect, optionalAuth };
