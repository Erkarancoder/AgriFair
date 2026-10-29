const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const { adminMutationLimiter } = require('../middleware/rateLimiter');
const {
  getOverview,
  getUsers,
  updateUserStatus,
  getProducts,
  moderateProduct,
  getOrders,
  getAuditLogs
} = require('../controllers/admin.controller');

const router = express.Router();

// Strict security: All admin routes require valid authenticated session with admin role
router.use(protect);
router.use(restrictTo('admin'));

// Operational Overview
router.get('/overview', getOverview);

// User Management & Moderation
router.get('/users', getUsers);
router.patch('/users/:id/status', adminMutationLimiter, updateUserStatus);

// Product Listings & Moderation
router.get('/products', getProducts);
router.patch('/products/:id/moderation', adminMutationLimiter, moderateProduct);

// Marketplace Orders & Settlement Visibility
router.get('/orders', getOrders);

// Audit Trail Logs
router.get('/audit-logs', getAuditLogs);

module.exports = router;
