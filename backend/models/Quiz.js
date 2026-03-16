const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["MCQ", "TrueFalse", "ShortAnswer", "FillBlank"],
    required: true,
  },
  question: {
    type: String,
    required: [true, "Question text is required"],
  },
  options: {
    type: [String],
    default: undefined, // Only for MCQ
  },
  correctAnswer: {
    type: String,
    required: [true, "Correct answer is required"],
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium",
  },
  tag: {
    type: String,
    default: "General",
  },
  explanation: {
    type: String,
    default: "",
  },
  bloomLevel: {
    type: String,
    enum: ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"],
    default: undefined,
  },
});

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Quiz title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    sourceText: {
      type: String,
      default: "", // Original text used to generate quiz
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questions: [questionSchema],
    settings: {
      totalQuestions: {
        type: Number,
        default: 20,
      },
      questionTypes: {
        type: [String],
        enum: ["MCQ", "TrueFalse", "ShortAnswer", "FillBlank"],
        default: ["MCQ", "TrueFalse", "ShortAnswer"],
      },
      examMode: {
        type: String,
        enum: ["General", "UPSC", "JEE", "College", "School"],
        default: "General",
      },
      bloomsMode: {
        type: Boolean,
        default: false,
      },
      difficultyDistribution: {
        easy: { type: Number, default: 50 },
        medium: { type: Number, default: 30 },
        hard: { type: Number, default: 20 },
      },
      timeLimit: {
        type: Number,
        default: 0, // 0 = no limit, otherwise in minutes
      },
    },
    topics: {
      type: [String],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    topic: {
      type: String,
      default: "",
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    timeLimit: {
      type: Number,
      default: 30, // Default 30 minutes
    },
    tags: {
      type: [String],
      default: [],
    },
    questionCount: {
      type: Number,
      default: 0,
    },
    timesPlayed: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to update questionCount
quizSchema.pre("save", function (next) {
  if (this.questions) {
    this.questionCount = this.questions.length;
  }
  next();
});

// Index for search functionality
quizSchema.index({ title: "text", description: "text", tags: "text" });

// Ensure virtuals are included in JSON
quizSchema.set("toJSON", { virtuals: true });
quizSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Quiz", quizSchema);
