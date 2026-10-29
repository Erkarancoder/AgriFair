const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification recipient is required'],
      index: true
    },
    type: {
      type: String,
      enum: ['order', 'payment', 'negotiation', 'system'],
      default: 'order',
      index: true
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: 120
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: 500
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    entityType: {
      type: String,
      trim: true,
      default: null
    },
    link: {
      type: String,
      trim: true,
      default: ''
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    },
    idempotencyKey: {
      type: String,
      trim: true,
      sparse: true,
      index: true
    },
    eventKey: {
      type: String,
      trim: true,
      default: null
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.pre('save', function () {
  if (this.idempotencyKey && !this.eventKey) {
    this.eventKey = this.idempotencyKey;
  }
});



// Compound indexes for performant querying and idempotency
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
