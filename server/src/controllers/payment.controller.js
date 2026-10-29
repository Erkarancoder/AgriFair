const mongoose = require('mongoose');
const { Order } = require('../models/Order');
const { Product } = require('../models/Product');
const config = require('../config/env');
const {
  isRazorpayConfigured,
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  createRazorpayRefund,
  fetchRazorpayPayment,
  fetchRazorpayOrder
} = require('../services/razorpay.service');
const { getIO } = require('../socket');
const notificationService = require('../services/notification.service');

/**
 * GET /api/payments/config
 * Returns public configuration status so frontend knows whether Razorpay Checkout is enabled.
 * Excludes all secrets and private keys.
 */
const getPaymentConfig = (req, res) => {
  const configured = isRazorpayConfigured();
  return res.status(200).json({
    success: true,
    data: {
      configured,
      keyId: configured ? config.razorpay.keyId : null,
      currency: 'INR'
    }
  });
};

/**
 * POST /api/payments/initiate
 * Initiates a server-side Razorpay order for an eligible buyer order.
 * Strictly verifies ownership, payable lifecycle status, and server-calculated amount in paise.
 */
const initiatePayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid order ID is required.'
      });
    }

    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        success: false,
        code: 'GATEWAY_NOT_CONFIGURED',
        message: 'Razorpay payment gateway is not configured. Direct Mandi / Bank Settlement remains available.'
      });
    }

    const order = await Order.findById(orderId).populate('product', 'name price unit status quantity');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // 1. Authorization: Only the buyer who placed the order can initiate payment
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to initiate payment for this order.'
      });
    }

    // 2. Terminal status check: Cannot pay for cancelled or rejected orders
    if (order.status === 'cancelled' || order.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: `Cannot pay for an order in '${order.status}' status.`
      });
    }

    // 3. Paid check: Cannot pay for already paid orders
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid and settled.'
      });
    }

    // 4. Server-side calculated amount validation
    if (!order.totalAmount || order.totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Order total amount must be a positive number.'
      });
    }

    // Convert INR to Paise strictly as an integer (e.g. ₹23,000 -> 2300000 paise)
    const amountInPaise = Math.round(Number(order.totalAmount) * 100);
    if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Calculated payment amount is invalid.'
      });
    }

    // 5. Create Razorpay order via official SDK
    const rzpOrder = await createRazorpayOrder({
      receipt: `ord_${order._id.toString()}`.slice(0, 40),
      amountPaise: amountInPaise,
      currency: order.currency || 'INR',
      notes: {
        orderId: order._id.toString(),
        buyerId: req.user._id.toString(),
        productId: order.product?._id ? order.product._id.toString() : ''
      }
    });

    // 6. Record payment attempt and link provider order ID
    order.razorpayOrderId = rzpOrder.id;
    order.paymentMethod = 'Razorpay';
    order.paymentAttempts.push({
      providerOrderId: rzpOrder.id,
      amountPaise: amountInPaise,
      currency: rzpOrder.currency || 'INR',
      status: 'created',
      createdAt: new Date()
    });

    await order.save();

    // 7. Return only necessary public info for Checkout UI
    return res.status(200).json({
      success: true,
      message: 'Payment order created successfully.',
      data: {
        keyId: config.razorpay.keyId,
        providerOrderId: rzpOrder.id,
        amount: rzpOrder.amount, // in paise
        currency: rzpOrder.currency,
        orderId: order._id,
        totalAmount: order.totalAmount,
        productName: order.product?.name || 'Produce Lot',
        buyerDetails: {
          name: req.user.name,
          email: req.user.email || '',
          phone: req.user.phone || ''
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/verify
 * Validates the cryptographic payment signature returned by Razorpay Checkout.
 * Never marks an order paid based only on client claims.
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid order ID is required.'
      });
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay verification parameters (razorpayOrderId, razorpayPaymentId, razorpaySignature).'
      });
    }

    const order = await Order.findById(orderId).populate('product');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // 1. Authorization: Only buyer or admin can submit verification
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to verify payment for this order.'
      });
    }

    // 2. Provider Order ID cross-check
    const hasMatchingAttempt =
      order.razorpayOrderId === razorpayOrderId ||
      order.paymentAttempts.some((att) => att.providerOrderId === razorpayOrderId);

    if (!hasMatchingAttempt) {
      return res.status(400).json({
        success: false,
        message: 'Provider order ID mismatch. This payment was not initiated for this order.'
      });
    }

    // 3. Idempotency: If already paid with this payment ID, return success immediately
    if (order.paymentStatus === 'paid' && order.razorpayPaymentId === razorpayPaymentId) {
      return res.status(200).json({
        success: true,
        message: 'Payment has already been verified and recorded.',
        data: order
      });
    }

    // 4. Cryptographic HMAC-SHA256 signature verification
    const isValid = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature
    });

    if (!isValid) {
      // Mark matching attempt failed
      await Order.updateOne(
        { _id: order._id, 'paymentAttempts.providerOrderId': razorpayOrderId },
        {
          $set: {
            'paymentAttempts.$.status': 'failed',
            'paymentAttempts.$.failureReason': 'Invalid cryptographic signature',
            paymentStatus: order.paymentStatus === 'paid' ? 'paid' : 'payment_failed'
          }
        }
      );

      return res.status(400).json({
        success: false,
        message: 'Cryptographic signature verification failed. Payment cannot be marked as verified.'
      });
    }

    // 5. Signature is valid -> Atomically transition paymentStatus to 'paid'
    // Update matching attempt
    const attemptIndex = order.paymentAttempts.findIndex((a) => a.providerOrderId === razorpayOrderId);
    if (attemptIndex !== -1) {
      order.paymentAttempts[attemptIndex].status = 'verified';
      order.paymentAttempts[attemptIndex].paymentId = razorpayPaymentId;
      order.paymentAttempts[attemptIndex].completedAt = new Date();
    }

    order.paymentStatus = 'paid';
    order.paymentMethod = 'Razorpay';
    order.razorpayOrderId = razorpayOrderId;
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paidAt = new Date();

    // 6. Stock coordination: If stock was not deducted yet (e.g. pending inquiry paid online)
    if (!order.isStockDeducted && order.product) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: order.product._id,
          quantity: { $gte: order.requestedQuantity }
        },
        {
          $inc: { quantity: -order.requestedQuantity }
        },
        { returnDocument: 'after' }
      );

      if (updatedProduct) {
        order.isStockDeducted = true;
        if (updatedProduct.quantity === 0) {
          await Product.updateOne({ _id: updatedProduct._id }, { status: 'unavailable' });
        }
      }
    }

    await order.save();

    // 7. Real-time notification via Socket.IO & In-App Idempotent Notifications
    const io = getIO();
    if (io) {
      io.to(`user:${order.farmer.toString()}`).emit('order_paid', {
        orderId: order._id,
        amount: order.totalAmount,
        paymentId: razorpayPaymentId
      });
      io.to(`user:${order.buyer.toString()}`).emit('order_paid', {
        orderId: order._id,
        amount: order.totalAmount,
        paymentId: razorpayPaymentId
      });
    }

    const orderShortId = order.orderNumber || order._id.toString().slice(-6);

    // Notify farmer about received payment
    notificationService.createNotification({
      recipient: order.farmer,
      type: 'payment',
      title: 'Payment Received',
      message: `Verified payment of ₹${order.totalAmount} received for Order #${orderShortId}.`,
      entityId: order._id,
      entityType: 'Order',
      link: '/farmer/orders',
      idempotencyKey: `payment:verified:farmer:${order._id}:${razorpayPaymentId || 'paid'}`
    }).catch((e) => console.warn('[Payment Farmer Notif Warn]:', e.message));

    // Notify buyer about payment confirmation
    notificationService.createNotification({
      recipient: order.buyer,
      type: 'payment',
      title: 'Payment Successful',
      message: `Your payment of ₹${order.totalAmount} for Order #${orderShortId} has been confirmed.`,
      entityId: order._id,
      entityType: 'Order',
      link: '/buyer/orders',
      idempotencyKey: `payment:verified:buyer:${order._id}:${razorpayPaymentId || 'paid'}`
    }).catch((e) => console.warn('[Payment Buyer Notif Warn]:', e.message));

    const populated = await Order.findById(order._id)
      .populate('product', 'name price unit currency location images status')
      .populate('farmer', 'name role email phone')
      .populate('buyer', 'name role email phone')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Payment verified and captured successfully via Razorpay.',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/webhook
 * Razorpay webhook handler for server-to-server notifications.
 * Verifies raw request body HMAC signature against RAZORPAY_WEBHOOK_SECRET.
 * Ensures idempotent processing.
 */
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const eventId = req.headers['x-razorpay-event-id'] || req.body?.event_id;

    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay webhook signature header.' });
    }

    // 1. Raw body signature verification
    const isValid = verifyWebhookSignature(req.rawBody, signature);
    if (!isValid) {
      console.warn('[Razorpay Webhook]: Signature validation failed for event:', eventId);
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const payload = req.body;
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const rzpOrderId = paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;

    if (!rzpOrderId) {
      // Event not tied to an order (e.g. system heartbeat)
      return res.status(200).json({ status: 'ignored', message: 'No order_id associated.' });
    }

    // 2. Find associated AgriFair order
    const order = await Order.findOne({
      $or: [{ razorpayOrderId: rzpOrderId }, { 'paymentAttempts.providerOrderId': rzpOrderId }]
    });

    if (!order) {
      console.warn('[Razorpay Webhook]: No matching order found for provider orderId:', rzpOrderId);
      return res.status(200).json({ status: 'ignored', message: 'Order not found in database.' });
    }

    // 3. Idempotency Check: Prevent duplicate event processing
    if (eventId && order.processedWebhooks.some((w) => w.eventId === eventId)) {
      return res.status(200).json({ status: 'idempotent', message: 'Event already processed.' });
    }

    // 4. Handle event lifecycle
    if (event === 'payment.captured' || event === 'order.paid') {
      if (order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.paymentMethod = 'Razorpay';
        order.razorpayPaymentId = paymentId;
        order.paidAt = new Date();

        // Atomically update payment attempt
        const attempt = order.paymentAttempts.find((a) => a.providerOrderId === rzpOrderId);
        if (attempt) {
          attempt.status = 'verified';
          attempt.paymentId = paymentId;
          attempt.completedAt = new Date();
        }

        // Coordinate stock if not yet deducted
        if (!order.isStockDeducted) {
          const updatedProduct = await Product.findOneAndUpdate(
            {
              _id: order.product,
              quantity: { $gte: order.requestedQuantity }
            },
            {
              $inc: { quantity: -order.requestedQuantity }
            },
            { returnDocument: 'after' }
          );

          if (updatedProduct) {
            order.isStockDeducted = true;
            if (updatedProduct.quantity === 0) {
              await Product.updateOne({ _id: updatedProduct._id }, { status: 'unavailable' });
            }
          }
        }
      }
    } else if (event === 'payment.failed') {
      if (order.paymentStatus !== 'paid') {
        order.paymentStatus = 'payment_failed';
        const attempt = order.paymentAttempts.find((a) => a.providerOrderId === rzpOrderId);
        if (attempt) {
          attempt.status = 'failed';
          attempt.failureReason = paymentEntity?.error_description || 'Payment failed';
        }
      }
    } else if (event === 'refund.processed') {
      const refundEntity = payload.payload?.refund?.entity;
      const refundId = refundEntity?.id;
      order.paymentStatus = 'refunded';
      const existingRefund = (order.refunds || []).find((r) => r.providerRefundId === refundId);
      if (existingRefund) {
        existingRefund.status = 'processed';
        existingRefund.processedAt = new Date();
      } else if (refundId) {
        order.refunds.push({
          providerRefundId: refundId,
          paymentId: paymentId || order.razorpayPaymentId,
          amountPaise: refundEntity?.amount || Math.round(order.totalAmount * 100),
          status: 'processed',
          reason: 'Webhook confirmed refund',
          createdAt: new Date(),
          processedAt: new Date()
        });
      }
    } else if (event === 'refund.failed') {
      const refundEntity = payload.payload?.refund?.entity;
      const refundId = refundEntity?.id;
      const existingRefund = (order.refunds || []).find((r) => r.providerRefundId === refundId);
      if (existingRefund) {
        existingRefund.status = 'failed';
      }
    }

    // 5. Record processed webhook event
    if (eventId) {
      order.processedWebhooks.push({
        eventId,
        eventType: event,
        paymentId: paymentId || null,
        processedAt: new Date()
      });
    }

    await order.save();

    return res.status(200).json({ status: 'success', message: 'Webhook processed successfully.' });
  } catch (error) {
    console.error('[Razorpay Webhook Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Internal error processing webhook.' });
  }
};

