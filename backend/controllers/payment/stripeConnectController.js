const dotenv = require("dotenv");
dotenv.config();

const Stripe = require("stripe");
const UserModel = require("../../models/userModel");

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not configured");
  }
  return new Stripe(secretKey);
};

/**
 * Generates a Stripe Connect onboarding URL for a Professional using Stripe Accounts V2 API.
 * Route: POST /api/payment/stripe-connect/onboard
 */
const createConnectOnboardingSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const stripe = getStripe();

    const user = await UserModel.findById(userId);

    if (!user || user.role !== "PROFESSIONAL") {
      return res.status(403).json({
        success: false,
        message: "Only approved professionals can connect a Stripe payout account",
      });
    }

    let accountId = user.stripeAccountId;

    // Verify existing V2 account if present
    if (accountId) {
      try {
        const existingAcc = await stripe.v2.core.accounts.retrieve(accountId);
        if (!existingAcc || existingAcc.closed) {
          accountId = null;
        }
      } catch {
        // If account not found or invalid in Stripe, reset to create a fresh V2 account
        accountId = null;
      }
    }

    // 1. Create a new Stripe Connected Account using Accounts V2 API (POST /v2/core/accounts)
    if (!accountId) {
      const v2Account = await stripe.v2.core.accounts.create({
        contact_email: user.email,
        display_name: `${user.firstName || "Professional"} ${user.lastName || ""}`.trim(),
        dashboard: "express",
        defaults: {
          responsibilities: {
            losses_collector: "application",
            fees_collector: "application",
          },
        },
        identity: {
          country: "US",
          entity_type: "individual",
          individual: {
            email: user.email,
            given_name: user.firstName || "Professional",
            surname: user.lastName || "User",
          },
        },
        configuration: {
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: { requested: true },
              },
            },
          },
        },
        metadata: {
          userId: user._id.toString(),
          role: "PROFESSIONAL",
        },
      });

      accountId = v2Account.id;
      user.stripeAccountId = accountId;
      user.stripeAccountStatus = "pending";
      await user.save();
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    // 2. Generate Stripe Onboarding URL using Accounts V2 AccountLinks API (POST /v2/core/account_links)
    const accountLink = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["recipient"],
          refresh_url: `${frontendUrl}/professional/dashboard?stripe=refresh`,
          return_url: `${frontendUrl}/professional/dashboard?stripe=return`,
        },
      },
    });

    return res.status(200).json({
      success: true,
      url: accountLink.url,
      stripeAccountId: accountId,
    });
  } catch (error) {
    console.error("Stripe Connect Accounts V2 onboarding error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to initiate Stripe Connect onboarding",
      error: error.message,
    });
  }
};

/**
 * Retrieves & synchronizes non-sensitive Stripe Connect status for a Professional using Accounts V2.
 * Route: GET /api/payment/stripe-connect/status
 */
const getConnectStatus = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.userId;
    const stripe = getStripe();

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

    // Retrieve status from Stripe Accounts V2 (GET /v2/core/accounts/:id)
    let account;
    try {
      account = await stripe.v2.core.accounts.retrieve(user.stripeAccountId, {
        include: ["configuration.recipient", "requirements"],
      });
    } catch {
      // Account deleted or invalid
      user.stripeAccountId = undefined;
      user.stripeAccountStatus = "unconnected";
      user.chargesEnabled = false;
      user.payoutsEnabled = false;
      user.maskedBank = "";
      await user.save();

      return res.status(200).json({
        success: true,
        connected: false,
        stripeAccountStatus: "unconnected",
        chargesEnabled: false,
        payoutsEnabled: false,
        maskedBank: "",
      });
    }

    const recipientCaps = account.configuration?.recipient?.capabilities?.stripe_balance;
    const transfersStatus = recipientCaps?.stripe_transfers?.status;
    const payoutsStatus = recipientCaps?.payouts?.status;

    const transfersActive = transfersStatus === "active";
    const payoutsActive = payoutsStatus === "active";

    const chargesEnabled = transfersActive;
    const payoutsEnabled = transfersActive || payoutsActive;
    const status = payoutsEnabled ? "active" : "pending";

    // Synchronize DB status
    user.chargesEnabled = chargesEnabled;
    user.payoutsEnabled = payoutsEnabled;
    user.stripeAccountStatus = status;
    await user.save();

    return res.status(200).json({
      success: true,
      connected: true,
      stripeAccountId: user.stripeAccountId,
      stripeAccountStatus: user.stripeAccountStatus,
      chargesEnabled: user.chargesEnabled,
      payoutsEnabled: user.payoutsEnabled,
      maskedBank: user.maskedBank || "",
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
 * Creates a Stripe Express Dashboard login link or fresh update link for the Professional.
 * Route: POST /api/payment/stripe-connect/dashboard-link
 */
const getConnectDashboardLink = async (req, res) => {
  try {
    const userId = req.user.userId;
    const stripe = getStripe();

    const user = await UserModel.findById(userId);

    if (!user || !user.stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: "No connected Stripe account found for this professional",
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    // If onboarding completed, create login link; otherwise create V2 onboarding link
    try {
      const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);
      return res.status(200).json({
        success: true,
        url: loginLink.url,
      });
    } catch {
      // If express login link cannot be generated (e.g. pending onboarding), provide V2 onboarding link
      const accountLink = await stripe.v2.core.accountLinks.create({
        account: user.stripeAccountId,
        use_case: {
          type: "account_onboarding",
          account_onboarding: {
            configurations: ["recipient"],
            refresh_url: `${frontendUrl}/professional/dashboard?stripe=refresh`,
            return_url: `${frontendUrl}/professional/dashboard?stripe=return`,
          },
        },
      });

      return res.status(200).json({
        success: true,
        url: accountLink.url,
      });
    }
  } catch (error) {
    console.error("Create dashboard link error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to create Stripe Dashboard link",
      error: error.message,
    });
  }
};

module.exports = {
  createConnectOnboardingSession,
  getConnectStatus,
  getConnectDashboardLink,
};
