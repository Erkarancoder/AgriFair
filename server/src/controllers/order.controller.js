const mongoose = require('mongoose');
const { Order } = require('../models/Order');
const { Product } = require('../models/Product');
const { NegotiationOffer } = require('../models/NegotiationOffer');
const { BUYER_ROLES } = require('../constants/roles');
const {
  ORDER_STATUSES,
  TERMINAL_STATUSES,
  VALID_TRANSITIONS
} = require('../constants/orderStatuses');
const notificationService = require('../services/notification.service');

/**
 * POST /api/orders
 * Authenticated buyer endpoint to create an inquiry / purchase request for a product
 */
const createOrder = async (req, res, next) => {
  try {
    // 1. Role verification: only buyers, wholesalers, retailers, or consumers can place order requests
    if (!BUYER_ROLES.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only buyers, wholesalers, retailers, or consumers can create purchase inquiries/orders.'
      });
    }

    // 2. Extract client inputs (ignoring any client-supplied buyer, farmer, status, price, or total)
    const { productId, product: altProductId, quantity, unit, message, buyerMessage } = req.body;
    const targetProductId = productId || altProductId;

    // 3. Validate product ID format
    if (!targetProductId || !mongoose.Types.ObjectId.isValid(targetProductId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid product ID is required.'
      });
    }

    // 4. Retrieve product from DB
    const product = await Product.findById(targetProductId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product listing not found.'
      });
    }

    // 5. Product must be active and in stock
    if (product.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Product is not currently active or available for purchase inquiries.'
      });
    }

    if (product.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This produce listing is currently out of stock.'
      });
    }

    // 6. Buyer cannot order their own listing
    if (product.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot place an order request for your own product listing.'
      });
    }

    // 7. Prevent duplicate pending inquiries from the same buyer for the same produce lot
    const existingPending = await Order.findOne({
      buyer: req.user._id,
      product: product._id,
      status: 'pending'
    });
    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active pending purchase inquiry for this produce listing. Please await farmer confirmation or cancel your previous request before submitting another.'
      });
    }

    // 8. Validate quantity
    const parsedQty = Number(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity must be a positive number greater than zero.'
      });
    }

    if (parsedQty > product.quantity) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${parsedQty} ${product.unit}) exceeds available stock (${product.quantity} ${product.unit}).`
      });
    }

    // Minimum Order Quantity (MOQ) check
    if (product.minOrderQuantity && parsedQty < product.minOrderQuantity) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${parsedQty} ${product.unit}) cannot be less than the minimum order quantity of ${product.minOrderQuantity} ${product.unit}.`
      });
    }

    // 9. Validate unit if provided (must match product's listed unit)
    if (unit && typeof unit === 'string') {
      const normalizedUnit = unit.toLowerCase().trim();
      if (normalizedUnit !== product.unit.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: `Unit mismatch: this produce lot is listed in '${product.unit}', but '${unit}' was requested.`
        });
      }
    }

    // 10. Optional message validation
    const rawMessage = buyerMessage || message || '';
    if (typeof rawMessage === 'string' && rawMessage.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Buyer message cannot exceed 1000 characters.'
      });
    }

    // 11. Check if buyer and farmer reached an accepted price negotiation
    let priceSnapshot = product.price;
    let isNegotiated = false;
    let negotiatedOfferId = null;

    const acceptedOffer = await NegotiationOffer.findOne({
      buyer: req.user._id,
      product: product._id,
      status: 'accepted',
      order: null
    }).sort({ updatedAt: -1 });

    if (acceptedOffer) {
      priceSnapshot = acceptedOffer.price;
      isNegotiated = true;
      negotiatedOfferId = acceptedOffer._id;
    }

    // Server-side totals derivation with 2 decimal rounding
    const totalAmount = Number((priceSnapshot * parsedQty).toFixed(2));
    const currency = product.currency || 'INR';

    // 12. Create order record with initial 'pending' status
    const order = new Order({
      buyer: req.user._id,
      farmer: product.owner,
      product: product._id,
      requestedQuantity: parsedQty,
      unit: product.unit,
      priceSnapshot,
      currency,
      totalAmount,
      buyerMessage: rawMessage.trim(),
      status: 'pending',
      isNegotiated,
      negotiatedOffer: negotiatedOfferId,
      negotiatedAt: isNegotiated ? new Date() : null,
      isStockDeducted: false,
      statusHistory: [
        {
          status: 'pending',
          changedBy: req.user._id,
          changedAt: new Date(),
          note: isNegotiated
            ? `Negotiated purchase inquiry submitted at agreed rate ₹${priceSnapshot}/${product.unit}`
            : 'Initial purchase request submitted by buyer'
        }
      ]
    });

    await order.save();

    if (acceptedOffer) {
      acceptedOffer.order = order._id;
      await acceptedOffer.save();
    }

    // Asynchronously dispatch idempotent notification to farmer
    notificationService
      .createNotification({
        recipient: product.owner,
        type: 'order',
        title: 'New Purchase Request',
        message: `New purchase request #${order.orderNumber || order._id.toString().slice(-6)} received for ${product.title || product.name || 'produce'} (${parsedQty} ${product.unit}).`,
        entityId: order._id,
        entityType: 'Order',
        link: '/farmer/orders',
        idempotencyKey: `order:created:${order._id}`
      })
      .catch((err) => console.warn('[Order Create Notification Warn]:', err.message));

    const populated = await Order.findById(order._id)
      .populate('product', 'name price unit currency location images status')
      .populate('buyer', 'name role')
      .populate('farmer', 'name role')
      .select('-__v')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Purchase request submitted successfully. The farmer will review your inquiry.',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/mine
 * Return orders visible to the authenticated user (as buyer or farmer)
 */
