const dns = require('dns');
const http = require('http');
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
  const token = jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: '1h' });
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const sendRequest = ({ method, path, headers = {}, body = null }) =>
  new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      ...headers,
      ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
    };

    const req = http.request(
      'http://localhost:5000' + path,
      { method, headers: reqHeaders },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });

async function runPhase5FTests() {
  console.log('================================================================');
  console.log('  AGRIFAIR — PHASE 5F: FARMER–BUYER WORKFLOW TEST SUITE');
  console.log('================================================================\n');

  await mongoose.connect(config.mongodbUri);
  console.log(`[INIT] Connected to Database: ${mongoose.connection.host}/${mongoose.connection.name}`);

  const createdUserIds = [];
  const createdProductIds = [];
  const createdOrderIds = [];

  let passed = 0;
  let total = 0;

  const assert = (title, condition, extra = '') => {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] Test ${total}: ${title}`);
    } else {
      console.log(`[FAIL] Test ${total}: ${title} - ${extra}`);
    }
  };

  try {
    const activeCategory = await Category.findOne({ isActive: true });
    if (!activeCategory) throw new Error('No active category found in DB');

    const stamp = Date.now();

    // 1. Create farmer and buyer users
    const farmer = await User.create({
      name: `Farmer 5F ${stamp}`,
      email: `farmer5f.${stamp}@agrifair.test`,
      password: 'password123',
      role: 'farmer',
      phone: `915${Math.floor(1000000 + Math.random() * 9000000)}`,
      isEmailVerified: true
    });
    createdUserIds.push(farmer._id);

    const buyer1 = await User.create({
      name: `Buyer 5F ${stamp}`,
      email: `buyer5f.${stamp}@agrifair.test`,
      password: 'password123',
      role: 'buyer',
      phone: `916${Math.floor(1000000 + Math.random() * 9000000)}`,
      isEmailVerified: true
    });
    createdUserIds.push(buyer1._id);

    const buyer2 = await User.create({
      name: `Buyer Two 5F ${stamp}`,
      email: `buyer2_5f.${stamp}@agrifair.test`,
      password: 'password123',
      role: 'wholesaler',
      phone: `917${Math.floor(1000000 + Math.random() * 9000000)}`,
      isEmailVerified: true
    });
    createdUserIds.push(buyer2._id);

    const farmerAuth = generateAuthHeader(farmer._id);
    const buyer1Auth = generateAuthHeader(buyer1._id);
    const buyer2Auth = generateAuthHeader(buyer2._id);

    // 2. Create test product listing (Quantity: 100 quintals, Price: ₹2400)
    const product = await Product.create({
      name: `Test Basmati Lot 5F ${stamp}`,
      description: 'Verified test produce lot for Phase 5F workflow',
      category: activeCategory._id,
      owner: farmer._id,
      price: 2400,
      currency: 'INR',
      quantity: 100,
      unit: 'quintal',
      location: { state: 'Punjab', district: 'Ludhiana', mandi: 'Khanna Mandi' },
      status: 'active'
    });
    createdProductIds.push(product._id);

    // ==========================================
    // TEST 1: Valid purchase inquiry submission
    // ==========================================
    const orderRes1 = await sendRequest({
      method: 'POST',
      path: '/api/orders',
      headers: buyer1Auth,
      body: {
        productId: product._id,
        quantity: 40,
        unit: 'quintal',
        buyerMessage: 'Phase 5F verification purchase request'
      }
    });

    assert(
      'Buyer can create purchase inquiry with valid quantity and server snapshot totals',
      orderRes1.status === 201 &&
        orderRes1.data?.success === true &&
        orderRes1.data.data.priceSnapshot === 2400 &&
        orderRes1.data.data.totalAmount === 96000 &&
        orderRes1.data.data.status === 'pending' &&
        orderRes1.data.data.isStockDeducted === false,
      `Status: ${orderRes1.status}, data: ${JSON.stringify(orderRes1.data)}`
    );

    const orderId1 = orderRes1.data?.data?._id;
    if (orderId1) createdOrderIds.push(orderId1);

    // ==========================================
    // TEST 2: Inability to request more than available stock
    // ==========================================
    const overStockRes = await sendRequest({
      method: 'POST',
      path: '/api/orders',
      headers: buyer2Auth,
      body: {
        productId: product._id,
        quantity: 150, // exceeds 100 stock
        unit: 'quintal'
      }
    });

    assert(
      'Server rejects order when requested quantity exceeds available listing stock (400)',
      overStockRes.status === 400 && overStockRes.data?.success === false,
      `Status: ${overStockRes.status}, message: ${overStockRes.data?.message}`
    );

    // ==========================================
    // TEST 3: Duplicate pending inquiry prevention
    // ==========================================
    const dupPendingRes = await sendRequest({
      method: 'POST',
      path: '/api/orders',
      headers: buyer1Auth, // same buyer who already has pending orderId1
      body: {
        productId: product._id,
        quantity: 10,
        unit: 'quintal'
      }
    });

    assert(
      'Server prevents duplicate active pending inquiries from same buyer for same lot (400)',
      dupPendingRes.status === 400 &&
        dupPendingRes.data?.message?.includes('already have an active pending purchase inquiry'),
      `Status: ${dupPendingRes.status}, message: ${dupPendingRes.data?.message}`
    );

    // ==========================================
    // TEST 4: Buyer cancellation of pending order
    // ==========================================
    const cancelRes = await sendRequest({
      method: 'PATCH',
      path: `/api/orders/${orderId1}/status`,
      headers: buyer1Auth,
      body: {
        status: 'cancelled',
        note: 'Buyer cancellation test'
      }
    });

    assert(
      'Buyer can cancel their own pending purchase request',
      cancelRes.status === 200 && cancelRes.data?.data?.status === 'cancelled',
      `Status: ${cancelRes.status}`
    );

    // ==========================================
    // TEST 5: Terminal order immutability
    // ==========================================
    const modTerminalRes = await sendRequest({
      method: 'PATCH',
      path: `/api/orders/${orderId1}/status`,
      headers: farmerAuth,
      body: {
        status: 'accepted'
      }
    });

    assert(
      'Terminal order (cancelled) cannot be transitioned to any other state (400)',
      modTerminalRes.status === 400 &&
        modTerminalRes.data?.message?.includes('already in terminal state'),
      `Status: ${modTerminalRes.status}, message: ${modTerminalRes.data?.message}`
    );

    // ==========================================
    // TEST 6: Atomic Stock Deduction on Farmer Acceptance
    // ==========================================
    // Buyer2 places order for 60 quintals
    const orderRes2 = await sendRequest({
      method: 'POST',
      path: '/api/orders',
      headers: buyer2Auth,
      body: {
        productId: product._id,
        quantity: 60,
        unit: 'quintal'
      }
    });
    const orderId2 = orderRes2.data?.data?._id;
    createdOrderIds.push(orderId2);

    // Farmer accepts order 2
    const acceptRes = await sendRequest({
      method: 'PATCH',
      path: `/api/orders/${orderId2}/status`,
      headers: farmerAuth,
      body: {
        status: 'accepted',
        note: 'Order accepted, batch allocated'
      }
    });

    const refreshedProduct = await Product.findById(product._id);

    assert(
      'Farmer acceptance atomically reduces available stock (100 - 60 = 40) and marks isStockDeducted=true',
      acceptRes.status === 200 &&
        acceptRes.data?.data?.status === 'accepted' &&
        acceptRes.data.data.isStockDeducted === true &&
        refreshedProduct.quantity === 40,
      `Product quantity: ${refreshedProduct.quantity}`
    );

    // ==========================================
    // TEST 7: Overselling Prevention on Acceptance
    // ==========================================
    // Buyer1 places order for 50 quintals (when only 40 are available in DB)
    // Wait, buyer1's order was cancelled so buyer1 can place a new order now!
    // But since available stock is 40, let's create a pending order for 35, then another order for 30
    const orderRes3 = await sendRequest({
      method: 'POST',
      path: '/api/orders',
      headers: buyer1Auth,
      body: {
        productId: product._id,
        quantity: 35,
        unit: 'quintal'
      }
    });
    const orderId3 = orderRes3.data?.data?._id;
    createdOrderIds.push(orderId3);

    // Now manually reduce product quantity in DB to 20 to simulate concurrent depletion
    await Product.updateOne({ _id: product._id }, { quantity: 20 });

    const oversellAcceptRes = await sendRequest({
      method: 'PATCH',
      path: `/api/orders/${orderId3}/status`,
      headers: farmerAuth,
      body: {
        status: 'accepted'
      }
    });

    assert(
      'Server blocks order acceptance if remaining stock is less than requested quantity (400)',
      oversellAcceptRes.status === 400 &&
        oversellAcceptRes.data?.message?.includes('exceeds currently available listing stock'),
      `Status: ${oversellAcceptRes.status}, message: ${oversellAcceptRes.data?.message}`
    );

    // Restore product stock back to 40 for subsequent lifecycle test
    await Product.updateOne({ _id: product._id }, { quantity: 40 });

    // ==========================================
    // TEST 8: Strict Lifecycle Transitions without Skipping
    // ==========================================
    // Try skipping from 'accepted' directly to 'delivered' on orderId2
    const skipRes = await sendRequest({
      method: 'PATCH',
      path: `/api/orders/${orderId2}/status`,
      headers: farmerAuth,
      body: {
        status: 'delivered'
      }
    });

    assert(
      'Server prevents skipping delivery lifecycle stages (e.g. accepted directly to delivered) (400)',
      skipRes.status === 400 && skipRes.data?.message?.includes('Invalid status transition'),
      `Status: ${skipRes.status}, message: ${skipRes.data?.message}`
    );

    // ==========================================
    // TEST 9: Stepwise progression: accepted -> ready_for_dispatch -> shipped -> out_for_delivery -> delivered
    // ==========================================
    const s1 = await sendRequest({
      method: 'PATCH',
      path: `/api/orders/${orderId2}/status`,
      headers: farmerAuth,
      body: { status: 'ready_for_dispatch', note: 'Packed at farm' }
    });
    const s2 = await sendRequest({
      method: 'PATCH',
      path: `/api/orders/${orderId2}/status`,
      headers: farmerAuth,
      body: { status: 'shipped', note: 'Loaded onto truck' }
    });
    const s3 = await sendRequest({
      method: 'PATCH',
      path: `/api/orders/${orderId2}/status`,
      headers: farmerAuth,
      body: { status: 'out_for_delivery', note: 'Arrived at destination mandi' }
    });
    const s4 = await sendRequest({
      method: 'PATCH',
      path: `/api/orders/${orderId2}/status`,
      headers: farmerAuth,
      body: { status: 'delivered', note: 'Received by buyer' }
    });

    assert(
      'Sequential delivery stages advance cleanly with authentic statusHistory timeline',
      s1.status === 200 &&
        s2.status === 200 &&
        s3.status === 200 &&
        s4.status === 200 &&
        s4.data?.data?.status === 'delivered' &&
        s4.data.data.statusHistory?.length >= 5,
      `Final status: ${s4.data?.data?.status}, history count: ${s4.data?.data?.statusHistory?.length}`
    );

    // ==========================================
    // TEST 10: Stock Restoration on Accepted Order Cancellation
    // ==========================================
    // Create new order for 20 quintals, accept it (stock becomes 40 - 20 = 20)
    const orderRes4 = await sendRequest({
      method: 'POST',
      path: '/api/orders',
      headers: buyer2Auth,
      body: {
        productId: product._id,
        quantity: 20,
        unit: 'quintal'
      }
    });
    const orderId4 = orderRes4.data?.data?._id;
    createdOrderIds.push(orderId4);

    await sendRequest({
      method: 'PATCH',
      path: `/api/orders/${orderId4}/status`,
      headers: farmerAuth,
      body: { status: 'accepted' }
    });

    const stockAfterAccept = (await Product.findById(product._id)).quantity;

    // Farmer cancels the accepted order before dispatch
    const cancelAcceptedRes = await sendRequest({
      method: 'PATCH',
      path: `/api/orders/${orderId4}/status`,
      headers: farmerAuth,
      body: { status: 'cancelled', note: 'Pre-dispatch cancellation due to weather delay' }
    });

    const stockAfterCancel = (await Product.findById(product._id)).quantity;

    assert(
      'Cancelling an accepted order restores product stock cleanly without leaks (20 -> 40)',
      cancelAcceptedRes.status === 200 &&
        cancelAcceptedRes.data?.data?.status === 'cancelled' &&
        stockAfterAccept === 20 &&
        stockAfterCancel === 40,
      `Stock before cancel: ${stockAfterAccept}, after cancel: ${stockAfterCancel}`
    );

    console.log('\n----------------------------------------------------------------');
    console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
    console.log('================================================================\n');

    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('[TEST SUITE ERROR]:', err);
    process.exit(1);
  } finally {
    // Clean up temporary test documents
    console.log('[CLEANUP] Removing test documents...');
    if (createdOrderIds.length > 0) {
      await Order.deleteMany({ _id: { $in: createdOrderIds } });
    }
    if (createdProductIds.length > 0) {
      await Product.deleteMany({ _id: { $in: createdProductIds } });
    }
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    await mongoose.disconnect();
    console.log('[CLEANUP] Done.');
  }
}

runPhase5FTests().catch((err) => {
  console.error('[FATAL]:', err);
  process.exit(1);
});
