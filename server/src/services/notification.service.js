const Notification = require('../models/Notification');
const { getIO } = require('../socket');
const { isEmailConfigured, sendTransactionalEmail } = require('./email.service');
const config = require('../config/env');

/**
 * Returns the operational status of all communication channels
 */
const getChannelsStatus = () => {
  const hasSmtp = isEmailConfigured();
  const hasFast2sms = Boolean(config.fast2smsApiKey && config.fast2smsApiKey.trim());

  return {
    inApp: {
      configured: true,
      persisted: true,
      realTime: true,
      status: 'active'
    },
    email: {
      configured: hasSmtp,
      provider: hasSmtp ? 'smtp' : 'none',
      status: hasSmtp ? 'active' : 'blocked_unconfigured',
      note: hasSmtp
        ? 'Transactional email notifications enabled via SMTP.'
        : 'SMTP credentials not configured in server environment. Email dispatch is blocked.'
    },
    sms: {
      configured: hasFast2sms,
      provider: hasFast2sms ? 'fast2sms' : 'none',
      status: hasFast2sms ? 'active_otp' : 'unconfigured',
      note: hasFast2sms
        ? 'Fast2SMS key configured for security OTP.'
        : 'SMS provider key not configured.'
    }
  };
};

/**
 * Creates an in-app notification idempotently, pushes via Socket.IO,
 * and queues transactional email if SMTP is configured.
 */
const createNotification = async ({
  recipient,
  type = 'order',
  title,
  message,
  entityId = null,
  entityType = null,
  link = '',
  idempotencyKey = null,
  emailData = null
}) => {
  if (!recipient || !title || !message) {
    throw new Error('Recipient, title, and message are required for notification');
  }

  // 1. Idempotency Check: prevent duplicate notifications
  if (idempotencyKey) {
    const existing = await Notification.findOne({
      recipient,
      idempotencyKey
    });
    if (existing) {
      return {
        existing: true,
        notification: existing
      };
    }
  }

  // 2. Persist in database
  let notification;
  try {
    notification = await Notification.create({
      recipient,
      type,
      title: title.slice(0, 120),
      message: message.slice(0, 500),
      entityId,
      entityType,
      link,
      idempotencyKey
    });
  } catch (err) {
    // Handle race condition duplicate key error safely
    if (err.code === 11000 && idempotencyKey) {
      const existing = await Notification.findOne({ recipient, idempotencyKey });
      if (existing) {
        return { existing: true, notification: existing };
      }
    }
    throw err;
  }

  // 3. Real-time push via Socket.IO
  try {
    const io = getIO();
    if (io) {
      io.to(`user:${recipient.toString()}`).emit('notification:new', notification);
    }
  } catch (socketErr) {
    console.warn('[Notification Socket Warn]:', socketErr.message);
  }

  // 4. Transactional email if SMTP is configured
  let emailDeliveryResult = null;
  if (emailData && emailData.to) {
    try {
      emailDeliveryResult = await sendTransactionalEmail({
        to: emailData.to,
        subject: emailData.subject || title,
        title,
        message,
        actionUrl: emailData.actionUrl || (link ? `${config.clientUrl}${link}` : undefined),
        actionText: emailData.actionText || 'View in AgriFair'
      });
    } catch (emailErr) {
      console.warn('[Notification Email Warn]:', emailErr.message);
      emailDeliveryResult = { delivered: false, error: emailErr.message };
    }
  }

  return {
    success: true,
    existing: false,
    notification,
    emailResult: emailDeliveryResult
  };
};

/**
 * Retrieves paginated notifications for an authenticated user
 */
const getUserNotifications = async (userId, options = {}) => {
  const page = Math.max(parseInt(options.page || 1, 10), 1);
  const limit = Math.min(Math.max(parseInt(options.limit || 20, 10), 1), 50);
  const skip = (page - 1) * limit;

  const query = { recipient: userId };
  if (options.unreadOnly === true || options.unreadOnly === 'true') {
    query.isRead = false;
  }
  if (options.type && typeof options.type === 'string') {
    query.type = options.type;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: userId, isRead: false })
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    unreadCount
  };
};

/**
 * Counts unread notifications for a user
 */
const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ recipient: userId, isRead: false });
};

/**
 * Marks a single notification as read with ownership verification
 */
const markNotificationAsRead = async (notificationId, userId) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  if (notification.recipient.toString() !== userId.toString()) {
    const error = new Error('Unauthorized to modify this notification');
    error.statusCode = 403;
    throw error;
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
};

/**
 * Marks all unread notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return {
    modifiedCount: result.modifiedCount || 0
  };
};

module.exports = {
  getChannelsStatus,
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead
};
