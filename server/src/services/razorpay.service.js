const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config/env');

let razorpayInstance = null;

/**
 * Initializes and returns the official Razorpay SDK client if credentials are configured.
 */
const getRazorpayInstance = () => {
  if (!config.razorpay.isConfigured) {
    return null;
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret
    });
  }

  return razorpayInstance;
};

/**
 * Checks whether real Razorpay credentials are configured in the environment.
 */
const isRazorpayConfigured = () => {
  return Boolean(config.razorpay.keyId && config.razorpay.keySecret);
};

/**
 * Creates a server-side order with Razorpay in paise.
 * @param {Object} params
 * @param {string} params.receipt - Internal order reference (e.g. AgriFair order ID)
 * @param {number} params.amountPaise - Total payable amount strictly converted to paise (integer)
 * @param {string} params.currency - Currency code (e.g. 'INR')
 * @param {Object} params.notes - Safe metadata for reporting/dashboard
 */
const createRazorpayOrder = async ({ receipt, amountPaise, currency = 'INR', notes = {} }) => {
  const instance = getRazorpayInstance();
  if (!instance) {
    const error = new Error('Razorpay payment gateway is not configured on this server. Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.');
    error.code = 'GATEWAY_NOT_CONFIGURED';
    error.status = 503;
    throw error;
  }

  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    const error = new Error(`Invalid payment amount in paise: ${amountPaise}. Must be a positive integer.`);
    error.status = 400;
    throw error;
  }

  const options = {
    amount: amountPaise,
    currency: currency.toUpperCase(),
    receipt: receipt.toString().slice(0, 40),
    payment_capture: 1, // Auto capture
    notes: {
      ...notes,
      platform: 'AgriFair',
      environment: config.nodeEnv
    }
  };

  try {
    const order = await instance.orders.create(options);
    return order;
  } catch (err) {
    // Sanitize error logging to ensure no secrets or sensitive data are leaked
    console.error('[Razorpay Order Creation Failed]:', {
      message: err.message,
      statusCode: err.statusCode,
      receipt
    });
    throw err;
  }
};

/**
 * Verifies the payment signature returned by the checkout browser callback.
 * Formula: HMAC_SHA256(order_id + "|" + razorpay_payment_id, secret)
 */
const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  if (!config.razorpay.keySecret) {
    return false;
  }

  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const payload = `${orderId}|${paymentId}`;
  const generatedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(payload)
    .digest('hex');

  // Use timing-safe equal to prevent timing attacks
  try {
    const genBuf = Buffer.from(generatedSignature, 'utf8');
    const sigBuf = Buffer.from(signature, 'utf8');
    if (genBuf.length !== sigBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(genBuf, sigBuf);
  } catch (_e) {
    return false;
  }
};

/**
 * Verifies incoming Razorpay webhook signature against the raw request body buffer.
 * Formula: HMAC_SHA256(rawBody, webhookSecret)
 */
const verifyWebhookSignature = (rawBody, signature) => {
  const secret = config.razorpay.webhookSecret;
  if (!secret) {
    console.warn('[Razorpay Webhook]: RAZORPAY_WEBHOOK_SECRET is not configured. Rejecting webhook.');
    return false;
  }

  if (!rawBody || !signature) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  try {
    const genBuf = Buffer.from(generatedSignature, 'utf8');
    const sigBuf = Buffer.from(signature, 'utf8');
    if (genBuf.length !== sigBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(genBuf, sigBuf);
  } catch (_e) {
    return false;
  }
};

/**
 * Creates a refund for a captured payment via the official Razorpay SDK.
 * @param {Object} params
 * @param {string} params.paymentId - The Razorpay payment ID
 * @param {number} params.amountPaise - Amount to refund in paise
 * @param {Object} params.notes - Safe metadata for reason & audit trail
 */
const createRazorpayRefund = async ({ paymentId, amountPaise, notes = {} }) => {
  const instance = getRazorpayInstance();
  if (!instance) {
    const error = new Error('Razorpay gateway is not configured on this server.');
    error.code = 'GATEWAY_NOT_CONFIGURED';
    error.status = 503;
    throw error;
  }

  if (!paymentId) {
    const error = new Error('Valid Razorpay payment ID is required for refund.');
    error.status = 400;
    throw error;
  }

  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    const error = new Error(`Invalid refund amount in paise: ${amountPaise}. Must be a positive integer.`);
    error.status = 400;
    throw error;
  }

  try {
    const refund = await instance.payments.refund(paymentId, {
      amount: amountPaise,
      notes: {
        ...notes,
        platform: 'AgriFair'
      }
    });
    return refund;
  } catch (err) {
    console.error('[Razorpay Refund Failed]:', {
      message: err.message,
      paymentId,
      amountPaise
    });
    throw err;
  }
};

/**
 * Fetches current payment details from Razorpay for server-side reconciliation.
 */
const fetchRazorpayPayment = async (paymentId) => {
  const instance = getRazorpayInstance();
  if (!instance) {
    const error = new Error('Razorpay gateway is not configured.');
    error.code = 'GATEWAY_NOT_CONFIGURED';
    error.status = 503;
    throw error;
  }

  return instance.payments.fetch(paymentId);
};

/**
 * Fetches current order details from Razorpay for server-side reconciliation.
 */
const fetchRazorpayOrder = async (orderId) => {
  const instance = getRazorpayInstance();
  if (!instance) {
    const error = new Error('Razorpay gateway is not configured.');
    error.code = 'GATEWAY_NOT_CONFIGURED';
    error.status = 503;
    throw error;
  }

  return instance.orders.fetch(orderId);
};

module.exports = {
  getRazorpayInstance,
  isRazorpayConfigured,
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  createRazorpayRefund,
  fetchRazorpayPayment,
  fetchRazorpayOrder
};

