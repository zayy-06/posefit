const UserModel = require("../../models/userModel");

const deleteProfessional = async (req, res) => {
  try {
    const { id } = req.params;

    const professional = await UserModel.findOneAndDelete({
      _id: id,
      role: "PROFESSIONAL",
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Professional removed successfully",
    });
  } catch (error) {
    console.error("Error deleting professional:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while removing professional",
    });
  }
};

module.exports = deleteProfessional;