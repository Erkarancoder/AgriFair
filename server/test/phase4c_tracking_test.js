const http = require('http');
const dns = require('dns');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');
const Category = require('../src/models/Category');
const { Product } = require('../src/models/Product');
const { Order } = require('../src/models/Order');
const User = require('../src/models/User');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore DNS override errors
}

const generateAuthHeader = (userId) => {
  const token = jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: '1h'
  });
  return { Authorization: `Bearer ${token}` };
};

async function runPhase4CTests() {
  console.log('================================================================');
  console.log('   AGRIFAIR PHASE 4C: REAL ORDER TRACKING & STATUS TIMELINE TEST');
  console.log('================================================================\n');

  await mongoose.connect(config.mongodbUri);
  console.log(`[INIT] Connected to Database: ${mongoose.connection.host}/${mongoose.connection.name}`);

  // Start test server on ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[INIT] Test server listening on ${baseUrl}\n`);

  const initialOrderCount = await Order.countDocuments();
  const initialProductCount = await Product.countDocuments();
  const initialUserCount = await User.countDocuments();
  console.log(`[BASELINE] Existing Real DB State: Orders = ${initialOrderCount}, Products = ${initialProductCount}, Users = ${initialUserCount}\n`);

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

    // 2. Create test product
    const testProduct = await Product.create({
      name: 'Phase 4C Test Wheat Lot',
      category: activeCategory._id,
      owner: farmer1._id,
      price: 2400,
      quantity: 500,
      unit: 'quintal',
      location: { state: 'Punjab', district: 'Ludhiana', mandi: 'Khanna' },
      status: 'active'
    });
    createdProductIds.push(testProduct._id);

    console.log('[SETUP] Test users and product initialized.\n');

    // -----------------------------------------------------------------
    // TEST 1: Full Valid Sequential Delivery Pipeline
    // pending -> accepted -> ready_for_dispatch -> shipped -> out_for_delivery -> delivered
    // -----------------------------------------------------------------
    console.log('--- Test 1: Full Valid Sequential Delivery Pipeline ---');
    // Step A: Buyer 1 creates order
    const orderCreateRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({
        productId: testProduct._id,
        quantity: 50,
        buyerMessage: 'Delivery needed by weekend at regional mandi.'
      })
    });
    const orderCreateData = await orderCreateRes.json();
    console.log(`Order creation: status=${orderCreateRes.status}, initialStatus=${orderCreateData.data?.status} (Expected 201 & pending)`);
    if (orderCreateRes.status !== 201 || orderCreateData.data.status !== 'pending') {
      throw new Error('Order creation failed');
    }
    const order1Id = orderCreateData.data._id;
    createdOrderIds.push(order1Id);

    // Step B: Farmer 1 accepts order
    const acceptRes = await fetch(`${baseUrl}/api/orders/${order1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({
        status: 'accepted',
        note: 'Order confirmed and allocated from batch A1.'
      })
    });
    const acceptData = await acceptRes.json();
    console.log(`Stage 1 (accepted): status=${acceptRes.status}, currentStatus=${acceptData.data?.status} (Expected 200 & accepted)`);
    if (acceptRes.status !== 200 || acceptData.data.status !== 'accepted') {
      throw new Error('Farmer acceptance failed');
    }

    // Step C: Farmer 1 marks ready_for_dispatch
    const dispatchRes = await fetch(`${baseUrl}/api/orders/${order1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({
        status: 'ready_for_dispatch',
        note: '50 bags cleaned, weighed, and tagged on dock.'
      })
    });
    const dispatchData = await dispatchRes.json();
    console.log(`Stage 2 (ready_for_dispatch): status=${dispatchRes.status}, currentStatus=${dispatchData.data?.status} (Expected 200 & ready_for_dispatch)`);
    if (dispatchRes.status !== 200 || dispatchData.data.status !== 'ready_for_dispatch') {
      throw new Error('Marking ready_for_dispatch failed');
    }

    // Step D: Farmer 1 marks shipped
    const shippedRes = await fetch(`${baseUrl}/api/orders/${order1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({
        status: 'shipped',
        note: 'Consignment handed to regional logistics carrier truck.'
      })
    });
    const shippedData = await shippedRes.json();
    console.log(`Stage 3 (shipped): status=${shippedRes.status}, currentStatus=${shippedData.data?.status} (Expected 200 & shipped)`);
    if (shippedRes.status !== 200 || shippedData.data.status !== 'shipped') {
      throw new Error('Marking shipped failed');
    }

    // Step E: Farmer 1 marks out_for_delivery
    const outRes = await fetch(`${baseUrl}/api/orders/${order1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({
        status: 'out_for_delivery',
        note: 'Truck arrived at local mandi dock, final delivery run started.'
      })
    });
    const outData = await outRes.json();
    console.log(`Stage 4 (out_for_delivery): status=${outRes.status}, currentStatus=${outData.data?.status} (Expected 200 & out_for_delivery)`);
    if (outRes.status !== 200 || outData.data.status !== 'out_for_delivery') {
      throw new Error('Marking out_for_delivery failed');
    }

    // Step F: Farmer 1 marks delivered
    const deliveredRes = await fetch(`${baseUrl}/api/orders/${order1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({
        status: 'delivered',
        note: 'Produce unloaded and physically acknowledged by buyer.'
      })
    });
    const deliveredData = await deliveredRes.json();
    console.log(`Stage 5 (delivered): status=${deliveredRes.status}, currentStatus=${deliveredData.data?.status} (Expected 200 & delivered)`);
    if (deliveredRes.status !== 200 || deliveredData.data.status !== 'delivered') {
      throw new Error('Marking delivered failed');
    }

    // Verify all 6 status history entries exist with timestamps and notes
    if (deliveredData.data.statusHistory?.length !== 6) {
      throw new Error(`Expected exactly 6 statusHistory entries, found ${deliveredData.data.statusHistory?.length}`);
    }
    console.log(`>> Status history integrity verified: ${deliveredData.data.statusHistory.length} audit records.`);

    // -----------------------------------------------------------------
    // TEST 2: Invalid & Skipped Status Transitions
    // -----------------------------------------------------------------
    console.log('\n--- Test 2: Invalid & Skipped Transitions Rejection ---');
    // Create fresh pending Order B
    const orderBRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({ productId: testProduct._id, quantity: 20 })
    });
    const orderBData = await orderBRes.json();
    const orderBId = orderBData.data._id;
    createdOrderIds.push(orderBId);

    // Try skipping from pending to shipped
    const skipShippedRes = await fetch(`${baseUrl}/api/orders/${orderBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({ status: 'shipped' })
    });
    console.log(`Skipped transition (pending -> shipped): status=${skipShippedRes.status} (Expected 400)`);
    if (skipShippedRes.status !== 400) throw new Error('Skipped transition to shipped was not rejected with 400');

    // Try skipping from pending to delivered
    const skipDeliveredRes = await fetch(`${baseUrl}/api/orders/${orderBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({ status: 'delivered' })
    });
    console.log(`Skipped transition (pending -> delivered): status=${skipDeliveredRes.status} (Expected 400)`);
    if (skipDeliveredRes.status !== 400) throw new Error('Skipped transition to delivered was not rejected with 400');

    // Advance Order B to accepted
    await fetch(`${baseUrl}/api/orders/${orderBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({ status: 'accepted' })
    });

    // Try skipping from accepted to delivered
    const skipAcceptedDelivered = await fetch(`${baseUrl}/api/orders/${orderBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({ status: 'delivered' })
    });
    console.log(`Skipped transition (accepted -> delivered): status=${skipAcceptedDelivered.status} (Expected 400)`);
    if (skipAcceptedDelivered.status !== 400) throw new Error('Skipped transition accepted->delivered was not rejected with 400');

    // Try backward transition: accepted -> pending
    const backwardRes = await fetch(`${baseUrl}/api/orders/${orderBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({ status: 'pending' })
    });
    console.log(`Backward transition (accepted -> pending): status=${backwardRes.status} (Expected 400)`);
    if (backwardRes.status !== 400) throw new Error('Backward transition was not rejected with 400');

    // Try invalid / unknown status
    const invalidStatusRes = await fetch(`${baseUrl}/api/orders/${orderBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({ status: 'flying_in_sky' })
    });
    console.log(`Invalid status string: status=${invalidStatusRes.status} (Expected 400)`);
    if (invalidStatusRes.status !== 400) throw new Error('Invalid status was not rejected with 400');

    // -----------------------------------------------------------------
    // TEST 3: Terminal States are Immutable
    // -----------------------------------------------------------------
    console.log('\n--- Test 3: Terminal States Immutability ---');
    // Order 1 is delivered (terminal)
    const mutateDeliveredRes = await fetch(`${baseUrl}/api/orders/${order1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({ status: 'shipped' })
    });
    console.log(`Attempt to mutate delivered order: status=${mutateDeliveredRes.status} (Expected 400)`);
    if (mutateDeliveredRes.status !== 400) throw new Error('Mutating delivered order was not rejected with 400');

    // Create Order C and reject it (terminal)
    const orderCRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({ productId: testProduct._id, quantity: 15 })
    });
    const orderCData = await orderCRes.json();
    const orderCId = orderCData.data._id;
    createdOrderIds.push(orderCId);

    await fetch(`${baseUrl}/api/orders/${orderCId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({ status: 'rejected', note: 'Out of stock for this grade.' })
    });

    const mutateRejectedRes = await fetch(`${baseUrl}/api/orders/${orderCId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({ status: 'accepted' })
    });
    console.log(`Attempt to mutate rejected order: status=${mutateRejectedRes.status} (Expected 400)`);
    if (mutateRejectedRes.status !== 400) throw new Error('Mutating rejected order was not rejected with 400');

    // Create Order D and cancel it (terminal)
    const orderDRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({ productId: testProduct._id, quantity: 10 })
    });
    const orderDData = await orderDRes.json();
    const orderDId = orderDData.data._id;
    createdOrderIds.push(orderDId);

    await fetch(`${baseUrl}/api/orders/${orderDId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({ status: 'cancelled', note: 'Changed mind.' })
    });

    const mutateCancelledRes = await fetch(`${baseUrl}/api/orders/${orderDId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({ status: 'accepted' })
    });
    console.log(`Attempt to mutate cancelled order: status=${mutateCancelledRes.status} (Expected 400)`);
    if (mutateCancelledRes.status !== 400) throw new Error('Mutating cancelled order was not rejected with 400');

    // -----------------------------------------------------------------
    // TEST 4: Buyer Cancellation Rules
    // -----------------------------------------------------------------
    console.log('\n--- Test 4: Buyer Cancellation Rules ---');
    // Order B is currently accepted. Buyer tries to cancel accepted order
    const cancelAcceptedRes = await fetch(`${baseUrl}/api/orders/${orderBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({ status: 'cancelled' })
    });
    console.log(`Buyer attempt to cancel accepted order: status=${cancelAcceptedRes.status} (Expected 400)`);
    if (cancelAcceptedRes.status !== 400) throw new Error('Cancelling accepted order was not rejected with 400');

    // Farmer tries to cancel an order
    const farmerCancelRes = await fetch(`${baseUrl}/api/orders/${orderBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({ status: 'cancelled' })
    });
    console.log(`Farmer attempt to cancel order: status=${farmerCancelRes.status} (Expected 403)`);
    if (farmerCancelRes.status !== 403) throw new Error('Farmer cancellation was not rejected with 403');

    // -----------------------------------------------------------------
    // TEST 5: Security & Role Boundaries
    // -----------------------------------------------------------------
    console.log('\n--- Test 5: Authorization & Cross-User Security ---');
    // Unauthenticated request to /track
    const unauthTrackRes = await fetch(`${baseUrl}/api/orders/${order1Id}/track`);
    console.log(`Unauthenticated GET /api/orders/:id/track: status=${unauthTrackRes.status} (Expected 401)`);
    if (unauthTrackRes.status !== 401) throw new Error('Unauthenticated tracking view was not rejected with 401');

    // Cross-buyer (Buyer 2) attempts to view tracking of Buyer 1's order
    const crossBuyerRes = await fetch(`${baseUrl}/api/orders/${order1Id}/track`, {
      headers: generateAuthHeader(buyer2._id)
    });
    console.log(`Cross-buyer GET /api/orders/:id/track: status=${crossBuyerRes.status} (Expected 403)`);
    if (crossBuyerRes.status !== 403) throw new Error('Cross-buyer tracking view was not rejected with 403');

    // Cross-farmer (Farmer 2) attempts to view tracking of Farmer 1's order
    const crossFarmerRes = await fetch(`${baseUrl}/api/orders/${order1Id}/track`, {
      headers: generateAuthHeader(farmer2._id)
    });
    console.log(`Cross-farmer GET /api/orders/:id/track: status=${crossFarmerRes.status} (Expected 403)`);
    if (crossFarmerRes.status !== 403) throw new Error('Cross-farmer tracking view was not rejected with 403');

    // Cross-farmer (Farmer 2) attempts to update status on Farmer 1's order
    const crossFarmerUpdateRes = await fetch(`${baseUrl}/api/orders/${orderBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer2._id)
      },
      body: JSON.stringify({ status: 'ready_for_dispatch' })
    });
    console.log(`Cross-farmer PATCH /api/orders/:id/status: status=${crossFarmerUpdateRes.status} (Expected 403)`);
    if (crossFarmerUpdateRes.status !== 403) throw new Error('Cross-farmer update was not rejected with 403');

    // Buyer attempts to update delivery stage (e.g. ready_for_dispatch)
    const buyerDeliveryUpdate = await fetch(`${baseUrl}/api/orders/${orderBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer1._id)
      },
      body: JSON.stringify({ status: 'ready_for_dispatch' })
    });
    console.log(`Buyer attempt to update delivery stage: status=${buyerDeliveryUpdate.status} (Expected 403)`);
    if (buyerDeliveryUpdate.status !== 403) throw new Error('Buyer delivery update was not rejected with 403');

    // -----------------------------------------------------------------
    // TEST 6: Real Tracking API Timeline Output
    // -----------------------------------------------------------------
    console.log('\n--- Test 6: Tracking Endpoint Timeline Output ---');
    // Buyer 1 views own tracking timeline
    const buyerTrackRes = await fetch(`${baseUrl}/api/orders/${order1Id}/track`, {
      headers: generateAuthHeader(buyer1._id)
    });
    const buyerTrackData = await buyerTrackRes.json();
    console.log(`Buyer tracking query: status=${buyerTrackRes.status}, historyCount=${buyerTrackData.data?.statusHistory?.length} (Expected 200 & 6)`);
    if (buyerTrackRes.status !== 200 || buyerTrackData.data.statusHistory.length !== 6) {
      throw new Error('Buyer tracking query failed');
    }

    // Farmer 1 views assigned tracking timeline
    const farmerTrackRes = await fetch(`${baseUrl}/api/orders/${order1Id}/track`, {
      headers: generateAuthHeader(farmer1._id)
    });
    const farmerTrackData = await farmerTrackRes.json();
    console.log(`Farmer tracking query: status=${farmerTrackRes.status}, status=${farmerTrackData.data?.status} (Expected 200 & delivered)`);
    if (farmerTrackRes.status !== 200 || farmerTrackData.data.status !== 'delivered') {
      throw new Error('Farmer tracking query failed');
    }

    // Farmer views only their assigned orders
    const farmerMineRes = await fetch(`${baseUrl}/api/orders/mine?role=farmer`, {
      headers: generateAuthHeader(farmer1._id)
    });
    const farmerMineData = await farmerMineRes.json();
    const allAssignedToFarmer1 = farmerMineData.data.every(o => o.farmer._id.toString() === farmer1._id.toString());
    console.log(`Farmer getMyOrders: count=${farmerMineData.count}, allAssigned=${allAssignedToFarmer1} (Expected true)`);
    if (!allAssignedToFarmer1) throw new Error('Farmer saw orders not assigned to them');

    // -----------------------------------------------------------------
    // TEST 7: Regression Checks on Existing APIs
    // -----------------------------------------------------------------
    console.log('\n--- Test 7: Regression Checks on Core APIs ---');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    console.log(`Health check: status=${healthRes.status} (Expected 200)`);
    if (healthRes.status !== 200) throw new Error('Health check failed');

    const catRes = await fetch(`${baseUrl}/api/categories`);
    const catData = await catRes.json();
    console.log(`Categories count: ${catData.count} (Expected 7)`);
    if (catData.count !== 7) throw new Error('Categories count regression');

    const prodRes = await fetch(`${baseUrl}/api/products`);
    console.log(`Public products endpoint: status=${prodRes.status} (Expected 200)`);
    if (prodRes.status !== 200) throw new Error('Public products endpoint failed');

    console.log('\n================================================================');
    console.log('   ALL PHASE 4C TESTS COMPLETED SUCCESSFULLY (100% PASS)');
    console.log('================================================================');
  } finally {
    // -----------------------------------------------------------------
    // CLEANUP: Purge test data cleanly and verify baseline
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
    const finalUserCount = await User.countDocuments();
    console.log(`[INTEGRITY] Database state: Orders=${finalOrderCount} (Initial was ${initialOrderCount}), Products=${finalProductCount} (Initial was ${initialProductCount}), Users=${finalUserCount} (Initial was ${initialUserCount})`);

    if (
      finalOrderCount !== initialOrderCount ||
      finalProductCount !== initialProductCount ||
      finalUserCount !== initialUserCount
    ) {
      console.error('ERROR: Database count mismatch after cleanup!');
      process.exitCode = 1;
    } else {
      console.log('>> SUCCESS: Zero real data modified. Database baseline restored.');
    }

    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    console.log('Test server closed and database disconnected.');
  }
}

runPhase4CTests().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
