const axios = require('axios');
const config = require('../config/env');

/**
 * Send SMS OTP using Fast2SMS API with graceful fallback
 */
const sendSMSOTP = async ({ phone, otp, purpose = 'registration_verification' }) => {
  if (!phone) {
    return { delivered: false, reason: 'No phone number provided' };
  }

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  if (cleanPhone.length !== 10) {
    return { delivered: false, reason: 'Invalid 10-digit mobile number' };
  }

  if (!config.fast2smsApiKey) {
    if (config.nodeEnv !== 'production') {
      console.log(`[SMS Service] Fast2SMS key not set. Local OTP for ${cleanPhone}: ${otp}`);
    }
    return { delivered: false, provider: 'dev_console' };
  }

  try {
    // Attempt Fast2SMS Quick SMS / OTP
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'q',
        message: `Your AgriFair security verification code is: ${otp}. Valid for 10 minutes.`,
        numbers: cleanPhone
      },
      {
        headers: {
          authorization: config.fast2smsApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 8000
      }
    );

    if (response.data && response.data.return === true) {
      console.log(`[SMS Service] Real SMS OTP delivered to +91 ${cleanPhone} via Fast2SMS.`);
      return { delivered: true, provider: 'fast2sms', data: response.data };
    } else {
      console.log(`[SMS Service] Fast2SMS notice: ${response.data?.message || 'Check Fast2SMS balance/DLT'}`);
      return { delivered: false, provider: 'fast2sms', data: response.data };
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.log(`[SMS Service Notice] Fast2SMS response: ${errorMsg}`);
    return { delivered: false, provider: 'fast2sms', error: errorMsg };
  }
};

module.exports = {
  sendSMSOTP
};
