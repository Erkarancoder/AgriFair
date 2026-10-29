const rateLimit = require('express-rate-limit');

/**
 * Chat Message Rate Limiter: Max 60 messages per minute per IP
 * Protects against chat spamming and automated bots
 */
const chatMessageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many messages sent. Please slow down and try again shortly.'
  }
});

/**
 * Negotiation Offer Rate Limiter: Max 25 offers or counters per 15 minutes per IP
 * Prevents bargaining harassment and offer spamming
 */
const negotiationOfferLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Offer proposal limit reached. Please wait a few minutes before submitting another offer.'
  }
});

/**
 * Call Request Rate Limiter: Max 10 call requests per 15 minutes per IP
 * Prevents repeated notification bombardment to producers
 */
const callRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'You have submitted multiple call requests recently. Please wait before requesting another call.'
  }
});

/**
 * Image Upload Rate Limiter: Max 25 image uploads per 15 minutes per IP
 * Protects server memory and Cloudinary storage quota
 */
const imageUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Upload limit reached. Please wait before uploading additional produce photos.'
  }
});

/**
 * Order Creation Rate Limiter: Max 20 direct order inquiries per 15 minutes per IP
 */
const orderCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Order submission limit reached. Please wait a few minutes before submitting additional orders.'
  }
});

/**
 * Payment Mutation Rate Limiter: Max 30 payment operations per 15 minutes per IP
 */
const paymentMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Payment attempt limit reached. Please wait a few minutes before initiating or verifying another payment.'
  }
});

/**
 * Admin Mutation Rate Limiter: Max 60 administrative mutations per 15 minutes per IP
 * Protects against moderation abuse and automated script manipulation
 */
const adminMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Admin action limit reached. Please wait a few moments before performing additional moderation actions.'
  }
});

module.exports = {
  chatMessageLimiter,
  negotiationOfferLimiter,
  callRequestLimiter,
  imageUploadLimiter,
  orderCreationLimiter,
  paymentMutationLimiter,
  adminMutationLimiter
};


