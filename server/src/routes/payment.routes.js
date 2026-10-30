const express = require('express');
const {
  getPaymentConfig,
  initiatePayment,
  verifyPayment,
  handleWebhook,
  initiateRefund,
  reconcilePayment,
  demoSettlePayment
} = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth');
const { paymentMutationLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// 1. Public Payment Gateway Config Status (Returns whether configured + public keyId)
router.get('/config', getPaymentConfig);

// 2. Razorpay Webhook Endpoint (Called by Razorpay servers with cryptographic signature)
router.post('/webhook', handleWebhook);

// 3. Authenticated Buyer: Initiate Payment Order with Razorpay
router.post('/initiate', protect, paymentMutationLimiter, initiatePayment);

// 4. Authenticated Buyer: Verify Payment Signature & Settle Order
router.post('/verify', protect, paymentMutationLimiter, verifyPayment);

// 5. Authenticated Participant: Initiate Verified Refund
router.post('/refund', protect, paymentMutationLimiter, initiateRefund);

// 6. Authenticated Participant: Reconcile Payment Status with Razorpay API
router.post('/:orderId/reconcile', protect, paymentMutationLimiter, reconcilePayment);

// 7. Authenticated Buyer: Instant Hackathon Demo / Direct Settlement
router.post('/demo-settle', protect, paymentMutationLimiter, demoSettlePayment);

module.exports = router;

