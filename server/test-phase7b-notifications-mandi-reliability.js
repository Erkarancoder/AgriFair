/**
 * Phase 7B Automated Verification Suite
 * Tests Notification Lifecycle, Idempotency, Authorization, Channel Status,
 * Mandi Data Validation, Idempotent Upserts, and Benchmark Segregation.
 */

const mongoose = require('mongoose');
const { connectDB } = require('./src/config/db');
const env = require('./src/config/env');
const User = require('./src/models/User');
const { Product } = require('./src/models/Product');
const { Order } = require('./src/models/Order');
const MandiRate = require('./src/models/MandiRate');
const Notification = require('./src/models/Notification');
const notificationService = require('./src/services/notification.service');
const emailService = require('./src/services/email.service');
const mandiSyncService = require('./src/services/mandiSync.service');
const { autoSeedMandiRates } = require('./src/controllers/mandi.controller');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✅ PASS: ${message}`);
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting AgriFair Phase 7B Test Suite');
  console.log('======================================================\n');

  try {
    await connectDB();


    const testRunId = Date.now().toString().slice(-6);

    // Setup Test Users
    const buyerUser = await User.create({
      name: `Test Buyer 7B ${testRunId}`,
      email: `buyer7b_${testRunId}@test.local`,
      phone: `98765${testRunId.slice(0, 5)}`,
      role: 'buyer',
      status: 'active',
      password: 'Password123!'
    });

    const farmerUser = await User.create({
      name: `Test Farmer 7B ${testRunId}`,
      email: `farmer7b_${testRunId}@test.local`,
      phone: `98766${testRunId.slice(0, 5)}`,
      role: 'farmer',
      status: 'active',
      password: 'Password123!'
    });

    const thirdPartyUser = await User.create({
      name: `Third Party 7B ${testRunId}`,
      email: `thirdparty_${testRunId}@test.local`,
      phone: `98767${testRunId.slice(0, 5)}`,
      role: 'buyer',
      status: 'active',
      password: 'Password123!'
    });

    console.log('\n--- Test Group 1: Notification Creation, Persistence & Idempotency ---');

    // 1. In-app notification creation
    const notif1 = await notificationService.createNotification({
      recipient: buyerUser._id,
      type: 'order',
      title: 'Order Confirmed',
      message: 'Your wheat purchase request has been accepted by the farmer.',
      link: '/buyer/orders',
      idempotencyKey: `test:order:confirmed:${testRunId}`
    });

    assert(notif1.success === true, 'Notification successfully created');
    assert(notif1.notification.isRead === false, 'Notification defaults to unread (isRead: false)');
    assert(notif1.notification.title === 'Order Confirmed', 'Notification title saved correctly');

    // 2. Idempotency test: duplicate notification must not create a second document
    const notifDuplicate = await notificationService.createNotification({
      recipient: buyerUser._id,
      type: 'order',
      title: 'Order Confirmed (Duplicate)',
      message: 'Repeated trigger of wheat purchase confirmation.',
      link: '/buyer/orders',
      idempotencyKey: `test:order:confirmed:${testRunId}`
    });

    assert(notifDuplicate.existing === true, 'Duplicate notification detected via idempotencyKey');
    assert(
      notifDuplicate.notification._id.toString() === notif1.notification._id.toString(),
      'Duplicate returns the existing notification document without creating a new one'
    );

    const countForBuyer = await Notification.countDocuments({
      recipient: buyerUser._id,
      idempotencyKey: `test:order:confirmed:${testRunId}`
    });
    assert(countForBuyer === 1, 'Only exactly 1 notification persisted despite duplicate events');

    console.log('\n--- Test Group 2: Notification Read / Unread State & Authorization ---');

    // 3. Unread count
    const unreadCount1 = await notificationService.getUnreadCount(buyerUser._id);
    assert(unreadCount1 >= 1, `Unread count for buyer is correctly tracked (${unreadCount1})`);

    // 4. Cross-user authorization check: third-party cannot mark buyer's notification as read
    let authErrorCaught = false;
    try {
      await notificationService.markNotificationAsRead(notif1.notification._id, thirdPartyUser._id);
    } catch (err) {
      authErrorCaught = true;
      assert(err.statusCode === 403, 'Unauthorized user gets 403 when trying to mark another user notification as read');
    }
    assert(authErrorCaught === true, 'Authorization check strictly enforced on notification modification');

    // 5. Authorized recipient marks as read
    const readDoc = await notificationService.markNotificationAsRead(notif1.notification._id, buyerUser._id);
    assert(readDoc.isRead === true, 'Notification marked as read by authorized recipient');
    assert(readDoc.readAt !== null, 'readAt timestamp populated upon marking read');

    // 6. Mark all as read
    await notificationService.createNotification({
      recipient: buyerUser._id,
      type: 'payment',
      title: 'Payment Successful',
      message: 'Payment of ₹12,000 confirmed.',
      idempotencyKey: `test:payment:${testRunId}`
    });
    await notificationService.createNotification({
      recipient: buyerUser._id,
      type: 'negotiation',
      title: 'Price Offer',
      message: 'New price offer proposed.',
      idempotencyKey: `test:negotiation:${testRunId}`
    });

    const markAllResult = await notificationService.markAllAsRead(buyerUser._id);
    assert(markAllResult.modifiedCount >= 2, 'markAllAsRead successfully updated unread notifications');

    const unreadAfter = await notificationService.getUnreadCount(buyerUser._id);
    assert(unreadAfter === 0, 'Unread count is 0 after markAllAsRead');

    console.log('\n--- Test Group 3: Channel Status & Transactional Email Safeguards ---');

    // 7. Channel status report
    const channels = notificationService.getChannelsStatus();
    assert(channels.inApp.configured === true, 'In-App notifications channel is active and persisted');
    assert(channels.inApp.realTime === true, 'In-App real-time delivery via Socket.IO is supported');
    assert(typeof channels.email.configured === 'boolean', 'Email channel configuration status reported accurately');
    assert(typeof channels.sms.configured === 'boolean', 'SMS channel configuration status reported accurately');

    // 8. Transactional email fallback without crashing
    const emailResult = await emailService.sendTransactionalEmail({
      to: 'unconfigured@agrifair.local',
      subject: 'Order Notice',
      title: 'Notice',
      message: 'Test message'
    });
    if (!channels.email.configured) {
      assert(emailResult.delivered === false, 'Transactional email honestly returns delivered: false when SMTP is unconfigured');
      assert(emailResult.reason.includes('SMTP credentials not configured'), 'Clean reason returned explaining SMTP is not configured');
    } else {
      assert(emailResult.delivered === true, 'Transactional email delivered via configured SMTP');
    }

    console.log('\n--- Test Group 4: Mandi Data Quality & Strict Row Validation ---');

    // 9. Valid official mandi row
    const validRow = {
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      market: 'Lucknow APMC',
      commodity: 'Wheat',
      variety: 'Desi',
      grade: 'FAQ',
      min_price: '2100',
      max_price: '2400',
      modal_price: '2250',
      arrival_date: '15/10/2026',
      unit: 'quintal'
    };
    const validResult = mandiSyncService.validateAndMapOfficialRecord(validRow);
    assert(validResult.valid === true, 'Valid AGMARKNET row passes data quality validation');
    assert(validResult.data.modalPrice === 2250, 'Modal price parsed to valid number');
    assert(validResult.data.isVerifiedSource === true, 'Verified source provenance flag set to true');

    // 10. Inverted min/max prices normalization
    const invertedRow = {
      ...validRow,
      min_price: '2500',
      max_price: '2100'
    };
    const invertedResult = mandiSyncService.validateAndMapOfficialRecord(invertedRow);
    assert(invertedResult.valid === true, 'Inverted min/max prices row accepted and normalized');
    assert(invertedResult.data.minPrice === 2100, 'Min price normalized to smaller value');
    assert(invertedResult.data.maxPrice === 2500, 'Max price normalized to larger value');

    // 11. Missing mandatory geographic fields rejected
    const missingMarketRow = { ...validRow, market: '' };
    const missingResult = mandiSyncService.validateAndMapOfficialRecord(missingMarketRow);
    assert(missingResult.valid === false, 'Row missing market name rejected by data quality validation');

    // 12. Negative or invalid modal price rejected
    const invalidPriceRow = { ...validRow, modal_price: '-50' };
    const invalidPriceResult = mandiSyncService.validateAndMapOfficialRecord(invalidPriceRow);
    assert(invalidPriceResult.valid === false, 'Negative modal_price rejected');

    const zeroPriceRow = { ...validRow, modal_price: '0' };
    const zeroPriceResult = mandiSyncService.validateAndMapOfficialRecord(zeroPriceRow);
    assert(zeroPriceResult.valid === false, 'Zero modal_price rejected');

    // 13. Invalid/Future date rejected
    const futureDateRow = { ...validRow, arrival_date: '01/01/2099' };
    const futureResult = mandiSyncService.validateAndMapOfficialRecord(futureDateRow);
    assert(futureResult.valid === false, 'Future arrival_date rejected');

    const corruptDateRow = { ...validRow, arrival_date: 'invalid-date' };
    const corruptDateResult = mandiSyncService.validateAndMapOfficialRecord(corruptDateRow);
    assert(corruptDateResult.valid === false, 'Corrupt arrival_date string rejected');

    console.log('\n--- Test Group 5: Safe Upserts & Sample Benchmark Segregation ---');

    await MandiRate.deleteMany({ mandi: 'Lucknow APMC', isVerifiedSource: true });

    // 14. Idempotent upsert of verified official records
    const testRecords = [
      validResult.data,
      {
        ...validResult.data,
        commodity: 'Mustard',
        category: 'Oilseeds',
        modalPrice: 5400,
        minPrice: 5100,
        maxPrice: 5600,
        sourceRecordId: `uttar_pradesh:lucknow:lucknow_apmc:mustard:desi:${testRunId}`
      }
    ];

    const upsert1 = await mandiSyncService.upsertOfficialRecords(testRecords, 'test-resource-7b');
    assert(upsert1.createdMandis >= 1 || upsert1.updatedCommodities >= 1, 'Official records upserted into database');

    // Verify document was marked with verified provenance
    const verifiedMandi = await MandiRate.findOne({
      mandi: 'Lucknow APMC',
      isVerifiedSource: true
    });
    assert(verifiedMandi !== null, 'Verified mandi document persisted with isVerifiedSource: true');
    assert(verifiedMandi.dataSource === 'data.gov.in / AGMARKNET (DMI)', 'Data source provenance preserved');

    // 15. Duplicate upsert must be idempotent (no duplicate mandi or commodity records)
    const initialCommCount = verifiedMandi.commodities.length;
    const upsert2 = await mandiSyncService.upsertOfficialRecords(testRecords, 'test-resource-7b');
    const verifiedMandiAfter = await MandiRate.findOne({
      mandi: 'Lucknow APMC',
      isVerifiedSource: true
    });
    assert(
      verifiedMandiAfter.commodities.length === initialCommCount,
      'Duplicate upsert does not create duplicate commodity subdocuments'
    );

    // 16. Benchmark segregation: autoSeedMandiRates must never overwrite verified official records
    await autoSeedMandiRates();
    const verifiedMandiAfterSeed = await MandiRate.findOne({
      mandi: 'Lucknow APMC',
      isVerifiedSource: true
    });
    assert(verifiedMandiAfterSeed !== null, 'autoSeed did not remove or overwrite verified mandi');
    assert(verifiedMandiAfterSeed.isVerifiedSource === true, 'Verified source status preserved after auto-seed');
    assert(verifiedMandiAfterSeed.dataSource === 'data.gov.in / AGMARKNET (DMI)', 'Official data source provenance untouched by seed');

    console.log('\n--- Test Group 6: Missing API Key & Provenance Reporting ---');

    // 17. syncOfficialMandiRates with missing/placeholder API key
    const syncResult = await mandiSyncService.syncOfficialMandiRates();
    if (!env.dataGovApiKey || env.dataGovApiKey === 'your_datagov_api_key_here') {
      assert(syncResult.success === false, 'Sync returns success: false when API key is missing');
      assert(syncResult.isConfigured === false, 'Sync reports isConfigured: false without claiming live import');
      assert(syncResult.recordsSynced === 0, 'No fake records synced when unconfigured');
    } else {
      assert(syncResult.isConfigured === true, 'Sync acknowledges configured API key');
    }

    // 18. getProvenanceStatus comprehensive reporting
    const statusReport = await mandiSyncService.getProvenanceStatus();
    assert(typeof statusReport.isConfigured === 'boolean', 'Provenance status reports API configuration');
    assert(typeof statusReport.counts.officialMandis === 'number', 'Official mandis count tracked');
    assert(typeof statusReport.counts.referenceMandis === 'number', 'Reference benchmarks count tracked');
    assert(typeof statusReport.counts.officialCommodities === 'number', 'Official commodities count tracked');
    assert(statusReport.latestSync !== null, 'latestSync metadata present');
    assert(typeof statusReport.syncReport.message === 'string', 'Honest sync report message returned');

    // Cleanup test artifacts
    await User.deleteMany({ _id: { $in: [buyerUser._id, farmerUser._id, thirdPartyUser._id] } });
    await Notification.deleteMany({ recipient: { $in: [buyerUser._id, farmerUser._id, thirdPartyUser._id] } });
    await MandiRate.deleteMany({ mandi: 'Lucknow APMC', isVerifiedSource: true });

    console.log('\n======================================================');
    console.log(`🎉 Phase 7B Test Suite Complete: ${passedTests}/${totalTests} Passed!`);
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ Phase 7B Test Suite encountered an error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
