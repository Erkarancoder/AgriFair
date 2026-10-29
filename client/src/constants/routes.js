export const ROUTES = {
  HOME: '/',
  MARKETPLACE: '/marketplace',
  CATEGORIES: '/categories',
  HOW_IT_WORKS: '/how-it-works',
  BENEFITS: '#benefits',
  ROLES: '/roles',
  ABOUT: '/about',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_OTP: '/verify-otp',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  PROFILE: '/profile',
  FARMER_LISTINGS: '/farmer/listings',
  FARMER_SELL: '/farmer/sell',
  FARMER_ORDERS: '/farmer/orders',
  BUYER_ORDERS: '/buyer/orders',
  CONVERSATIONS: '/conversations',
  ADMIN: '/admin'
};


export const categoryPath = (slug) => `/categories/${slug}`;
export const rolePath = (slug) => `/roles/${slug}`;
export const productDetailPath = (id) => `/marketplace/${id}`;

export default ROUTES;
