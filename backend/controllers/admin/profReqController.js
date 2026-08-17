const nodemailer = require("nodemailer");
const UserModel = require("../../models/userModel");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS,
  },
});

// Retrieves applications that are in Pending Verification stage
const getPendingProfessionals = async (req, res) => {
  try {
    const professionals = await UserModel.find({
      role: "PROFESSIONAL",
      professionalStatus: {
        $in: ["pending_verification", "PENDING_VERIFICATION", "PENDING"],
      },
    })
      .select(
        "firstName lastName email role professionalType specialization bio profilePhoto sessionFee credentialDocs bankDetails availability professionalStatus rejectionReason appliedAt verificationNotes"
      )
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: professionals.length,
      professionals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get pending professional requests",
      error: error.message,
    });
  }
};

// Application Final Review Stage: Admin strictly Approves or Rejects the submitted application
const updateProfessionalStatus = async (req, res) => {
  try {
    const { status, rejectionReason, verificationNotes } = req.body;

    const normalizedStatus = (status || "").toLowerCase();

    if (!["approved", "rejected"].includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected",
      });
    }

    const professional = await UserModel.findOne({
      _id: req.params.id,
      role: "PROFESSIONAL",
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      });
    }

    if (normalizedStatus === "approved") {
      professional.professionalStatus = "approved";
      professional.rejectionReason = undefined;
    } else {
      professional.professionalStatus = "rejected";
      professional.rejectionReason = rejectionReason || verificationNotes || "Application requirements not met.";
    }

    if (verificationNotes) {
      professional.verificationNotes = verificationNotes;
    }

    await professional.save();

    const isApproved = normalizedStatus === "approved";
    const subject = isApproved
      ? "PoseFit Professional Account Approved & Live"
      : "PoseFit Professional Application Update";

    const text = isApproved
      ? `Hi ${professional.firstName} ${professional.lastName},

Great news! Your professional application has been reviewed and approved by the PoseFit Admin team.

You are now LIVE and BOOKABLE on PoseFit.

Regards,
PoseFit Team`
      : `Hi ${professional.firstName} ${professional.lastName},

Unfortunately, your professional application was not approved at this time.

Reason: ${professional.rejectionReason}

You may log in to your account, update your submitted information/documents, and resubmit for verification.

Regards,
PoseFit Team`;

    try {
      await transporter.sendMail({
        from: process.env.USER_EMAIL,
        to: professional.email,
        subject,
        text,
      });
    } catch (emailErr) {
      console.error("Failed to send status update email:", emailErr);
    }

    res.status(200).json({
      success: true,
      message: isApproved
        ? "Professional approved & set to live/bookable successfully"
        : "Professional rejected successfully with rejection reason saved",
      professional: {
        _id: professional._id,
        firstName: professional.firstName,
        lastName: professional.lastName,
        email: professional.email,
        professionalStatus: professional.professionalStatus,
        rejectionReason: professional.rejectionReason,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update professional status",
      error: error.message,
    });
  }
};

module.exports = {
  getPendingProfessionals,
  updateProfessionalStatus,
};