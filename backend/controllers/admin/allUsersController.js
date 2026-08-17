const UserModel = require("../../models/userModel");

const getAllUsers = async (req, res) => {
  try {
    const totalUsers = await UserModel.countDocuments({
      role: "USER",
    });

    return res.status(200).json({
      success: true,
      totalUsers,
    });
  } catch (error) {
    console.log("Get all users error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = getAllUsers;