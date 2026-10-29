import api from './api';

export const mandiService = {
  /**
   * Fetch real database-backed location and mandi suggestions
   * @param {string} query
   * @param {AbortSignal} [signal]
   */
  async getSuggestions(query = '', signal) {
    if (!query || query.trim().length < 2) {
      return { success: true, count: 0, suggestions: [] };
    }
    const response = await api.get('/mandi-rates/suggestions', {
      params: { q: query.trim() },
      signal
    });
    return response.data; // { success: true, count, suggestions: [...] }
  },

  /**
   * Search mandis by query (city, district, state, mandi name, crop name)
   * @param {string} query
   * @param {Object} filters { state, district, market, commodity, date, verified }
   */
  async searchMandis(query = '', filters = {}) {
    const params = {};
    if (query && query.trim()) {
      params.q = query.trim();
    }
    if (filters.state) {
      params.state = filters.state;
    }
    if (filters.district) {
      params.district = filters.district;
    }
    if (filters.market) {
      params.market = filters.market;
    }
    if (filters.commodity) {
      params.commodity = filters.commodity;
    }
    if (filters.date) {
      params.date = filters.date;
    }
    if (filters.verified !== undefined && filters.verified !== 'all') {
      params.verified = String(filters.verified);
    }

    const response = await api.get('/mandi-rates/search', { params });
    return response.data; // { success: true, count, locations, data: [...] }
  },

  /**
   * Fetch available filter options (states, districts, markets, commodities, dates)
   * @param {Object} params { state, district }
   */
  async getFilterOptions(params = {}) {
    const response = await api.get('/mandi-rates/filter-options', { params });
    return response.data; // { success: true, data: { states, districts, markets, commodities, dates } }
  },

  /**
   * Get official sync & data provenance status
   */
  async getSyncStatus() {
    const response = await api.get('/mandi-rates/sync/status');
    return response.data; // { success: true, data: { isConfigured, counts, ... } }
  },

  /**
   * Trigger bounded sync from data.gov.in AGMARKNET
   */
  async triggerSync(options = {}) {
    const response = await api.post('/mandi-rates/sync', options);
    return response.data;
  },

  /**
   * Get popular / trending mandis
   */
  async getPopularMandis() {
    const response = await api.get('/mandi-rates/popular');
    return response.data; // { success: true, count, data: [...] }
  },

  /**
   * Get single mandi rate card by ID
   * @param {string} id
   */
  async getMandiById(id) {
    const response = await api.get(`/mandi-rates/${encodeURIComponent(id)}`);
    return response.data; // { success: true, data: mandi }
  }
};

export default mandiService;
