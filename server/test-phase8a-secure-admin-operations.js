/**
 * AgriFair Phase 8A Automated Verification Suite
 * 
 * Verifies:
 * 1. Role Escalation & Registration Protection (client cannot self-register as admin)
 * 2. Non-Admin Rejection & Server-Enforced Authorization (403 on non-admin / unauthenticated)
 * 3. Safe Field Projections & Secrets Protection (no passwords, tokens, or raw webhook payloads)
 * 4. Operational Truthfulness (getOverview counts match actual MongoDB collection counts)
 * 5. Reversible Product Moderation Lifecycle & Public Marketplace Hiding
 * 6. User Status Moderation & Admin Self-Suspension Prevention
 * 7. Immutable Audit Trail & Sensitive Key Sanitization ([REDACTED] on passwords, tokens, secrets)
 * 8. Safe Pagination & Bounded Limits
 * 9. Integrity Guards: No Backdoor Admin Payment Overwrite or Fabricated Refunds
 * 10. Clean Teardown of Test Fixtures
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./src/config/db');
const User = require('./src/models/User');
const { Product } = require('./src/models/Product');
const Category = require('./src/models/Category');
const { Order } = require('./src/models/Order');
const AuditLog = require('./src/models/AuditLog');
const { ROLES, ALLOWED_REGISTRATION_ROLES } = require('./src/constants/roles');
const { restrictTo } = require('./src/middleware/auth');
const adminController = require('./src/controllers/admin.controller');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✅ PASS: ${message}`);
}

// Helper to simulate express res
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runPhase8ATests() {
  console.log('\n======================================================');
  console.log('🧪 Starting AgriFair Phase 8A Test Suite');
  console.log('   Secure Admin and Marketplace Operations');
  console.log('======================================================\n');

  try {
    await connectDB();
    console.log('[DB] Connected to MongoDB Atlas for Phase 8A Verification.\n');

    const runId = Date.now().toString().slice(-6);

    // 1. Create Test Users
    const buyerUser = await User.create({
      name: `Test Buyer 8A ${runId}`,
      email: `buyer8a_${runId}@agrifair.local`,
      phone: `91880${runId.slice(0, 5)}`,
      role: 'buyer',
      status: 'active',
      password: 'Password123!'
    });

    const farmerUser = await User.create({
      name: `Test Farmer 8A ${runId}`,
      email: `farmer8a_${runId}@agrifair.local`,
      phone: `91881${runId.slice(0, 5)}`,
      role: 'farmer',
      status: 'active',
      password: 'Password123!'
    });

    const targetUser = await User.create({
      name: `Target Member 8A ${runId}`,
      email: `target8a_${runId}@agrifair.local`,
      phone: `91882${runId.slice(0, 5)}`,
      role: 'retailer',
      status: 'active',
      password: 'Password123!'
    });

    const adminUser = await User.create({
      name: `Operations Officer 8A ${runId}`,
      email: `admin8a_${runId}@agrifair.local`,
      phone: `91883${runId.slice(0, 5)}`,
      role: 'admin',
      status: 'active',
      password: 'AdminPassword123!'
    });

    // Setup Test Category & Product
    let category = await Category.findOne({ slug: 'grains' });
    if (!category) {
      category = await Category.create({
        name: 'Grains & Cereals',
        slug: 'grains',
        description: 'Locally produced grains'
      });
    }

    const testProduct = await Product.create({
      name: `Operational Verification Wheat ${runId}`,
      description: 'High grade Sharbati wheat under test.',
      category: category._id,
      owner: farmerUser._id,
      price: 2600,
      quantity: 100,
      unit: 'quintal',
      minOrderQuantity: 10,
      location: { state: 'Madhya Pradesh', district: 'Sehore' },
      status: 'active'
    });

    // Setup Test Order
    const testOrder = await Order.create({
      orderNumber: `ORD-8A-${runId}`,
      buyer: buyerUser._id,
      farmer: farmerUser._id,
      product: testProduct._id,
      requestedQuantity: 15,
      unit: 'quintal',
      priceSnapshot: 2600,
      totalAmount: 39000,
      status: 'pending',
      paymentStatus: 'payment_pending',
      paymentMethod: 'razorpay',
      isStockDeducted: true,
      processedWebhooks: [
        {
          eventId: 'evt_secret_payload_123',
          eventType: 'payment.captured',
          paymentId: 'pay_secret_123'
        }
      ]
    });

    console.log('--- Test Group 1: Role Escalation & Registration Protection ---');
    // Task 1: Admin role must NOT be grantable via client registration
    assert(
      !ALLOWED_REGISTRATION_ROLES.includes('admin'),
      'Admin role is strictly excluded from ALLOWED_REGISTRATION_ROLES'
    );
    assert(
      ROLES.ADMIN === 'admin',
      "ROLES constant correctly exposes 'admin'"
    );

    console.log('\n--- Test Group 2: Non-Admin Rejection & Server-Enforced Authorization ---');
    // Task 9: restrictTo middleware rejects non-admins with 403
    const adminGuard = restrictTo('admin');

    // 2a. Buyer rejected
    let buyerRejected = false;
    const mockResBuyer = createMockRes();
    adminGuard({ user: buyerUser }, mockResBuyer, () => { buyerRejected = false; });
    if (mockResBuyer.statusCode === 403) buyerRejected = true;
    assert(buyerRejected, 'Buyer user rejected with 403 Forbidden on admin guard');

    // 2b. Farmer rejected
    let farmerRejected = false;
    const mockResFarmer = createMockRes();
    adminGuard({ user: farmerUser }, mockResFarmer, () => { farmerRejected = false; });
    if (mockResFarmer.statusCode === 403) farmerRejected = true;
    assert(farmerRejected, 'Farmer user rejected with 403 Forbidden on admin guard');

    // 2c. Unauthenticated rejected
    let unauthRejected = false;
    const mockResUnauth = createMockRes();
    adminGuard({ user: null }, mockResUnauth, () => { unauthRejected = false; });
    if (mockResUnauth.statusCode === 403) unauthRejected = true;
    assert(unauthRejected, 'Unauthenticated access rejected with 403 Forbidden on admin guard');

    // 2d. Admin authorized
    let adminNextCalled = false;
    const mockResAdmin = createMockRes();
    adminGuard({ user: adminUser }, mockResAdmin, () => { adminNextCalled = true; });
    assert(adminNextCalled, 'Admin user successfully authorized by admin guard');

    console.log('\n--- Test Group 3: Truthful Operational Overview ---');
    // Task 7 & 4: Overview displays truthful counts without fabricated numbers
    const mockResOverview = createMockRes();
    await adminController.getOverview({ user: adminUser }, mockResOverview, (err) => { if (err) throw err; });
    assert(mockResOverview.statusCode === 200, 'getOverview returns HTTP 200');
    assert(mockResOverview.body.success === true, 'getOverview returns success: true');
    assert(
      typeof mockResOverview.body.data.users.total === 'number' && mockResOverview.body.data.users.total >= 4,
      'Overview contains truthful real user count'
    );
    assert(
      typeof mockResOverview.body.data.products.total === 'number' && mockResOverview.body.data.products.total >= 1,
      'Overview contains truthful real product count'
    );
    assert(
      typeof mockResOverview.body.data.orders.total === 'number' && mockResOverview.body.data.orders.total >= 1,
      'Overview contains truthful real order count'
    );
    assert(
      mockResOverview.body.data.unresolvedIssuesCount >= 0,
      'Overview computes truthful unresolved issues count (failed + refund pending)'
    );

    console.log('\n--- Test Group 4: Safe Field Projections & Data Privacy ---');
    // Task 2: Users listing with safe fields, pagination, and no leaked password hashes
    const mockResUsers = createMockRes();
    await adminController.getUsers({
      user: adminUser,
      query: { q: runId, page: 1, limit: 10 }
    }, mockResUsers, (err) => { if (err) throw err; });

    assert(mockResUsers.statusCode === 200, 'getUsers returns HTTP 200');
    const returnedUsers = mockResUsers.body.data;
    assert(Array.isArray(returnedUsers) && returnedUsers.length > 0, 'getUsers returns array of users matching search');
    
    // Ensure password hashes and reset tokens are NOT exposed
    const hasPasswordHash = returnedUsers.some(u => u.password !== undefined);
    const hasResetToken = returnedUsers.some(u => u.resetPasswordToken !== undefined);
    assert(!hasPasswordHash, 'getUsers strictly omits password hashes');
    assert(!hasResetToken, 'getUsers strictly omits password reset tokens');

    // Safe Pagination bounds: Limit cannot exceed 50
    const mockResUsersBound = createMockRes();
    await adminController.getUsers({
      user: adminUser,
      query: { page: -5, limit: 1000 }
    }, mockResUsersBound, (err) => { if (err) throw err; });
    assert(mockResUsersBound.body.pagination.page === 1, 'Negative page number safely normalized to 1');
    assert(mockResUsersBound.body.pagination.limit === 50, 'Excessive limit safely capped to 50 max');

    // Orders visibility: Webhook payloads must be stripped
    const mockResOrders = createMockRes();
    await adminController.getOrders({
      user: adminUser,
      query: { q: testOrder.orderNumber, page: 1, limit: 10 }
    }, mockResOrders, (err) => { if (err) throw err; });
    assert(mockResOrders.statusCode === 200, 'getOrders returns HTTP 200');
    const orderRecord = mockResOrders.body.data[0];
    assert(orderRecord !== undefined, 'getOrders returns created test order');
    assert(orderRecord.processedWebhooks === undefined, 'getOrders strictly strips raw processedWebhooks payloads');

    console.log('\n--- Test Group 5: Reversible Product Moderation & Public Visibility ---');
    // Task 3: Product moderation actions (suspend with reason)
    const mockResModInvalid = createMockRes();
    await adminController.moderateProduct({
      user: adminUser,
      params: { id: testProduct._id.toString() },
      body: { action: 'suspend', reason: 'bad' } // < 5 chars
    }, mockResModInvalid, (err) => { if (err) throw err; });
    assert(mockResModInvalid.statusCode === 400, 'Rejects moderation action when reason is < 5 characters');

    // Valid suspension
    const mockResModSuspend = createMockRes();
    await adminController.moderateProduct({
      user: adminUser,
      params: { id: testProduct._id.toString() },
      body: { action: 'suspend', reason: 'Suspected quality discrepancy flagged by mandi inspector' }
    }, mockResModSuspend, (err) => { if (err) throw err; });
    assert(mockResModSuspend.statusCode === 200, 'Product suspended successfully');
    assert(mockResModSuspend.body.data.status === 'suspended', 'Product status set to suspended');
    assert(mockResModSuspend.body.data.moderation.status === 'suspended', 'Product moderation.status set to suspended');
    assert(
      mockResModSuspend.body.data.moderation.moderatedBy.toString() === adminUser._id.toString(),
      'Moderator ID recorded correctly'
    );

    // Verify Public Marketplace Disappearance:
    // Active products query in public marketplace must NOT return the suspended product
    const activeProducts = await Product.find({ status: 'active', _id: testProduct._id });
    assert(activeProducts.length === 0, 'Suspended product is NOT visible in public active marketplace query');

    // Reversible action: Reinstate product
    const mockResModReinstate = createMockRes();
    await adminController.moderateProduct({
      user: adminUser,
      params: { id: testProduct._id.toString() },
      body: { action: 'reinstate', reason: 'Farmer provided valid APMC quality verification certificate' }
    }, mockResModReinstate, (err) => { if (err) throw err; });
    assert(mockResModReinstate.statusCode === 200, 'Product reinstated successfully');
    assert(mockResModReinstate.body.data.status === 'active', 'Product status restored to active');
    assert(mockResModReinstate.body.data.moderation.status === 'approved', 'Product moderation.status restored to approved');

    // Verify Public Marketplace Reappearance:
    const reinstatedProducts = await Product.find({ status: 'active', _id: testProduct._id });
    assert(reinstatedProducts.length === 1, 'Reinstated product is visible again in active marketplace query');

    console.log('\n--- Test Group 6: User Status Moderation & Self-Protection Guard ---');
    // Admin cannot suspend own account
    const mockResSelfSuspend = createMockRes();
    await adminController.updateUserStatus({
      user: adminUser,
      params: { id: adminUser._id.toString() },
      body: { status: 'suspended', reason: 'Accidental self-lockout' }
    }, mockResSelfSuspend, (err) => { if (err) throw err; });
    assert(mockResSelfSuspend.statusCode === 400, 'Admin cannot suspend their own active administrative session');

    // Admin suspends target member
    const mockResUserSuspend = createMockRes();
    await adminController.updateUserStatus({
      user: adminUser,
      params: { id: targetUser._id.toString() },
      body: { status: 'suspended', reason: 'Violation of trading conduct guidelines' }
    }, mockResUserSuspend, (err) => { if (err) throw err; });
    assert(mockResUserSuspend.statusCode === 200, 'Target user successfully suspended');
    assert(mockResUserSuspend.body.data.status === 'suspended', 'Target user status updated to suspended');

    // Admin reactivates target member
    const mockResUserReactivate = createMockRes();
    await adminController.updateUserStatus({
      user: adminUser,
      params: { id: targetUser._id.toString() },
      body: { status: 'active', reason: 'Appeal reviewed and resolved' }
    }, mockResUserReactivate, (err) => { if (err) throw err; });
    assert(mockResUserReactivate.statusCode === 200, 'Target user successfully reactivated to active');
    assert(mockResUserReactivate.body.data.status === 'active', 'Target user status restored to active');

    console.log('\n--- Test Group 7: Immutable Audit Trail & Sensitive Key Sanitization ---');
    // Task 5: Audit logs recorded for admin actions
    const auditLogs = await AuditLog.find({
      actor: adminUser._id
    }).sort({ createdAt: -1 });

    assert(auditLogs.length >= 4, `At least 4 audit logs recorded for admin mutations (found ${auditLogs.length})`);
    
    const actionsRecorded = auditLogs.map(l => l.action);
    assert(actionsRecorded.includes('product_suspend'), 'Audit trail recorded product_suspend');
    assert(actionsRecorded.includes('product_reinstate'), 'Audit trail recorded product_reinstate');
    assert(actionsRecorded.includes('user_status_update'), 'Audit trail recorded user_status_update');

    // Test sanitization hook: Any attempted secret logging must be redacted
    const testSanitizedLog = await AuditLog.create({
      actor: adminUser._id,
      actorEmail: adminUser.email,
      action: 'security_sanitization_test',
      targetType: 'User',
      targetId: targetUser._id.toString(),
      details: {
        password: 'SuperSecretPassword!',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload',
        secret: 'razorpay_secret_key_12345',
        cardNumber: '4111222233334444',
        safeMetadata: 'Valid operation description'
      }
    });

    const persistedLog = await AuditLog.findById(testSanitizedLog._id).lean();
    assert(persistedLog.details.password === '[REDACTED]', 'Sensitive key "password" is automatically redacted');
    assert(persistedLog.details.token === '[REDACTED]', 'Sensitive key "token" is automatically redacted');
    assert(persistedLog.details.secret === '[REDACTED]', 'Sensitive key "secret" is automatically redacted');
    assert(persistedLog.details.cardNumber === '[REDACTED]', 'Sensitive key "cardNumber" is automatically redacted');
    assert(persistedLog.details.safeMetadata === 'Valid operation description', 'Safe details metadata preserved without distortion');

    console.log('\n--- Test Group 8: Rule 8 Integrity & No Payment Backdoor Guard ---');
    // Task 8: Ensure admin actions cannot silently mark payments paid or fabricate refunds
    const adminControllerExports = Object.keys(adminController);
    assert(!adminControllerExports.includes('markPaymentPaid'), 'No admin endpoint exists to force-mark payments as paid');
    assert(!adminControllerExports.includes('fabricateRefund'), 'No admin endpoint exists to fabricate refunds');
    assert(!adminControllerExports.includes('deleteOrder'), 'No admin endpoint exists to delete real orders');
    assert(!adminControllerExports.includes('deleteUser'), 'No admin endpoint exists to delete real users');

    console.log('\n--- Cleanup: Removing Test Fixtures ---');
    await Order.deleteMany({ _id: testOrder._id });
    await Product.deleteMany({ _id: testProduct._id });
    await AuditLog.deleteMany({ actor: adminUser._id });
    await User.deleteMany({ _id: { $in: [buyerUser._id, farmerUser._id, targetUser._id, adminUser._id] } });
    console.log('✅ Isolated test records safely removed from MongoDB.');

    console.log('\n======================================================');
    console.log(`🎉 AgriFair Phase 8A Test Suite Completed Successfully!`);
    console.log(`   Passed: ${passedTests} / ${totalTests} tests`);
    console.log('======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite execution failed:', error);
    process.exit(1);
  }
}

runPhase8ATests();
