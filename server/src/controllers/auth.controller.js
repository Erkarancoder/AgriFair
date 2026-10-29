const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTPVerification = require('../models/OTPVerification');
const { ALLOWED_REGISTRATION_ROLES } = require('../constants/roles');
const config = require('../config/env');
const { sendOTPEmail } = require('../services/email.service');
const { sendSMSOTP } = require('../services/sms.service');

const getCookieOptions = () => ({
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
  maxAge: config.cookieMaxAgeDays * 24 * 60 * 60 * 1000
});

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

// Generates cryptographically secure 6-digit OTP
const generateSecureOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, phone number, password, and role.'
      });
    }

    // Role security check
    const normalizedRole = role.toLowerCase().trim();
    if (!ALLOWED_REGISTRATION_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role selected. Allowed roles: ${ALLOWED_REGISTRATION_ROLES.join(', ')}`
      });
    }

    const cleanPhoneDigits = phone.replace(/\D/g, '');
    if (cleanPhoneDigits.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone.trim();

    // Check duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Check duplicate phone number
    const existingPhone = await User.findOne({ phone: normalizedPhone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'An account with this phone number is already registered. Please sign in or use another number.'
      });
    }

    // Create user with unverified email
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: normalizedRole,
      phone: normalizedPhone,
      isEmailVerified: false
    });

    // Generate secure 6-digit OTP
    const rawOtp = generateSecureOTP();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    // Invalidate previous OTPs for this user
    await OTPVerification.deleteMany({
      email: normalizedEmail,
      purpose: 'registration_verification'
    });

    // Save hashed OTP with 10 min expiry
    await OTPVerification.create({
      userId: user._id,
      email: normalizedEmail,
      otpHash,
      purpose: 'registration_verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    // Deliver OTP via real email service
    const emailDelivery = await sendOTPEmail({
      to: normalizedEmail,
      otp: rawOtp,
      purpose: 'registration_verification'
    });

    // Deliver OTP via real SMS service to phone
    const smsDelivery = await sendSMSOTP({
      phone: normalizedPhone,
      otp: rawOtp,
      purpose: 'registration_verification'
    });

    const isDev = config.nodeEnv !== 'production';
    const dispatched = smsDelivery.delivered || emailDelivery.delivered;

    return res.status(201).json({
      success: true,
      message: dispatched
        ? `Account registered. Verification code dispatched to ${normalizedPhone}.`
        : isDev
          ? `Account registered. Verification code is ${rawOtp}.`
          : `Account registered. Verification code dispatched to your registered contact.`,
      email: user.email,
      phone: user.phone,
      userId: user._id,
      requiresVerification: true,
      ...(isDev && { devOtp: rawOtp })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-otp
 */
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp, purpose = 'registration_verification' } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and verification code.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find active verification record
    const otpRecord = await OTPVerification.findOne({
      email: normalizedEmail,
      purpose,
      isUsed: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No active verification code found for this email. Please request a new code.'
      });
    }

    // Check application-level expiry
    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    // Check maximum attempts
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new verification code.'
      });
    }

    // Verify hash
    const isMatch = await bcrypt.compare(otp.toString().trim(), otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = otpRecord.maxAttempts - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Maximum attempts exceeded.'}`
      });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // If registration verification, update user and authenticate
    if (purpose === 'registration_verification') {
      const user = await User.findById(otpRecord.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User account not found.'
        });
      }

      user.isEmailVerified = true;
      await user.save();

      const token = generateToken(user._id);
      res.cookie('token', token, getCookieOptions());

      return res.status(200).json({
        success: true,
        message: 'Email verified successfully. Welcome to AgriFair!',
        user: user.toSafeObject()
      });
    }

    // For password reset verification
    if (purpose === 'password_reset') {
      return res.status(200).json({
        success: true,
        message: 'Verification code confirmed. You may now reset your password.',
        verified: true
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Code verified successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/resend-otp
 */
const resendOTP = async (req, res, next) => {
  try {
    const { email, purpose = 'registration_verification' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.'
      });
    }

    // Rate-limit resend: must wait 60 seconds
    const lastOTP = await OTPVerification.findOne({
      email: normalizedEmail,
      purpose
    }).sort({ createdAt: -1 });

    if (lastOTP && Date.now() - new Date(lastOTP.createdAt).getTime() < 60 * 1000) {
      const secondsLeft = Math.ceil(
        (60 * 1000 - (Date.now() - new Date(lastOTP.createdAt).getTime())) / 1000
      );
      return res.status(429).json({
        success: false,
        message: `Please wait ${secondsLeft} seconds before requesting a new code.`
      });
    }

    // Invalidate previous OTPs
    await OTPVerification.deleteMany({
      email: normalizedEmail,
      purpose
    });

    // Generate new OTP
    const rawOtp = generateSecureOTP();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    await OTPVerification.create({
      userId: user._id,
      email: normalizedEmail,
      otpHash,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    const delivery = await sendOTPEmail({
      to: normalizedEmail,
      otp: rawOtp,
      purpose
    });

    let smsDelivery = { delivered: false };
    if (user.phone) {
      smsDelivery = await sendSMSOTP({
        phone: user.phone,
        otp: rawOtp,
        purpose
      });
    }

    const isDev = config.nodeEnv !== 'production';
    const dispatched = smsDelivery.delivered || delivery.delivered;

    return res.status(200).json({
      success: true,
      message: dispatched
        ? `A new verification code has been dispatched to ${user.phone || normalizedEmail}.`
        : isDev
          ? `A new verification code is ${rawOtp}.`
          : `A new verification code has been dispatched.`,
      ...(isDev && { devOtp: rawOtp })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // Generic error to prevent account enumeration
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended or inactive. Please contact support.'
      });
    }

    // Set HttpOnly cookie
    const token = generateToken(user._id);
    res.cookie('token', token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user.toSafeObject ? req.user.toSafeObject() : req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    res.clearCookie('token', getCookieOptions());
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your account email address.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Always return generic success message to prevent user enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification code has been dispatched.'
      });
    }

    const rawOtp = generateSecureOTP();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    await OTPVerification.deleteMany({
      email: normalizedEmail,
      purpose: 'password_reset'
    });

    await OTPVerification.create({
      userId: user._id,
      email: normalizedEmail,
      otpHash,
      purpose: 'password_reset',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await sendOTPEmail({
      to: normalizedEmail,
      otp: rawOtp,
      purpose: 'password_reset'
    });

    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a verification code has been dispatched.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, verification code, and new password.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpRecord = await OTPVerification.findOne({
      email: normalizedEmail,
      purpose: 'password_reset',
      isUsed: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No active password reset code found. Please request a new one.'
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    const isMatch = await bcrypt.compare(otp.toString().trim(), otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code.'
      });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    const user = await User.findById(otpRecord.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, allowDirectCalls } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (typeof allowDirectCalls === 'boolean') {
      user.allowDirectCalls = allowDirectCalls;
    }

    if (phone && phone.trim() !== user.phone) {
      const cleanPhoneDigits = phone.replace(/\D/g, '');
      if (cleanPhoneDigits.length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 10-digit mobile number.'
        });
      }
      const normalizedPhone = phone.trim();
      const existingPhone = await User.findOne({ phone: normalizedPhone, _id: { $ne: user._id } });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'This mobile number is already registered with another account.'
        });
      }
      user.phone = normalizedPhone;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  getMe,
  updateProfile,
  logout,
  forgotPassword,
  resetPassword
};
