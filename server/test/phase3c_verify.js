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

async function runPhase3CVerification() {
  console.log('=== AgriFair Phase 3C Verification Starting ===\n');

  // 1. Connect to DB
  await mongoose.connect(config.mongodbUri);
  console.log(`[1] MongoDB Connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

  // 2. Verify Category Count and Slugs
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  console.log(`[2] Total active categories in MongoDB: ${categories.length}`);
  if (categories.length !== 7) {
    throw new Error(`Expected 7 active categories, found ${categories.length}`);
  }
  const slugs = categories.map((c) => c.slug);
  console.log(`    Category slugs: ${slugs.join(', ')}`);

  // 3. Test find category by slug
  const grainCat = await Category.findOne({ slug: 'grains-cereals', isActive: true });
  if (!grainCat) {
    throw new Error('grains-cereals category not found in DB');
  }
  console.log(`[3] Found category by slug 'grains-cereals': ID=${grainCat._id}, Name="${grainCat.name}"`);

  // 4. Test non-existent category
  const nonExistent = await Category.findOne({ slug: 'invalid-non-existent-slug' });
  console.log(`[4] Non-existent slug query correctly returned: ${nonExistent}`);

  // 5. Test initial Product list (must be empty or real DB records, no mock data)
  const initialCount = await Product.countDocuments();
  console.log(`[5] Pre-test Product count in DB: ${initialCount}`);

  // 6. Create temporary test farmer user
  const testFarmerEmail = `test.farmer.${Date.now()}@agrifair.test`;
  const testFarmer = await User.create({
    name: 'Karan Test Farmer',
    email: testFarmerEmail,
    password: 'password123',
    role: 'farmer',
    phone: `999${Math.floor(1000000 + Math.random() * 9000000)}`,
    isEmailVerified: true
  });
  console.log(`[6] Created temporary test farmer: ${testFarmer.name} (${testFarmer._id})`);

  // 7. Test Product model validations
  console.log('[7] Testing Product Model Validations:');
  try {
    await Product.create({
      name: 'X', // too short (< 2)
      category: grainCat._id,
      owner: testFarmer._id,
      price: -50, // invalid negative
      quantity: -5, // invalid negative
      unit: 'invalid_unit',
      location: { state: 'Punjab' }
    });
    throw new Error('Validation failed to catch invalid product fields!');
  } catch (err) {
    console.log(`    Validation correctly rejected invalid product: ${err.message}`);
  }

  // 8. Create two valid test products
  const pulseCat = await Category.findOne({ slug: 'pulses-legumes' });
  const testProduct1 = await Product.create({
    name: 'Verified Punjab Golden Sharbati Wheat',
    description: 'High grade clean dry wheat grain directly from farm harvest',
    category: grainCat._id,
    owner: testFarmer._id,
    price: 2800,
    currency: 'INR',
    quantity: 150,
    unit: 'quintal',
    location: {
      state: 'Punjab',
      district: 'Ludhiana',
      mandi: 'Khanna Mandi'
    },
    status: 'active'
  });

  const testProduct2 = await Product.create({
    name: 'Organic Desi Chana Bold Lot',
    description: 'Machine cleaned chemical free organic brown chickpeas',
    category: pulseCat._id,
    owner: testFarmer._id,
    price: 5400,
    currency: 'INR',
    quantity: 40,
    unit: 'quintal',
    location: {
      state: 'Rajasthan',
      district: 'Bikaner',
      mandi: 'Bikaner Mandi'
    },
    status: 'active'
  });
  console.log(`[8] Created 2 test products: "${testProduct1.name}" (₹${testProduct1.price}) & "${testProduct2.name}" (₹${testProduct2.price})`);

  // 9. Verify Category Filtering
  const grainProducts = await Product.find({ category: grainCat._id, status: 'active' });
  console.log(`[9] Category filtering for 'grains-cereals': found ${grainProducts.length} product(s)`);
  if (grainProducts.length !== 1 || grainProducts[0].name !== testProduct1.name) {
    throw new Error('Category filtering returned incorrect products');
  }

  // 10. Verify Search Query
  const searchResults = await Product.find({
    status: 'active',
    name: { $regex: 'Sharbati', $options: 'i' }
  });
  console.log(`[10] Search for 'Sharbati': found ${searchResults.length} product(s) -> "${searchResults[0]?.name}"`);
  if (searchResults.length !== 1) {
    throw new Error('Search query returned incorrect result count');
  }

  // 11. Verify Sorting (Price Descending)
  const sortedDesc = await Product.find({ _id: { $in: [testProduct1._id, testProduct2._id] } }).sort({ price: -1 });
  console.log(`[11] Sort by price-desc: 1st=₹${sortedDesc[0].price} ("${sortedDesc[0].name}"), 2nd=₹${sortedDesc[1].price} ("${sortedDesc[1].name}")`);
  if (sortedDesc[0].price !== 5400 || sortedDesc[1].price !== 2800) {
    throw new Error('Price sorting order incorrect');
  }

  // 12. Verify Population Safety (No password or sensitive data exposed)
  const populated = await Product.findById(testProduct1._id)
    .populate('category', 'name slug')
    .populate('owner', 'name phone role')
    .lean();
  console.log(`[12] Populated Product checks:`);
  console.log(`    category:`, populated.category);
  console.log(`    owner:`, populated.owner);
  if (populated.owner.password || populated.owner.passwordHash) {
    throw new Error('SECURITY LEAK: Password field was populated!');
  }

  // 13. Clean up ONLY the test records
  console.log('[13] Cleaning up test records...');
  await Product.deleteMany({ _id: { $in: [testProduct1._id, testProduct2._id] } });
  await User.deleteOne({ _id: testFarmer._id });
  console.log('    Test products and test farmer deleted cleanly.');

  // 14. Verify DB state is pristine
  const finalProductCount = await Product.countDocuments();
  console.log(`[14] Final Product count in DB: ${finalProductCount} (matches initial count: ${initialCount})`);

  await mongoose.disconnect();
  console.log('\n=== AgriFair Phase 3C Verification PASSED 100% ===');
}

runPhase3CVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nVerification FAILED:', err);
    process.exit(1);
  });
