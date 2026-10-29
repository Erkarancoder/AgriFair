import api from './api';

export const negotiationService = {
  /**
   * Propose a new price offer on a product inside a conversation
   */
  async createOffer(data) {
    const response = await api.post('/negotiations', data);
    return response.data; // { success: true, message, data: { offer, message } }
  },

  /**
   * Counter an existing offer with new price and/or quantity
   */
  async counterOffer(offerId, data) {
    const response = await api.post(`/negotiations/${offerId}/counter`, data);
    return response.data; // { success: true, message, data: { offer, message } }
  },

  /**
   * Accept an offer -> creates or advances the Order
   */
  async acceptOffer(offerId) {
    const response = await api.post(`/negotiations/${offerId}/accept`);
    return response.data; // { success: true, message, data: { offer, order, message } }
  },

  /**
   * Reject an offer
   */
  async rejectOffer(offerId, reason = '') {
    const response = await api.post(`/negotiations/${offerId}/reject`, { reason });
    return response.data; // { success: true, message, data: offer }
  }
};

export default negotiationService;
