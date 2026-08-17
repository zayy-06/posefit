const Stripe = require("stripe");
const PaymentModel = require("../../models/paymentModel");
const UserModel = require("../../models/userModel");

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
    console.error("Stripe webhook verification error:", error.message);

    return res.status(400).json({
      success: false,
      message: "Invalid Stripe webhook signature",
    });
  }

  try {
    // 1. Successful Checkout Session Payment
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const paymentId = session.metadata?.paymentId;

      if (paymentId) {
        const payment = await PaymentModel.findById(paymentId);
        if (payment && payment.status !== "completed") {
          payment.status = "completed";
          payment.payoutStatus = "transferred";
          payment.stripePaymentIntentId = session.payment_intent;
          payment.paidAt = new Date();
          await payment.save();
        }
      }
    }

    // 2. Expired Checkout Session
    if (event.type === "checkout.session.expired") {
      const session = event.data.object;

      const paymentId = session.metadata?.paymentId;

      if (paymentId) {
        await PaymentModel.findByIdAndUpdate(paymentId, {
          status: "cancelled",
        });
      }
    }

    // 3. Stripe Connect Account Updated (Onboarding / Payout Capability Changes)
    if (event.type === "account.updated") {
      const account = event.data.object;

      const user = await UserModel.findOne({ stripeAccountId: account.id });
      if (user) {
        const chargesEnabled = !!account.charges_enabled;
        const payoutsEnabled = !!account.payouts_enabled;
        const status = chargesEnabled && payoutsEnabled ? "active" : "pending";

        let maskedBank = user.maskedBank || "";
        if (account.external_accounts && account.external_accounts.data && account.external_accounts.data.length > 0) {
          const ext = account.external_accounts.data[0];
          if (ext.last4) {
            maskedBank = `****${ext.last4}`;
          }
        }

        user.chargesEnabled = chargesEnabled;
        user.payoutsEnabled = payoutsEnabled;
        user.stripeAccountStatus = status;
        user.maskedBank = maskedBank;
        await user.save();
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