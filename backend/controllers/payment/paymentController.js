const dotenv = require("dotenv");
dotenv.config();

const Stripe = require("stripe");
const PaymentModel = require("../../models/paymentModel");
const UserModel = require("../../models/userModel");

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);

const createPayment = async (req, res) => {
  try {
    const stripe = getStripe();
    const {
      professionalId,
      amount,
      appointmentDay,
      appointmentSlot,
      appointmentDate,
      notes,
    } = req.body;

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

    // Verify status live with Stripe (Accounts V2)
    let payoutsEnabled = professional.payoutsEnabled;
    try {
      let v2Account;
      try {
        v2Account = await stripe.v2.core.accounts.retrieve(professional.stripeAccountId, {
          include: ["configuration.recipient"],
        });
      } catch {
        v2Account = null;
      }

      if (v2Account) {
        const recipientCaps = v2Account.configuration?.recipient?.capabilities?.stripe_balance;
        const transfersActive = recipientCaps?.stripe_transfers?.status === "active";
        const payoutsActive = recipientCaps?.payouts?.status === "active";
        payoutsEnabled = transfersActive || payoutsActive || professional.payoutsEnabled;
      } else {
        const account = await stripe.accounts.retrieve(professional.stripeAccountId);
        payoutsEnabled = !!account.payouts_enabled || !!account.charges_enabled;
      }

      // Update cached values in DB
      professional.payoutsEnabled = payoutsEnabled;
      professional.chargesEnabled = payoutsEnabled;
      professional.stripeAccountStatus = payoutsEnabled ? "active" : "pending";
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
      appointmentDay: appointmentDay || "",
      appointmentSlot: appointmentSlot || "",
      appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined,
      notes: notes || "",
      currency: "usd",
      status: "pending",
      payoutStatus: "pending",
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const slotInfo = appointmentDay && appointmentSlot ? ` (${appointmentDay}, ${appointmentSlot})` : "";

    // Create Stripe Checkout Session with Direct Connect Transfer Split
    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `PoseFit Session with ${professional.firstName} ${professional.lastName}${slotInfo}`,
              description: appointmentSlot ? `Appointment Slot: ${appointmentDay} ${appointmentSlot}` : "1-on-1 Fitness Session",
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
          appointmentDay: appointmentDay || "",
          appointmentSlot: appointmentSlot || "",
        },
      },

      metadata: {
        paymentId: payment._id.toString(),
        professionalId: professionalId.toString(),
        userId: userId.toString(),
        appointmentDay: appointmentDay || "",
        appointmentSlot: appointmentSlot || "",
      },

      success_url: `${frontendUrl}/professionals/${professionalId}?booking_success=true`,
      cancel_url: `${frontendUrl}/professionals/${professionalId}?booking_cancelled=true`,
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
      message: error.message || "Something went wrong while creating payment session",
    });
  }
};

const getPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await PaymentModel.findById(id)
      .populate("user", "firstName lastName email")
      .populate("professional", "firstName lastName email specialization sessionFee profilePhoto");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
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
      message: "Something went wrong",
    });
  }
};

const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const payments = await PaymentModel.find({ user: userId })
      .populate("professional", "firstName lastName email specialization profilePhoto")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Get user payments error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  createPayment,
  getPayment,
  getUserPayments,
};