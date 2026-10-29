import api from './api';

export const communityService = {
  /**
   * Fetch community members with filters and pagination
   */
  async getMembers(params = {}) {
    const response = await api.get('/community/members', { params });
    return response.data;
  },

  /**
   * Join AgriFair community & submit member profile
   */
  async joinCommunity(memberData) {
    const response = await api.post('/community/join', memberData);
    return response.data;
  }
};
