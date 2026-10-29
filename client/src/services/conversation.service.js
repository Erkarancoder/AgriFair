import api from './api';

export const conversationService = {
  /**
   * Fetch all active conversations for the authenticated user
   */
  async getConversations() {
    const response = await api.get('/conversations');
    return response.data; // { success: true, count, data: [...] }
  },

  /**
   * Start or retrieve existing conversation for a product
   */
  async getOrCreateConversation(productId) {
    const response = await api.post('/conversations', { productId });
    return response.data; // { success: true, isNew, data: conversation }
  },

  /**
   * Retrieve message history for a conversation
   */
  async getMessages(conversationId) {
    const response = await api.get(`/conversations/${conversationId}/messages`);
    return response.data; // { success: true, count, data: [...] }
  },

  /**
   * Send a message in a conversation
   */
  async sendMessage(conversationId, data) {
    const response = await api.post(`/conversations/${conversationId}/messages`, data);
    return response.data; // { success: true, data: message }
  },

  /**
   * Request a call inside the conversation thread
   */
  async requestCall(conversationId) {
    const response = await api.post(`/conversations/${conversationId}/request-call`);
    return response.data; // { success: true, data: message }
  }
};

export default conversationService;
