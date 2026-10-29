import api from './api';

export const orderService = {
  /**
   * Buyer: Submit purchase inquiry/order request
   * @param {Object} orderData { productId, quantity, unit, buyerMessage }
   */
  async createOrder(orderData) {
    const response = await api.post('/orders', orderData);
    return response.data; // { success: true, message, data: populatedOrder }
  },

  /**
   * Fetch authenticated user's orders (buyer or farmer)
   * @param {Object} params { status, role, page, limit }
   */
  async getMyOrders(params = {}) {
    const cleanParams = {};
    if (params.status && params.status !== 'all') {
      cleanParams.status = params.status;
    }
    if (params.role) {
      cleanParams.role = params.role;
    }
    if (params.page) {
      cleanParams.page = params.page;
    }
    if (params.limit) {
      cleanParams.limit = params.limit;
    }

    const response = await api.get('/orders/mine', { params: cleanParams });
    return response.data; // { success: true, count, total, totalPages, currentPage, data: [...] }
  },

  /**
   * Fetch single order by ID
   * @param {string} id
   */
  async getOrderById(id) {
    const response = await api.get(`/orders/${encodeURIComponent(id)}`);
    return response.data; // { success: true, data: order }
  },

  /**
   * Fetch real order tracking timeline by ID
   * @param {string} id
   */
  async getOrderTracking(id) {
    const response = await api.get(`/orders/${encodeURIComponent(id)}/track`);
    return response.data; // { success: true, data: order }
  },

  /**
   * Update order status (accept, reject, cancel)
   * @param {string} id
   * @param {Object} statusData { status, note }
   */
  async updateOrderStatus(id, statusData) {
    const response = await api.patch(`/orders/${encodeURIComponent(id)}/status`, statusData);
    return response.data; // { success: true, message, data: populatedOrder }
  }
};

export default orderService;
