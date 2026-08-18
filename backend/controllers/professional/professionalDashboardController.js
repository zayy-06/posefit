const UserModel = require("../../models/userModel");
const PaymentModel = require("../../models/paymentModel");

/**
 * GET /api/professional/dashboard
 * Aggregates dashboard metrics for the authenticated professional.
 */
const getProfessionalDashboard = async (req, res) => {
  try {
    const professionalId = req.user.userId;

    const professional = await UserModel.findOne({
      _id: professionalId,
      role: "PROFESSIONAL",
    }).select("-password -verificationCode");

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      });
    }

    // Fetch payments associated with this professional
    const payments = await PaymentModel.find({
      professional: professionalId,
    })
      .populate("user", "firstName lastName email profilePhoto")
      .sort({ createdAt: -1 });

    const totalSessions = payments.length;

    const completedPayments = payments.filter((p) => p.status === "completed");
    const completedSessions = completedPayments.length;

    // Compute monthly earnings (current calendar month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyPayments = completedPayments.filter((p) => {
      const paidDate = p.paidAt || p.createdAt;
      return new Date(paidDate) >= startOfMonth;
    });

    const monthlyEarnings = monthlyPayments.reduce(
      (sum, p) => sum + (p.professionalAmount || 0),
      0
    );

    const totalEarnings = completedPayments.reduce(
      (sum, p) => sum + (p.professionalAmount || 0),
      0
    );

    const pendingEarnings = payments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + (p.professionalAmount || 0), 0);

    // Filter upcoming sessions/bookings
    const upcomingBookings = completedPayments.slice(0, 5); // Recent completed/active bookings

    return res.status(200).json({
      success: true,
      dashboard: {
        professional: {
          _id: professional._id,
          firstName: professional.firstName,
          lastName: professional.lastName,
          email: professional.email,
          role: professional.role,
          professionalType: professional.professionalType,
          specialization: professional.specialization,
          sessionFee: professional.sessionFee,
          profilePhoto: professional.profilePhoto,
          professionalStatus: professional.professionalStatus,
          rejectionReason: professional.rejectionReason,
        },
        metrics: {
          totalSessions,
          completedSessions,
          upcomingSessionsCount: upcomingBookings.length,
          monthlyEarnings: Number(monthlyEarnings.toFixed(2)),
          totalEarnings: Number(totalEarnings.toFixed(2)),
          pendingEarnings: Number(pendingEarnings.toFixed(2)),
          averageRating: professional.rating?.average || 5.0,
          ratingCount: professional.rating?.count || 0,
        },
        stripeStatus: {
          connected: !!professional.stripeAccountId,
          stripeAccountId: professional.stripeAccountId || null,
          accountStatus: professional.stripeAccountStatus || "unconnected",
          chargesEnabled: !!professional.chargesEnabled,
          payoutsEnabled: !!professional.payoutsEnabled,
          maskedBank: professional.maskedBank || "",
        },
        recentBookings: upcomingBookings,
      },
    });
  } catch (error) {
    console.error("Get professional dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while loading dashboard",
      error: error.message,
    });
  }
};

module.exports = {
  getProfessionalDashboard,
};
