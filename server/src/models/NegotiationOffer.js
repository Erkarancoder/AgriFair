const mongoose = require('mongoose');
const { ALLOWED_UNITS } = require('./Product');

const OFFER_STATUSES = ['pending', 'countered', 'accepted', 'rejected', 'cancelled', 'ordered'];

const negotiationOfferSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation reference is required'],
      index: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true
    },
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
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Proposer reference is required']
    },
    price: {
      type: Number,
      required: [true, 'Offer price is required'],
      min: [0.01, 'Price must be positive']
    },
    quantity: {
      type: Number,
      required: [true, 'Requested quantity is required'],
      min: [0.001, 'Quantity must be positive']
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: {
        values: ALLOWED_UNITS,
        message: 'Invalid unit: ' + ALLOWED_UNITS.join(', ')
      },
      lowercase: true,
      trim: true
    },
    totalAmount: {
      type: Number,
      required: [true, 'Calculated total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      default: ''
    },
    status: {
      type: String,
      enum: OFFER_STATUSES,
      default: 'pending',
      index: true
    },
    counterOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NegotiationOffer',
      default: null
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    actionNote: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

negotiationOfferSchema.index({ conversation: 1, createdAt: -1 });

module.exports = {
  NegotiationOffer: mongoose.model('NegotiationOffer', negotiationOfferSchema),
  OFFER_STATUSES
};
