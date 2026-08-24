const express = require("express");

const {
  getPublicProfessionals,
  getPublicProfessionalById,
} = require("../../controllers/user/userController");

const router = express.Router();

// User-side public professional discovery and availability lookup
router.get("/professionals", getPublicProfessionals);
router.get("/professionals/:id", getPublicProfessionalById);
router.get("/public-professionals", getPublicProfessionals);
router.get("/public-professionals/:id", getPublicProfessionalById);

module.exports = router;
