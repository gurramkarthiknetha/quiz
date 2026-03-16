const pdfParse = require("pdf-parse");
const cloudinary = require("../config/cloudinary");
const { asyncHandler, ApiError } = require("../utils");

/**
 * @desc    Upload PDF to Cloudinary and extract text
 * @route   POST /api/upload/pdf
 * @access  Public
 */
const uploadPDF = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError("No file uploaded", 400);
  }

  console.log("Processing file:", req.file.originalname, "Type:", req.file.mimetype, "Size:", req.file.size);

  let extractedText = "";
  let pageCount = 1;

  try {
    // Extract text from PDF using pdf-parse
    if (req.file.mimetype === "application/pdf") {
      console.log("Parsing PDF...");
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = pdfData.text || "";
      pageCount = pdfData.numpages || 1;
      console.log("PDF parsed successfully. Pages:", pageCount, "Text length:", extractedText.length);
    } else if (req.file.mimetype === "text/plain") {
      extractedText = req.file.buffer.toString("utf-8");
    } else {
      throw new ApiError("Unsupported file type. Please upload PDF or TXT files.", 400);
    }

    // Clean the extracted text
    extractedText = extractedText
      .replace(/\f/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (extractedText.length < 50) {
      throw new ApiError(
        "The file doesn't contain enough text. Please upload a file with more content.",
        400
      );
    }

    // Try to upload to Cloudinary (optional - don't fail if this fails)
    let uploadResult = null;
    try {
      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "quiz-ai-pdfs",
            resource_type: "raw",
            public_id: `${req.file.originalname.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`,
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              resolve(null); // Don't reject, just resolve with null
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(req.file.buffer);
      });
    } catch (cloudinaryError) {
      console.error("Cloudinary upload failed:", cloudinaryError);
      // Continue without Cloudinary - text extraction is the main goal
    }

    res.json({
      success: true,
      data: {
        text: extractedText,
        file: {
          name: req.file.originalname,
          url: uploadResult?.secure_url || null,
          publicId: uploadResult?.public_id || null,
          size: req.file.size,
          pages: pageCount,
        },
        characterCount: extractedText.length,
      },
    });
  } catch (error) {
    console.error("PDF processing error:", error.message, error.stack);
    if (error instanceof ApiError) throw error;
    throw new ApiError(`Failed to process file: ${error.message}`, 500);
  }
});

/**
 * @desc    Upload text content directly
 * @route   POST /api/upload/text
 * @access  Public
 */
const uploadText = asyncHandler(async (req, res) => {
  const { text, title } = req.body;

  if (!text || text.trim().length < 50) {
    throw new ApiError("Please provide at least 50 characters of text", 400);
  }

  const cleanedText = text
    .replace(/\f/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  res.json({
    success: true,
    data: {
      text: cleanedText,
      title: title || "Uploaded Text",
      characterCount: cleanedText.length,
    },
  });
});

/**
 * @desc    Get file from Cloudinary by public ID
 * @route   GET /api/upload/:publicId
 * @access  Public
 */
const getFile = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: "raw",
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        createdAt: result.created_at,
      },
    });
  } catch (error) {
    throw new ApiError("File not found", 404);
  }
});

/**
 * @desc    Delete file from Cloudinary
 * @route   DELETE /api/upload/:publicId
 * @access  Private
 */
const deleteFile = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    throw new ApiError("Failed to delete file", 500);
  }
});

module.exports = {
  uploadPDF,
  uploadText,
  getFile,
  deleteFile,
};
