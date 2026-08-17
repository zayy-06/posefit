const Stripe = require("stripe");
const PaymentModel = require("../../models/paymentModel");
const UserModel = require("../../models/userModel");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createPayment = async (req, res) => {
  try {
    const { professionalId, amount } = req.body;

    if (!professionalId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Professional and amount are required",
      });
    }

    const totalAmount = Number(amount);

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Fetch Professional & Verify Eligibility
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

    // Verify Professional Stripe Connect Account & Payout Status
    if (!professional.stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: "Professional payout account is not connected or payouts are not enabled.",
      });
    }

    // Verify status live with Stripe
    let payoutsEnabled = professional.payoutsEnabled;
    try {
      const account = await stripe.accounts.retrieve(professional.stripeAccountId);
      payoutsEnabled = !!account.payouts_enabled;

      // Update cached values in DB
      professional.payoutsEnabled = payoutsEnabled;
      professional.chargesEnabled = !!account.charges_enabled;
      professional.stripeAccountStatus = account.charges_enabled && payoutsEnabled ? "active" : "pending";
      await professional.save();
    } catch (acctErr) {
      console.error("Error retrieving Stripe Connect account:", acctErr);
    }

    if (!payoutsEnabled) {
      return res.status(400).json({
        success: false,
        message: "Professional payout account is not connected or payouts are not enabled.",
      });
    }

    // 20% PoseFit Admin Commission / 80% Professional Share
    const adminCommission = Number((totalAmount * 0.2).toFixed(2));
    const professionalAmount = Number((totalAmount * 0.8).toFixed(2));

    const payment = await PaymentModel.create({
      user: userId,
      professional: professionalId,
      amount: totalAmount,
      adminCommission,
      professionalAmount,
      currency: "usd",
      status: "pending",
      payoutStatus: "pending",
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    // Create Stripe Checkout Session with Direct Connect Transfer Split
    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `PoseFit Session with ${professional.firstName} ${professional.lastName}`,
            },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],

      // Payment Split: 20% stays on Admin Platform, 80% transferred to Professional's Connected Account
      payment_intent_data: {
        application_fee_amount: Math.round(adminCommission * 100),
        transfer_data: {
          destination: professional.stripeAccountId,
        },
        metadata: {
          paymentId: payment._id.toString(),
          professionalId: professionalId.toString(),
          userId: userId.toString(),
        },
      },

      metadata: {
        paymentId: payment._id.toString(),
        professionalId: professionalId.toString(),
        userId: userId.toString(),
      },

      success_url: `${frontendUrl}/payment-success`,
      cancel_url: `${frontendUrl}/payment-cancelled`,
    });

    payment.stripeSessionId = session.id;

    await payment.save();

    return res.status(201).json({
      success: true,
      message: "Payment session created successfully",
      paymentId: payment._id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("Create payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment",
      error: error.message,
    });
  }
};

const getPayment = async (req, res) => {
  try {
    const payment = await PaymentModel.findById(req.params.id)
      .populate("user", "firstName lastName email")
      .populate("professional", "firstName lastName email stripeAccountId stripeAccountStatus payoutsEnabled maskedBank");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const requesterId = req.user.userId.toString();

    const isOwner =
      payment.user &&
      payment.user._id.toString() === requesterId;

    const isProfessional =
      payment.professional &&
      payment.professional._id.toString() === requesterId;

    const isAdmin =
      req.user.role === "ADMIN";

    if (!isOwner && !isProfessional && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this payment",
      });
    }

    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Get payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch payment",
    });
  }
};

const getUserPayments = async (req, res) => {
  try {
    const payments = await PaymentModel.find({
      user: req.user.userId,
    })
      .populate("professional", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Get user payments error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch payments",
    });
  }
};

module.exports = {
  createPayment,
  getPayment,
  getUserPayments,
};