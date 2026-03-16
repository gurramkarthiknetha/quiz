const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  createNote,
  getMyNotes,
  getPublishedNotes,
  getNoteById,
  updateNote,
  deleteNote,
  togglePublish,
  getSubjects,
} = require("../controllers/notesController");
const { protect, requireFaculty } = require("../middleware");

// Multer memory storage for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, TXT, DOC, and DOCX files are allowed"), false);
    }
  },
});

// ── Public / Student routes (require auth) ───────────────────────────
router.get("/", protect, getPublishedNotes);
router.get("/subjects", protect, getSubjects);

// ── Faculty routes ───────────────────────────────────────────────────
router.get("/my", protect, requireFaculty, getMyNotes);
router.post("/", protect, requireFaculty, upload.single("file"), createNote);
router.put("/:id", protect, requireFaculty, upload.single("file"), updateNote);
router.patch("/:id/publish", protect, requireFaculty, togglePublish);
router.delete("/:id", protect, deleteNote); // faculty (own) or admin

// ── Single note (must be after /my, /subjects) ───────────────────────
router.get("/:id", protect, getNoteById);

module.exports = router;
