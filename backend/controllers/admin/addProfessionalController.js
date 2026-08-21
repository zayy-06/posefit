const UserModel = require("../../models/userModel");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS,
  },
});

const addProfessional = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      professionalType,
      specialization,
      sessionFee,
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, and email are required",
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

    // Use provided password or auto-generate temporary password
    const tempPassword = password || `PoseFit@${Math.floor(1000 + Math.random() * 9000)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newProfessional = new UserModel({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "PROFESSIONAL",
      isVerified: true, 
      professionalStatus: "invited",
      professionalType: professionalType || "Trainer",
      specialization: specialization || "",
      sessionFee: sessionFee ? Number(sessionFee) : 0,
      appliedAt: new Date(),
    });

    await newProfessional.save();

    // Send Credential Invitation Email
    try {
      await transporter.sendMail({
        from: `"PoseFit Admin" <${process.env.USER_EMAIL}>`,
        to: email.toLowerCase(),
        subject: "Welcome to PoseFit - Professional Onboarding Credentials",
        text: `Hi ${firstName} ${lastName},

Congratulations! The PoseFit Admin team has invited you to join PoseFit as a Professional ${professionalType || "Trainer"}.

Here are your initial login credentials:
Login Email: ${email.toLowerCase()}
Temporary Password: ${tempPassword}

Next Steps:
1. Log in to your PoseFit account using these credentials.
2. Complete your professional profile by uploading your bio, photo, credential documents, bank details, and availability schedule.
3. Once submitted, your profile will be reviewed by the admin for final live verification.

Regards,
PoseFit Team`,
      });
    } catch (emailErr) {
      console.error("Failed to send onboarding email:", emailErr);
    }

    return res.status(201).json({
      success: true,
      message: "Professional invited & account created successfully. Credentials emailed to professional.",
      tempPassword,
      professional: {
        _id: newProfessional._id,
        firstName: newProfessional.firstName,
        lastName: newProfessional.lastName,
        email: newProfessional.email,
        role: newProfessional.role,
        professionalStatus: newProfessional.professionalStatus,
        professionalType: newProfessional.professionalType,
        specialization: newProfessional.specialization,
        sessionFee: newProfessional.sessionFee,
      },
    });
  } catch (error) {
    console.error("Error adding professional:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while adding professional",
      error: error.message,
    });
  }
};

module.exports = addProfessional;