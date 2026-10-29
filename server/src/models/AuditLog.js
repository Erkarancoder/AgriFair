const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Audit log requires an actor ID'],
      index: true
    },
    actorEmail: {
      type: String,
      required: [true, 'Audit log requires actor email'],
      trim: true
    },
    action: {
      type: String,
      required: [true, 'Audit log requires an action name'],
      trim: true,
      index: true
    },
    targetType: {
      type: String,
      enum: ['User', 'Product', 'Order', 'System'],
      required: [true, 'Target type is required'],
      index: true
    },
    targetId: {
      type: String,
      required: [true, 'Target ID is required'],
      index: true
    },
    details: {
      type: Object,
      default: {}
    },
    ip: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Compound indexes for performant audit queries
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });

// Sanitize details before saving to guarantee no passwords, secrets, or tokens are ever logged
auditLogSchema.pre('save', function () {
  if (this.details && typeof this.details === 'object') {
    const sanitized = { ...this.details };
    const forbiddenKeys = [
      'password',
      'passwordHash',
      'hash',
      'token',
      'jwt',
      'secret',
      'keySecret',
      'apiKey',
      'otp',
      'cvv',
      'cardNumber',
      'cookie'
    ];

    for (const key of Object.keys(sanitized)) {
      if (forbiddenKeys.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    this.details = sanitized;
    this.markModified('details');
  }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
