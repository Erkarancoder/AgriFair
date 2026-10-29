const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  getChannels,
  markRead,
  markAllRead
} = require('../controllers/notification.controller');

const router = express.Router();

// All notification routes require authenticated session
router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.get('/channels', getChannels);
router.patch('/mark-all-read', markAllRead);
router.patch('/:id/read', markRead);

module.exports = router;
