const { ApiError } = require("../utils");
const { ROLES } = require("../models");

/**
 * Role-Based Access Control (RBAC) Middleware
 * Provides flexible authorization based on user roles
 */

/**
 * Authorize middleware - Check if user has required role(s)
 * @param {...string} allowedRoles - Roles allowed to access the route
 * @returns {function} Express middleware function
 * 
 * Usage:
 * - Single role: authorize(ROLES.FACULTY)
 * - Multiple roles: authorize(ROLES.FACULTY, ROLES.ADMIN)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // User must be authenticated first
    if (!req.user) {
      return next(new ApiError("Not authenticated", 401));
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          `Access denied. Required role(s): ${allowedRoles.join(", ")}. Your role: ${req.user.role}`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Require Faculty Role
 * Middleware to restrict access to faculty members only
 */
const requireFaculty = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError("Not authenticated", 401));
  }

  if (req.user.role !== ROLES.FACULTY && req.user.role !== ROLES.ADMIN) {
    return next(new ApiError("Access denied. Faculty role required.", 403));
  }

  next();
};

/**
 * Require Student Role
 * Middleware to restrict access to students only
 */
const requireStudent = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError("Not authenticated", 401));
  }

  if (req.user.role !== ROLES.STUDENT && req.user.role !== ROLES.ADMIN) {
    return next(new ApiError("Access denied. Student role required.", 403));
  }

  next();
};

/**
 * Require Admin Role
 * Middleware to restrict access to admins only
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError("Not authenticated", 401));
  }

  if (req.user.role !== ROLES.ADMIN) {
    return next(new ApiError("Access denied. Admin role required.", 403));
  }

  next();
};

/**
 * Check if user is owner of resource
 * @param {string} resourceUserField - Field name containing user ID in the resource
 * @returns {function} Express middleware function
 * 
 * Usage: checkOwnership('createdBy') - checks if req.resource.createdBy === req.user._id
 */
const checkOwnership = (resourceUserField = "user") => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError("Not authenticated", 401));
    }

    // Admin can access any resource
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    // Check if resource exists and user is the owner
    const resource = req.resource || req.body;
    const resourceUserId = resource[resourceUserField];

    if (!resourceUserId) {
      return next(new ApiError("Resource not found", 404));
    }

    if (resourceUserId.toString() !== req.user._id.toString()) {
      return next(new ApiError("Not authorized to access this resource", 403));
    }

    next();
  };
};

/**
 * Check if user is owner OR has specific role
 * Useful for routes where owners can edit their content, but faculty can also view/edit all
 * @param {string} resourceUserField - Field containing the owner's user ID
 * @param {...string} additionalRoles - Additional roles that can access regardless of ownership
 */
const checkOwnershipOrRole = (resourceUserField, ...additionalRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError("Not authenticated", 401));
    }

    // Admin always has access
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    // Check if user has one of the additional roles
    if (additionalRoles.includes(req.user.role)) {
      return next();
    }

    // Check ownership
    const resource = req.resource || req.body;
    const resourceUserId = resource[resourceUserField];

    if (resourceUserId && resourceUserId.toString() === req.user._id.toString()) {
      return next();
    }

    return next(
      new ApiError("Not authorized to access this resource", 403)
    );
  };
};

/**
 * Permission-based access control
 * Define specific permissions for each role
 */
const PERMISSIONS = {
  // Quiz permissions
  CREATE_QUIZ: [ROLES.FACULTY, ROLES.ADMIN],
  EDIT_ANY_QUIZ: [ROLES.ADMIN],
  DELETE_ANY_QUIZ: [ROLES.ADMIN],
  VIEW_ALL_QUIZZES: [ROLES.FACULTY, ROLES.ADMIN],
  
  // User management permissions
  MANAGE_USERS: [ROLES.ADMIN],
  VIEW_ALL_USERS: [ROLES.ADMIN],
  CHANGE_USER_ROLE: [ROLES.ADMIN],
  
  // Student permissions
  TAKE_QUIZ: [ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN],
  VIEW_OWN_RESULTS: [ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN],
  
  // Faculty permissions
  VIEW_STUDENT_RESULTS: [ROLES.FACULTY, ROLES.ADMIN],
  GENERATE_REPORTS: [ROLES.FACULTY, ROLES.ADMIN],
};

/**
 * Check if user has specific permission
 * @param {string} permission - Permission name from PERMISSIONS object
 * @returns {function} Express middleware function
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError("Not authenticated", 401));
    }

    const allowedRoles = PERMISSIONS[permission];
    
    if (!allowedRoles) {
      console.error(`Unknown permission: ${permission}`);
      return next(new ApiError("Server configuration error", 500));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(`Permission denied. You don't have the "${permission}" permission.`, 403)
      );
    }

    next();
  };
};

/**
 * Check if user account is active
 */
const requireActiveAccount = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError("Not authenticated", 401));
  }

  if (!req.user.isActive) {
    return next(new ApiError("Your account has been deactivated. Please contact support.", 403));
  }

  next();
};

module.exports = {
  authorize,
  requireFaculty,
  requireStudent,
  requireAdmin,
  checkOwnership,
  checkOwnershipOrRole,
  hasPermission,
  requireActiveAccount,
  PERMISSIONS,
};
