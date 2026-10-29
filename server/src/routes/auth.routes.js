const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Strict rate limit for auth mutations (login/register/OTP: max 15 requests per 10 minutes)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 10 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth Routes
router.post('/register', authLimiter, authController.register);
router.post('/verify-otp', authLimiter, authController.verifyOTP);
router.post('/resend-otp', authLimiter, authController.resendOTP);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

module.exports = router;
