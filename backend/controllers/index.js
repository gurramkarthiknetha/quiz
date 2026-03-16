const authController = require("./authController");
const quizController = require("./quizController");
const generateController = require("./generateController");
const resultsController = require("./resultsController");
const analyticsController = require("./analyticsController");

module.exports = {
  ...authController,
  ...quizController,
  ...generateController,
  ...resultsController,
  ...analyticsController,
};
