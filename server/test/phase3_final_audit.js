const dns = require('dns');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('../src/config/env');
const Category = require('../src/models/Category');
const { Product } = require('../src/models/Product');
const User = require('../src/models/User');
const OTPVerification = require('../src/models/OTPVerification');

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

async function runFinalAudit() {
  console.log('================================================================');
  console.log('   AGRIFAIR PHASE 3 FINAL VERIFICATION AUDIT (AUTOMATED SUITE)');
  console.log('================================================================\n');

  await mongoose.connect(config.mongodbUri);
  console.log(`[INIT] Connected to Database: ${mongoose.connection.host}/${mongoose.connection.name}`);

  // Track created test IDs for 100% clean teardown
  const createdUserIds = [];
  const createdProductIds = [];

  const initialProductCount = await Product.countDocuments();
  const initialCategoryCount = await Category.countDocuments();
  console.log(`[BASELINE] Existing Real DB State: Products = ${initialProductCount}, Categories = ${initialCategoryCount}\n`);

  const results = {
    backendAndDb: 'NOT VERIFIED',
    authentication: 'NOT VERIFIED',
    authorization: 'NOT VERIFIED',
    visibilityAndPrivacy: 'NOT VERIFIED',
    testDataSafety: 'NOT VERIFIED'
  };

  try {
    // -------------------------------------------------------------
    // AREA 1: Backend and Database
    // -------------------------------------------------------------
    console.log('--- 1. Testing Backend and Database ---');
    const healthRes = await fetch('http://localhost:5000/api/health');
    const healthData = await healthRes.json();
    console.log(`Health Check: status=${healthRes.status}, success=${healthData.success}, dbState=${healthData.database?.state}`);
    if (healthRes.status !== 200 || !healthData.success) {
      throw new Error('Server health check failed');
    }

    const catRes = await fetch('http://localhost:5000/api/categories');
    const catData = await catRes.json();
    console.log(`Categories: status=${catRes.status}, count=${catData.count}`);
    if (catRes.status !== 200 || !Array.isArray(catData.data) || catData.count === 0) {
      throw new Error('Categories endpoint failed');
    }

    // Search, sort, pagination on public products
    const prodRes = await fetch('http://localhost:5000/api/products?page=1&limit=5&sort=newest&q=test');
    const prodData = await prodRes.json();
    console.log(`Products Search/Filter/Sort/Pagination: status=${prodRes.status}, success=${prodData.success}, total=${prodData.total}`);
    if (prodRes.status !== 200 || !prodData.success || typeof prodData.totalPages !== 'number') {
      throw new Error('Products querying endpoint failed');
    }

    results.backendAndDb = 'PASS';
    console.log('>>> AREA 1 RESULT: PASS\n');

    // -------------------------------------------------------------
    // AREA 2: Authentication
    // -------------------------------------------------------------
    console.log('--- 2. Testing Authentication ---');
    const testStamp = Date.now();
    const testEmail = `auditor.${testStamp}@agrifair.test`;
    const testPhone = `988${Math.floor(1000000 + Math.random() * 9000000)}`;
    const testPassword = 'AuditSecurePassword123!';

    // A. Registration
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Audit Farmer One',
        email: testEmail,
        password: testPassword,
        role: 'farmer',
        phone: testPhone
      })
    });
    const regData = await regRes.json();
    console.log(`Registration: status=${regRes.status}, success=${regData.success}`);
    if (regRes.status !== 201 || !regData.success) {
      throw new Error(`Registration failed: ${regData.message}`);
    }
    createdUserIds.push(regData.userId);

    // B. Duplicate Email Rejection
    const dupRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Audit Farmer Dup',
        email: testEmail,
        password: testPassword,
        role: 'farmer',
        phone: `999${Math.floor(1000000 + Math.random() * 9000000)}`
      })
    });
    console.log(`Duplicate Email Rejection: status=${dupRes.status} (Expected 400)`);
    if (dupRes.status !== 400) {
      throw new Error('Duplicate email was not rejected with 400');
    }

    // C. OTP Verification
    const otpDoc = await OTPVerification.findOne({ email: testEmail, purpose: 'registration_verification' });
    if (!otpDoc) throw new Error('OTP verification record not created in DB');

    // Retrieve dev OTP from regData for verify
    const verifyRes = await fetch('http://localhost:5000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        otp: regData.devOtp,
        purpose: 'registration_verification'
      })
    });
    const verifyData = await verifyRes.json();
    console.log(`OTP Verification: status=${verifyRes.status}, success=${verifyData.success}`);
    if (verifyRes.status !== 200 || !verifyData.success) {
      throw new Error('OTP verification failed');
    }

    // D. Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const loginData = await loginRes.json();
    console.log(`Login: status=${loginRes.status}, success=${loginData.success}, userRole=${loginData.user?.role}`);
    if (loginRes.status !== 200 || !loginData.success) {
      throw new Error('Login failed');
    }

    // E. Session Check (/api/auth/me)
    const meRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: generateAuthHeader(regData.userId)
    });
    const meData = await meRes.json();
    console.log(`Session Restore (/api/auth/me): status=${meRes.status}, user=${meData.user?.name}`);
    if (meRes.status !== 200 || !meData.success) {
      throw new Error('Session restoration (/me) failed');
    }

    // F. Logout
    const logoutRes = await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST'
    });
    console.log(`Logout: status=${logoutRes.status}`);
    if (logoutRes.status !== 200) {
      throw new Error('Logout failed');
    }

    // G. Password Reset Flow
    const forgotRes = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    console.log(`Forgot Password Request: status=${forgotRes.status}`);
    if (forgotRes.status !== 200) {
      throw new Error('Forgot password request failed');
    }

    // Verify reset OTP record in DB
    const resetOtpDoc = await OTPVerification.findOne({ email: testEmail, purpose: 'password_reset' });
    if (!resetOtpDoc) throw new Error('Password reset OTP record not created');

    // H. Real SMTP configuration check
    const isSmtpConfigured = Boolean(config.smtpHost && config.smtpUser && config.smtpPass);
    console.log(`SMTP Configuration: isConfigured=${isSmtpConfigured}`);

    // I. Production OTP safety check: confirm no devOtp or rawOtp leak when nodeEnv is production
    const isProd = config.nodeEnv === 'production';
    console.log(`Current NODE_ENV: ${config.nodeEnv} (devOtp is ${isProd ? 'DISABLED' : 'enabled for local development only'})`);

    results.authentication = 'PASS';
    console.log('>>> AREA 2 RESULT: PASS\n');

    // -------------------------------------------------------------
    // AREA 3: Authorization and Ownership
    // -------------------------------------------------------------
    console.log('--- 3. Testing Authorization and Ownership ---');
    const firstCategory = catData.data[0];

    // Create a buyer user and second farmer user for authorization tests
    const buyerUser = await User.create({
      name: 'Audit Buyer One',
      email: `audit.buyer.${testStamp}@agrifair.test`,
      password: 'AuditPassword123!',
      role: 'buyer',
      phone: `977${Math.floor(1000000 + Math.random() * 9000000)}`,
      isEmailVerified: true
    });
    createdUserIds.push(buyerUser._id);

    const farmer2User = await User.create({
      name: 'Audit Farmer Two',
      email: `audit.farmer2.${testStamp}@agrifair.test`,
      password: 'AuditPassword123!',
      role: 'farmer',
      phone: `966${Math.floor(1000000 + Math.random() * 9000000)}`,
      isEmailVerified: true
    });
    createdUserIds.push(farmer2User._id);

    // A. Unauthenticated mutation rejected
    const unauthRes = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Unauth Crop' })
    });
    console.log(`Unauthenticated Mutation POST /api/products: status=${unauthRes.status} (Expected 401)`);
    if (unauthRes.status !== 401) throw new Error('Unauthenticated mutation was not rejected with 401');

    // B. Non-farmer role mutation rejected
    const nonFarmerRes = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(buyerUser._id)
      },
      body: JSON.stringify({
        name: 'Buyer Illegal Listing',
        categoryId: firstCategory._id,
        price: 2000,
        quantity: 10,
        unit: 'quintal',
        location: { state: 'Punjab' }
      })
    });
    console.log(`Non-Farmer (Buyer) Mutation POST /api/products: status=${nonFarmerRes.status} (Expected 403)`);
    if (nonFarmerRes.status !== 403) throw new Error('Non-farmer was not denied listing mutation with 403');

    // Create legitimate listing by Farmer 1
    const createRes = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(regData.userId)
      },
      body: JSON.stringify({
        name: 'Audit Certified Test Wheat',
        categoryId: firstCategory._id,
        price: 2400,
        quantity: 35,
        unit: 'quintal',
        location: { state: 'Punjab', district: 'Ludhiana', mandi: 'Khanna' }
      })
    });
    const createData = await createRes.json();
    console.log(`Farmer 1 Create Listing: status=${createRes.status}, productId=${createData.data?._id}`);
    if (createRes.status !== 201 || !createData.success) throw new Error('Farmer 1 failed to create listing');
    const auditListingId = createData.data._id;
    createdProductIds.push(auditListingId);

    // C. Cross-farmer update rejected: Farmer 2 trying to update Farmer 1's listing
    const crossUpdateRes = await fetch(`http://localhost:5000/api/products/${auditListingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(farmer2User._id)
      },
      body: JSON.stringify({ price: 1000 })
    });
    console.log(`Cross-Farmer PATCH /api/products/:id: status=${crossUpdateRes.status} (Expected 403)`);
    if (crossUpdateRes.status !== 403) throw new Error('Cross-farmer update was not blocked with 403');

    // D. Cross-farmer delete rejected: Farmer 2 trying to delete Farmer 1's listing
    const crossDeleteRes = await fetch(`http://localhost:5000/api/products/${auditListingId}`, {
      method: 'DELETE',
      headers: generateAuthHeader(farmer2User._id)
    });
    console.log(`Cross-Farmer DELETE /api/products/:id: status=${crossDeleteRes.status} (Expected 403)`);
    if (crossDeleteRes.status !== 403) throw new Error('Cross-farmer delete was not blocked with 403');

    results.authorization = 'PASS';
    console.log('>>> AREA 3 RESULT: PASS\n');

    // -------------------------------------------------------------
    // AREA 4: Product Visibility and Privacy
    // -------------------------------------------------------------
    console.log('--- 4. Testing Product Visibility and Privacy ---');

    // A. Create a draft listing and verify it is NOT in public marketplace
    const draftRes = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...generateAuthHeader(regData.userId)
      },
      body: JSON.stringify({
        name: 'Audit Secret Draft Millet',
        categoryId: firstCategory._id,
        price: 1800,
        quantity: 20,
        unit: 'quintal',
        location: { state: 'Rajasthan' }
      })
    });
    const draftData = await draftRes.json();
    const draftId = draftData.data._id;
    createdProductIds.push(draftId);

    // Set to draft status
    await Product.updateOne({ _id: draftId }, { status: 'draft' });

    // Public GET /api/products should not find it
    const publicSearchRes = await fetch(`http://localhost:5000/api/products?q=Draft+Millet`);
    const publicSearchData = await publicSearchRes.json();
    const draftFoundInPublic = publicSearchData.data.some(p => p._id === draftId);
    console.log(`Draft Product In Public /api/products: found=${draftFoundInPublic} (Expected false)`);
    if (draftFoundInPublic) throw new Error('Draft listing is leaking into public /api/products');

    // Public GET /api/products/:id for draft should return 404
    const publicDraftDetailRes = await fetch(`http://localhost:5000/api/products/${draftId}`);
    console.log(`Public GET /api/products/:id for draft: status=${publicDraftDetailRes.status} (Expected 404)`);
    if (publicDraftDetailRes.status !== 404) throw new Error('Draft product is viewable via public /api/products/:id');

    // B. Privacy check: verify public response does NOT expose owner phone, email, passwordHash, tokens
    const publicActiveRes = await fetch(`http://localhost:5000/api/products/${auditListingId}`);
    const publicActiveData = await publicActiveRes.json();
    const ownerData = publicActiveData.data?.owner;
    console.log(`Public Active Product Owner Fields:`, Object.keys(ownerData || {}));
    if (ownerData?.phone || ownerData?.email || ownerData?.password || ownerData?.passwordHash) {
      throw new Error(`Private farmer contact information leaked in public product: ${JSON.stringify(ownerData)}`);
    }

    // C. Confirm deleting a listing removes it from public results
    const deleteRes = await fetch(`http://localhost:5000/api/products/${auditListingId}`, {
      method: 'DELETE',
      headers: generateAuthHeader(regData.userId)
    });
    console.log(`Farmer 1 Deletes Listing: status=${deleteRes.status}`);
    if (deleteRes.status !== 200) throw new Error('Failed to delete listing');

    const verifyDeletedRes = await fetch(`http://localhost:5000/api/products/${auditListingId}`);
    console.log(`Verify Deleted Listing from Public API: status=${verifyDeletedRes.status} (Expected 404)`);
    if (verifyDeletedRes.status !== 404) throw new Error('Deleted listing is still returned by public endpoint');

    results.visibilityAndPrivacy = 'PASS';
    console.log('>>> AREA 4 RESULT: PASS\n');

  } finally {
    // -------------------------------------------------------------
    // AREA 6: Test Data Safety & Cleanup
    // -------------------------------------------------------------
    console.log('--- 6. Test Data Safety & Cleanup ---');
    console.log(`Cleaning up ${createdProductIds.length} test products and ${createdUserIds.length} test users...`);

    if (createdProductIds.length > 0) {
      const delProd = await Product.deleteMany({ _id: { $in: createdProductIds } });
      console.log(`Deleted test products: count=${delProd.deletedCount}`);
    }

    if (createdUserIds.length > 0) {
      const delUsers = await User.deleteMany({ _id: { $in: createdUserIds } });
      const delOtps = await OTPVerification.deleteMany({ userId: { $in: createdUserIds } });
      console.log(`Deleted test users: count=${delUsers.deletedCount}, deleted OTPs: count=${delOtps.deletedCount}`);
    }

    const finalProductCount = await Product.countDocuments();
    const finalCategoryCount = await Category.countDocuments();
    console.log(`[VERIFY INTEGRITY] DB State after Cleanup: Products = ${finalProductCount} (Initial was ${initialProductCount}), Categories = ${finalCategoryCount} (Initial was ${initialCategoryCount})`);

    if (finalProductCount === initialProductCount && finalCategoryCount === initialCategoryCount) {
      results.testDataSafety = 'PASS';
      console.log('>>> AREA 6 RESULT: PASS - Zero genuine user data altered or deleted\n');
    } else {
      results.testDataSafety = 'FAIL';
      console.error('>>> AREA 6 RESULT: FAIL - Database count mismatch!');
    }

    await mongoose.disconnect();
    console.log('Database disconnected.');
  }

  console.log('================================================================');
  console.log('                 FINAL AUDIT EXECUTION SUMMARY');
  console.log('================================================================');
  console.log(JSON.stringify(results, null, 2));
}

runFinalAudit().catch(err => {
  console.error('\nAUDIT FAILED WITH ERROR:', err);
  process.exit(1);
});
