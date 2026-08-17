const UserModel = require("../../models/userModel");

const userDetails = async (req, res) => {
  try {
    const users = await UserModel.find({ role: "USER" })
      .select("-password -verificationCode");

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.log("User details error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = userDetails;