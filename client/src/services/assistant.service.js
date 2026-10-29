import api from './api';

export const assistantService = {
  /**
   * Send a query to the AgriFair AI Assistant
   * @param {string} message
   * @param {object} [userContext]
   * @returns {Promise<{ reply: string, suggestions: string[], timestamp: string }>}
   */
  async sendMessage(message, userContext = null) {
    const response = await api.post('/assistant/chat', {
      message,
      userContext
    });
    return response.data?.data;
  }
};

export default assistantService;
