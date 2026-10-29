import api from './api';

let scriptPromise = null;

/**
 * Dynamically loads the official Razorpay Checkout SDK script
 */
export const loadRazorpayScript = () => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error('Failed to load Razorpay Checkout script.');
        scriptPromise = null;
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  return scriptPromise;
};

const paymentService = {
  /**
   * Retrieves public gateway status and key ID
   */
  async getConfig() {
    const response = await api.get('/payments/config');
    return response.data?.data;
  },

  /**
   * Initiates payment order on server with verified server-calculated total
   */
  async initiatePayment(orderId) {
    const response = await api.post('/payments/initiate', { orderId });
    return response.data?.data;
  },

  /**
   * Cryptographically verifies payment signature with server
   */
  async verifyPayment({ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const response = await api.post('/payments/verify', {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });
    return response.data;
  },

  /**
   * Initiates a refund for an eligible paid order
   */
  async initiateRefund({ orderId, reason, amount }) {
    const response = await api.post('/payments/refund', {
      orderId,
      reason,
      amount
    });
    return response.data;
  },

  /**
   * Reconciles current payment and refund state with Razorpay API
   */
  async reconcilePayment(orderId) {
    const response = await api.post(`/payments/${orderId}/reconcile`);
    return response.data;
  }
};

export default paymentService;

