const mongoose = require('mongoose');
const { ALLOWED_UNITS } = require('./Product');
const { ORDER_STATUSES } = require('../constants/orderStatuses');

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer reference is required'],
      index: true
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
      index: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true
    },
    requestedQuantity: {
      type: Number,
      required: [true, 'Requested quantity is required'],
      min: [0.001, 'Requested quantity must be greater than zero']
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: {
        values: ALLOWED_UNITS,
        message: 'Invalid unit. Allowed units: ' + ALLOWED_UNITS.join(', ')
      },
      lowercase: true,
      trim: true
    },
    priceSnapshot: {
      type: Number,
      required: [true, 'Price snapshot is required'],
      min: [0.01, 'Price snapshot must be positive']
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true
    },
    totalAmount: {
      type: Number,
      required: [true, 'Calculated total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    buyerMessage: {
      type: String,
      trim: true,
      maxlength: [1000, 'Buyer message cannot exceed 1000 characters'],
      default: ''
    },
    status: {
      type: String,
      enum: {
        values: ORDER_STATUSES,
        message: 'Invalid status. Allowed statuses: ' + ORDER_STATUSES.join(', ')
      },
      default: 'pending',
      index: true
    },
    statusNote: {
      type: String,
      trim: true,
      maxlength: [500, 'Status note cannot exceed 500 characters'],
      default: ''
    },
    negotiatedOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NegotiationOffer',
      default: null
    },
    isNegotiated: {
      type: Boolean,
      default: false
    },
    negotiatedAt: {
      type: Date,
      default: null
    },
    paymentStatus: {
      type: String,
      enum: ['payment_pending', 'paid', 'payment_failed', 'failed', 'refund_pending', 'refunded'],
      default: 'payment_pending',
      index: true
    },
    paymentMethod: {
      type: String,
      default: 'Direct Mandi / Bank Settlement'
    },
    razorpayOrderId: {
      type: String,
      default: null,
      index: true
    },
    razorpayPaymentId: {
      type: String,
      default: null
    },
    razorpaySignature: {
      type: String,
      default: null
    },
    paidAt: {
      type: Date,
      default: null
    },
    paymentAttempts: [
      {
        providerOrderId: { type: String, required: true },
        amountPaise: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        status: { type: String, enum: ['created', 'verified', 'failed'], default: 'created' },
        paymentId: { type: String, default: null },
        failureReason: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
        completedAt: { type: Date, default: null }
      }
    ],
    processedWebhooks: [
      {
        eventId: { type: String, required: true },
        eventType: { type: String, required: true },
        paymentId: { type: String, default: null },
        processedAt: { type: Date, default: Date.now }
      }
    ],
    refunds: [
      {
        providerRefundId: { type: String, required: true },
        paymentId: { type: String, required: true },
        amountPaise: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
        reason: { type: String, default: '' },
        initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        processedAt: { type: Date, default: null }
      }
    ],
    reconciledAt: {
      type: Date,
      default: null
    },
    fulfilment: {
      transporterName: { type: String, trim: true, default: '' },
      vehicleNumber: { type: String, trim: true, default: '' },
      dispatchNote: { type: String, trim: true, default: '' },
      dispatchedAt: { type: Date, default: null },
      deliveredAt: { type: Date, default: null },
      receivedBy: { type: String, trim: true, default: '' },
      deliveryConfirmationNote: { type: String, trim: true, default: '' },
      settlementConfirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      settlementConfirmedAt: { type: Date, default: null },
      settlementNote: { type: String, trim: true, default: '' }
    },
    isStockDeducted: {
      type: Boolean,
      default: false,
      index: true
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ORDER_STATUSES,
          required: true
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        changedAt: {
          type: Date,
          default: Date.now
        },
        note: {
          type: String,
          default: ''
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Compound indexes for performant role-based queries
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ farmer: 1, createdAt: -1 });
orderSchema.index({ product: 1, status: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = {
  Order,
  ORDER_STATUSES
};
