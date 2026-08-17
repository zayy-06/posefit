const Stripe = require("stripe");
const PaymentModel = require("../../models/paymentModel");

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
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "PoseFit Professional Service",
            },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],

      metadata: {
        paymentId: payment._id.toString(),
        professionalId: professionalId.toString(),
        userId: userId.toString(),
      },

      success_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
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
    });
  }
};

const getPayment = async (req, res) => {
  try {
    const payment = await PaymentModel.findById(req.params.id)
      .populate("user", "firstName lastName email")
      .populate("professional", "firstName lastName email");

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