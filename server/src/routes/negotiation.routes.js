const express = require('express');
const {
  createOffer,
  counterOffer,
  acceptOffer,
  rejectOffer
} = require('../controllers/negotiation.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All negotiation endpoints require authentication
router.use(protect);

// 1. Propose initial price offer for a conversation (buyer or farmer)
router.post('/', createOffer);

// 2. Counter an active offer
router.post('/:id/counter', counterOffer);

// 3. Explicitly accept an offer -> creates/advances Order
router.post('/:id/accept', acceptOffer);

// 4. Reject an offer
router.post('/:id/reject', rejectOffer);

module.exports = router;
