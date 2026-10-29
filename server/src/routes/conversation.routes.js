const express = require('express');
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  requestCall
} = require('../controllers/conversation.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All conversation endpoints require authentication
router.use(protect);

// 1. Get all conversations for current user
router.get('/', getConversations);

// 2. Start or retrieve existing conversation for a product
router.post('/', getOrCreateConversation);

// 3. Get message history for a conversation
router.get('/:id/messages', getMessages);

// 4. Send real-time message
router.post('/:id/messages', sendMessage);

// 5. Safe call request within conversation
router.post('/:id/request-call', requestCall);

module.exports = router;
