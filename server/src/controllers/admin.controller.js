const mongoose = require('mongoose');
const User = require('../models/User');
const { Product } = require('../models/Product');
const { Order } = require('../models/Order');
const AuditLog = require('../models/AuditLog');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET /api/admin/overview
 * Real database counts for operational visibility without fabricated analytics
 */
const getOverview = async (req, res, next) => {
  try {
    const [
      totalUsers,
      farmersCount,
      wholesalersCount,
      retailersCount,
      buyersCount,
      suspendedUsersCount,
      totalProducts,
      activeProductsCount,
      suspendedProductsCount,
      unavailableProductsCount,
      totalOrders,
      pendingOrdersCount,
      acceptedOrdersCount,
      shippedOrdersCount,
      deliveredOrdersCount,
      cancelledOrdersCount,
      paidPaymentsCount,
      pendingPaymentsCount,
      failedPaymentsCount,
      refundPendingCount,
      refundedCount,
      recentAuditLogs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'wholesaler' }),
      User.countDocuments({ role: 'retailer' }),
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ status: 'suspended' }),
      Product.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ status: 'suspended' }),
      Product.countDocuments({ status: 'unavailable' }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'accepted' }),
      Order.countDocuments({ status: 'shipped' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.countDocuments({ paymentStatus: 'paid' }),
      Order.countDocuments({ paymentStatus: 'payment_pending' }),
      Order.countDocuments({ paymentStatus: { $in: ['payment_failed', 'failed'] } }),
      Order.countDocuments({ paymentStatus: 'refund_pending' }),
      Order.countDocuments({ paymentStatus: 'refunded' }),
      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .lean()
    ]);

    const unresolvedIssuesCount = failedPaymentsCount + refundPendingCount;

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          farmers: farmersCount,
          wholesalers: wholesalersCount,
          retailers: retailersCount,
          buyers: buyersCount,
          suspended: suspendedUsersCount
        },
        products: {
          total: totalProducts,
          active: activeProductsCount,
          suspended: suspendedProductsCount,
          unavailable: unavailableProductsCount
        },
        orders: {
          total: totalOrders,
          pending: pendingOrdersCount,
          accepted: acceptedOrdersCount,
          shipped: shippedOrdersCount,
          delivered: deliveredOrdersCount,
          cancelled: cancelledOrdersCount
        },
        payments: {
          paid: paidPaymentsCount,
          pending: pendingPaymentsCount,
          failed: failedPaymentsCount,
          refundPending: refundPendingCount,
          refunded: refundedCount
        },
        unresolvedIssuesCount,
        recentAuditLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users
 * Paginated and searchable users list with strictly safe field projection
 */
