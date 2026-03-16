const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Configure Cloudinary storage for PDFs
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "quiz-ai-pdfs",
    resource_type: "raw", // Required for non-image files like PDFs
    allowed_formats: ["pdf", "txt"],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const originalName = file.originalname.replace(/\.[^/.]+$/, ""); // Remove extension
      return `${originalName}_${timestamp}`;
    },
  },
});

// File filter to accept only PDF and TXT files
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["application/pdf", "text/plain"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and TXT files are allowed"), false);
  }
};

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Memory storage for local processing (used for text extraction)
const memoryStorage = multer.memoryStorage();

const uploadToMemory = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

module.exports = { upload, uploadToMemory, cloudinary };
