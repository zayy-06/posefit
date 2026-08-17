const UserModel = require("../../models/userModel");
const bcrypt = require("bcryptjs");

const addUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await UserModel.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserModel({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "USER",
      isVerified: true,
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "User added successfully",
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Error adding user:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while adding user",
    });
  }
};

module.exports = addUser;