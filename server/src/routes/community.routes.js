const express = require('express');
const {
  getCommunityMembers,
  joinCommunity
} = require('../controllers/community.controller');

const router = express.Router();

// GET /api/community/members - Retrieve member showcase & statistics
router.get('/members', getCommunityMembers);

// POST /api/community/join - Join AgriFair community & submit profile
router.post('/join', joinCommunity);

module.exports = router;
