const nodemailer = require('nodemailer');
const config = require('../config/env');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (config.smtpHost && config.smtpUser && config.smtpPass) {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: Number(config.smtpPort) || 587,
      secure: Number(config.smtpPort) === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      }
    });
  }
  return transporter;
};

const sendOTPEmail = async ({ to, otp, purpose }) => {
  const mailTransporter = getTransporter();

  const purposeLabels = {
    registration_verification: 'Verify your AgriFair Account',
    password_reset: 'Reset your AgriFair Password',
    login_otp: 'AgriFair Login Verification Code'
  };

  const subject = purposeLabels[purpose] || 'AgriFair Verification Code';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 12px; background-color: #faf9f5;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #164e3b; margin: 0; font-size: 26px;">AgriFair</h1>
        <p style="color: #57534e; font-size: 14px; margin-top: 4px;">Fair Trade, Transparent Agricultural Marketplace</p>
      </div>
      <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e7e5e4;">
        <h2 style="color: #1c1917; font-size: 18px; margin-top: 0;">${subject}</h2>
        <p style="color: #44403c; font-size: 14px; line-height: 1.5;">
          Use the following single-use verification code to complete your request. This code is valid for 10 minutes.
        </p>
      <div style="text-align: center; margin: 30px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #164e3b; background-color: #ecfdf5; padding: 12px 28px; border-radius: 8px; border: 1px dashed #10b981;">
            ${otp} 
          </span>
        </div>
        <p style="color: #78716c; font-size: 12px; margin-bottom: 0;">
          If you did not request this verification code, please ignore this email or contact support. Never share your verification code with anyone.
        </p>
      </div>
      <p style="text-align: center; color: #a8a29e; font-size: 12px; margin-top: 20px;">
        &copy; ${new Date().getFullYear()} AgriFair Marketplace. All rights reserved.
      </p>
    </div>
  `;

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail({
        from: config.emailFrom || '"AgriFair Marketplace" <no-reply@agrifair.org>',
        to,
        subject,
        html: htmlContent
      });
      console.log(`[Email Service] Live email delivered to ${to} (MessageId: ${info.messageId})`);
      return { delivered: true, provider: 'smtp', messageId: info.messageId };
    } catch (error) {
      console.error(`[Email Service Error] Failed to send email via SMTP to ${to}:`, error.message);
      return { delivered: false, provider: 'smtp', error: error.message };
    }
  } else {
    // Development fallback logging when SMTP credentials are not yet supplied in .env
    if (config.nodeEnv !== 'production') {
      console.log(`\n======================================================`);
      console.log(`[AgriFair Dev OTP Dispatch]`);
      console.log(`Recipient: ${to}`);
      console.log(`Purpose  : ${purpose}`);
      console.log(`OTP Code : ${otp}`);
      console.log(`Note: Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env for production inbox delivery.`);
      console.log(`======================================================\n`);
    }
    return {
      delivered: false,
      provider: 'console_dev',
      message: 'SMTP credentials not configured in .env. Code output to server console in dev mode.'
    };
  }
};

const isEmailConfigured = () => {
  return Boolean(config.smtpHost && config.smtpUser && config.smtpPass);
};

const sendTransactionalEmail = async ({
  to,
  subject,
  title,
  message,
  actionUrl,
  actionText
}) => {
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    return {
      delivered: false,
      provider: 'smtp',
      reason: 'SMTP credentials not configured in server environment'
    };
  }

  if (!to) {
    return {
      delivered: false,
      provider: 'smtp',
      reason: 'Recipient email address not provided'
    };
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 12px; background-color: #faf9f5;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #164e3b; margin: 0; font-size: 26px;">AgriFair</h1>
        <p style="color: #57534e; font-size: 14px; margin-top: 4px;">Fair Trade, Transparent Agricultural Marketplace</p>
      </div>
      <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e7e5e4;">
        <h2 style="color: #1c1917; font-size: 18px; margin-top: 0;">${title || subject || 'AgriFair Notification'}</h2>
        <p style="color: #44403c; font-size: 14px; line-height: 1.5;">
          ${message}
        </p>
        ${
          actionUrl && actionText
            ? `
          <div style="text-align: center; margin: 24px 0;">
            <a href="${actionUrl}" style="display: inline-block; background-color: #164e3b; color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 6px; font-weight: bold; font-size: 14px;">
              ${actionText}
            </a>
          </div>
        `
            : ''
        }
        <p style="color: #78716c; font-size: 12px; margin-top: 24px; margin-bottom: 0;">
          This is an automated notification regarding your AgriFair account. Please do not reply directly to this email.
        </p>
      </div>
      <p style="text-align: center; color: #a8a29e; font-size: 12px; margin-top: 20px;">
        &copy; ${new Date().getFullYear()} AgriFair Marketplace. All rights reserved.
      </p>
    </div>
  `;

  try {
    const info = await mailTransporter.sendMail({
      from: config.emailFrom || '"AgriFair Marketplace" <no-reply@agrifair.org>',
      to,
      subject: subject || title || 'AgriFair Notification',
      html: htmlContent
    });
    console.log(`[Email Service] Live transactional notice delivered to ${to} (MessageId: ${info.messageId})`);
    return { delivered: true, provider: 'smtp', messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send transactional email to ${to}:`, error.message);
    return { delivered: false, provider: 'smtp', error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  isEmailConfigured,
  sendTransactionalEmail
};

