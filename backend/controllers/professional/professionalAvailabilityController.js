const UserModel = require("../../models/userModel");
const { validateAvailabilityArray } = require("../../utils/timeValidation");

/**
 * GET /api/professional/availability
 * Retrieves the availability schedule of the authenticated professional.
 */
const getAvailability = async (req, res) => {
  try {
    const professionalId = req.user.userId;

    const professional = await UserModel.findOne({
      _id: professionalId,
      role: "PROFESSIONAL",
    }).select("availability");

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      });
    }

    return res.status(200).json({
      success: true,
      availability: professional.availability || [],
    });
  } catch (error) {
    console.error("Get availability error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching availability",
      error: error.message,
    });
  }
};

/**
 * PUT /api/professional/availability
 * Updates/replaces the availability schedule for the authenticated professional.
 * Enforces strict time format, start < end, and no overlapping slots.
 */
const updateAvailability = async (req, res) => {
  try {
    const professionalId = req.user.userId;
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      return res.status(400).json({
        success: false,
        message: "Availability must be an array of day & slot objects",
      });
    }

    const validation = validateAvailabilityArray(availability);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const professional = await UserModel.findOne({
      _id: professionalId,
      role: "PROFESSIONAL",
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      });
    }

    professional.availability = availability;
    await professional.save();

    return res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      availability: professional.availability,
    });
  } catch (error) {
    console.error("Update availability error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while updating availability",
      error: error.message,
    });
  }
};

module.exports = {
  getAvailability,
  updateAvailability,
};
