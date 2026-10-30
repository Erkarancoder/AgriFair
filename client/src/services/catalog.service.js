import api from './api';

export const catalogService = {
  /**
   * Fetch all active categories from MongoDB
   */
  async getCategories() {
    const response = await api.get('/categories');
    return response.data; // { success: true, count, data: [...] }
  },

  /**
   * Fetch a single category by slug from MongoDB
   */
  async getCategoryBySlug(slug) {
    const response = await api.get(`/categories/${encodeURIComponent(slug)}`);
    return response.data; // { success: true, data: {...} }
  },

  /**
   * Fetch products with search, category filter, sorting, and pagination
   */
  async getProducts(params = {}) {
    const cleanParams = {};
    if (params.category && params.category !== 'all') {
      cleanParams.category = params.category;
    }
    if (params.q && params.q.trim()) {
      cleanParams.q = params.q.trim();
    }
    if (params.sort && params.sort !== 'default') {
      cleanParams.sort = params.sort;
    }
    if (params.page) {
      cleanParams.page = params.page;
    }
    if (params.limit) {
      cleanParams.limit = params.limit;
    }

    const response = await api.get('/products', { params: cleanParams });
    return response.data; // { success: true, count, total, totalPages, currentPage, data: [...] }
  },

  /**
   * Fetch a single product by ID
   */
  async getProductById(id) {
    const response = await api.get(`/products/${encodeURIComponent(id)}`);
    return response.data; // { success: true, data: {...} }
  },

  /**
   * Farmer: Fetch only own listings
   */
  async getMyProducts() {
    const response = await api.get('/products/mine');
    return response.data; // { success: true, count, data: [...] }
  },

  /**
   * Farmer: Create a new listing
   */
  async createProduct(productData) {
    const response = await api.post('/products', productData);
    return response.data; // { success: true, message, data: {...} }
  },

  /**
   * Farmer: Update an existing listing
   */
  async updateProduct(id, productData) {
    const response = await api.patch(`/products/${encodeURIComponent(id)}`, productData);
    return response.data; // { success: true, message, data: {...} }
  },

  /**
   * Farmer: Delete an existing listing
   */
  async deleteProduct(id) {
    const response = await api.delete(`/products/${encodeURIComponent(id)}`);
    return response.data; // { success: true, message }
  },

  /**
   * Check whether image storage provider (Cloudinary) is configured on the server
   */
  async getStorageStatus() {
    const response = await api.get('/products/storage-status');
    return response.data; // { success: true, data: { isConfigured, provider, cloudName, maxFileSizeMb } }
  },

  /**
   * Upload a product image file to Cloudinary with real-time upload progress tracking
   * @param {File} file - Browser File object
   * @param {Function} onProgress - Progress callback (percentage)
   */
  async uploadProductImage(file, onProgress = null) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      }
    });

    return response.data; // { success: true, message, data: { url, publicId, format, bytes } }
  },

  /**
   * Attach an image directly to an existing product
   */
  async attachProductImage(productId, file, onProgress = null) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post(
      `/products/${encodeURIComponent(productId)}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      }
    );

    return response.data;
  },

  /**
   * Remove an image from an existing product and delete from Cloudinary
   */
  async removeProductImage(productId, publicId) {
    const response = await api.delete(
      `/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(publicId)}`
    );
    return response.data;
  },

  /**
   * Auto-fetch State, District, and Village list by 6-digit Indian PIN Code
   */
  async lookupPincode(pincode) {
    const response = await api.get(`/location/pincode/${encodeURIComponent(pincode)}`);
    return response.data;
  }
};

export default catalogService;
