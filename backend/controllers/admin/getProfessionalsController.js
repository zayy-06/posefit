const UserModel = require("../../models/userModel");

// Admin endpoint: Full details including bank details & credential documents for admin management
const getProfessionals = async (req, res) => {
  try {
    const professionals = await UserModel.find({
      role: "PROFESSIONAL",
    }).select("-password -verificationCode");

    return res.status(200).json({
      success: true,
      count: professionals.length,
      professionals,
    });
  } catch (error) {
    console.error("Error fetching professionals for admin:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching professionals",
    });
  }
};

// Public / User endpoint: Returns ONLY approved live professionals and EXCLUDES sensitive bankDetails & credentialDocs
const getPublicProfessionals = async (req, res) => {
  try {
    const professionals = await UserModel.find({
      role: "PROFESSIONAL",
      professionalStatus: { $in: ["approved", "APPROVED"] },
    }).select(
      "firstName lastName email profilePhoto bio specialization professionalType sessionFee availability rating professionalStatus isVerified"
    );

    return res.status(200).json({
      success: true,
      count: professionals.length,
      professionals,
    });
  } catch (error) {
    console.error("Error fetching public professionals:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching public professionals",
    });
  }
};

// Public endpoint for fetching single approved professional details
const getPublicProfessionalById = async (req, res) => {
  try {
    const { id } = req.params;

    const professional = await UserModel.findOne({
      _id: id,
      role: "PROFESSIONAL",
      professionalStatus: { $in: ["approved", "APPROVED"] },
    }).select(
      "firstName lastName email profilePhoto bio specialization professionalType sessionFee availability rating professionalStatus isVerified"
    );

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Approved professional not found",
      });
    }

    return res.status(200).json({
      success: true,
      professional,
    });
  } catch (error) {
    console.error("Error fetching public professional by id:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching professional details",
    });
  }
};

module.exports = {
  getProfessionals,
  getPublicProfessionals,
  getPublicProfessionalById,
};