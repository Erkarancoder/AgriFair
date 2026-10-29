const http = require('http');

const request = (path) =>
  new Promise((resolve, reject) => {
    http
      .get('http://localhost:5000' + path, (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      })
      .on('error', reject);
  });

async function runPhase5ETests() {
  console.log('=====================================================');
  console.log('  AGRIFAIR — PHASE 5E: MANDI FILTERING & QUALITY TEST');
  console.log('=====================================================\n');

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

  // Test 1: Filter Options endpoint returns valid states, districts, markets, commodities, dates
  const optRes = await request('/api/mandi-rates/filter-options');
  assert(
    'GET /api/mandi-rates/filter-options returns 200 with structured filter data',
    optRes.status === 200 &&
      Array.isArray(optRes.data?.data?.states) &&
      optRes.data.data.states.length > 0 &&
      Array.isArray(optRes.data?.data?.commodities) &&
      optRes.data.data.commodities.length > 0 &&
      Array.isArray(optRes.data?.data?.dates),
    `Received status ${optRes.status}`
  );

  // Test 2: Scoped filter options for a state (e.g. Uttar Pradesh)
  const scopedRes = await request('/api/mandi-rates/filter-options?state=Uttar%20Pradesh');
  assert(
    'GET /api/mandi-rates/filter-options?state=Uttar Pradesh returns scoped districts and markets',
    scopedRes.status === 200 &&
      scopedRes.data?.data?.districts.includes('Lucknow') &&
      scopedRes.data?.data?.districts.includes('Gorakhpur'),
    `Districts: ${JSON.stringify(scopedRes.data?.data?.districts)}`
  );

  // Test 3: State-only filtering
  const stateRes = await request('/api/mandi-rates/search?state=Punjab');
  const allPunjab = stateRes.data?.data?.every((m) => m.state === 'Punjab');
  assert(
    'Search by state=Punjab returns only Punjab mandis',
    stateRes.status === 200 && stateRes.data?.count > 0 && allPunjab,
    `Count: ${stateRes.data?.count}`
  );

  // Test 4: District-only filtering
  const distRes = await request('/api/mandi-rates/search?district=Lucknow');
  const allLucknow = distRes.data?.data?.every((m) => m.district === 'Lucknow');
  assert(
    'Search by district=Lucknow returns only Lucknow mandis',
    distRes.status === 200 && distRes.data?.count >= 4 && allLucknow,
    `Count: ${distRes.data?.count}`
  );

  // Test 5: Market-only filtering
  const marketName = 'Sitapur Road Krishi Upaj Mandi';
  const mktRes = await request(`/api/mandi-rates/search?market=${encodeURIComponent(marketName)}`);
  assert(
    `Search by market="${marketName}" returns exact match`,
    mktRes.status === 200 && mktRes.data?.count === 1 && mktRes.data.data[0].mandi === marketName,
    `Count: ${mktRes.data?.count}`
  );

  // Test 6: Commodity filtering within mandis
  const commRes = await request('/api/mandi-rates/search?state=Uttar%20Pradesh&commodity=Wheat');
  const allHaveWheat = commRes.data?.data?.every((m) =>
    m.commodities.some((c) => c.commodity.toLowerCase().includes('wheat'))
  );
  assert(
    'Search by state=Uttar Pradesh & commodity=Wheat filters matching commodities accurately',
    commRes.status === 200 && commRes.data?.count > 0 && allHaveWheat,
    `Count: ${commRes.data?.count}`
  );

  // Test 7: Combined Search + Multi-Dimensional Filters
  const combinedRes = await request(
    '/api/mandi-rates/search?q=Fruit&state=Uttar%20Pradesh&district=Lucknow'
  );
  assert(
    'Combined query (q=Fruit, state=UP, district=Lucknow) resolves properly',
    combinedRes.status === 200 &&
      combinedRes.data?.count >= 1 &&
      combinedRes.data.data[0].district === 'Lucknow',
    `Count: ${combinedRes.data?.count}`
  );

  // Test 8: Market Date filtering
  const dateRes = await request('/api/mandi-rates/search?date=2026-10-15');
  assert(
    'Search by marketDate=2026-10-15 returns valid benchmark records',
    dateRes.status === 200 && dateRes.data?.count > 0,
    `Count: ${dateRes.data?.count}`
  );

  // Test 9: Data Provenance Distinction & No False Live Claims
  const provRes = await request('/api/mandi-rates/search?verified=false');
  const allUnverified = provRes.data?.data?.every(
    (m) => m.isVerifiedSource === false && m.dataSource.includes('Sample')
  );
  assert(
    'Preserves distinction: Sample records are strictly marked isVerifiedSource=false with Unverified source',
    provRes.status === 200 && allUnverified,
    `Count: ${provRes.data?.count}`
  );

  // Test 10: Deduplication consistency across commodities
  const sampleMandi = distRes.data.data[0];
  const keys = new Set();
  let hasDuplicate = false;
  for (const c of sampleMandi.commodities) {
    const k = `${c.commodity}::${c.variety}::${c.grade}::${c.marketDate}`;
    if (keys.has(k)) {
      hasDuplicate = true;
      break;
    }
    keys.add(k);
  }
  assert(
    'Commodity subdocuments are consistently deduplicated across (commodity, variety, grade, marketDate)',
    !hasDuplicate,
    `Duplicate found: ${hasDuplicate}`
  );

  console.log('\n-----------------------------------------------------');
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('=====================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase5ETests().catch((err) => {
  console.error('[TEST ERROR]:', err);
  process.exit(1);
});
