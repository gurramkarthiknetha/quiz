const express = require("express");
const router = express.Router();
const {
  uploadPDF,
  uploadText,
  getFile,
  deleteFile,
} = require("../controllers/uploadController");
const { uploadToMemory } = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware");

// Public routes
router.post("/pdf", uploadToMemory.single("file"), uploadPDF);
router.post("/text", uploadText);
router.get("/:publicId", getFile);

// Protected routes
router.delete("/:publicId", protect, deleteFile);

module.exports = router;
