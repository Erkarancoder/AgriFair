const express = require('express');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrderTracking,
  updateOrderStatus
} = require('../controllers/order.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All order endpoints require authentication
router.use(protect);

// 1. Authenticated Buyer: Create purchase inquiry/order request
router.post('/', createOrder);

// 2. Authenticated Buyer / Farmer: Retrieve own orders (registered before /:id)
router.get('/mine', getMyOrders);

// 3. Authenticated Participant: Retrieve single order details
router.get('/:id', getOrderById);

// 4. Authenticated Participant: Retrieve order tracking timeline
router.get('/:id/track', getOrderTracking);

// 5. Authenticated Participant: Transition order status
router.patch('/:id/status', updateOrderStatus);

module.exports = router;
