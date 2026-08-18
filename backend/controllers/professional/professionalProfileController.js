const UserModel = require("../../models/userModel");
const { validateAvailabilityArray } = require("../../utils/timeValidation");

/**
 * GET /api/professional/profile
 * Allows authenticated professional to view their own profile, verification status, and credentials.
 */
const getProfessionalProfile = async (req, res) => {
  try {
    const professionalId = req.user.userId;

    const professional = await UserModel.findOne({
      _id: professionalId,
      role: "PROFESSIONAL",
    }).select("-password -verificationCode");

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      professional,
    });
  } catch (error) {
    console.error("Get professional profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching profile",
      error: error.message,
    });
  }
};

/**
 * PUT /api/professional/profile
 * Allows authenticated professional to update allowed profile details.
 * Enforces admin-set professionalType as read-only.
 */
const updateProfessionalProfile = async (req, res) => {
  try {
    const professionalId = req.user.userId;

    const professional = await UserModel.findOne({
      _id: professionalId,
      role: "PROFESSIONAL",
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional profile not found",
      });
    }

    const {
      firstName,
      lastName,
      profilePhoto,
      bio,
      specialization,
      sessionFee,
      credentialDocs,
      availability,
    } = req.body;

    if (availability !== undefined) {
      const validation = validateAvailabilityArray(availability);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }
      professional.availability = availability;
    }

    if (firstName) professional.firstName = firstName;
    if (lastName) professional.lastName = lastName;
    if (profilePhoto !== undefined) professional.profilePhoto = profilePhoto;
    if (bio !== undefined) professional.bio = bio;
    if (specialization !== undefined) professional.specialization = specialization;
    // professionalType is ADMIN-SET and cannot be modified by the professional
    if (sessionFee !== undefined) professional.sessionFee = Number(sessionFee);
    if (credentialDocs !== undefined) professional.credentialDocs = credentialDocs;

    // If professional was rejected and is resubmitting, set status to pending_verification for admin review
    if (
      professional.professionalStatus === "rejected" ||
      professional.professionalStatus === "REJECTED"
    ) {
      professional.professionalStatus = "pending_verification";
      professional.rejectionReason = undefined;
      professional.appliedAt = new Date();
    }

    await professional.save();

    const updatedData = professional.toObject();
    delete updatedData.password;
    delete updatedData.verificationCode;

    return res.status(200).json({
      success: true,
      message: "Professional profile updated successfully",
      professional: updatedData,
    });
  } catch (error) {
    console.error("Update professional profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while updating profile",
      error: error.message,
    });
  }
};

module.exports = {
  getProfessionalProfile,
  updateProfessionalProfile,
};
