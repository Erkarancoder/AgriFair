const dns = require('dns');
const mongoose = require('mongoose');
const config = require('../src/config/env');
const Category = require('../src/models/Category');
const { Product } = require('../src/models/Product');
const User = require('../src/models/User');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore
}

async function runPhase3D1Verification() {
  console.log('=== AgriFair Phase 3D-1 Real API Integration Verification ===\n');

  // 1. Connect to DB
  await mongoose.connect(config.mongodbUri);
  console.log(`[1] Database connection confirmed: ${mongoose.connection.host}/${mongoose.connection.name}`);

  // 2. Test GET /api/categories API via HTTP
  const catRes = await fetch('http://localhost:5000/api/categories');
  const catData = await catRes.json();
  console.log(`[2] HTTP GET /api/categories -> Status: ${catRes.status}, Success: ${catData.success}, Count: ${catData.count}`);
  if (!catData.success || catData.count !== 7) {
    throw new Error('Categories API did not return 7 categories');
  }

  // 3. Test GET /api/categories/:slug via HTTP
  const fruitRes = await fetch('http://localhost:5000/api/categories/fruits');
  const fruitData = await fruitRes.json();
  console.log(`[3] HTTP GET /api/categories/fruits -> Status: ${fruitRes.status}, Category: "${fruitData.data.name}", Slug: "${fruitData.data.slug}"`);
  if (!fruitData.success || fruitData.data.slug !== 'fruits') {
    throw new Error('Category by slug failed');
  }

  // 4. Test GET /api/categories/invalid-slug (404 handling)
  const invalidCatRes = await fetch('http://localhost:5000/api/categories/non-existent-xyz');
  console.log(`[4] HTTP GET /api/categories/non-existent-xyz -> Status: ${invalidCatRes.status} (Correct 404 error state)`);
  if (invalidCatRes.status !== 404) {
    throw new Error('Invalid category slug should return 404');
  }

  // 5. Test Initial Empty Products state
  const prodRes = await fetch('http://localhost:5000/api/products');
  const prodData = await prodRes.json();
  console.log(`[5] HTTP GET /api/products -> Status: ${prodRes.status}, Total: ${prodData.total}, Data length: ${prodData.data.length}`);
  if (!prodData.success || prodData.total !== 0 || prodData.data.length !== 0) {
    throw new Error('Initial products should be empty array');
  }

  // 6. Create temporary test farmer & product to test search, category filter, and sorting
  console.log('\n[6] Testing end-to-end Marketplace Querying with temporary DB records:');
  const testFarmer = await User.create({
    name: 'Integration Test Farmer',
    email: `integration.farmer.${Date.now()}@agrifair.test`,
    password: 'password123',
    role: 'farmer',
    phone: `987${Math.floor(1000000 + Math.random() * 9000000)}`,
    isEmailVerified: true
  });

  const fruitCatDoc = await Category.findOne({ slug: 'fruits' });
  const grainCatDoc = await Category.findOne({ slug: 'grains-cereals' });

  const p1 = await Product.create({
    name: 'Ratnagiri Export Grade Alphonso Mango',
    description: 'Sweet naturally ripened GI tagged Alphonso mangoes direct from orchard',
    category: fruitCatDoc._id,
    owner: testFarmer._id,
    price: 1800,
    currency: 'INR',
    quantity: 50,
    unit: 'box',
    location: { state: 'Maharashtra', district: 'Ratnagiri', mandi: 'Ratnagiri APMC' },
    status: 'active'
  });

  const p2 = await Product.create({
    name: 'Sehore Golden Premium Sharbati Wheat',
    description: 'Clean harvested heavy golden grains high protein',
    category: grainCatDoc._id,
    owner: testFarmer._id,
    price: 2950,
    currency: 'INR',
    quantity: 120,
    unit: 'quintal',
    location: { state: 'Madhya Pradesh', district: 'Sehore', mandi: 'Sehore Mandi' },
    status: 'active'
  });

  // Test Category filter via HTTP
  const filterCatRes = await fetch('http://localhost:5000/api/products?category=fruits');
  const filterCatData = await filterCatRes.json();
  console.log(`    Category Filter (?category=fruits) -> Found: ${filterCatData.total} product(s) -> "${filterCatData.data[0]?.name}"`);
  if (filterCatData.total !== 1 || filterCatData.data[0]?.name !== p1.name) {
    throw new Error('Filter by category slug failed');
  }

  // Test Search query via HTTP
  const searchRes = await fetch('http://localhost:5000/api/products?q=Sharbati');
  const searchData = await searchRes.json();
  console.log(`    Search Query (?q=Sharbati) -> Found: ${searchData.total} product(s) -> "${searchData.data[0]?.name}"`);
  if (searchData.total !== 1 || searchData.data[0]?.name !== p2.name) {
    throw new Error('Search query parameter failed');
  }

  // Test Sort by price-desc via HTTP
  const sortRes = await fetch('http://localhost:5000/api/products?sort=price-desc');
  const sortData = await sortRes.json();
  console.log(`    Sort (?sort=price-desc) -> 1st: ₹${sortData.data[0]?.price} ("${sortData.data[0]?.name}"), 2nd: ₹${sortData.data[1]?.price} ("${sortData.data[1]?.name}")`);
  if (sortData.data[0]?.price !== 2950 || sortData.data[1]?.price !== 1800) {
    throw new Error('Sorting by price-desc failed');
  }

  // 7. Cleanup temporary test records
  console.log('\n[7] Cleaning up temporary test records...');
  await Product.deleteMany({ _id: { $in: [p1._id, p2._id] } });
  await User.deleteOne({ _id: testFarmer._id });
  console.log('    Cleaned up test products and test farmer.');

  // 8. Re-verify pristine empty state
  const finalCheck = await fetch('http://localhost:5000/api/products');
  const finalData = await finalCheck.json();
  console.log(`[8] Post-cleanup GET /api/products -> Total: ${finalData.total}, Inventory is cleanly empty.`);
  if (finalData.total !== 0) {
    throw new Error('Cleanup failed: leftover test records detected');
  }

  await mongoose.disconnect();
  console.log('\n=== AgriFair Phase 3D-1 Real API Verification PASSED 100% ===');
}

runPhase3D1Verification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nVerification FAILED:', err);
    process.exit(1);
  });
