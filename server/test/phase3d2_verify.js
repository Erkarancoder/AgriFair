const dns = require('dns');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('../src/config/env');
const Category = require('../src/models/Category');
const { Product } = require('../src/models/Product');
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

async function runPhase3D2Verification() {
  console.log('=== AgriFair Phase 3D-2 Farmer Listing Verification ===\n');

  await mongoose.connect(config.mongodbUri);
  console.log(`[1] Connected to DB: ${mongoose.connection.host}/${mongoose.connection.name}`);

  // Fetch valid active category
  const grainCat = await Category.findOne({ slug: 'grains-cereals', isActive: true });
  if (!grainCat) throw new Error('Category grains-cereals not found in DB');

  // Create two temporary test farmers and one buyer
  const farmer1 = await User.create({
    name: 'Farmer Test One',
    email: `farmer1.${Date.now()}@agrifair.test`,
    password: 'password123',
    role: 'farmer',
    phone: `911${Math.floor(1000000 + Math.random() * 9000000)}`,
    isEmailVerified: true
  });

  const farmer2 = await User.create({
    name: 'Farmer Test Two',
    email: `farmer2.${Date.now()}@agrifair.test`,
    password: 'password123',
    role: 'farmer',
    phone: `922${Math.floor(1000000 + Math.random() * 9000000)}`,
    isEmailVerified: true
  });

  const buyer = await User.create({
    name: 'Buyer Test One',
    email: `buyer.${Date.now()}@agrifair.test`,
    password: 'password123',
    role: 'buyer',
    phone: `933${Math.floor(1000000 + Math.random() * 9000000)}`,
    isEmailVerified: true
  });

  console.log(`[2] Created test users: Farmer 1 (${farmer1._id}), Farmer 2 (${farmer2._id}), Buyer (${buyer._id})`);

  let createdProduct1Id = null;

  try {
    // 3. Test: Unauthenticated requests being rejected
    const unauthRes = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Unauth Crop' })
    });
    console.log(`[3] Unauthenticated POST /api/products -> Status: ${unauthRes.status} (Expected 401)`);
    if (unauthRes.status !== 401) throw new Error('Unauthenticated request was not rejected with 401');

    // 4. Test: Non-farmer users being denied listing mutations (buyer trying to create listing)
    const buyerRes = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyer._id)
      },
      body: JSON.stringify({
        name: 'Buyer Produce Listing',
        categoryId: grainCat._id,
        price: 2500,
        quantity: 50,
        unit: 'quintal',
        location: { state: 'Haryana' }
      })
    });
    console.log(`[4] Non-farmer (buyer) POST /api/products -> Status: ${buyerRes.status} (Expected 403 Forbidden)`);
    if (buyerRes.status !== 403) throw new Error('Buyer was not denied with 403');

    // 5. Test: Invalid price, quantity, category, and unit being rejected
    const invalidPayloads = [
      { name: 'A', price: 100, quantity: 10, categoryId: grainCat._id, unit: 'quintal', location: { state: 'Punjab' }, reason: 'Name too short' },
      { name: 'Valid Wheat', price: -10, quantity: 10, categoryId: grainCat._id, unit: 'quintal', location: { state: 'Punjab' }, reason: 'Negative price' },
      { name: 'Valid Wheat', price: 100, quantity: -5, categoryId: grainCat._id, unit: 'quintal', location: { state: 'Punjab' }, reason: 'Negative quantity' },
      { name: 'Valid Wheat', price: 100, quantity: 10, categoryId: '60c72b2f9b1d8b2bad000000', unit: 'quintal', location: { state: 'Punjab' }, reason: 'Non-existent category' },
      { name: 'Valid Wheat', price: 100, quantity: 10, categoryId: grainCat._id, unit: 'unsupported_unit', location: { state: 'Punjab' }, reason: 'Invalid unit' },
      { name: 'Valid Wheat', price: 100, quantity: 10, categoryId: grainCat._id, unit: 'quintal', location: { state: '' }, reason: 'Missing state' }
    ];

    for (const testCase of invalidPayloads) {
      const invRes = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...generateAuthHeader(farmer1._id)
        },
        body: JSON.stringify(testCase)
      });
      if (invRes.status !== 400) {
        throw new Error(`Validation check failed to reject with 400 for: ${testCase.reason} (got ${invRes.status})`);
      }
    }
    console.log(`[5] All 6 invalid payload tests correctly rejected with HTTP 400`);

    // 6. Test: Farmer 1 successfully creates a valid listing
    const validCreateRes = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({
        name: 'Punjab Golden Sharbati Wheat Lot 1',
        description: 'Dry clean harvest with 10% moisture grade A',
        categoryId: grainCat._id,
        price: 2750,
        currency: 'INR',
        quantity: 80,
        unit: 'quintal',
        location: {
          state: 'Punjab',
          district: 'Ludhiana',
          mandi: 'Khanna Mandi'
        },
        status: 'active'
      })
    });
    const validCreateData = await validCreateRes.json();
    console.log(`[6] Farmer 1 valid listing creation -> Status: ${validCreateRes.status}, Product ID: ${validCreateData.data?._id}`);
    if (validCreateRes.status !== 201 || !validCreateData.data?._id) {
      throw new Error('Valid product creation failed');
    }
    createdProduct1Id = validCreateData.data._id;

    // 7. Test: GET /api/products/mine for Farmer 1
    const myProdsRes = await fetch('http://localhost:5000/api/products/mine', {
      headers: generateAuthHeader(farmer1._id)
    });
    const myProdsData = await myProdsRes.json();
    console.log(`[7] Farmer 1 GET /api/products/mine -> Count: ${myProdsData.count}, First item name: "${myProdsData.data[0]?.name}"`);
    if (myProdsData.count !== 1 || myProdsData.data[0]?._id !== createdProduct1Id) {
      throw new Error('/api/products/mine returned incorrect listings for Farmer 1');
    }

    // 8. Test: Empty "My Listings" for Farmer 2 (who hasn't created anything yet)
    const farmer2MyRes = await fetch('http://localhost:5000/api/products/mine', {
      headers: generateAuthHeader(farmer2._id)
    });
    const farmer2MyData = await farmer2MyRes.json();
    console.log(`[8] Farmer 2 (no listings) GET /api/products/mine -> Count: ${farmer2MyData.count} (Expected 0)`);
    if (farmer2MyData.count !== 0) {
      throw new Error('Farmer 2 should have 0 listings in /mine');
    }

    // 9. Test: Farmer 2 attempting to EDIT Farmer 1's listing (Forbidden check)
    const crossEditRes = await fetch(`http://localhost:5000/api/products/${createdProduct1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer2._id)
      },
      body: JSON.stringify({ price: 1000 })
    });
    console.log(`[9] Cross-farmer PATCH attempt by Farmer 2 -> Status: ${crossEditRes.status} (Expected 403 Forbidden)`);
    if (crossEditRes.status !== 403) {
      throw new Error('Cross-farmer PATCH was not rejected with 403');
    }

    // 10. Test: Farmer 2 attempting to DELETE Farmer 1's listing (Forbidden check)
    const crossDeleteRes = await fetch(`http://localhost:5000/api/products/${createdProduct1Id}`, {
      method: 'DELETE',
      headers: generateAuthHeader(farmer2._id)
    });
    console.log(`[10] Cross-farmer DELETE attempt by Farmer 2 -> Status: ${crossDeleteRes.status} (Expected 403 Forbidden)`);
    if (crossDeleteRes.status !== 403) {
      throw new Error('Cross-farmer DELETE was not rejected with 403');
    }

    // 11. Test: Farmer 1 successfully updates own listing
    const updateRes = await fetch(`http://localhost:5000/api/products/${createdProduct1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer1._id)
      },
      body: JSON.stringify({
        price: 2900,
        quantity: 95
      })
    });
    const updateData = await updateRes.json();
    console.log(`[11] Farmer 1 PATCH own listing -> Status: ${updateRes.status}, New Price: ₹${updateData.data?.price}, New Qty: ${updateData.data?.quantity}`);
    if (updateRes.status !== 200 || updateData.data?.price !== 2900 || updateData.data?.quantity !== 95) {
      throw new Error('Listing update failed or did not persist');
    }

    // 12. Test: Public Marketplace visibility reflecting the updated product
    const publicMarketRes = await fetch('http://localhost:5000/api/products');
    const publicMarketData = await publicMarketRes.json();
    console.log(`[12] Public GET /api/products -> Total active: ${publicMarketData.total}, Listing visible with price ₹${publicMarketData.data[0]?.price}`);
    if (publicMarketData.total !== 1 || publicMarketData.data[0]?.price !== 2900) {
      throw new Error('Updated listing was not correctly visible in public marketplace');
    }

    // 13. Test: Farmer 1 deletes listing
    const deleteRes = await fetch(`http://localhost:5000/api/products/${createdProduct1Id}`, {
      method: 'DELETE',
      headers: generateAuthHeader(farmer1._id)
    });
    console.log(`[13] Farmer 1 DELETE own listing -> Status: ${deleteRes.status} (Expected 200)`);
    if (deleteRes.status !== 200) {
      throw new Error('Listing deletion failed');
    }

    // 14. Test: Verify marketplace returns back to genuine empty state
    const postDeletePublicRes = await fetch('http://localhost:5000/api/products');
    const postDeletePublicData = await postDeletePublicRes.json();
    console.log(`[14] Public GET /api/products post-deletion -> Total: ${postDeletePublicData.total} (Pristine empty state)`);
    if (postDeletePublicData.total !== 0) {
      throw new Error('Marketplace was not empty after listing deletion');
    }

  } finally {
    // 15. Clean up any remaining test records
    console.log('\n[15] Cleaning up test users and test products...');
    if (createdProduct1Id) {
      await Product.deleteOne({ _id: createdProduct1Id });
    }
    await User.deleteMany({
      _id: { $in: [farmer1._id, farmer2._id, buyer._id] }
    });
    console.log('     Test records removed cleanly.');
  }

  await mongoose.disconnect();
  console.log('\n=== AgriFair Phase 3D-2 Verification PASSED 100% ===');
}

runPhase3D2Verification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nVerification FAILED:', err);
    process.exit(1);
  });