const getMyOrders = async (req, res, next) => {
  try {
    const { status, role, page = 1, limit = 20 } = req.query;

    const query = {};

    // Filter by role perspective if explicitly requested, otherwise match either
    if (role === 'buyer') {
      query.buyer = req.user._id;
    } else if (role === 'farmer') {
      query.farmer = req.user._id;
    } else {
      query.$or = [{ buyer: req.user._id }, { farmer: req.user._id }];
    }

    // Optional status filtering
    if (status && ORDER_STATUSES.includes(status)) {
      query.status = status;
    }

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (parsedPage - 1) * parsedLimit;

    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('product', 'name price unit currency location images status')
        .populate('buyer', 'name role')
        .populate('farmer', 'name role')
        .select('-__v')
        .lean()
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages,
      currentPage: parsedPage,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:id
 * Return a single order only if the user is its buyer or farmer
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format.'
      });
    }

    const order = await Order.findById(id)
      .populate('product', 'name price unit currency location images status')
      .populate('buyer', 'name role')
      .populate('farmer', 'name role')
      .select('-__v')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order request not found.'
      });
    }

    // Authorization: only the buyer or assigned farmer may view this order
    const isBuyer = order.buyer?._id?.toString() === req.user._id.toString();
    const isFarmer = order.farmer?._id?.toString() === req.user._id.toString();

    if (!isBuyer && !isFarmer) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this order.'
      });
    }

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/orders/:id/status
 * Perform role-governed delivery stage status transitions
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format.'
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order request not found.'
      });
    }

    const { status, note, statusNote } = req.body;

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Target status is required.'
      });
    }

    const targetStatus = status.toLowerCase().trim();

    if (!ORDER_STATUSES.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid target status '${targetStatus}'. Allowed statuses: ${ORDER_STATUSES.join(', ')}.`
      });
    }

    // Check if order is already in target status
    if (order.status === targetStatus) {
      return res.status(400).json({
        success: false,
        message: `Order is already in '${targetStatus}' status.`
      });
    }

    // Check if order is already in a terminal state
    if (TERMINAL_STATUSES.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order is already in terminal state '${order.status}' and cannot be modified.`
      });
    }

    const isBuyer = order.buyer.toString() === req.user._id.toString();
    const isFarmer = order.farmer.toString() === req.user._id.toString();

    // Verify actor authorization per transition rule
    if (targetStatus === 'cancelled') {
      if (order.status === 'pending') {
        // Buyer can cancel their own pending inquiry
        if (!isBuyer) {
          return res.status(403).json({
            success: false,
            message: 'Only the buyer who placed this inquiry can cancel it.'
          });
        }
      } else if (order.status === 'accepted') {
        // Farmer can cancel an accepted order before dispatch (e.g. crop failure)
        if (!isFarmer) {
          return res.status(403).json({
            success: false,
            message: 'Only the assigned farmer can cancel an accepted order before dispatch.'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: `Order cannot be cancelled once it has progressed to '${order.status}'.`
        });
      }
    } else {
      // Phase 7A: Delivery reception confirmation can be submitted by assigned farmer or buyer
      const isAuthorizedToUpdate =
        isFarmer || (targetStatus === 'delivered' && isBuyer);

      if (!isAuthorizedToUpdate) {
        return res.status(403).json({
          success: false,
          message:
            targetStatus === 'delivered'
              ? 'Only the assigned farmer or receiving buyer can mark this order as delivered.'
              : `Only the assigned farmer can update this order to '${targetStatus}'.`
        });
      }

      // Check strict valid transition from current state (no skipping stages)
      const allowedNext = VALID_TRANSITIONS[order.status] || [];
      if (!allowedNext.includes(targetStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from '${order.status}' to '${targetStatus}'. Allowed next status: ${
            allowedNext.length > 0 ? allowedNext.join(', ') : 'none'
          }.`
        });
      }

      // Phase 6E: Order confirmation/dispatch depends on verified payment for Razorpay orders
      if (
        order.paymentMethod === 'Razorpay' &&
        ['ready_for_dispatch', 'shipped', 'out_for_delivery', 'delivered'].includes(targetStatus) &&
        order.paymentStatus !== 'paid'
      ) {
        return res.status(400).json({
          success: false,
          message: `Cannot advance order to '${targetStatus}': Online Razorpay payment has not been verified yet (current status: ${order.paymentStatus}). Payment must be settled before dispatch.`
        });
      }
    }

    // Phase 6E: Review cancellation rules for paid and unpaid orders
    let targetPaymentStatus = order.paymentStatus;
    if (targetStatus === 'cancelled' && order.paymentStatus === 'paid') {
      targetPaymentStatus = 'refund_pending';
    }

    // Phase 7A: Farmer Fulfilment Details & Honest Manual Settlement Tracking
    const updatedFulfilment = { ...(order.fulfilment?.toObject ? order.fulfilment.toObject() : order.fulfilment || {}) };

    if (targetStatus === 'shipped') {
      updatedFulfilment.dispatchedAt = new Date();
      if (req.body.transporterName) updatedFulfilment.transporterName = String(req.body.transporterName).trim();
      if (req.body.vehicleNumber) updatedFulfilment.vehicleNumber = String(req.body.vehicleNumber).trim();
      if (req.body.dispatchNote) updatedFulfilment.dispatchNote = String(req.body.dispatchNote).trim();
    }

    if (targetStatus === 'delivered') {
      updatedFulfilment.deliveredAt = new Date();
      if (req.body.receivedBy) updatedFulfilment.receivedBy = String(req.body.receivedBy).trim();
      else if (isBuyer) updatedFulfilment.receivedBy = req.user.name;
      if (req.body.deliveryConfirmationNote) updatedFulfilment.deliveryConfirmationNote = String(req.body.deliveryConfirmationNote).trim();
    }

    // Manual Direct Mandi / Bank Settlement confirmation (Farmer only)
    if (
      order.paymentMethod === 'Direct Mandi / Bank Settlement' &&
      req.body.confirmSettlement === true &&
      isFarmer
    ) {
      targetPaymentStatus = 'paid';
      updatedFulfilment.settlementConfirmedBy = req.user._id;
      updatedFulfilment.settlementConfirmedAt = new Date();
      updatedFulfilment.settlementNote = (req.body.settlementNote || note || 'Direct mandi settlement confirmed by producer').trim();
    }

    // ATOMIC STOCK CONSISTENCY MANAGEMENT
    let stockDeductedInThisStep = false;

    // 1. When an order is accepted by the farmer: reserve/deduct stock atomically
    if (targetStatus === 'accepted') {
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

      if (!updatedProduct) {
        const currentProd = await Product.findById(order.product).select('quantity unit');
        const available = currentProd ? currentProd.quantity : 0;
        const unit = currentProd ? currentProd.unit : order.unit;
        return res.status(400).json({
          success: false,
          message: `Cannot accept order: requested quantity (${order.requestedQuantity} ${order.unit}) exceeds currently available listing stock (${available} ${unit}).`
        });
      }

      // If available quantity drops to 0, mark listing unavailable
      if (updatedProduct.quantity === 0) {
        await Product.updateOne({ _id: updatedProduct._id }, { status: 'unavailable' });
      }

      stockDeductedInThisStep = true;
    }

    // 2. If an order with deducted stock is cancelled or rejected: restore stock cleanly
    if (order.isStockDeducted && (targetStatus === 'cancelled' || targetStatus === 'rejected')) {
      await Product.findOneAndUpdate(
        { _id: order.product },
        {
          $inc: { quantity: order.requestedQuantity },
          $set: { status: 'active' }
        }
      );
    }

    const finalNote = (note || statusNote || '').trim();
    const finalIsStockDeducted = stockDeductedInThisStep
      ? true
      : targetStatus === 'cancelled' || targetStatus === 'rejected'
      ? false
      : Boolean(order.isStockDeducted);

    // Perform atomic conditional update to prevent concurrent duplicate updates
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: order.status
      },
      {
        $set: {
          status: targetStatus,
          paymentStatus: targetPaymentStatus,
          fulfilment: updatedFulfilment,
          isStockDeducted: finalIsStockDeducted,
          ...(finalNote ? { statusNote: finalNote } : {})
        },
        $push: {
          statusHistory: {
            status: targetStatus,
            changedBy: req.user._id,
            changedAt: new Date(),
            note: finalNote
          }
        }
      },
      { returnDocument: 'after' }
    );

    if (!updatedOrder) {
      // Rollback deducted stock if order status update conflicted concurrently
      if (stockDeductedInThisStep) {
        await Product.updateOne(
          { _id: order.product },
          { $inc: { quantity: order.requestedQuantity } }
        );
      }
      return res.status(409).json({
        success: false,
        message: 'Order status was modified concurrently by another process. Please reload and try again.'
      });
    }

    const populated = await Order.findById(updatedOrder._id)
      .populate('product', 'name price unit currency location images status')
      .populate('buyer', 'name role email phone')
      .populate('farmer', 'name role email phone')
      .select('-__v')
      .lean();

    // Asynchronously dispatch idempotent notification based on transitioned status
    try {
      const orderShortId = updatedOrder.orderNumber || updatedOrder._id.toString().slice(-6);
      const prodTitle = populated?.product?.title || populated?.product?.name || 'produce';

      if (['accepted', 'confirmed'].includes(targetStatus)) {
        notificationService.createNotification({
          recipient: updatedOrder.buyer,
          type: 'order',
          title: 'Order Confirmed',
          message: `The farmer has confirmed your order #${orderShortId} for ${prodTitle}.`,
          entityId: updatedOrder._id,
          entityType: 'Order',
          link: '/buyer/orders',
          idempotencyKey: `order:confirmed:${updatedOrder._id}`
        }).catch((e) => console.warn('[Notify Order Warn]:', e.message));
      } else if (targetStatus === 'ready_for_dispatch') {
        notificationService.createNotification({
          recipient: updatedOrder.buyer,
          type: 'order',
          title: 'Order Prepared for Dispatch',
          message: `Your order #${orderShortId} is packed and ready for dispatch.`,
          entityId: updatedOrder._id,
          entityType: 'Order',
          link: '/buyer/orders',
          idempotencyKey: `order:ready_for_dispatch:${updatedOrder._id}`
        }).catch((e) => console.warn('[Notify Order Warn]:', e.message));
      } else if (targetStatus === 'shipped') {
        const transInfo = updatedFulfilment.transporterName ? ` via ${updatedFulfilment.transporterName}` : '';
        notificationService.createNotification({
          recipient: updatedOrder.buyer,
          type: 'order',
          title: 'Order Dispatched',
          message: `Your order #${orderShortId} has been dispatched${transInfo}.`,
          entityId: updatedOrder._id,
          entityType: 'Order',
          link: '/buyer/orders',
          idempotencyKey: `order:shipped:${updatedOrder._id}`
        }).catch((e) => console.warn('[Notify Order Warn]:', e.message));
      } else if (targetStatus === 'out_for_delivery') {
        notificationService.createNotification({
          recipient: updatedOrder.buyer,
          type: 'order',
          title: 'Out for Delivery',
          message: `Your order #${orderShortId} is out for delivery.`,
          entityId: updatedOrder._id,
          entityType: 'Order',
          link: '/buyer/orders',
          idempotencyKey: `order:out_for_delivery:${updatedOrder._id}`
        }).catch((e) => console.warn('[Notify Order Warn]:', e.message));
      } else if (targetStatus === 'delivered') {
        // If buyer marked delivered, notify farmer; if farmer marked delivered, notify buyer
        const notifyRecipient = isBuyer ? updatedOrder.farmer : updatedOrder.buyer;
        const recipientLink = isBuyer ? '/farmer/orders' : '/buyer/orders';
        notificationService.createNotification({
          recipient: notifyRecipient,
          type: 'order',
          title: 'Order Delivered',
          message: `Order #${orderShortId} has been marked as delivered.`,
          entityId: updatedOrder._id,
          entityType: 'Order',
          link: recipientLink,
          idempotencyKey: `order:delivered:${updatedOrder._id}`
        }).catch((e) => console.warn('[Notify Order Warn]:', e.message));
      } else if (targetStatus === 'cancelled') {
        const notifyRecipient = isBuyer ? updatedOrder.farmer : updatedOrder.buyer;
        const recipientLink = isBuyer ? '/farmer/orders' : '/buyer/orders';
        const actorName = isBuyer ? 'buyer' : 'farmer';
        notificationService.createNotification({
          recipient: notifyRecipient,
          type: 'order',
          title: 'Order Cancelled',
          message: `Order #${orderShortId} was cancelled by the ${actorName}.`,
          entityId: updatedOrder._id,
          entityType: 'Order',
          link: recipientLink,
          idempotencyKey: `order:cancelled:${updatedOrder._id}`
        }).catch((e) => console.warn('[Notify Order Warn]:', e.message));
      }
    } catch (notifErr) {
      console.warn('[Order Notification Trigger Error]:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Order status transitioned to '${targetStatus}'.`,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:id/track
 * Protected tracking timeline endpoint for buyer and assigned farmer
 */
const getOrderTracking = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format.'
      });
    }

    const order = await Order.findById(id)
      .populate('product', 'name price unit currency location images status')
      .populate('buyer', 'name role email phone')
      .populate('farmer', 'name role email phone allowDirectCalls')
      .select('-__v')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Authorization: only the buyer or assigned farmer may view tracking
    const isBuyer = order.buyer?._id?.toString() === req.user._id.toString();
    const isFarmer = order.farmer?._id?.toString() === req.user._id.toString();

    if (!isBuyer && !isFarmer) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view tracking for this order.'
      });
    }


    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrderTracking,
  updateOrderStatus
};

