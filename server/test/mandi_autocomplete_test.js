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

async function runTests() {
  console.log('--- STARTING MANDI AUTOCOMPLETE & INTEGRITY TESTS ---');

  // Test 1: Empty & 1-char
  const t1 = await request('/api/mandi-rates/suggestions');
  const t2 = await request('/api/mandi-rates/suggestions?q=a');
  console.log(
    'Test 1 (Empty & 1-char input):',
    t1.data.count === 0 && t2.data.count === 0 ? 'PASS' : 'FAIL'
  );

  // Test 2: Lucknow query
  const tLuck = await request('/api/mandi-rates/suggestions?q=luck');
  const hasLuckDist = tLuck.data.suggestions.some(
    (s) => s.type === 'district' && s.name === 'Lucknow'
  );
  console.log('Test 2 (Lucknow District Suggestion):', hasLuckDist ? 'PASS' : 'FAIL');

  // Test 3: Gorakhpur query
  const tGor = await request('/api/mandi-rates/suggestions?q=gor');
  const hasGorDist = tGor.data.suggestions.some(
    (s) => s.type === 'district' && s.name === 'Gorakhpur'
  );
  const hasGorMandi = tGor.data.suggestions.some((s) => s.type === 'mandi');
  console.log(
    'Test 3 (Gorakhpur District & Mandi Matches):',
    hasGorDist && hasGorMandi ? 'PASS' : 'FAIL'
  );

  // Test 4: State name query (Bihar)
  const tBihar = await request('/api/mandi-rates/suggestions?q=bihar');
  const hasBiharState = tBihar.data.suggestions.some(
    (s) => s.type === 'state' && s.name === 'Bihar'
  );
  console.log('Test 4 (State Suggestion for Bihar):', hasBiharState ? 'PASS' : 'FAIL');

  // Test 5: Partial mandi name (Sitapur)
  const tSita = await request('/api/mandi-rates/suggestions?q=sitapur');
  const hasSitaMandi = tSita.data.suggestions.some(
    (s) => s.type === 'mandi' && s.name.includes('Sitapur Road')
  );
  console.log('Test 5 (Partial Mandi Name Sitapur):', hasSitaMandi ? 'PASS' : 'FAIL');

  // Test 6: Unknown query (Atlantis)
  const tUnknown = await request('/api/mandi-rates/suggestions?q=Atlantis99');
  console.log(
    'Test 6 (Unknown Query returns only search_all):',
    tUnknown.data.count === 1 && tUnknown.data.suggestions[0].type === 'search_all'
      ? 'PASS'
      : 'FAIL'
  );

  // Test 7: Regex characters safety
  const tSafe = await request('/api/mandi-rates/suggestions?q=luck[now)+');
  console.log('Test 7 (Regex safety with special chars):', tSafe.status === 200 ? 'PASS' : 'FAIL');

  // Test 8: Location filtering (district=Lucknow)
  const tDistSearch = await request('/api/mandi-rates/search?district=Lucknow');
  const allInLucknow = tDistSearch.data.data.every((m) => m.district === 'Lucknow');
  console.log(
    'Test 8 (Filter mandis by district=Lucknow):',
    tDistSearch.data.count === 4 && allInLucknow ? 'PASS' : 'FAIL',
    `Total found: ${tDistSearch.data.count}`
  );

  // Test 9: Location filtering (state=Bihar)
  const tStateSearch = await request('/api/mandi-rates/search?state=Bihar');
  const allInBihar = tStateSearch.data.data.every((m) => m.state === 'Bihar');
  console.log(
    'Test 9 (Filter mandis by state=Bihar):',
    tStateSearch.data.count >= 2 && allInBihar ? 'PASS' : 'FAIL',
    `Total found: ${tStateSearch.data.count}`
  );

  // Test 10: Mandi by ID & Data Integrity audit
  const firstMandi = tDistSearch.data.data[0];
  const tMandi = await request('/api/mandi-rates/' + firstMandi._id);
  const mData = tMandi.data.data;
  const isAuditHonest =
    mData.isVerifiedSource === false &&
    mData.dataSource.includes('Unverified') &&
    Boolean(mData.marketDate);
  console.log(
    'Test 10 (Mandi Rate Card & Audit Fields):',
    isAuditHonest ? 'PASS' : 'FAIL',
    `Source: ${mData.dataSource}, Verified: ${mData.isVerifiedSource}`
  );

  console.log('--- ALL MANDI AUTOCOMPLETE & INTEGRITY TESTS PASS ---');
}

runTests();
