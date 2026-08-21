const PaymentModel = require("../../models/paymentModel");
const UserModel = require("../../models/userModel");


const getProfessionalEarnings = async (req, res) => {
  try {
    const professionalId = req.user.userId;

    const professional = await UserModel.findById(professionalId).select(
      "stripeAccountId stripeAccountStatus chargesEnabled payoutsEnabled maskedBank"
    );

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      });
    }

    const payments = await PaymentModel.find({
      professional: professionalId,
    })
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });

    const completedPayments = payments.filter((p) => p.status === "completed");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyPayments = completedPayments.filter((p) => {
      const paidDate = p.paidAt || p.createdAt;
      return new Date(paidDate) >= startOfMonth;
    });

    const totalEarnings = completedPayments.reduce(
      (sum, p) => sum + (p.professionalAmount || 0),
      0
    );

    const currentMonthEarnings = monthlyPayments.reduce(
      (sum, p) => sum + (p.professionalAmount || 0),
      0
    );

    const pendingEarnings = payments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + (p.professionalAmount || 0), 0);

    const releasedEarnings = completedPayments
      .filter((p) => p.payoutStatus === "transferred" || p.payoutStatus === "paid")
      .reduce((sum, p) => sum + (p.professionalAmount || 0), 0);

    return res.status(200).json({
      success: true,
      earnings: {
        totalEarnings: Number(totalEarnings.toFixed(2)),
        currentMonthEarnings: Number(currentMonthEarnings.toFixed(2)),
        pendingEarnings: Number(pendingEarnings.toFixed(2)),
        releasedEarnings: Number(releasedEarnings.toFixed(2)),
        totalTransactionsCount: payments.length,
        completedTransactionsCount: completedPayments.length,
      },
      stripeStatus: {
        connected: !!professional.stripeAccountId,
        stripeAccountId: professional.stripeAccountId || null,
        accountStatus: professional.stripeAccountStatus || "unconnected",
        chargesEnabled: !!professional.chargesEnabled,
        payoutsEnabled: !!professional.payoutsEnabled,
        maskedBank: professional.maskedBank || "",
      },
      paymentHistory: payments,
    });
  } catch (error) {
    console.error("Get professional earnings error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while loading earnings data",
      error: error.message,
    });
  }
};

module.exports = {
  getProfessionalEarnings,
};
