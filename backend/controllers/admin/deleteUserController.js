const UserModel = require("../../models/userModel");

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await UserModel.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log("Delete user error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = deleteUser;