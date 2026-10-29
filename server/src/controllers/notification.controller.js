const notificationService = require('../services/notification.service');

/**
 * GET /api/notifications
 * Retrieves notifications for the logged-in user
 */
const getNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getUserNotifications(req.user._id, req.query);
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/unread-count
 * Returns unread notification count for the authenticated user
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    return res.status(200).json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/channels
 * Returns status report of all notification channels (in-app, email, SMS)
 */
const getChannels = async (req, res, next) => {
  try {
    const status = notificationService.getChannelsStatus();
    return res.status(200).json({
      success: true,
      channels: status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Marks a specific notification as read (with authorization check)
 */
const markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markNotificationAsRead(
      req.params.id,
      req.user._id
    );
    return res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/mark-all-read
 * Marks all notifications as read for current user
 */
const markAllRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  getChannels,
  markRead,
  markAllRead
};
