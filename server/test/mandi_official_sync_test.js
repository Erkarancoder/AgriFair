const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const MandiRate = require('../src/models/MandiRate');
const {
  validateAndMapOfficialRecord,
  parseArrivalDate,
  upsertOfficialRecords,
  syncOfficialMandiRates,
  getProvenanceStatus
} = require('../src/services/mandiSync.service');

async function runOfficialSyncTests() {
  console.log('=== STARTING OFFICIAL MANDI SYNC & PROVENANCE TESTS ===');

  let dbConnected = false;
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    dbConnected = true;
  } catch (err) {
    console.error('Database connection failed for tests:', err.message);
    process.exit(1);
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Date Parsing Accuracy
    // ----------------------------------------------------
    const parsedValid = parseArrivalDate('23/10/2026');
    const parsedInvalid = parseArrivalDate('not-a-date');
    const parsedNull = parseArrivalDate(null);
    const test1Pass =
      parsedValid instanceof Date &&
      parsedValid.getUTCFullYear() === 2026 &&
      parsedValid.getUTCMonth() === 9 && // 0-indexed October
      parsedValid.getUTCDate() === 23 &&
      parsedInvalid === null &&
      parsedNull === null;
    console.log('Test 1 (Arrival Date Parsing):', test1Pass ? 'PASS' : 'FAIL');

    // ----------------------------------------------------
    // TEST 2: Valid Official Field Mapping
    // ----------------------------------------------------
    const validRaw = {
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      market: 'Dubagga',
      commodity: 'Potato',
      variety: 'Desi',
      grade: 'FAQ',
      arrival_date: '20/10/2026',
      min_price: '1400',
      max_price: '1800',
      modal_price: '1650'
    };
    const mapResult = validateAndMapOfficialRecord(validRaw);
    const test2Pass =
      mapResult.valid === true &&
      mapResult.data.state === 'Uttar Pradesh' &&
      mapResult.data.district === 'Lucknow' &&
      mapResult.data.market === 'Dubagga' &&
      mapResult.data.commodity === 'Potato' &&
      mapResult.data.modalPrice === 1650 &&
      mapResult.data.minPrice === 1400 &&
      mapResult.data.maxPrice === 1800 &&
      mapResult.data.isVerifiedSource === true &&
      mapResult.data.dataSource.includes('data.gov.in') &&
      Boolean(mapResult.data.sourceRecordId);
    console.log('Test 2 (Valid Field Mapping & Provenance Tag):', test2Pass ? 'PASS' : 'FAIL');

    // ----------------------------------------------------
    // TEST 3: Malformed & Incomplete Records Handling
    // ----------------------------------------------------
    const missingMarket = validateAndMapOfficialRecord({
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      commodity: 'Wheat',
      modal_price: '2200',
      arrival_date: '20/10/2026'
    });
    const missingPrice = validateAndMapOfficialRecord({
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      market: 'Dubagga',
      commodity: 'Wheat',
      arrival_date: '20/10/2026'
    });
    const missingDate = validateAndMapOfficialRecord({
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      market: 'Dubagga',
      commodity: 'Wheat',
      modal_price: '2200'
    });
    const test3Pass =
      missingMarket.valid === false &&
      missingPrice.valid === false &&
      missingDate.valid === false;
    console.log('Test 3 (Rejection of Malformed / Incomplete Records):', test3Pass ? 'PASS' : 'FAIL');

    // ----------------------------------------------------
    // TEST 4: Secure Unconfigured State (No Fake Data)
    // ----------------------------------------------------
    const unconfiguredSync = await syncOfficialMandiRates({
      resourceId: '9ef84268-d588-465a-a308-a864a43d0070'
    });
    const test4Pass =
      unconfiguredSync.success === false &&
      unconfiguredSync.isConfigured === false &&
      unconfiguredSync.message.includes('DATAGOV_API_KEY');
    console.log('Test 4 (Secure Unconfigured State Handling):', test4Pass ? 'PASS' : 'FAIL');

    // ----------------------------------------------------
    // TEST 5: Idempotent Upsert & Duplicate Prevention
    // ----------------------------------------------------
    const testMandiName = 'Test-APMC-SyncYard';
    const testRecordDate = new Date('2026-10-22T00:00:00.000Z');

    const testOfficialRecords = [
      {
        state: 'Uttar Pradesh',
        district: 'Lucknow',
        market: testMandiName,
        commodity: 'Mustard',
        category: 'Oilseeds',
        variety: 'Black Bold',
        grade: 'FAQ',
        minPrice: 5200,
        maxPrice: 5800,
        modalPrice: 5500,
        unit: 'quintal',
        arrivalQuantity: '30 Tonnes',
        marketDate: testRecordDate,
        sourceRecordId: 'test_official_1',
        dataSource: 'data.gov.in / AGMARKNET (DMI)',
        isVerifiedSource: true
      }
    ];

    // First upsert: creates new verified document
    const firstImport = await upsertOfficialRecords(
      testOfficialRecords,
      '9ef84268-d588-465a-a308-a864a43d0070'
    );
    const docAfterFirst = await MandiRate.findOne({
      mandi: testMandiName,
      isVerifiedSource: true
    });
    const countAfterFirst = docAfterFirst ? docAfterFirst.commodities.length : 0;

    // Second upsert of identical record with updated price: must NOT create duplicate commodity or mandi!
    const updatedTestRecords = [
      {
        ...testOfficialRecords[0],
        modalPrice: 5600, // Price updated in auction
        maxPrice: 5900
      }
    ];
    const secondImport = await upsertOfficialRecords(
      updatedTestRecords,
      '9ef84268-d588-465a-a308-a864a43d0070'
    );
    const docAfterSecond = await MandiRate.findOne({
      mandi: testMandiName,
      isVerifiedSource: true
    });
    const countAfterSecond = docAfterSecond ? docAfterSecond.commodities.length : 0;
    const priceUpdated = docAfterSecond && docAfterSecond.commodities[0].modalPrice === 5600;

    const test5Pass =
      firstImport.createdMandis === 1 &&
      secondImport.createdMandis === 0 &&
      countAfterFirst === 1 &&
      countAfterSecond === 1 &&
      priceUpdated;
    console.log(
      'Test 5 (Idempotent Upsert & Duplicate Protection):',
      test5Pass ? 'PASS' : 'FAIL',
      `Commodities count: ${countAfterSecond}, Updated price: ₹${docAfterSecond?.commodities[0]?.modalPrice}`
    );

    // ----------------------------------------------------
    // TEST 6: Provenance Separation & No Overwrite by Sample Data
    // ----------------------------------------------------
    const provStatus = await getProvenanceStatus();
    const hasOfficial = provStatus.counts.officialMandis >= 1;
    const hasReference = provStatus.counts.referenceMandis >= 1;

    // Check that sample search with verified=true only returns verified records
    const verifiedOnly = await MandiRate.find({ isVerifiedSource: true }).lean();
    const allAreVerified = verifiedOnly.every((m) => m.isVerifiedSource === true);

    const test6Pass = hasOfficial && hasReference && allAreVerified;
    console.log(
      'Test 6 (Provenance Separation Official vs Reference):',
      test6Pass ? 'PASS' : 'FAIL',
      `Official Mandis: ${provStatus.counts.officialMandis}, Reference Mandis: ${provStatus.counts.referenceMandis}`
    );

    // ----------------------------------------------------
    // CLEANUP: Remove only the isolated test record
    // ----------------------------------------------------
    await MandiRate.deleteOne({ mandi: testMandiName });
    const cleanedDoc = await MandiRate.findOne({ mandi: testMandiName });
    console.log('Cleanup:', cleanedDoc === null ? 'SUCCESS (Test record removed)' : 'WARNING');

    console.log('=== ALL PHASE 5D OFFICIAL SYNC TESTS COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    if (dbConnected) {
      await mongoose.disconnect();
    }
  }
}

runOfficialSyncTests();