const getUsers = async (req, res, next) => {
  try {
    const { q, role, status, page = 1, limit = 15 } = req.query;

    const query = {};

    if (q && typeof q === 'string' && q.trim()) {
      const safeRegex = new RegExp(escapeRegex(q.trim()), 'i');
      query.$or = [{ name: safeRegex }, { email: safeRegex }, { phone: safeRegex }];
    }

    if (role && typeof role === 'string' && role !== 'all') {
      query.role = role.trim();
    }

    if (status && typeof status === 'string' && status !== 'all') {
      query.status = status.trim();
    }

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (parsedPage - 1) * parsedLimit;

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('_id name email role phone status isEmailVerified allowDirectCalls createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit)
      },
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * Administrative suspension or reactivation of a user with audit log
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Allowed: 'active', 'suspended'."
      });
    }

    // Protection rule: Admin cannot suspend their own session
    if (req.user._id.toString() === id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot suspend their own active administrative account.'
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const previousStatus = targetUser.status;
    targetUser.status = status;
    await targetUser.save();

    // Audit trail creation
    await AuditLog.create({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'user_status_update',
      targetType: 'User',
      targetId: targetUser._id.toString(),
      details: {
        targetUserEmail: targetUser.email,
        targetUserRole: targetUser.role,
        previousStatus,
        newStatus: status,
        reason: reason || 'Administrative status change'
      },
      ip: req.ip || req.headers?.['x-forwarded-for'] || ''
    });

    return res.status(200).json({
      success: true,
      message: `User status transitioned from '${previousStatus}' to '${status}'.`,
      data: targetUser.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/products
 * Operational listings overview with moderation state and search
 */
const getProducts = async (req, res, next) => {
  try {
    const { q, status, category, page = 1, limit = 15 } = req.query;

    const query = {};

    if (q && typeof q === 'string' && q.trim()) {
      const safeRegex = new RegExp(escapeRegex(q.trim()), 'i');
      query.name = safeRegex;
    }

    if (status && typeof status === 'string' && status !== 'all') {
      query.status = status.trim();
    }

    if (category && typeof category === 'string' && category !== 'all') {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      }
    }

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (parsedPage - 1) * parsedLimit;

    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .populate('owner', 'name email role phone')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit)
      },
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/products/:id/moderation
 * Reversible moderation of a product (suspend or reinstate) with mandatory reason
 */
const moderateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format.' });
    }

    if (!['suspend', 'reinstate'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Allowed: 'suspend', 'reinstate'."
      });
    }

    const cleanReason = (reason || '').trim();
    if (!cleanReason || cleanReason.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A detailed moderation reason is required (minimum 5 characters).'
      });
    }

    const product = await Product.findById(id).populate('owner', 'name email');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product listing not found.' });
    }

    const previousStatus = product.status;
    const newStatus = action === 'suspend' ? 'suspended' : 'active';
    const moderationState = action === 'suspend' ? 'suspended' : 'approved';

    product.status = newStatus;
    product.moderation = {
      status: moderationState,
      reason: cleanReason,
      moderatedBy: req.user._id,
      moderatedAt: new Date()
    };

    await product.save();

    // Audit trail creation
    await AuditLog.create({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: `product_${action}`,
      targetType: 'Product',
      targetId: product._id.toString(),
      details: {
        productTitle: product.name,
        producerEmail: product.owner?.email,
        previousStatus,
        newStatus,
        moderationReason: cleanReason
      },
      ip: req.ip || req.headers?.['x-forwarded-for'] || ''
    });

    return res.status(200).json({
      success: true,
      message: `Product listing '${product.name}' transitioned to '${newStatus}'.`,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/orders
 * Operational visibility into marketplace orders, settlement and fulfilment
 */
const getOrders = async (req, res, next) => {
  try {
    const { q, status, paymentStatus, paymentMethod, page = 1, limit = 15 } = req.query;

    const query = {};

    if (q && typeof q === 'string' && q.trim()) {
      const cleanQ = q.trim();
      const safeRegex = new RegExp(escapeRegex(cleanQ), 'i');
      query.$or = [
        { orderNumber: safeRegex },
        { buyerMessage: safeRegex },
        { statusNote: safeRegex }
      ];
    }

    if (status && typeof status === 'string' && status !== 'all') {
      query.status = status.trim();
    }

    if (paymentStatus && typeof paymentStatus === 'string' && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus.trim();
    }

    if (paymentMethod && typeof paymentMethod === 'string' && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod.trim();
    }

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (parsedPage - 1) * parsedLimit;

    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .populate('buyer', 'name email role phone')
        .populate('farmer', 'name email role phone')
        .populate('product', 'name price unit currency location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .select('-processedWebhooks') // Exclude raw webhook payloads to prevent secret leakage
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit)
      },
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/audit-logs
 * Chronological immutable audit trail of administrative modifications
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { targetType, action, page = 1, limit = 20 } = req.query;

    const query = {};

    if (targetType && typeof targetType === 'string' && targetType !== 'all') {
      query.targetType = targetType.trim();
    }

    if (action && typeof action === 'string' && action !== 'all') {
      query.action = action.trim();
    }

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (parsedPage - 1) * parsedLimit;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('actor', 'name role')
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit)
      },
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getUsers,
  updateUserStatus,
  getProducts,
  moderateProduct,
  getOrders,
  getAuditLogs
};
