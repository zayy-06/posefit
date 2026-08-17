const PaymentModel = require("../../models/paymentModel");

const getAdminPayments = async (req, res) => {
  try {
    const payments = await PaymentModel.find()
      .populate("user", "firstName lastName email")
      .populate("professional", "firstName lastName email stripeAccountId stripeAccountStatus payoutsEnabled maskedBank")
      .sort({ createdAt: -1 });

    const completedPayments = payments.filter(
      (payment) => payment.status === "completed"
    );

    const totalRevenue = completedPayments.reduce(
      (total, payment) => total + (payment.amount || 0),
      0
    );

    const totalCommission = completedPayments.reduce(
      (total, payment) => total + (payment.adminCommission || 0),
      0
    );

    const totalProfessionalEarnings = completedPayments.reduce(
      (total, payment) => total + (payment.professionalAmount || 0),
      0
    );

    const completedCount = completedPayments.length;
    const failedCount = payments.filter((p) => p.status === "failed").length;
    const refundedCount = payments.filter((p) => p.status === "refunded").length;
    const pendingCount = payments.filter((p) => p.status === "pending").length;

    return res.status(200).json({
      success: true,
      totalRevenue,
      totalCommission,
      totalProfessionalEarnings,
      completedCount,
      failedCount,
      refundedCount,
      pendingCount,
      totalTransactions: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Get admin payments error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch payment records",
      error: error.message,
    });
  }
};

module.exports = {
  getAdminPayments,
};