const express = require("express");
const authMiddleware = require("../../middleware/authMiddleware");
const { uploadPhoto, uploadDocument } = require("../../middleware/uploadMiddleware");

const router = express.Router();

// Upload profile photo from device
router.post("/photo", authMiddleware, (req, res) => {
  uploadPhoto.single("photo")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to upload photo",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No photo file provided",
      });
    }

    const host = req.get("host");
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/photos/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: "Photo uploaded successfully",
      fileUrl,
      filename: req.file.filename,
    });
  });
});

// Upload credential/certificate document from device
router.post("/document", authMiddleware, (req, res) => {
  uploadDocument.single("document")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to upload document",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No document file provided",
      });
    }

    const host = req.get("host");
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/documents/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      fileUrl,
      originalName: req.file.originalname,
      filename: req.file.filename,
    });
  });
});

module.exports = router;
