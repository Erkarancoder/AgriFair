const express = require('express');
const { handleChatMessage } = require('../controllers/assistant.controller');

const router = express.Router();

// POST /api/assistant/chat - Send query to AgriFair Assistant
router.post('/chat', handleChatMessage);

module.exports = router;
