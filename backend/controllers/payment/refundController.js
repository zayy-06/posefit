const Stripe = require("stripe");
const PaymentModel = require("../../models/paymentModel");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const refundPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await PaymentModel.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed payments can be refunded",
      });
    }

    if (!payment.stripePaymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Stripe payment intent not found",
      });
    }

    await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
    });

    payment.status = "refunded";
    payment.refundedAt = new Date();

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment refunded successfully",
    });
  } catch (error) {
    console.error("Refund payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to refund payment",
    });
  }
};

module.exports = refundPayment;