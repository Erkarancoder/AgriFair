const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    otpHash: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      enum: ['registration_verification', 'login_otp', 'password_reset'],
      required: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    isUsed: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// MongoDB TTL index to auto-delete expired documents
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTPVerification = mongoose.model('OTPVerification', otpVerificationSchema);

module.exports = OTPVerification;
