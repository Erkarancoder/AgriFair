const express = require('express');
const { getDBStatus } = require('../config/db');
const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const orderRoutes = require('./order.routes');
const mandiRoutes = require('./mandi.routes');
const assistantRoutes = require('./assistant.routes');
const communityRoutes = require('./community.routes');
const conversationRoutes = require('./conversation.routes');
const negotiationRoutes = require('./negotiation.routes');
const paymentRoutes = require('./payment.routes');
const notificationRoutes = require('./notification.routes');
const locationRoutes = require('./location.routes');

const router = express.Router();

// GET /api/health - Reports backend and database health
router.get('/health', (req, res) => {
  const dbStatus = getDBStatus();
  const isDbConnected = dbStatus.stateCode === 1;

  res.status(isDbConnected ? 200 : 503).json({
    success: isDbConnected,
    service: 'AgriFair Backend API',
    uptime: `${process.uptime().toFixed(1)}s`,
    timestamp: new Date().toISOString(),
    database: {
      provider: 'MongoDB',
      ...dbStatus
    }
  });
});

// Authentication routes
router.use('/auth', authRoutes);

// Category routes
router.use('/categories', categoryRoutes);

// Product routes
router.use('/products', productRoutes);

// Order inquiry & request routes
router.use('/orders', orderRoutes);

// Mandi benchmarks & real market price discovery routes
router.use('/mandi-rates', mandiRoutes);

// Intelligent AgriFair AI Assistant
router.use('/assistant', assistantRoutes);

// Farmer & Trader Community Showcase & Registration routes
router.use('/community', communityRoutes);

// Real-Time Chat & Safe Calls routes
router.use('/conversations', conversationRoutes);

// Bargaining & Price Negotiation routes
router.use('/negotiations', negotiationRoutes);

// Real Razorpay Payment Gateway routes
router.use('/payments', paymentRoutes);

// Notifications & Alert Lifecycle routes
router.use('/notifications', notificationRoutes);

// Location & Postal PIN Code routes
router.use('/location', locationRoutes);

// Secure Admin & Operational Operations routes
const adminRoutes = require('./admin.routes');
router.use('/admin', adminRoutes);

module.exports = router;



