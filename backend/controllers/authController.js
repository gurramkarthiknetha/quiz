const { User, ROLES, APPROVAL_STATUS } = require("../models");
const { asyncHandler, generateToken, ApiError } = require("../utils");

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ApiError("User already exists with this email", 400);
  }

  // Check if email is in admin list
  const isAdminEmail = User.isAdminEmail(email);
  
  // Determine role
  let userRole;
  if (isAdminEmail) {
    // Admin emails get admin role automatically
    userRole = ROLES.ADMIN;
  } else if (role === ROLES.FACULTY || role === ROLES.STUDENT) {
    // Use the role selected by user (only student or faculty allowed)
    userRole = role;
  } else {
    // Default to student
    userRole = ROLES.STUDENT;
  }

  // Determine approval status based on role
  const approvalStatus = User.getInitialApprovalStatus(userRole);

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: userRole,
    approvalStatus,
    authProvider: "local",
  });

  if (user) {
    // If faculty, don't generate token - they need approval first
    if (userRole === ROLES.FACULTY && approvalStatus === APPROVAL_STATUS.PENDING) {
      res.status(201).json({
        success: true,
        message: "Registration successful! Your faculty account is pending admin approval. You will be notified once approved.",
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          approvalStatus: user.approvalStatus,
          pendingApproval: true,
        },
      });
      return;
    }

    const token = generateToken(user._id);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        approvalStatus: user.approvalStatus,
        authProvider: user.authProvider,
        token,
      },
    });
  }
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    throw new ApiError("Please provide email and password", 400);
  }

  // Check for user
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError("Invalid credentials", 401);
  }

  // Check if user uses OAuth (no password)
  if (user.authProvider === "google" && !user.password) {
    throw new ApiError("This account uses Google sign-in. Please login with Google.", 400);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new ApiError("Your account has been deactivated. Please contact support.", 403);
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError("Invalid credentials", 401);
  }

  // Check if faculty account is pending approval
  if (user.role === ROLES.FACULTY && user.approvalStatus === APPROVAL_STATUS.PENDING) {
    throw new ApiError("Your faculty account is pending admin approval. Please wait for approval.", 403);
  }

  // Check if faculty account was rejected
  if (user.role === ROLES.FACULTY && user.approvalStatus === APPROVAL_STATUS.REJECTED) {
    throw new ApiError("Your faculty registration was rejected. Please contact support for more information.", 403);
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user._id);

  // Set cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      approvalStatus: user.approvalStatus,
      authProvider: user.authProvider,
      token,
    },
  });
});

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, avatar } = req.body;

  const user = await User.findById(req.user._id);

  if (user) {
    user.name = name || user.name;
    user.email = email || user.email;
    if (avatar !== undefined) user.avatar = avatar;

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        authProvider: updatedUser.authProvider,
      },
    });
  } else {
    throw new ApiError("User not found", 404);
  }
});

/**
 * @desc    Update password
 * @route   PUT /api/auth/password
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  // Check if user uses OAuth (might not have password)
  if (user.authProvider === "google" && !user.password) {
    throw new ApiError("Cannot change password for Google OAuth accounts", 400);
  }

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw new ApiError("Current password is incorrect", 401);
  }

  user.password = newPassword;
  await user.save();

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: "Password updated successfully",
    token,
  });
});

/**
 * @desc    Handle Google OAuth callback
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
const googleCallback = asyncHandler(async (req, res) => {
  // Passport middleware adds user to req.user
  const user = req.user;

  if (!user) {
    // Redirect to frontend with error
    return res.redirect(
      `${process.env.CORS_ORIGIN}/login?error=Authentication failed`
    );
  }

  // Check if account is active
  if (!user.isActive) {
    return res.redirect(
      `${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent("Your account has been deactivated. Please contact support.")}`
    );
  }

  // Check if faculty account is pending approval
  if (user.role === ROLES.FACULTY && user.approvalStatus === APPROVAL_STATUS.PENDING) {
    return res.redirect(
      `${process.env.CORS_ORIGIN}/pending-approval?email=${encodeURIComponent(user.email)}`
    );
  }

  // Check if faculty account was rejected
  if (user.role === ROLES.FACULTY && user.approvalStatus === APPROVAL_STATUS.REJECTED) {
    return res.redirect(
      `${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent("Your faculty registration was rejected. Please contact support.")}`
    );
  }

  // Generate JWT token
  const token = generateToken(user._id);

  // Set cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // Redirect to frontend with success
  // Frontend will read the cookie and update auth state
  res.redirect(
    `${process.env.CORS_ORIGIN}/auth/callback?success=true&token=${token}`
  );
});

/**
 * @desc    Get user role
 * @route   GET /api/auth/role
 * @access  Private
 */
const getRole = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      role: req.user.role,
      permissions: getPermissionsForRole(req.user.role),
    },
  });
});

/**
 * @desc    Update user role (Admin only)
 * @route   PUT /api/auth/users/:userId/role
 * @access  Private (Admin)
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  // Validate role
  if (!Object.values(ROLES).includes(role)) {
    throw new ApiError(`Invalid role. Must be one of: ${Object.values(ROLES).join(", ")}`, 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  // Prevent self-demotion
  if (req.user._id.toString() === userId && role !== ROLES.ADMIN) {
    throw new ApiError("Cannot change your own admin role", 400);
  }

  user.role = role;
  await user.save();

  res.json({
    success: true,
    message: `User role updated to ${role}`,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/auth/users
 * @access  Private (Admin)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search } = req.query;

  const query = {};

  // Filter by role
  if (role && Object.values(ROLES).includes(role)) {
    query.role = role;
  }

  // Search by name or email
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(query)
    .select("-password")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Deactivate user account (Admin only)
 * @route   PUT /api/auth/users/:userId/deactivate
 * @access  Private (Admin)
 */
const deactivateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  // Prevent self-deactivation
  if (req.user._id.toString() === userId) {
    throw new ApiError("Cannot deactivate your own account", 400);
  }

  user.isActive = false;
  await user.save();

  res.json({
    success: true,
    message: "User account deactivated",
  });
});

/**
 * @desc    Activate user account (Admin only)
 * @route   PUT /api/auth/users/:userId/activate
 * @access  Private (Admin)
 */
const activateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  user.isActive = true;
  await user.save();

  res.json({
    success: true,
    message: "User account activated",
  });
});

/**
 * Helper function to get permissions for a role
 */
const getPermissionsForRole = (role) => {
  const permissions = {
    [ROLES.STUDENT]: [
      "take_quiz",
      "view_own_results",
      "update_profile",
    ],
    [ROLES.FACULTY]: [
      "take_quiz",
      "create_quiz",
      "view_own_results",
      "view_student_results",
      "generate_reports",
      "update_profile",
    ],
    [ROLES.ADMIN]: [
      "take_quiz",
      "create_quiz",
      "view_own_results",
      "view_student_results",
      "view_all_results",
      "generate_reports",
      "manage_users",
      "manage_roles",
      "update_profile",
    ],
  };

  return permissions[role] || [];
};

module.exports = {
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
};
