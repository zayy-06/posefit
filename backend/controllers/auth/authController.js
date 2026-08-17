const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const UserModel = require("../../models/userModel");
const generateToken = require("../../utils/token");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS,
  },
});

const signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
    } = req.body;

    // BLOCK PUBLIC PROFESSIONAL SIGNUP
    if (role && role.toUpperCase() === "PROFESSIONAL") {
      return res.status(403).json({
        success: false,
        message:
          "Direct public registration for Professionals is not allowed. Please contact the PoseFit admin team to get onboarded.",
      });
    }

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
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const newUser = new UserModel({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "USER",
      isVerified: false,
      verificationCode,
    });

    await newUser.save();

    // Send verification email
    await transporter.sendMail({
      from: `"PoseFit" <${process.env.USER_EMAIL}>`,
      to: email,
      subject: "PoseFit Email Verification",
      text:
        `Hi ${firstName} ${lastName},\n\n` +
        `Your PoseFit verification code is: ${verificationCode}\n\n` +
        `Please use this code to verify your email.`,
    });

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Verification code sent to your email.",
      userId: newUser._id,
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong during registration",
      error: error.message,
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        message: "User ID and verification code are required",
      });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    if (user.verificationCode !== code.toString()) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    user.isVerified = true;
    user.verificationCode = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify email error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while verifying email",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await UserModel.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User does not exist",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(
      user._id.toString(),
      user.role
    );

    const userData = user.toObject();

    delete userData.password;
    delete userData.verificationCode;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong during login",
      error: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await UserModel.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email does not exist",
      });
    }

    const resetCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    user.verificationCode = resetCode;

    await user.save();

    await transporter.sendMail({
      from: `"PoseFit" <${process.env.USER_EMAIL}>`,
      to: email,
      subject: "PoseFit Password Reset Code",
      text:
        `Hi ${user.firstName} ${user.lastName},\n\n` +
        `Your PoseFit password reset code is: ${resetCode}\n\n` +
        `If you did not request a password reset, please ignore this email.`,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset code sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const {
      email,
      code,
      password,
    } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email, code and new password are required",
      });
    }

    const user = await UserModel.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.verificationCode !== code.toString()) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset code",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    user.password = hashedPassword;
    user.verificationCode = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// PROFESSIONAL PROFILE COMPLETION SUPPORT (FOR FUTURE PROFESSIONAL FRONTEND)
const completeProfessionalProfile = async (req, res) => {
  try {
    const professionalId = req.user.userId;

    const professional = await UserModel.findOne({
      _id: professionalId,
      role: "PROFESSIONAL",
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found or unauthorized",
      });
    }

    const {
      profilePhoto,
      bio,
      specialization,
      professionalType,
      sessionFee,
      credentialDocs,
      bankDetails,
      availability,
    } = req.body;

    if (profilePhoto) professional.profilePhoto = profilePhoto;
    if (bio) professional.bio = bio;
    if (specialization) professional.specialization = specialization;
    if (professionalType) professional.professionalType = professionalType;
    if (sessionFee !== undefined) professional.sessionFee = sessionFee;
    if (credentialDocs) professional.credentialDocs = credentialDocs;
    if (bankDetails) professional.bankDetails = bankDetails;
    if (availability) professional.availability = availability;

    // Transition status to pending_verification upon submission
    professional.professionalStatus = "pending_verification";
    professional.rejectionReason = undefined;
    professional.appliedAt = new Date();

    await professional.save();

    const result = professional.toObject();
    delete result.password;

    return res.status(200).json({
      success: true,
      message: "Professional profile submitted for verification successfully",
      professional: result,
    });
  } catch (error) {
    console.error("Error in completeProfessionalProfile:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while completing professional profile",
      error: error.message,
    });
  }
};

module.exports = {
  signup,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  completeProfessionalProfile,
};