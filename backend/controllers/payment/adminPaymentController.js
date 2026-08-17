const PaymentModel = require("../../models/paymentModel");

const getAdminPayments = async (req, res) => {
  try {
    const payments = await PaymentModel.find()
      .populate("user", "firstName lastName email")
      .populate("professional", "firstName lastName email")
      .sort({ createdAt: -1 });

    const completedPayments = payments.filter(
      (payment) => payment.status === "completed"
    );

    const totalRevenue = completedPayments.reduce(
      (total, payment) => total + payment.amount,
      0
    );

    const totalCommission = completedPayments.reduce(
      (total, payment) => total + payment.adminCommission,
      0
    );

    return res.status(200).json({
      success: true,
      totalRevenue,
      totalCommission,
      payments,
    });
  } catch (error) {
    console.error("Get admin payments error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch payment records",
    });
  }
};

module.exports = {
  getAdminPayments,
};