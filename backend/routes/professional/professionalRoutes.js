const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const professionalMiddleware = require("../../middleware/professionalMiddleware");

const {
  getProfessionalDashboard,
} = require("../../controllers/professional/professionalDashboardController");

const {
  getProfessionalProfile,
  updateProfessionalProfile,
} = require("../../controllers/professional/professionalProfileController");

const {
  getProfessionalBookings,
  getProfessionalBookingById,
} = require("../../controllers/professional/professionalBookingController");

const {
  getAvailability,
  updateAvailability,
} = require("../../controllers/professional/professionalAvailabilityController");

const {
  getProfessionalEarnings,
} = require("../../controllers/professional/professionalEarningsController");

const router = express.Router();

// Apply auth & professional authorization middleware to all professional routes
router.use(authMiddleware);
router.use(professionalMiddleware);

// Professional Dashboard Metric Aggregation
router.get("/dashboard", getProfessionalDashboard);

// Professional Profile Management
router.get("/profile", getProfessionalProfile);
router.put("/profile", updateProfessionalProfile);

// Professional Bookings & Session Management
router.get("/bookings", getProfessionalBookings);
router.get("/bookings/:id", getProfessionalBookingById);

// Professional Availability Management
router.get("/availability", getAvailability);
router.put("/availability", updateAvailability);

// Professional Earnings & Financial Breakdown
router.get("/earnings", getProfessionalEarnings);

module.exports = router;
