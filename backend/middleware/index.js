const { protect, optionalAuth } = require("./authMiddleware");
const { notFound, errorHandler } = require("./errorMiddleware");
const { apiLimiter, authLimiter, generateLimiter } = require("./rateLimiter");
const {
  registerValidation,
  loginValidation,
  createQuizValidation,
  updateQuizValidation,
  generateQuizValidation,
  submitAttemptValidation,
  paginationValidation,
} = require("./validateMiddleware");
const {
  authorize,
  requireFaculty,
  requireStudent,
  requireAdmin,
  checkOwnership,
  checkOwnershipOrRole,
  hasPermission,
  requireActiveAccount,
  PERMISSIONS,
} = require("./rbacMiddleware");

module.exports = {
  // Authentication
  protect,
  optionalAuth,
  
  // RBAC (Role-Based Access Control)
  authorize,
  requireFaculty,
  requireStudent,
  requireAdmin,
  checkOwnership,
  checkOwnershipOrRole,
  hasPermission,
  requireActiveAccount,
  PERMISSIONS,
  
  // Error handling
  notFound,
  errorHandler,
  
  // Rate limiting
  apiLimiter,
  authLimiter,
  generateLimiter,
  
  // Validation
  registerValidation,
  loginValidation,
  createQuizValidation,
  updateQuizValidation,
  generateQuizValidation,
  submitAttemptValidation,
  paginationValidation,
};
