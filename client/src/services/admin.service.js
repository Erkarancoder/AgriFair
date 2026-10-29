import api from './api';

const adminService = {
  getOverview: async () => {
    const res = await api.get('/admin/overview');
    return res.data;
  },

  getUsers: async (params = {}) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  updateUserStatus: async (id, { status, reason }) => {
    const res = await api.patch(`/admin/users/${id}/status`, { status, reason });
    return res.data;
  },

  getProducts: async (params = {}) => {
    const res = await api.get('/admin/products', { params });
    return res.data;
  },

  moderateProduct: async (id, { action, reason }) => {
    const res = await api.patch(`/admin/products/${id}/moderation`, { action, reason });
    return res.data;
  },

  getOrders: async (params = {}) => {
    const res = await api.get('/admin/orders', { params });
    return res.data;
  },

  getAuditLogs: async (params = {}) => {
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  }
};

export default adminService;
