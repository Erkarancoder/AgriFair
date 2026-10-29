import api from './api';

const notificationService = {
  // Fetch paginated notifications for current user
  getNotifications: async (params = {}) => {
    const res = await api.get('/notifications', { params });
    return res.data;
  },

  // Get count of unread notifications
  getUnreadCount: async () => {
    const res = await api.get('/notifications/unread-count');
    return res.data;
  },

  // Get communication channel status
  getChannelsStatus: async () => {
    const res = await api.get('/notifications/channels');
    return res.data;
  },

  // Mark single notification as read
  markAsRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  // Mark all user notifications as read
  markAllAsRead: async () => {
    const res = await api.patch('/notifications/mark-all-read');
    return res.data;
  }
};

export default notificationService;
