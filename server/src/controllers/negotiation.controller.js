const mongoose = require('mongoose');
const { NegotiationOffer } = require('../models/NegotiationOffer');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { Product, ALLOWED_UNITS } = require('../models/Product');
const { Order } = require('../models/Order');
const { getIO } = require('../socket');
const notificationService = require('../services/notification.service');

/**
 * POST /api/negotiations
 * Buyer proposes an initial price offer on a product
 */
const createOffer = async (req, res, next) => {
  try {
    const { conversationId, price, quantity, unit, message = '' } = req.body;

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, message: 'Valid Conversation ID is required' });
    }

    const conversation = await Conversation.findById(conversationId).populate('product');
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const userId = req.user._id.toString();
    const isBuyer = conversation.buyer.toString() === userId;
    const isFarmer = conversation.farmer.toString() === userId;

    if (!isBuyer && !isFarmer) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const numPrice = Number(price);
    const numQuantity = Number(quantity);

    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Offer price must be greater than zero' });
    }

    if (isNaN(numQuantity) || numQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'Offer quantity must be greater than zero' });
    }

    const targetUnit = (unit || conversation.product?.unit || 'quintal').toLowerCase().trim();
    if (!ALLOWED_UNITS.includes(targetUnit)) {
      return res.status(400).json({
        success: false,
        message: `Invalid unit. Allowed units: ${ALLOWED_UNITS.join(', ')}`
      });
    }

    const product = await Product.findById(conversation.product._id);
    if (!product || product.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This produce listing is currently unavailable or inactive'
      });
    }

    // Minimum Order Quantity Check
    if (product.minOrderQuantity && numQuantity < product.minOrderQuantity) {
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity for this crop is ${product.minOrderQuantity} ${product.unit}`
      });
    }

    // Available Stock Check
    if (numQuantity > product.quantity) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity exceeds available stock (${product.quantity} ${product.unit} remaining)`
      });
    }

    const totalAmount = Math.round(numPrice * numQuantity * 100) / 100;

    const offer = await NegotiationOffer.create({
      conversation: conversation._id,
      product: product._id,
      buyer: conversation.buyer,
      farmer: conversation.farmer,
      proposedBy: req.user._id,
      price: numPrice,
      quantity: numQuantity,
      unit: targetUnit,
      totalAmount,
      message: message.trim(),
      status: 'pending'
    });

    conversation.activeOffer = offer._id;
    conversation.lastMessage = `Price Offer: ₹${numPrice}/${targetUnit} for ${numQuantity} ${targetUnit}`;
    conversation.lastMessageAt = new Date();
    conversation.lastSender = req.user._id;

    const recipientId = isBuyer ? conversation.farmer : conversation.buyer;
    if (isBuyer) conversation.unreadFarmer += 1;
    else conversation.unreadBuyer += 1;
    await conversation.save();

    // Create an in-chat system offer message
    const offerMessage = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      recipient: recipientId,
      text: `${req.user.name} proposed an offer of ₹${numPrice}/${targetUnit} for ${numQuantity} ${targetUnit} (Total: ₹${totalAmount.toLocaleString('en-IN')})`,
      type: 'offer',
      offer: offer._id,
      isRead: false
    });

    const populatedOffer = await NegotiationOffer.findById(offer._id)
      .populate('proposedBy', 'name role')
      .lean();

    const populatedMessage = await Message.findById(offerMessage._id)
      .populate('sender', 'name role')
      .populate('offer')
      .lean();

    const io = getIO();
    if (io) {
      io.to(`conversation:${conversation._id.toString()}`).emit('offer_created', {
        offer: populatedOffer,
        message: populatedMessage
      });
      io.to(`user:${recipientId.toString()}`).emit('conversation_updated', {
        conversationId: conversation._id.toString(),
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        senderName: req.user.name
      });
    }

    // Idempotent notification to the counterparty
    notificationService.createNotification({
      recipient: recipientId,
      type: 'negotiation',
      title: 'New Price Offer',
      message: `${req.user.name} proposed an offer of ₹${numPrice}/${targetUnit} for ${product.title || product.name || 'produce'}.`,
      entityId: offer._id,
      entityType: 'NegotiationOffer',
      link: '/conversations',
      idempotencyKey: `negotiation:offer:${offer._id}`
    }).catch((e) => console.warn('[Negotiation Notif Warn]:', e.message));

    return res.status(201).json({
      success: true,
      message: 'Offer submitted successfully',
      data: populatedOffer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/negotiations/:id/counter
 * Submit a counter-offer with revised price or quantity
 */
const counterOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { price, quantity, message = '' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid offer ID' });
    }

    const currentOffer = await NegotiationOffer.findById(id);
    if (!currentOffer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    if (currentOffer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot counter an offer that is already ${currentOffer.status}`
      });
    }

    const userId = req.user._id.toString();


    const conversation = await Conversation.findById(currentOffer.conversation);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isBuyer = conversation.buyer.toString() === userId;
    const isFarmer = conversation.farmer.toString() === userId;

    if (!isBuyer && !isFarmer) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const numPrice = Number(price);
    const numQuantity = Number(quantity);

    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Valid counter price is required' });
    }

    if (isNaN(numQuantity) || numQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'Valid counter quantity is required' });
    }

    if (typeof message === 'string' && message.length > 500) {
      return res.status(400).json({ success: false, message: 'Counter note cannot exceed 500 characters' });
    }

    const product = await Product.findById(currentOffer.product);
    if (!product || product.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This produce listing is currently inactive or unavailable'
      });
    }

    // Minimum Order Quantity Check
    if (product.minOrderQuantity && numQuantity < product.minOrderQuantity) {
      return res.status(400).json({
        success: false,
        message: `Counter quantity cannot be less than minimum order quantity of ${product.minOrderQuantity} ${product.unit}`
      });
    }

    if (numQuantity > product.quantity) {
      return res.status(400).json({
        success: false,
        message: `Quantity exceeds available stock (${product.quantity} ${product.unit} remaining)`
      });
    }

    const totalAmount = Math.round(numPrice * numQuantity * 100) / 100;

    // Create new counter-offer
    const newOffer = await NegotiationOffer.create({
      conversation: conversation._id,
      product: product._id,
      buyer: currentOffer.buyer,
      farmer: currentOffer.farmer,
      proposedBy: req.user._id,
      price: numPrice,
      quantity: numQuantity,
      unit: currentOffer.unit,
      totalAmount,
      message: message.trim(),
      status: 'pending'
    });

    // Mark previous offer as countered atomically
    const transitioned = await NegotiationOffer.findOneAndUpdate(
      { _id: id, status: 'pending' },
      { $set: { status: 'countered', counterOffer: newOffer._id } }
    );

    if (!transitioned) {
      await NegotiationOffer.findByIdAndDelete(newOffer._id);
      return res.status(400).json({
        success: false,
        message: 'This offer is no longer pending or has already been updated'
      });
    }

    conversation.activeOffer = newOffer._id;
    conversation.lastMessage = `Counter-Offer: ₹${numPrice}/${currentOffer.unit} for ${numQuantity} ${currentOffer.unit}`;
    conversation.lastMessageAt = new Date();
    conversation.lastSender = req.user._id;

    const recipientId = isBuyer ? conversation.farmer : conversation.buyer;
    if (isBuyer) conversation.unreadFarmer += 1;
    else conversation.unreadBuyer += 1;
    await conversation.save();

    const offerMessage = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      recipient: recipientId,
      text: `${req.user.name} submitted a counter-offer: ₹${numPrice}/${currentOffer.unit} for ${numQuantity} ${currentOffer.unit} (Total: ₹${totalAmount.toLocaleString('en-IN')})`,
      type: 'offer',
      offer: newOffer._id,
      isRead: false
    });

    const populatedNewOffer = await NegotiationOffer.findById(newOffer._id)
      .populate('proposedBy', 'name role')
      .lean();

    const populatedMsg = await Message.findById(offerMessage._id)
      .populate('sender', 'name role')
      .populate('offer')
      .lean();

    const io = getIO();
    if (io) {
      io.to(`conversation:${conversation._id.toString()}`).emit('offer_countered', {
        previousOfferId: id,
        newOffer: populatedNewOffer,
        message: populatedMsg
      });
      io.to(`user:${recipientId.toString()}`).emit('conversation_updated', {
        conversationId: conversation._id.toString(),
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        senderName: req.user.name
      });
    }

    // Idempotent notification to the counterparty
    notificationService.createNotification({
      recipient: recipientId,
      type: 'negotiation',
      title: 'Counter-Offer Received',
      message: `${req.user.name} submitted a counter-offer of ₹${numPrice}/${currentOffer.unit} for ${product.title || product.name || 'produce'}.`,
      entityId: newOffer._id,
      entityType: 'NegotiationOffer',
      link: '/conversations',
      idempotencyKey: `negotiation:counter:${newOffer._id}`
    }).catch((e) => console.warn('[Negotiation Counter Notif Warn]:', e.message));

    return res.status(200).json({
      success: true,
      message: 'Counter-offer submitted successfully',
      data: populatedNewOffer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/negotiations/:id/accept
 * Accept the offer, create a negotiated Order with agreed terms and payment_pending status
 */
const acceptOffer = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid offer ID' });
    }

    const offer = await NegotiationOffer.findById(id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This offer is already ${offer.status} and cannot be accepted`
      });
    }

    const userId = req.user._id.toString();

    // The user who proposed the offer CANNOT accept their own proposal! The counter-party must accept it.
    if (offer.proposedBy.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot accept your own proposed offer. Awaiting counter-party response.'
      });
    }

    const isAuthorized =
      offer.buyer.toString() === userId || offer.farmer.toString() === userId;
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Atomic Stock Check
    const product = await Product.findById(offer.product);
    if (!product || product.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Produce listing is no longer active or available'
      });
    }

    if (product.quantity < offer.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock remaining. Available stock is ${product.quantity} ${product.unit}. Please propose a revised quantity.`
      });
    }

    // Check if an order already exists for this offer to prevent duplicates
    let order = await Order.findOne({ negotiatedOffer: offer._id });
    if (order) {
      return res.status(200).json({
        success: true,
        message: 'Negotiated order has already been created for this offer',
        data: { offer, order }
      });
    }

    // 1. Atomically transition offer from 'pending' to 'accepted' to prevent concurrent double-accept
    const acceptedOffer = await NegotiationOffer.findOneAndUpdate(
      { _id: id, status: 'pending' },
      {
        $set: {
          status: 'accepted',
          actionNote: `Accepted by ${req.user.name} on ${new Date().toISOString()}`
        }
      },
      { returnDocument: 'after' }
    );

    if (!acceptedOffer) {
      return res.status(400).json({
        success: false,
        message: 'This offer is no longer pending or has already been accepted/countered'
      });
    }

    // 2. Atomically decrement product stock
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: offer.product,
        status: 'active',
        quantity: { $gte: offer.quantity }
      },
      {
        $inc: { quantity: -offer.quantity }
      },
      { returnDocument: 'after' }
    );

    if (!updatedProduct) {
      // Rollback offer state back to pending
      await NegotiationOffer.updateOne(
        { _id: id },
        { $set: { status: 'pending', actionNote: '' } }
      );
      const currentProd = await Product.findById(offer.product).select('quantity unit status');
      const available = currentProd ? currentProd.quantity : 0;
      const unit = currentProd ? currentProd.unit : offer.unit;
      return res.status(400).json({
        success: false,
        message: `Cannot accept offer: requested quantity (${offer.quantity} ${offer.unit}) exceeds available stock (${available} ${unit}).`
      });
    }

    if (updatedProduct.quantity === 0) {
      await Product.updateOne({ _id: updatedProduct._id }, { status: 'unavailable' });
    }

    // 3. Create real Order with exact negotiated terms and isStockDeducted: true
    try {
      order = await Order.create({
        buyer: offer.buyer,
        farmer: offer.farmer,
        product: offer.product,
        requestedQuantity: offer.quantity,
        unit: offer.unit,
        priceSnapshot: offer.price,
        currency: updatedProduct.currency || 'INR',
        totalAmount: offer.totalAmount,
        buyerMessage: offer.message || `Negotiated deal agreed at ₹${offer.price}/${offer.unit}`,
        status: 'accepted', // Order confirmed by mutual agreement
        statusNote: `Agreed via direct negotiation at ₹${offer.price}/${offer.unit}`,
        isNegotiated: true,
        negotiatedOffer: offer._id,
        negotiatedAt: new Date(),
        isStockDeducted: true,
        paymentStatus: 'payment_pending',
        paymentMethod: 'Direct Mandi / Bank Settlement',
        statusHistory: [
          {
            status: 'pending',
            changedBy: offer.buyer,
            note: 'Offer proposed during bargaining'
          },
          {
            status: 'accepted',
            changedBy: req.user._id,
            note: `Terms finalized: ₹${offer.price}/${offer.unit} for ${offer.quantity} ${offer.unit}`
          }
        ]
      });

      acceptedOffer.order = order._id;
      acceptedOffer.status = 'accepted';
      await acceptedOffer.save();
    } catch (orderErr) {
      // Rollback stock decrement and offer status if order creation fails
      await Product.updateOne(
        { _id: offer.product },
        { $inc: { quantity: offer.quantity }, $set: { status: 'active' } }
      );
      await NegotiationOffer.updateOne(
        { _id: id },
        { $set: { status: 'pending', actionNote: '' } }
      );
      throw orderErr;
    }

    const conversation = await Conversation.findById(offer.conversation);
    if (conversation) {
      conversation.lastMessage = `🤝 Deal Finalized! Order #${order._id.toString().slice(-6).toUpperCase()}`;
      conversation.lastMessageAt = new Date();
      conversation.lastSender = req.user._id;
      await conversation.save();

      // Post in-chat system agreement card
      const systemMsg = await Message.create({
        conversation: conversation._id,
        sender: req.user._id,
        recipient: offer.buyer.toString() === userId ? offer.farmer : offer.buyer,
        text: `🤝 Deal Finalized! ${req.user.name} accepted the offer of ₹${offer.price}/${offer.unit} for ${offer.quantity} ${offer.unit} (Total: ₹${offer.totalAmount.toLocaleString('en-IN')}). Order #${order._id.toString().slice(-6).toUpperCase()} created with payment pending.`,
        type: 'system',
        offer: offer._id,
        isRead: false
      });

      const io = getIO();
      if (io) {
        io.to(`conversation:${conversation._id.toString()}`).emit('offer_accepted', {
          offer: acceptedOffer,
          order,
          message: systemMsg
        });
      }
    }

    // Idempotent notification to the party whose offer was accepted
    notificationService.createNotification({
      recipient: offer.proposedBy,
      type: 'negotiation',
      title: 'Offer Accepted! Deal Finalized',
      message: `${req.user.name} accepted your offer of ₹${offer.price}/${offer.unit}. Order #${order._id.toString().slice(-6).toUpperCase()} is confirmed!`,
      entityId: offer._id,
      entityType: 'NegotiationOffer',
      link: '/conversations',
      idempotencyKey: `negotiation:accepted:${offer._id}`
    }).catch((e) => console.warn('[Negotiation Accept Notif Warn]:', e.message));

    return res.status(200).json({
      success: true,
      message: 'Offer accepted and negotiated order created successfully',
      data: {
        offer: acceptedOffer,
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/negotiations/:id/reject
 * Decline an offer
 */
const rejectOffer = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid offer ID' });
    }

    const offer = await NegotiationOffer.findById(id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This offer is already ${offer.status}`
      });
    }

    const userId = req.user._id.toString();
    const isAuthorized =
      offer.buyer.toString() === userId || offer.farmer.toString() === userId;
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updatedOffer = await NegotiationOffer.findOneAndUpdate(
      { _id: id, status: 'pending' },
      {
        $set: {
          status: 'rejected',
          actionNote: `Declined by ${req.user.name}`
        }
      },
      { returnDocument: 'after' }
    );

    if (!updatedOffer) {
      return res.status(400).json({
        success: false,
        message: 'This offer is no longer pending or has already been resolved'
      });
    }

    const conversation = await Conversation.findById(offer.conversation);
    if (conversation) {
      conversation.lastMessage = `Offer of ₹${offer.price}/${offer.unit} declined`;
      conversation.lastMessageAt = new Date();
      await conversation.save();

      const rejectMsg = await Message.create({
        conversation: conversation._id,
        sender: req.user._id,
        recipient: offer.buyer.toString() === userId ? offer.farmer : offer.buyer,
        text: `Offer of ₹${offer.price}/${offer.unit} for ${offer.quantity} ${offer.unit} was declined by ${req.user.name}.`,
        type: 'system',
        offer: offer._id,
        isRead: false
      });

      const io = getIO();
      if (io) {
        io.to(`conversation:${conversation._id.toString()}`).emit('offer_rejected', {
          offer,
          message: rejectMsg
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Offer declined',
      data: offer
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOffer,
  counterOffer,
  acceptOffer,
  rejectOffer
};
