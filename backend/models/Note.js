const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Note title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    content: {
      type: String,
      default: "",
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [100, "Subject cannot exceed 100 characters"],
    },
    topic: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Topic cannot exceed 100 characters"],
    },
    tags: {
      type: [String],
      default: [],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // File attachment (PDF uploaded to Cloudinary)
    attachment: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
      fileName: { type: String, default: "" },
      fileSize: { type: Number, default: 0 },
      fileType: { type: String, default: "" },
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Text search index
noteSchema.index({ title: "text", description: "text", subject: "text", tags: "text" });

// Ensure virtuals are included in JSON
noteSchema.set("toJSON", { virtuals: true });
noteSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Note", noteSchema);
