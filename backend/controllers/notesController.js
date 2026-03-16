const Note = require("../models/Note");
const { asyncHandler, ApiError } = require("../utils");
const cloudinary = require("../config/cloudinary");

/**
 * @desc    Create a new note (with optional PDF attachment)
 * @route   POST /api/notes
 * @access  Private (Faculty)
 */
const createNote = asyncHandler(async (req, res) => {
  const { title, description, content, subject, topic, tags, isPublished } = req.body;

  if (!title || !subject) {
    throw new ApiError("Title and subject are required", 400);
  }

  const noteData = {
    title,
    description: description || "",
    content: content || "",
    subject,
    topic: topic || "",
    tags: tags || [],
    isPublished: isPublished || false,
    creator: req.user._id,
  };

  // Handle file upload (multer puts file in req.file)
  if (req.file) {
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "quiz-ai-notes",
            resource_type: "raw",
            public_id: `note_${Date.now()}_${req.file.originalname.replace(/\.[^/.]+$/, "")}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      noteData.attachment = {
        url: result.secure_url,
        publicId: result.public_id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
      };
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      // Continue without attachment if upload fails
    }
  }

  const note = await Note.create(noteData);

  res.status(201).json({
    success: true,
    message: "Note created successfully",
    data: note,
  });
});

/**
 * @desc    Get all notes created by the faculty member
 * @route   GET /api/notes/my
 * @access  Private (Faculty)
 */
const getMyNotes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  const query = { creator: req.user._id };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
      { topic: { $regex: search, $options: "i" } },
    ];
  }

  const total = await Note.countDocuments(query);
  const notes = await Note.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    data: notes,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Get all published notes (for students)
 * @route   GET /api/notes
 * @access  Private (any authenticated user)
 */
const getPublishedNotes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, subject, topic } = req.query;

  const query = { isPublished: true };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
      { topic: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  if (subject) {
    query.subject = { $regex: subject, $options: "i" };
  }

  if (topic) {
    query.topic = { $regex: topic, $options: "i" };
  }

  const total = await Note.countDocuments(query);
  const notes = await Note.find(query)
    .populate("creator", "name email avatar")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    data: notes,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Get single note by ID
 * @route   GET /api/notes/:id
 * @access  Private
 */
const getNoteById = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id).populate(
    "creator",
    "name email avatar"
  );

  if (!note) {
    throw new ApiError("Note not found", 404);
  }

  // Students can only see published notes
  if (
    !note.isPublished &&
    req.user.role === "student"
  ) {
    throw new ApiError("Note not found", 404);
  }

  // Faculty can only see their own unpublished notes
  if (
    !note.isPublished &&
    req.user.role === "faculty" &&
    note.creator._id.toString() !== req.user._id.toString()
  ) {
    throw new ApiError("Not authorized to view this note", 403);
  }

  // Increment view count
  note.viewCount += 1;
  await note.save();

  res.json({
    success: true,
    data: note,
  });
});

/**
 * @desc    Update a note
 * @route   PUT /api/notes/:id
 * @access  Private (Faculty - own note)
 */
const updateNote = asyncHandler(async (req, res) => {
  let note = await Note.findById(req.params.id);

  if (!note) {
    throw new ApiError("Note not found", 404);
  }

  // Only the creator can update
  if (note.creator.toString() !== req.user._id.toString()) {
    throw new ApiError("Not authorized to update this note", 403);
  }

  const allowedUpdates = [
    "title",
    "description",
    "content",
    "subject",
    "topic",
    "tags",
    "isPublished",
  ];

  const updates = {};
  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  // Handle new file upload
  if (req.file) {
    // Delete old file from Cloudinary if exists
    if (note.attachment?.publicId) {
      try {
        await cloudinary.uploader.destroy(note.attachment.publicId, {
          resource_type: "raw",
        });
      } catch (err) {
        console.error("Error deleting old attachment:", err);
      }
    }

    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "quiz-ai-notes",
            resource_type: "raw",
            public_id: `note_${Date.now()}_${req.file.originalname.replace(/\.[^/.]+$/, "")}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      updates.attachment = {
        url: result.secure_url,
        publicId: result.public_id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
      };
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
    }
  }

  note = await Note.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    message: "Note updated successfully",
    data: note,
  });
});

/**
 * @desc    Delete a note
 * @route   DELETE /api/notes/:id
 * @access  Private (Faculty - own note, or Admin)
 */
const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    throw new ApiError("Note not found", 404);
  }

  // Only creator or admin can delete
  if (
    note.creator.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError("Not authorized to delete this note", 403);
  }

  // Delete attachment from Cloudinary
  if (note.attachment?.publicId) {
    try {
      await cloudinary.uploader.destroy(note.attachment.publicId, {
        resource_type: "raw",
      });
    } catch (err) {
      console.error("Error deleting attachment:", err);
    }
  }

  await Note.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Note deleted successfully",
  });
});

/**
 * @desc    Publish / unpublish a note
 * @route   PATCH /api/notes/:id/publish
 * @access  Private (Faculty - own note)
 */
const togglePublish = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    throw new ApiError("Note not found", 404);
  }

  if (note.creator.toString() !== req.user._id.toString()) {
    throw new ApiError("Not authorized", 403);
  }

  note.isPublished = !note.isPublished;
  await note.save();

  res.json({
    success: true,
    message: note.isPublished ? "Note published" : "Note unpublished",
    data: note,
  });
});

/**
 * @desc    Get distinct subjects (for filter dropdowns)
 * @route   GET /api/notes/subjects
 * @access  Private
 */
const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Note.distinct("subject", { isPublished: true });

  res.json({
    success: true,
    data: subjects.filter(Boolean).sort(),
  });
});

module.exports = {
  createNote,
  getMyNotes,
  getPublishedNotes,
  getNoteById,
  updateNote,
  deleteNote,
  togglePublish,
  getSubjects,
};
