const express = require("express");
const authMiddleware = require("../../middleware/authMiddleware");
const uploadMiddleware = require("../../middleware/uploadMiddleware")
const {
  uploadPhotoHandler,
  uploadDocumentHandler,
} = require("../../controllers/upload/uploadController");

const router = express.Router();

router.post("/photo", authMiddleware, uploadPhotoHandler);
router.post("/document", authMiddleware, uploadDocumentHandler);

module.exports = router;