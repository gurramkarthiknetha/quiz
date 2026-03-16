const { body, param, query, validationResult } = require("express-validator");
const { ApiError } = require("../utils");

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg);
    throw new ApiError(messages.join(", "), 400);
  }
  next();
};

/**
 * Auth validation rules
 */
const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 50 })
    .withMessage("Name cannot exceed 50 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  validate,
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

/**
 * Quiz validation rules
 */
const createQuizValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Quiz title is required")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),
  body("questions")
    .isArray({ min: 1 })
    .withMessage("At least one question is required"),
  body("questions.*.question")
    .trim()
    .notEmpty()
    .withMessage("Question text is required"),
  body("questions.*.type")
    .isIn(["MCQ", "TrueFalse", "ShortAnswer", "FillBlank"])
    .withMessage("Invalid question type"),
  body("questions.*.correctAnswer")
    .trim()
    .notEmpty()
    .withMessage("Correct answer is required"),
  validate,
];

const updateQuizValidation = [
  param("id").isMongoId().withMessage("Invalid quiz ID"),
  body("title")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),
  validate,
];

/**
 * Generate quiz validation rules
 */
const generateQuizValidation = [
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Text content is required")
    .isLength({ min: 50 })
    .withMessage("Text must be at least 50 characters"),
  body("settings").optional().isObject().withMessage("Settings must be an object"),
  validate,
];

/**
 * Quiz attempt validation
 */
const submitAttemptValidation = [
  param("id").isMongoId().withMessage("Invalid quiz ID"),
  body("answers").isArray().withMessage("Answers must be an array"),
  body("totalTimeTaken")
    .isInt({ min: 0 })
    .withMessage("Time taken must be a positive number"),
  validate,
];

/**
 * Pagination validation
 */
const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  validate,
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  createQuizValidation,
  updateQuizValidation,
  generateQuizValidation,
  submitAttemptValidation,
  paginationValidation,
};
