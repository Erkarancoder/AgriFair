const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { Product } = require('../models/Product');
const { getIO } = require('../socket');

/**
 * GET /api/conversations
 * Fetch all active conversations for the authenticated user (buyer or farmer)
 */
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      $or: [{ buyer: userId }, { farmer: userId }]
    })
      .sort({ updatedAt: -1 })
      .populate('product', 'name price currency quantity unit location images status minOrderQuantity variety qualityGrade')
      .populate('buyer', 'name role email')
      .populate('farmer', 'name role email allowDirectCalls')
      .populate('activeOffer')
      .lean();

    return res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/conversations
 * Start or retrieve an existing conversation between buyer and farmer for a product
 */
const getOrCreateConversation = async (req, res, next) => {
  try {
    const { productId } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid Product ID is required'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product listing not found'
      });
    }

    // Prevent farmer chatting with themselves on their own listing
    if (product.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot open a buyer negotiation conversation on your own produce listing'
      });
    }

    // Find or create unique conversation
    let conversation = await Conversation.findOne({
      product: product._id,
      buyer: req.user._id
    });

    if (!conversation) {
      conversation = await Conversation.create({
        product: product._id,
        buyer: req.user._id,
        farmer: product.owner,
        lastMessage: 'Conversation started',
        lastMessageAt: new Date(),
        lastSender: req.user._id
      });
    }

    const populated = await Conversation.findById(conversation._id)
      .populate('product', 'name price currency quantity unit location images status minOrderQuantity variety qualityGrade')
      .populate('buyer', 'name role email')
      .populate('farmer', 'name role email allowDirectCalls')
      .populate('activeOffer')
      .lean();

    return res.status(200).json({
      success: true,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/conversations/:id/messages
 * Retrieve full message history with pagination and mark unread messages as read
 */
const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format'
      });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const userId = req.user._id.toString();
    const isBuyer = conversation.buyer.toString() === userId;
    const isFarmer = conversation.farmer.toString() === userId;

    if (!isBuyer && !isFarmer) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view messages in this conversation'
      });
    }

    // Retrieve messages in chronological order
    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role')
      .populate('offer')
      .lean();

    // Mark unread messages sent to current user as read
    await Message.updateMany(
      { conversation: conversation._id, recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    // Reset unread counter for current user in conversation
    if (isBuyer && conversation.unreadBuyer > 0) {
      conversation.unreadBuyer = 0;
      await conversation.save();
    } else if (isFarmer && conversation.unreadFarmer > 0) {
      conversation.unreadFarmer = 0;
      await conversation.save();
    }

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/conversations/:id/messages
 * Send a new real-time message and notify recipient
 */
const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text = '', attachments = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format'
      });
    }

    if (!text.trim() && (!Array.isArray(attachments) || attachments.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const userId = req.user._id.toString();
    const isBuyer = conversation.buyer.toString() === userId;
    const isFarmer = conversation.farmer.toString() === userId;

    if (!isBuyer && !isFarmer) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to send messages in this conversation'
      });
    }

    const recipientId = isBuyer ? conversation.farmer : conversation.buyer;

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      recipient: recipientId,
      text: text.trim(),
      type: 'text',
      attachments: Array.isArray(attachments) ? attachments : [],
      isRead: false
    });

    // Update conversation metadata and increment recipient's unread counter
    conversation.lastMessage = text.trim() || 'Attached Photo';
    conversation.lastMessageAt = new Date();
    conversation.lastSender = req.user._id;

    if (isBuyer) {
      conversation.unreadFarmer += 1;
    } else {
      conversation.unreadBuyer += 1;
    }
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name role')
      .populate('offer')
      .lean();

    // Broadcast message via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`conversation:${id}`).emit('new_message', populatedMessage);
      io.to(`user:${recipientId.toString()}`).emit('conversation_updated', {
        conversationId: id,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        senderName: req.user.name
      });
    }

    return res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/conversations/:id/request-call
 * Send an official call request message in chat without exposing private phone numbers
 */
const requestCall = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid conversation ID' });
    }

    const conversation = await Conversation.findById(id).populate('product', 'name');
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const userId = req.user._id.toString();
    const isBuyer = conversation.buyer.toString() === userId;
    const isFarmer = conversation.farmer.toString() === userId;

    if (!isBuyer && !isFarmer) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const recipientId = isBuyer ? conversation.farmer : conversation.buyer;
    const roleTitle = isBuyer ? 'Buyer' : 'Farmer';
    const productName = conversation.product?.name || 'agricultural harvest';

    const callMsg = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      recipient: recipientId,
      text: `📞 Call Request: ${roleTitle} ${req.user.name} has requested a direct phone call discussion regarding ${productName}. You may reply here to share direct contact or arrange a call.`,
      type: 'call_request',
      isRead: false
    });

    conversation.lastMessage = `Call request from ${req.user.name}`;
    conversation.lastMessageAt = new Date();
    conversation.lastSender = req.user._id;
    if (isBuyer) conversation.unreadFarmer += 1;
    else conversation.unreadBuyer += 1;
    await conversation.save();

    const populated = await Message.findById(callMsg._id)
      .populate('sender', 'name role')
      .lean();

    const io = getIO();
    if (io) {
      io.to(`conversation:${id}`).emit('new_message', populated);
      io.to(`user:${recipientId.toString()}`).emit('conversation_updated', {
        conversationId: id,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        senderName: req.user.name
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Call request successfully posted to the conversation',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  requestCall
};
