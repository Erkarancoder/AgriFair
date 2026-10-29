const dns = require('dns');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('../src/config/env');
const Category = require('../src/models/Category');
const { Product } = require('../src/models/Product');
const { Order } = require('../src/models/Order');
const User = require('../src/models/User');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore
}

const generateAuthHeader = (userId) => {
  const token = jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: '1h'
  });
  return { Authorization: `Bearer ${token}` };
};

async function runPhase4ATests() {
  console.log('================================================================');
  console.log('   AGRIFAIR PHASE 4A: BUYER INQUIRY & ORDER BACKEND TEST SUITE');
  console.log('================================================================\n');

  await mongoose.connect(config.mongodbUri);
  console.log(`[INIT] Connected to Database: ${mongoose.connection.host}/${mongoose.connection.name}`);

  const initialOrderCount = await Order.countDocuments();
  const initialProductCount = await Product.countDocuments();
  console.log(`[BASELINE] Existing Real DB State: Orders = ${initialOrderCount}, Products = ${initialProductCount}\n`);

  const createdUserIds = [];
  const createdProductIds = [];
  const createdOrderIds = [];

  try {
    const activeCategory = await Category.findOne({ slug: 'grains-cereals', isActive: true });
    if (!activeCategory) throw new Error('Category grains-cereals not found');

    const stamp = Date.now();

    // 1. Create test users
    const farmer1 = await User.create({
      name: 'Farmer Seller One',
      email: `farmer1.${stamp}@agrifair.test`,
      password: 'password123',
      role: 'farmer',
      phone: `911${Math.floor(1000000 + Math.random() * 9000000)}`,
      isEmailVerified: true
    });
    createdUserIds.push(farmer1._id);

    const farmer2 = await User.create({
      name: 'Farmer Unrelated Two',
      email: `farmer2.${stamp}@agrifair.test`,
      password: 'password123',
      role: 'farmer',
      phone: `922${Math.floor(1000000 + Math.random() * 9000000)}`,
      isEmailVerified: true
    });
    createdUserIds.push(farmer2._id);

    const buyer1 = await User.create({
      name: 'Buyer Purchaser One',
      email: `buyer1.${stamp}@agrifair.test`,
      password: 'password123',
      role: 'buyer',
      phone: `933${Math.floor(1000000 + Math.random() * 9000000)}`,
      isEmailVerified: true
    });
    createdUserIds.push(buyer1._id);

    const buyer2 = await User.create({
      name: 'Buyer Unrelated Two',
      email: `buyer2.${stamp}@agrifair.test`,
      password: 'password123',
      role: 'buyer',
      phone: `944${Math.floor(1000000 + Math.random() * 9000000)}`,
      isEmailVerified: true
    });
    createdUserIds.push(buyer2._id);

    // 2. Create test products
    const activeProduct = await Product.create({
      name: 'Phase 4A Test Barley',
      category: activeCategory._id,
      owner: farmer1._id,
      price: 2200,
      quantity: 100,
      unit: 'quintal',
      location: { state: 'Punjab', district: 'Ludhiana', mandi: 'Khanna' },
      status: 'active'
    });
    createdProductIds.push(activeProduct._id);

    const draftProduct = await Product.create({
      name: 'Phase 4A Draft Barley',
      category: activeCategory._id,
      owner: farmer1._id,
      price: 1900,
      quantity: 50,
      unit: 'quintal',
      location: { state: 'Punjab', district: 'Ludhiana' },
      status: 'draft'
    });
    createdProductIds.push(draftProduct._id);

    const buyerOwnedProduct = await Product.create({
      name: 'Phase 4A Self Produce',
      category: activeCategory._id,
      owner: buyer1._id,
      price: 1500,
      quantity: 30,
      unit: 'quintal',
      location: { state: 'Haryana' },
      status: 'active'
    });
    createdProductIds.push(buyerOwnedProduct._id);

    console.log('[SETUP] Test users and products initialized.\n');

    // -----------------------------------------------------------------
    // TEST 1: Unauthenticated request rejected
    // -----------------------------------------------------------------
    console.log('--- Test 1: Unauthenticated request rejected ---');
    const unauthRes = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: activeProduct._id, quantity: 10 })
    });
    console.log(`Unauthenticated POST /api/orders: status=${unauthRes.status} (Expected 401)`);
    if (unauthRes.status !== 401) throw new Error('Unauthenticated request was not rejected with 401');

    // -----------------------------------------------------------------
    // TEST 2: Disallowed role rejected
    // -----------------------------------------------------------------
    console.log('\n--- Test 2: Disallowed role rejected (Farmer cannot create order) ---');
    const farmerRes = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer2._id)
      },
      body: JSON.stringify({ productId: activeProduct._id, quantity: 10 })
    });
    console.log(`Farmer POST /api/orders: status=${farmerRes.status} (Expected 403)`);
    if (farmerRes.status !== 403) throw new Error('Farmer role was not rejected with 403');

    // -----------------------------------------------------------------
    // TEST 3: Validation (Quantity, Product ID, Unit)
    // -----------------------------------------------------------------
    console.log('\n--- Test 3: Validation (Invalid IDs, Quantities, Units) ---');
    // Non-existent product
    const nonExistentRes = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({ productId: '60c72b2f9b1d8b2bad000000', quantity: 10 })
    });
    console.log(`Non-existent product ID: status=${nonExistentRes.status} (Expected 404)`);
    if (nonExistentRes.status !== 404) throw new Error('Non-existent product ID was not rejected with 404');

    // Negative/Zero quantity
    const zeroQtyRes = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({ productId: activeProduct._id, quantity: 0 })
    });
    console.log(`Zero quantity: status=${zeroQtyRes.status} (Expected 400)`);
    if (zeroQtyRes.status !== 400) throw new Error('Zero quantity was not rejected with 400');

    // Quantity exceeds available stock (150 > 100)
    const excessQtyRes = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({ productId: activeProduct._id, quantity: 150 })
    });
    console.log(`Excess quantity (150 > 100): status=${excessQtyRes.status} (Expected 400)`);
    if (excessQtyRes.status !== 400) throw new Error('Excess quantity was not rejected with 400');

    // Mismatched unit ('box' vs 'quintal')
    const unitMismatchRes = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({ productId: activeProduct._id, quantity: 10, unit: 'box' })
    });
    console.log(`Mismatched unit: status=${unitMismatchRes.status} (Expected 400)`);
    if (unitMismatchRes.status !== 400) throw new Error('Mismatched unit was not rejected with 400');

    // -----------------------------------------------------------------
    // TEST 4: Inactive/Draft product rejected
    // -----------------------------------------------------------------
    console.log('\n--- Test 4: Inactive/Draft product rejected ---');
    const draftOrderRes = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({ productId: draftProduct._id, quantity: 10 })
    });
    console.log(`Draft product order request: status=${draftOrderRes.status} (Expected 400)`);
    if (draftOrderRes.status !== 400) throw new Error('Draft product was not rejected with 400');

    // -----------------------------------------------------------------
    // TEST 5: Buyer cannot request their own product
    // -----------------------------------------------------------------
    console.log('\n--- Test 5: Buyer cannot request their own product ---');
    const selfOrderRes = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({ productId: buyerOwnedProduct._id, quantity: 5 })
    });
    console.log(`Self-order attempt: status=${selfOrderRes.status} (Expected 400)`);
    if (selfOrderRes.status !== 400) throw new Error('Self-order attempt was not rejected with 400');

    // -----------------------------------------------------------------
    // TEST 6: Valid buyer request persisted & Client overrides ignored
    // -----------------------------------------------------------------
    console.log('\n--- Test 6: Valid buyer request persisted & Client overrides ignored ---');
    const validOrderRes = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({
        productId: activeProduct._id,
        quantity: 25,
        unit: 'quintal',
        buyerMessage: 'Interested in purchasing 25 quintals for delivery next week.',
        // Malicious client overrides (must be completely ignored by server):
        buyer: farmer2._id,
        farmer: buyer1._id,
        status: 'accepted',
        priceSnapshot: 10,
        totalAmount: 250
      })
    });
    const validOrderData = await validOrderRes.json();
    console.log(`Valid Order Request: status=${validOrderRes.status}, orderId=${validOrderData.data?._id}`);
    if (validOrderRes.status !== 201 || !validOrderData.success) {
      throw new Error(`Valid order request failed: ${validOrderData.message}`);
    }

    const order1 = validOrderData.data;
    createdOrderIds.push(order1._id);

    // Verify security derivations:
    console.log(`Buyer derived: ${order1.buyer._id} (Expected ${buyer1._id})`);
    if (order1.buyer._id.toString() !== buyer1._id.toString()) throw new Error('Buyer ID was not derived from session');

    console.log(`Farmer derived: ${order1.farmer._id} (Expected ${farmer1._id})`);
    if (order1.farmer._id.toString() !== farmer1._id.toString()) throw new Error('Farmer ID was not derived from product');

    console.log(`Status initialized: ${order1.status} (Expected 'pending')`);
    if (order1.status !== 'pending') throw new Error('Status was not initialized to pending');

    console.log(`Price snapshot: ${order1.priceSnapshot} (Expected 2200)`);
    if (order1.priceSnapshot !== 2200) throw new Error('Price snapshot mismatch');

    console.log(`Total amount calculated: ${order1.totalAmount} (Expected 55000)`);
    if (order1.totalAmount !== 55000) throw new Error('Total amount calculation mismatch');

    // Confirm product stock is unchanged (no unsafe silent deduction)
    const checkProduct = await Product.findById(activeProduct._id);
    console.log(`Product Stock after order request: ${checkProduct.quantity} (Expected 100 - unchanged)`);
    if (checkProduct.quantity !== 100) throw new Error('Stock was prematurely altered in Phase 4A');

    // -----------------------------------------------------------------
    // TEST 7: Role-based order access (/mine and /:id)
    // -----------------------------------------------------------------
    console.log('\n--- Test 7: Role-based order access ---');
    // Buyer1 can see order in /mine
    const buyerMineRes = await fetch('http://localhost:5000/api/orders/mine', {
      headers: generateAuthHeader(buyer1._id)
    });
    const buyerMineData = await buyerMineRes.json();
    const buyerFoundOrder = buyerMineData.data?.some(o => o._id === order1._id);
    console.log(`Buyer1 /api/orders/mine: found=${buyerFoundOrder} (Expected true)`);
    if (!buyerFoundOrder) throw new Error('Buyer cannot view own order in /mine');

    // Farmer1 can see order in /mine
    const farmerMineRes = await fetch('http://localhost:5000/api/orders/mine', {
      headers: generateAuthHeader(farmer1._id)
    });
    const farmerMineData = await farmerMineRes.json();
    const farmerFoundOrder = farmerMineData.data?.some(o => o._id === order1._id);
    console.log(`Farmer1 /api/orders/mine: found=${farmerFoundOrder} (Expected true)`);
    if (!farmerFoundOrder) throw new Error('Farmer cannot view assigned order in /mine');

    // Single order view: Buyer1 and Farmer1 can view
    const buyerDetailRes = await fetch(`http://localhost:5000/api/orders/${order1._id}`, {
      headers: generateAuthHeader(buyer1._id)
    });
    console.log(`Buyer1 GET /api/orders/:id: status=${buyerDetailRes.status} (Expected 200)`);
    if (buyerDetailRes.status !== 200) throw new Error('Buyer1 failed to get order details');

    const farmerDetailRes = await fetch(`http://localhost:5000/api/orders/${order1._id}`, {
      headers: generateAuthHeader(farmer1._id)
    });
    console.log(`Farmer1 GET /api/orders/:id: status=${farmerDetailRes.status} (Expected 200)`);
    if (farmerDetailRes.status !== 200) throw new Error('Farmer1 failed to get order details');

    // Unrelated Buyer (buyer2) cannot view order
    const unrelatedBuyerRes = await fetch(`http://localhost:5000/api/orders/${order1._id}`, {
      headers: generateAuthHeader(buyer2._id)
    });
    console.log(`Unrelated Buyer2 GET /api/orders/:id: status=${unrelatedBuyerRes.status} (Expected 403)`);
    if (unrelatedBuyerRes.status !== 403) throw new Error('Unrelated buyer was not denied with 403');

    // Unrelated Farmer (farmer2) cannot view order
    const unrelatedFarmerRes = await fetch(`http://localhost:5000/api/orders/${order1._id}`, {
      headers: generateAuthHeader(farmer2._id)
    });
    console.log(`Unrelated Farmer2 GET /api/orders/:id: status=${unrelatedFarmerRes.status} (Expected 403)`);
    if (unrelatedFarmerRes.status !== 403) throw new Error('Unrelated farmer was not denied with 403');

    // -----------------------------------------------------------------
    // TEST 8: Status transition authorization & validation
    // -----------------------------------------------------------------
    console.log('\n--- Test 8: Status transition policy enforcement ---');
    // Invalid target status
    const invalidStatusRes = await fetch(`http://localhost:5000/api/orders/${order1._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({ status: 'shipped' })
    });
    console.log(`Invalid status 'shipped': status=${invalidStatusRes.status} (Expected 400)`);
    if (invalidStatusRes.status !== 400) throw new Error('Invalid status was not rejected with 400');

    // Buyer attempting to accept their own order (must be forbidden)
    const buyerAcceptRes = await fetch(`http://localhost:5000/api/orders/${order1._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({ status: 'accepted' })
    });
    console.log(`Buyer attempting to accept order: status=${buyerAcceptRes.status} (Expected 403)`);
    if (buyerAcceptRes.status !== 403) throw new Error('Buyer accepting own order was not blocked with 403');

    // Farmer attempting to cancel buyer's order (must be forbidden)
    const farmerCancelRes = await fetch(`http://localhost:5000/api/orders/${order1._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({ status: 'cancelled' })
    });
    console.log(`Farmer attempting to cancel buyer order: status=${farmerCancelRes.status} (Expected 403)`);
    if (farmerCancelRes.status !== 403) throw new Error('Farmer cancelling order was not blocked with 403');

    // -----------------------------------------------------------------
    // TEST 9: Farmer Acceptance & Terminal State Immutability
    // -----------------------------------------------------------------
    console.log('\n--- Test 9: Farmer accepts order & Terminal state enforcement ---');
    const acceptRes = await fetch(`http://localhost:5000/api/orders/${order1._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({
        status: 'accepted',
        note: 'Lot confirmed. Ready for pickup at Khanna mandi.'
      })
    });
    const acceptData = await acceptRes.json();
    console.log(`Farmer acceptance: status=${acceptRes.status}, newStatus=${acceptData.data?.status}`);
    if (acceptRes.status !== 200 || acceptData.data?.status !== 'accepted') {
      throw new Error('Farmer acceptance failed');
    }

    // Terminal state check: cannot cancel or reject once accepted
    const reCancelRes = await fetch(`http://localhost:5000/api/orders/${order1._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({ status: 'cancelled' })
    });
    console.log(`Modifying terminal accepted order: status=${reCancelRes.status} (Expected 400)`);
    if (reCancelRes.status !== 400) throw new Error('Modifying terminal order was not rejected with 400');

    // -----------------------------------------------------------------
    // TEST 10: Buyer Cancellation Flow
    // -----------------------------------------------------------------
    console.log('\n--- Test 10: Buyer cancellation flow on fresh request ---');
    const order2Res = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({
        productId: activeProduct._id,
        quantity: 10,
        buyerMessage: 'Testing cancellation flow'
      })
    });
    const order2Data = await order2Res.json();
    const order2Id = order2Data.data._id;
    createdOrderIds.push(order2Id);

    // Buyer cancels their pending order
    const cancelRes = await fetch(`http://localhost:5000/api/orders/${order2Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({
        status: 'cancelled',
        note: 'Order canceled due to logistics re-routing'
      })
    });
    const cancelData = await cancelRes.json();
    console.log(`Buyer cancellation: status=${cancelRes.status}, newStatus=${cancelData.data?.status}`);
    if (cancelRes.status !== 200 || cancelData.data?.status !== 'cancelled') {
      throw new Error('Buyer cancellation failed');
    }

    // Farmer attempting to accept a cancelled order
    const acceptCancelledRes = await fetch(`http://localhost:5000/api/orders/${order2Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({ status: 'accepted' })
    });
    console.log(`Farmer accepting cancelled order: status=${acceptCancelledRes.status} (Expected 400)`);
    if (acceptCancelledRes.status !== 400) throw new Error('Accepting cancelled order was not rejected with 400');

    // -----------------------------------------------------------------
    // TEST 11: Existing APIs remain unaffected
    // -----------------------------------------------------------------
    console.log('\n--- Test 11: Regression check on existing APIs ---');
    const healthRes = await fetch('http://localhost:5000/api/health');
    console.log(`Health check: status=${healthRes.status} (Expected 200)`);
    if (healthRes.status !== 200) throw new Error('Health check failed');

    const catRes = await fetch('http://localhost:5000/api/categories');
    const catData = await catRes.json();
    console.log(`Categories count: ${catData.count} (Expected 7)`);
    if (catData.count !== 7) throw new Error('Categories count changed');

    const prodRes = await fetch('http://localhost:5000/api/products');
    console.log(`Public products endpoint: status=${prodRes.status} (Expected 200)`);
    if (prodRes.status !== 200) throw new Error('Public products endpoint failed');

    console.log('\n================================================================');
    console.log('   ALL PHASE 4A TESTS COMPLETED SUCCESSFULLY (100% PASS)');
    console.log('================================================================');
  } finally {
    // -----------------------------------------------------------------
    // CLEANUP: Purge test data cleanly
    // -----------------------------------------------------------------
    console.log('\n--- Cleanup: Purging temporary test records ---');
    if (createdOrderIds.length > 0) {
      const delOrders = await Order.deleteMany({ _id: { $in: createdOrderIds } });
      console.log(`Deleted test orders: ${delOrders.deletedCount}`);
    }

    if (createdProductIds.length > 0) {
      const delProds = await Product.deleteMany({ _id: { $in: createdProductIds } });
      console.log(`Deleted test products: ${delProds.deletedCount}`);
    }

    if (createdUserIds.length > 0) {
      const delUsers = await User.deleteMany({ _id: { $in: createdUserIds } });
      console.log(`Deleted test users: ${delUsers.deletedCount}`);
    }

    const finalOrderCount = await Order.countDocuments();
    const finalProductCount = await Product.countDocuments();
    console.log(`[INTEGRITY] Database state: Orders=${finalOrderCount} (Initial was ${initialOrderCount}), Products=${finalProductCount} (Initial was ${initialProductCount})`);

    if (finalOrderCount !== initialOrderCount || finalProductCount !== initialProductCount) {
      console.error('ERROR: Database count mismatch after cleanup!');
    } else {
      console.log('>> SUCCESS: Zero real data modified. Database integrity verified.');
    }

    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

runPhase4ATests().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
