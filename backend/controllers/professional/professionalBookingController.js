const PaymentModel = require("../../models/paymentModel");

/**
 * GET /api/professional/bookings
 * Retrieves all bookings/sessions belonging ONLY to the authenticated professional.
 */
const getProfessionalBookings = async (req, res) => {
  try {
    const professionalId = req.user.userId;
    const { status } = req.query;

    const query = { professional: professionalId };

    if (status && ["completed", "pending", "refunded", "cancelled", "failed"].includes(status.toLowerCase())) {
      query.status = status.toLowerCase();
    }

    const bookings = await PaymentModel.find(query)
      .populate("user", "firstName lastName email profilePhoto")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get professional bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching bookings",
      error: error.message,
    });
  }
};

/**
 * GET /api/professional/bookings/:id
 * Retrieves details for a specific booking.
 * Enforces STRICT ownership authorization (Professional can ONLY access their own booking).
 */
const getProfessionalBookingById = async (req, res) => {
  try {
    const professionalId = req.user.userId;
    const { id } = req.params;

    const booking = await PaymentModel.findById(id).populate(
      "user",
      "firstName lastName email profilePhoto"
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Strict ownership verification
    if (booking.professional.toString() !== professionalId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You do not have permission to view this booking",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Get booking by id error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching booking details",
      error: error.message,
    });
  }
};

module.exports = {
  getProfessionalBookings,
  getProfessionalBookingById,
};
