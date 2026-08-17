const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: { 
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["ADMIN", "USER", "PROFESSIONAL"],
      default: "USER",
    },

    // Email verification
    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationCode: {
      type: String,
    },

    // Professional Specific Fields
    professionalType: {
      type: String,
      enum: ["Trainer", "Nutritionist", "TRAINER", "NUTRITIONIST", "OTHER"],
      default: "Trainer",
    },

    specialization: {
      type: String,
      trim: true,
    },

    sessionFee: {
      type: Number,
      min: 0,
      default: 0,
    },

    profilePhoto: {
      type: String,
      trim: true,
    },

    bio: {
      type: String,
      trim: true,
    },

    credentialDocs: [
      {
        title: { type: String, trim: true },
        fileUrl: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // SENSITIVE DATA - Accessible ONLY by ADMIN or the Professional themselves
    bankDetails: {
      accountHolderName: { type: String, trim: true },
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      routingNumber: { type: String, trim: true },
      iban: { type: String, trim: true },
      swiftCode: { type: String, trim: true },
    },

    availability: [
      {
        day: { type: String, trim: true },
        slots: [{ type: String, trim: true }],
      },
    ],

    // Professional verification status flow: invited -> pending_verification -> approved / rejected
    professionalStatus: {
      type: String,
      enum: [
        "invited",
        "pending_verification",
        "approved",
        "rejected",
        "INVITED",
        "PENDING",
        "PENDING_VERIFICATION",
        "APPROVED",
        "REJECTED",
      ],
      default: function () {
        return this.role === "PROFESSIONAL" ? "invited" : undefined;
      },
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    verificationMeetingLink: {
      type: String,
      trim: true,
    },

    verificationMeetingTime: {
      type: Date,
    },

    verificationNotes: {
      type: String,
      trim: true,
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel;