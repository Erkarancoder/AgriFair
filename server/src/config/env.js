const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agrifair',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'agrifair_super_secret_jwt_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieMaxAgeDays: parseInt(process.env.COOKIE_MAX_AGE_DAYS || '7', 10),
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: process.env.SMTP_PORT || '587',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  emailFrom: process.env.EMAIL_FROM || '"AgriFair Support" <support@agrifair.local>',
  fast2smsApiKey: process.env.FAST2SMS_API_KEY || '',
  dataGovApiKey: process.env.DATAGOV_API_KEY || '',
  dataGovResourceId:
    process.env.DATAGOV_RESOURCE_ID || '9ef84268-d588-465a-a308-a864a43d0070',
  dataGovBaseUrl: process.env.DATAGOV_BASE_URL || 'https://api.data.gov.in/resource',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    isConfigured: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    )
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    isConfigured: Boolean(
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_KEY_ID !== 'rzp_test_yourKeyIdHere' &&
      process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_secret_here' &&
      !process.env.RAZORPAY_KEY_ID.includes('yourKeyIdHere')
    )
  }
};

module.exports = config;