/**
 * POST /api/payments/refund
 * Initiates a verified refund via Razorpay for an eligible paid order.
 * Validates participant authorization, payment status, amount limits, and stores provider refund IDs.
 */
const initiateRefund = async (req, res, next) => {
  try {
    const { orderId, reason, amount } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Valid order ID is required.' });
    }

    const order = await Order.findById(orderId).populate('product');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // 1. Authorization: Only buyer or assigned farmer (or admin) can request refund
    const userId = req.user._id.toString();
    const isBuyer = order.buyer.toString() === userId;
    const isFarmer = order.farmer.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isFarmer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You are not authorized to initiate a refund for this order.' });
    }

    // 2. State validation: Order must be paid or refund_pending
    if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'refund_pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot refund order with payment status '${order.paymentStatus}'. Only paid orders can be refunded.`
      });
    }

    if (!order.razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: 'No online payment transaction ID found for this order. Settle via offline/mandi procedures if paid outside Razorpay.'
      });
    }

    // Check delivery state: Cannot refund delivered orders directly without dispute resolution
    if (order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Order has already been delivered. Completed deliveries cannot be refunded directly.'
      });
    }

    // 3. Amount validation: default to full remaining amount
    const alreadyRefundedPaise = (order.refunds || [])
      .filter((r) => r.status === 'processed')
      .reduce((sum, r) => sum + (r.amountPaise || 0), 0);

    const totalPaise = Math.round(Number(order.totalAmount) * 100);
    const maxRefundablePaise = Math.max(0, totalPaise - alreadyRefundedPaise);

    if (maxRefundablePaise <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This order has already been fully refunded.'
      });
    }

    const requestedAmountPaise = amount ? Math.round(Number(amount) * 100) : maxRefundablePaise;
    if (requestedAmountPaise <= 0 || requestedAmountPaise > maxRefundablePaise) {
      return res.status(400).json({
        success: false,
        message: `Refund amount (${requestedAmountPaise / 100}) exceeds maximum refundable amount (${maxRefundablePaise / 100}).`
      });
    }

    // 4. Create refund with Razorpay provider
    const rzpRefund = await createRazorpayRefund({
      paymentId: order.razorpayPaymentId,
      amountPaise: requestedAmountPaise,
      notes: {
        orderId: order._id.toString(),
        reason: reason || 'AgriFair order cancellation refund',
        initiatedBy: req.user.name
      }
    });

    const isProcessed = rzpRefund.status === 'processed';
    const refundRecord = {
      providerRefundId: rzpRefund.id,
      paymentId: order.razorpayPaymentId,
      amountPaise: requestedAmountPaise,
      currency: rzpRefund.currency || 'INR',
      status: isProcessed ? 'processed' : 'pending',
      reason: reason || 'Order cancellation refund',
      initiatedBy: req.user._id,
      createdAt: new Date(),
      processedAt: isProcessed ? new Date() : null
    };

    order.refunds.push(refundRecord);
    order.paymentStatus = isProcessed ? 'refunded' : 'refund_pending';

    // 5. If order was accepted and is now cancelled, restore stock atomically if not yet restored
    if (order.status === 'accepted' || order.status === 'pending') {
      order.status = 'cancelled';
      order.statusNote = `Cancelled and refunded via Razorpay (Refund ID: ${rzpRefund.id})`;
      order.statusHistory.push({
        status: 'cancelled',
        changedBy: req.user._id,
        changedAt: new Date(),
        note: `Cancelled and refunded (Refund ID: ${rzpRefund.id})`
      });

      if (order.isStockDeducted && order.product) {
        await Product.findOneAndUpdate(
          { _id: order.product._id || order.product },
          {
            $inc: { quantity: order.requestedQuantity },
            $set: { status: 'active' }
          }
        );
        order.isStockDeducted = false;
      }
    }

    await order.save();

    // Idempotent refund notification to buyer
    const refundShortId = order.orderNumber || order._id.toString().slice(-6);
    notificationService.createNotification({
      recipient: order.buyer,
      type: 'payment',
      title: 'Refund Processed',
      message: `Refund of ₹${(requestedAmountPaise / 100).toFixed(2)} for Order #${refundShortId} has been initiated.`,
      entityId: order._id,
      entityType: 'Order',
      link: '/buyer/orders',
      idempotencyKey: `refund:processed:${order._id}:${rzpRefund.id}`
    }).catch((e) => console.warn('[Refund Buyer Notif Warn]:', e.message));

    const io = getIO();
    if (io) {
      io.to(`user:${order.buyer.toString()}`).emit('order_refunded', {
        orderId: order._id,
        refundId: rzpRefund.id,
        amount: requestedAmountPaise / 100,
        status: order.paymentStatus
      });
      io.to(`user:${order.farmer.toString()}`).emit('order_refunded', {
        orderId: order._id,
        refundId: rzpRefund.id,
        amount: requestedAmountPaise / 100,
        status: order.paymentStatus
      });
    }

    const populated = await Order.findById(order._id)
      .populate('product', 'name price unit currency location images status')
      .populate('farmer', 'name role email phone')
      .populate('buyer', 'name role email phone')
      .lean();

    return res.status(200).json({
      success: true,
      message: `Refund of ₹${(requestedAmountPaise / 100).toLocaleString('en-IN')} initiated with status '${order.paymentStatus}'.`,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/:orderId/reconcile
 * Reconciles order payment status directly against Razorpay API.
 */
const reconcilePayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Valid order ID is required.' });
    }

    const order = await Order.findById(orderId).populate('product');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Authorization: Must be order participant
    const userId = req.user._id.toString();
    const isAuthorized =
      order.buyer.toString() === userId ||
      order.farmer.toString() === userId ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Unauthorized to reconcile this order.' });
    }

    if (!order.razorpayPaymentId && !order.razorpayOrderId) {
      return res.status(200).json({
        success: true,
        message: 'No Razorpay transaction IDs attached to this order. Settle via Direct Mandi procedures.',
        data: order
      });
    }

    let providerPayment = null;
    if (order.razorpayPaymentId) {
      providerPayment = await fetchRazorpayPayment(order.razorpayPaymentId);
    } else if (order.razorpayOrderId) {
      const providerOrder = await fetchRazorpayOrder(order.razorpayOrderId);
      if (providerOrder && providerOrder.status === 'paid') {
        order.paymentStatus = 'paid';
        order.paymentMethod = 'Razorpay';
      }
    }

    if (providerPayment) {
      if (providerPayment.status === 'captured') {
        if (providerPayment.refund_status === 'full') {
          order.paymentStatus = 'refunded';
        } else if (providerPayment.amount_refunded > 0) {
          order.paymentStatus = 'refund_pending';
        } else {
          order.paymentStatus = 'paid';
          order.paidAt = order.paidAt || new Date(providerPayment.created_at * 1000);
          order.paymentMethod = 'Razorpay';

          // Ensure stock consistency
          if (!order.isStockDeducted && order.product) {
            const updatedProduct = await Product.findOneAndUpdate(
              {
                _id: order.product._id || order.product,
                quantity: { $gte: order.requestedQuantity }
              },
              { $inc: { quantity: -order.requestedQuantity } },
              { returnDocument: 'after' }
            );
            if (updatedProduct) {
              order.isStockDeducted = true;
              if (updatedProduct.quantity === 0) {
                await Product.updateOne({ _id: updatedProduct._id }, { status: 'unavailable' });
              }
            }
          }
        }
      } else if (providerPayment.status === 'failed') {
        if (order.paymentStatus !== 'paid') {
          order.paymentStatus = 'payment_failed';
        }
      }
    }

    order.reconciledAt = new Date();
    await order.save();

    const populated = await Order.findById(order._id)
      .populate('product', 'name price unit currency location images status')
      .populate('farmer', 'name role email phone')
      .populate('buyer', 'name role email phone')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Payment status successfully reconciled with Razorpay.',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPaymentConfig,
  initiatePayment,
  verifyPayment,
  handleWebhook,
  initiateRefund,
  reconcilePayment
};

