const Stripe = require("stripe");
const PaymentModel = require("../../models/paymentModel");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const stripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Stripe webhook error:", error.message);

    return res.status(400).json({
      success: false,
      message: "Invalid Stripe webhook",
    });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const paymentId = session.metadata?.paymentId;

      if (paymentId) {
        await PaymentModel.findByIdAndUpdate(paymentId, {
          status: "completed",
          stripePaymentIntentId: session.payment_intent,
          paidAt: new Date(),
        });
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;

      const paymentId = session.metadata?.paymentId;

      if (paymentId) {
        await PaymentModel.findByIdAndUpdate(paymentId, {
          status: "cancelled",
        });
      }
    }

    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};

module.exports = stripeWebhook;