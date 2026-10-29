const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
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
    lastMessage: {
      type: String,
      trim: true,
      default: ''
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    lastSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    activeOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NegotiationOffer',
      default: null
    },
    unreadBuyer: {
      type: Number,
      default: 0
    },
    unreadFarmer: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// One unique conversation per product-buyer pair
conversationSchema.index({ product: 1, buyer: 1 }, { unique: true });
conversationSchema.index({ buyer: 1, updatedAt: -1 });
conversationSchema.index({ farmer: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
