import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor to extract clean error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = new Error(
      error.response?.data?.message || error.message || 'An unexpected error occurred'
    );
    customError.status = error.response?.status;
    customError.data = error.response?.data;
    return Promise.reject(customError);
  }
);

export default api;
