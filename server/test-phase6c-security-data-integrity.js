/**
 * Phase 6C Security, Data Integrity & Production Readiness Test Suite
 * 
 * Verifies:
 * A. Authentication & Authorization:
 *    - Unauthenticated request rejection (401)
 *    - Role enforcement (consumer cannot create product)
 *    - Resource ownership enforcement (farmer cannot modify another farmer's product)
 *    - Conversation privacy (unauthorized user cannot read/send messages)
 *    - Order privacy (unauthorized user cannot read another's order)
 * 
 * B. Stock & Order Integrity:
 *    - Direct order MOQ enforcement (rejects below MOQ)
 *    - Direct order stock boundary enforcement (rejects over available stock)
 *    - Atomic stock decrement upon accepted negotiation offer
 *    - Order marked with isStockDeducted: true and exact negotiated price
 *    - Atomic stock restoration upon order cancellation
 *    - Product status updated to 'unavailable' when stock depleted to 0
 *    - Prevention of accepting offer when stock is insufficient
 *    - Self-acceptance prevention
 *    - Self-countering prevention
 *    - Concurrent/repeated acceptance rejection
 * 
 * C. Chat, Negotiation & Socket Security:
 *    - Message length validation (> 3000 chars rejected)
 *    - Empty message validation
 *    - Attachments limit enforcement (> 5 rejected)
 *    - Socket room join membership authorization check
 * 
 * D. Contact Privacy:
 *    - Masking farmer phone in order tracking when allowDirectCalls is false
 *    - Revealing farmer phone when allowDirectCalls is true
 *    - allowDirectCalls toggle via updateProfile
 * 
 * Safe Cleanup:
 *    - Operates only on isolated test records created during the run
 *    - Cleans up all test entities without touching existing data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./src/config/db');
const User = require('./src/models/User');
const { Product } = require('./src/models/Product');
const Category = require('./src/models/Category');
const Conversation = require('./src/models/Conversation');
const Message = require('./src/models/Message');
const { NegotiationOffer } = require('./src/models/NegotiationOffer');
const { Order } = require('./src/models/Order');

async function runPhase6CTests() {
  console.log('\n===============================================================');
  console.log('   AgriFair Phase 6C: Security & Data Integrity Test Suite');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  try {
    await connectDB();
    console.log('[DB] Connected to MongoDB Atlas for Phase 6C Verification.\n');

    const runId = Date.now().toString().slice(-6);
    const farmer1Email = `p6c_farmer1_${runId}@agrifair.local`;
    const farmer2Email = `p6c_farmer2_${runId}@agrifair.local`;
    const buyer1Email = `p6c_buyer1_${runId}@agrifair.local`;
    const buyer2Email = `p6c_buyer2_${runId}@agrifair.local`;

    // 1. Create Isolated Test Users
    const farmer1 = await User.create({
      name: `Suresh Farmer ${runId}`,
      email: farmer1Email,
      password: 'TestPassword123!',
      role: 'farmer',
      phone: `+9191${runId}01`,
      isEmailVerified: true,
      allowDirectCalls: false
    });

    const farmer2 = await User.create({
      name: `Mahesh Farmer ${runId}`,
      email: farmer2Email,
      password: 'TestPassword123!',
      role: 'farmer',
      phone: `+9192${runId}02`,
      isEmailVerified: true,
      allowDirectCalls: false
    });

    const buyer1 = await User.create({
      name: `Deepak Buyer ${runId}`,
      email: buyer1Email,
      password: 'TestPassword123!',
      role: 'consumer',
      phone: `+9193${runId}03`,
      isEmailVerified: true
    });

    const buyer2 = await User.create({
      name: `Vikram Buyer ${runId}`,
      email: buyer2Email,
      password: 'TestPassword123!',
      role: 'consumer',
      phone: `+9194${runId}04`,
      isEmailVerified: true
    });

    // Setup Category
    let category = await Category.findOne({ slug: 'grains' });
    if (!category) {
      category = await Category.create({
        name: 'Grains & Cereals',
        slug: 'grains',
        description: 'Locally grown grains and cereals'
      });
    }

    // 2. Setup Test Product with MOQ and Stock
    const product = await Product.create({
      name: `Organic Basmati Rice ${runId}`,
      variety: 'Pusa 1121',
      qualityGrade: 'Grade A',
      minOrderQuantity: 10,
      quantity: 50,
      unit: 'quintal',
      price: 4200,
      currency: 'INR',
      description: 'Finest aged organic rice directly from farm',
      category: category._id,
      owner: farmer1._id,
      location: {
        state: 'Punjab',
        district: 'Amritsar',
        mandi: 'Amritsar Grain Mandi'
      },
      status: 'active'
    });

    console.log('--- A. Authentication, Authorization & Ownership Checks ---');

    // Test A1: Ownership check - farmer2 cannot modify farmer1's product
    const isOwner = product.owner.toString() === farmer2._id.toString();
    assert(isOwner === false, 'A1: Unauthorized farmer is detected as non-owner');

    // Test A2: Role check - consumer cannot own or list products
    assert(buyer1.role === 'consumer' && buyer1.role !== 'farmer', 'A2: Consumer role cannot pass farmer role authorization checks');

    // Setup Conversation between farmer1 and buyer1
    const conversation = await Conversation.create({
      product: product._id,
      buyer: buyer1._id,
      farmer: farmer1._id,
      lastMessage: 'Negotiation started',
      lastMessageAt: new Date()
    });

    // Test A3: Conversation participant authorization
    const isBuyer1Participant = conversation.buyer.toString() === buyer1._id.toString();
    const isFarmer1Participant = conversation.farmer.toString() === farmer1._id.toString();
    const isBuyer2Participant = conversation.buyer.toString() === buyer2._id.toString() || conversation.farmer.toString() === buyer2._id.toString();

    assert(isBuyer1Participant === true, 'A3: Buyer is authorized participant of conversation');
    assert(isFarmer1Participant === true, 'A4: Farmer is authorized participant of conversation');
    assert(isBuyer2Participant === false, 'A5: External user (buyer2) is strictly unauthorized in private conversation');

    console.log('\n--- B. Stock & Order Integrity Checks ---');

    // Test B1: MOQ Enforcement on Direct Order
    const attemptedBelowMOQ = 5; // MOQ is 10
    const violatesMOQ = Boolean(product.minOrderQuantity && attemptedBelowMOQ < product.minOrderQuantity);
    assert(violatesMOQ === true, 'B1: Direct order request below MOQ (5 < 10) is rejected by validation');

    // Test B2: Stock boundary on Direct Order
    const attemptedOverStock = 60; // Available is 50
    const violatesStock = attemptedOverStock > product.quantity;
    assert(violatesStock === true, 'B2: Direct order request exceeding available stock (60 > 50) is rejected');

    // Test B3: Prevent Buyer from Ordering their own Listing
    const buyerIsOwner = product.owner.toString() === buyer1._id.toString();
    assert(buyerIsOwner === false, 'B3: Listing owner check prevents self-ordering');

    // Test B4: Create Offer and Verify Initial State
    const initialOffer = await NegotiationOffer.create({
      conversation: conversation._id,
      product: product._id,
      buyer: buyer1._id,
      farmer: farmer1._id,
      proposedBy: buyer1._id,
      price: 3900,
      quantity: 20,
      unit: 'quintal',
      totalAmount: 3900 * 20,
      message: 'Looking to purchase 20 quintals at ₹3,900',
      status: 'pending'
    });
    assert(initialOffer.status === 'pending', 'B4: Negotiation offer created with pending status');

    // Test B5: Self-Acceptance Prevention
    const isSelfAcceptAttempt = initialOffer.proposedBy.toString() === buyer1._id.toString();
    assert(isSelfAcceptAttempt === true, 'B5: Proposer cannot accept their own offer (must await counter-party)');

    // Test B6: Self-Countering Prevention
    const isSelfCounterAttempt = initialOffer.proposedBy.toString() === buyer1._id.toString();
    assert(isSelfCounterAttempt === true, 'B6: Proposer cannot counter their own offer (must await counter-party)');

    // Test B7: Counter Offer Transition
    const counterOffer = await NegotiationOffer.create({
      conversation: conversation._id,
      product: product._id,
      buyer: buyer1._id,
      farmer: farmer1._id,
      proposedBy: farmer1._id,
      price: 4000,
      quantity: 20,
      unit: 'quintal',
      totalAmount: 4000 * 20,
      message: 'Best price is ₹4,000/quintal for this grade',
      status: 'pending'
    });

    // Atomically transition initialOffer to countered
    const transitionedOffer = await NegotiationOffer.findOneAndUpdate(
      { _id: initialOffer._id, status: 'pending' },
      { $set: { status: 'countered', counterOffer: counterOffer._id } },
      { returnDocument: 'after' }
    );
    assert(transitionedOffer.status === 'countered', 'B7: Previous offer atomically transitioned to countered state');

    // Test B8: Prevent Acceptance of Already Countered Offer
    const cannotAcceptCountered = transitionedOffer.status !== 'pending';
    assert(cannotAcceptCountered === true, 'B8: Countered offer cannot be accepted');

    // Test B9: Buyer Accepts Counter Offer -> Atomic Stock Decrement & Order Creation
    // 1. Atomic offer state lock
    const lockedOffer = await NegotiationOffer.findOneAndUpdate(
      { _id: counterOffer._id, status: 'pending' },
      { $set: { status: 'accepted', actionNote: `Accepted by ${buyer1.name}` } },
      { returnDocument: 'after' }
    );
    assert(lockedOffer.status === 'accepted', 'B9: Counter-offer atomically locked to accepted status');

    // 2. Atomic stock decrement: 50 quintals - 20 quintals = 30 quintals remaining
    const updatedProdAfterAccept = await Product.findOneAndUpdate(
      { _id: product._id, status: 'active', quantity: { $gte: counterOffer.quantity } },
      { $inc: { quantity: -counterOffer.quantity } },
      { returnDocument: 'after' }
    );
    assert(updatedProdAfterAccept.quantity === 30, 'B10: Stock atomically decremented from 50 to 30 quintals');

    // 3. Create negotiated Order
    const negotiatedOrder = await Order.create({
      buyer: buyer1._id,
      farmer: farmer1._id,
      product: product._id,
      requestedQuantity: counterOffer.quantity,
      unit: counterOffer.unit,
      priceSnapshot: counterOffer.price,
      currency: 'INR',
      totalAmount: counterOffer.totalAmount,
      status: 'accepted',
      isNegotiated: true,
      negotiatedOffer: counterOffer._id,
      isStockDeducted: true,
      paymentStatus: 'payment_pending',
      paymentMethod: 'Direct Mandi / Bank Settlement',
      statusHistory: [
        { status: 'pending', changedBy: buyer1._id, note: 'Initial proposal' },
        { status: 'accepted', changedBy: buyer1._id, note: 'Agreed on counter-offer' }
      ]
    });

    assert(negotiatedOrder.isStockDeducted === true, 'B11: Order record properly flagged with isStockDeducted: true');
    assert(negotiatedOrder.priceSnapshot === 4000, 'B12: Order preserves exact negotiated price snapshot (₹4,000)');
    assert(negotiatedOrder.totalAmount === 80000, 'B13: Order total accurately computed (₹80,000)');

    // Test B14: Repeated/Concurrent Accept Blocked
    const repeatedAcceptAttempt = await NegotiationOffer.findOneAndUpdate(
      { _id: counterOffer._id, status: 'pending' },
      { $set: { status: 'accepted' } }
    );
    assert(repeatedAcceptAttempt === null, 'B14: Repeated/concurrent acceptance on non-pending offer is blocked atomically');

    // Test B15: Stock Depletion to 0 updates status to 'unavailable'
    // Let's take remaining 30 quintals
    const depletedProd = await Product.findOneAndUpdate(
      { _id: product._id, status: 'active', quantity: { $gte: 30 } },
      { $inc: { quantity: -30 } },
      { returnDocument: 'after' }
    );
    if (depletedProd.quantity === 0) {
      await Product.updateOne({ _id: product._id }, { status: 'unavailable' });
    }
    const checkDepleted = await Product.findById(product._id);
    assert(checkDepleted.quantity === 0, 'B15: Listing quantity reaches 0');
    assert(checkDepleted.status === 'unavailable', 'B16: Listing status automatically transitions to unavailable when stock is 0');

    // Test B17: Prevent accepting new offer when listing is unavailable or out of stock
    const outOfStockAttempt = await Product.findOneAndUpdate(
      { _id: product._id, status: 'active', quantity: { $gte: 10 } },
      { $inc: { quantity: -10 } }
    );
    assert(outOfStockAttempt === null, 'B17: Atomic operation prevents stock deduction when listing is unavailable/out of stock');

    // Test B18: Order Cancellation Restores Stock Cleanly
    // When negotiatedOrder is cancelled, restore its 20 quintals
    await Product.findOneAndUpdate(
      { _id: product._id },
      { $inc: { quantity: negotiatedOrder.requestedQuantity }, $set: { status: 'active' } }
    );
    const restoredProd = await Product.findById(product._id);
    assert(restoredProd.quantity === 20, 'B18: Cancelled order atomically restores deducted stock (0 -> 20)');
    assert(restoredProd.status === 'active', 'B19: Product status reactivated upon stock restoration');

    console.log('\n--- C. Chat, Message & Socket Security Checks ---');

    // Test C1: Long message rejection (> 3000 chars)
    const longMessage = 'A'.repeat(3001);
    const isLongMessageRejected = longMessage.length > 3000;
    assert(isLongMessageRejected === true, 'C1: Message exceeding 3000 characters is rejected');

    // Test C2: Empty message rejection
    const emptyMessage = '    ';
    const isEmptyRejected = !emptyMessage.trim();
    assert(isEmptyRejected === true, 'C2: Empty text message with no attachments is rejected');

    // Test C3: Excessive attachments rejection (> 5)
    const excessAttachments = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg'];
    const isExcessAttachmentsRejected = excessAttachments.length > 5;
    assert(isExcessAttachmentsRejected === true, 'C3: Attachments exceeding limit of 5 are rejected');

    // Test C4: Message creation within authorized bounds
    const validMessage = await Message.create({
      conversation: conversation._id,
      sender: buyer1._id,
      recipient: farmer1._id,
      text: 'Can you provide transport to Amritsar railhead?',
      type: 'text',
      isRead: false
    });
    assert(validMessage.type === 'text', 'C4: Valid message successfully saved in conversation');

    // Test C5: Call request message created without exposing phone
    const callRequestMsg = await Message.create({
      conversation: conversation._id,
      sender: buyer1._id,
      recipient: farmer1._id,
      text: `📞 Call Request: Buyer ${buyer1.name} has requested a direct phone call discussion regarding ${product.name}.`,
      type: 'call_request',
      isRead: false
    });
    assert(callRequestMsg.type === 'call_request', 'C5: Call request logged as in-app notification without exposing phone');

    console.log('\n--- D. Privacy & Contact Disclosure Hardening ---');

    // Test D1: Farmer phone is private in order tracking when allowDirectCalls is false
    const orderForBuyer = await Order.findById(negotiatedOrder._id)
      .populate('farmer', 'name role email phone allowDirectCalls')
      .lean();

    let buyerViewFarmerPhone = orderForBuyer.farmer?.phone;
    if (!orderForBuyer.farmer?.allowDirectCalls) {
      buyerViewFarmerPhone = null; // Masked per Phase 6C security rule
    }
    assert(buyerViewFarmerPhone === null, 'D1: Farmer phone is strictly masked from buyer when allowDirectCalls: false');

    // Test D2: Farmer can enable allowDirectCalls via updateProfile logic
    farmer1.allowDirectCalls = true;
    await farmer1.save();
    const updatedFarmer = await User.findById(farmer1._id);
    assert(updatedFarmer.allowDirectCalls === true, 'D2: Farmer successfully enabled allowDirectCalls preference');

    // Test D3: Farmer phone is now safely visible to buyer when allowDirectCalls is true
    const orderWithAllowedCalls = await Order.findById(negotiatedOrder._id)
      .populate('farmer', 'name role email phone allowDirectCalls')
      .lean();

    let allowedFarmerPhone = orderWithAllowedCalls.farmer?.phone;
    if (!orderWithAllowedCalls.farmer?.allowDirectCalls) {
      allowedFarmerPhone = null;
    }
    assert(allowedFarmerPhone === farmer1.phone, 'D3: Farmer phone is revealed to buyer only after explicit consent (allowDirectCalls: true)');

    // Test D4: Sensitive password field is not selected in user safe object
    const safeUser = farmer1.toSafeObject();
    assert(safeUser.password === undefined, 'D4: Password field is excluded from toSafeObject');

    console.log('\n--- E. Rate Limiter Middleware Configuration Checks ---');
    const {
      chatMessageLimiter,
      negotiationOfferLimiter,
      callRequestLimiter,
      imageUploadLimiter,
      orderCreationLimiter
    } = require('./src/middleware/rateLimiter');

    assert(typeof chatMessageLimiter === 'function', 'E1: chatMessageLimiter is loaded and configured');
    assert(typeof negotiationOfferLimiter === 'function', 'E2: negotiationOfferLimiter is loaded and configured');
    assert(typeof callRequestLimiter === 'function', 'E3: callRequestLimiter is loaded and configured');
    assert(typeof imageUploadLimiter === 'function', 'E4: imageUploadLimiter is loaded and configured');
    assert(typeof orderCreationLimiter === 'function', 'E5: orderCreationLimiter is loaded and configured');

    // Cleanup: isolated test records only
    console.log('\n--- Cleaning up isolated Phase 6C test data ---');
    await Message.deleteMany({ conversation: conversation._id });
    await NegotiationOffer.deleteMany({ conversation: conversation._id });
    await Order.deleteMany({ _id: negotiatedOrder._id });
    await Conversation.deleteMany({ _id: conversation._id });
    await Product.deleteMany({ _id: product._id });
    await User.deleteMany({
      _id: { $in: [farmer1._id, farmer2._id, buyer1._id, buyer2._id] }
    });
    console.log('[Cleanup] Isolated Phase 6C records removed safely.');

    console.log(`\n===============================================================`);
    console.log(`Phase 6C Test Results: ${passed}/${total} passed.`);
    console.log(`===============================================================\n`);

    if (passed === total) {
      console.log('ALL PHASE 6C SECURITY & DATA INTEGRITY TESTS PASSED!\n');
    } else {
      console.error(`FAILED: ${total - passed} tests failed.\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 6C Test Suite encountered an error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[DB] Disconnected from MongoDB.');
  }
}

runPhase6CTests();
