const Stripe = require("stripe");
const UserModel = require("../../models/userModel");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Generates a Stripe Connect Express onboarding URL for a Professional.
 */
const createConnectOnboardingSession = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await UserModel.findById(userId);

    if (!user || user.role !== "PROFESSIONAL") {
      return res.status(403).json({
        success: false,
        message: "Only approved professionals can connect a Stripe payout account",
      });
    }

    let accountId = user.stripeAccountId;

    // Create a new Express account if not already created
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          userId: user._id.toString(),
          role: "PROFESSIONAL",
        },
      });

      accountId = account.id;
      user.stripeAccountId = accountId;
      user.stripeAccountStatus = "pending";
      await user.save();
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    // Generate Stripe hosted onboarding URL
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${frontendUrl}/stripe-connect/refresh`,
      return_url: `${frontendUrl}/stripe-connect/return`,
      type: "account_onboarding",
    });

    return res.status(200).json({
      success: true,
      url: accountLink.url,
      stripeAccountId: accountId,
    });
  } catch (error) {
    console.error("Stripe Connect onboarding error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to initiate Stripe Connect onboarding",
      error: error.message,
    });
  }
};

/**
 * Retrieves & synchronizes non-sensitive Stripe Connect status for a Professional.
 */
const getConnectStatus = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.userId;

    const user = await UserModel.findById(targetUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.stripeAccountId) {
      return res.status(200).json({
        success: true,
        connected: false,
        stripeAccountStatus: "unconnected",
        chargesEnabled: false,
        payoutsEnabled: false,
        maskedBank: "",
      });
    }

    // Retrieve status from Stripe
    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    const chargesEnabled = !!account.charges_enabled;
    const payoutsEnabled = !!account.payouts_enabled;
    const status = chargesEnabled && payoutsEnabled ? "active" : "pending";

    // Extract masked bank last 4 if present (NO raw details stored!)
    let maskedBank = "";
    if (account.external_accounts && account.external_accounts.data && account.external_accounts.data.length > 0) {
      const ext = account.external_accounts.data[0];
      if (ext.last4) {
        maskedBank = `****${ext.last4}`;
      }
    }

    // Synchronize DB status
    user.chargesEnabled = chargesEnabled;
    user.payoutsEnabled = payoutsEnabled;
    user.stripeAccountStatus = status;
    user.maskedBank = maskedBank;
    await user.save();

    return res.status(200).json({
      success: true,
      connected: true,
      stripeAccountId: user.stripeAccountId,
      stripeAccountStatus: user.stripeAccountStatus,
      chargesEnabled: user.chargesEnabled,
      payoutsEnabled: user.payoutsEnabled,
      maskedBank: user.maskedBank,
    });
  } catch (error) {
    console.error("Get Connect status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch Stripe Connect account status",
      error: error.message,
    });
  }
};

/**
 * Creates a Stripe Express Dashboard login link for the Professional.
 */
const getConnectDashboardLink = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await UserModel.findById(userId);

    if (!user || !user.stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: "No connected Stripe account found for this professional",
      });
    }

    const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);

    return res.status(200).json({
      success: true,
      url: loginLink.url,
    });
  } catch (error) {
    console.error("Create login link error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create Stripe Dashboard link",
      error: error.message,
    });
  }
};

module.exports = {
  createConnectOnboardingSession,
  getConnectStatus,
  getConnectDashboardLink,
};
