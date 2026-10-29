const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation reference is required'],
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender reference is required'],
      index: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient reference is required'],
      index: true
    },
    text: {
      type: String,
      trim: true,
      maxlength: [3000, 'Message cannot exceed 3000 characters'],
      default: ''
    },
    type: {
      type: String,
      enum: ['text', 'offer', 'system', 'call_request'],
      default: 'text'
    },
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NegotiationOffer',
      default: null
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    attachments: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        format: { type: String }
      }
    ]
  },
  {
    timestamps: true
  }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
