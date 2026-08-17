const UserModel = require("../../models/userModel");

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, email } = req.body;

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (email) {
      const existingUser = await UserModel.findOne({
        email: email.toLowerCase(),
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use by another user",
        });
      }
    }

    const updatedData = {};

    if (firstName) updatedData.firstName = firstName;
    if (lastName) updatedData.lastName = lastName;
    if (email) updatedData.email = email.toLowerCase();

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      updatedData,
      { new: true }
    ).select("-password -verificationCode");

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log("Update user error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

module.exports = updateUser;