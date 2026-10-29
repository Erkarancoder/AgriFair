const https = require('https');
const http = require('http');
const env = require('../config/env');
const MandiRate = require('../models/MandiRate');

/**
 * Standard category classifier for agricultural commodities
 */
const classifyCommodityCategory = (commodityName = '') => {
  const name = commodityName.toLowerCase();
  if (
    name.includes('potato') ||
    name.includes('aloo') ||
    name.includes('onion') ||
    name.includes('pyaz') ||
    name.includes('tomato') ||
    name.includes('tamatar') ||
    name.includes('brinjal') ||
    name.includes('cauliflower') ||
    name.includes('cabbage') ||
    name.includes('chilli') ||
    name.includes('garlic') ||
    name.includes('ginger') ||
    name.includes('lady finger') ||
    name.includes('bhindi')
  ) {
    return 'Vegetables';
  }
  if (
    name.includes('mango') ||
    name.includes('apple') ||
    name.includes('banana') ||
    name.includes('orange') ||
    name.includes('guava') ||
    name.includes('grapes') ||
    name.includes('papaya') ||
    name.includes('pomegranate')
  ) {
    return 'Fruits';
  }
  if (
    name.includes('mustard') ||
    name.includes('sarson') ||
    name.includes('groundnut') ||
    name.includes('soyabean') ||
    name.includes('sunflower') ||
    name.includes('sesamum')
  ) {
    return 'Oilseeds';
  }
  if (
    name.includes('chana') ||
    name.includes('gram') ||
    name.includes('arhar') ||
    name.includes('tur') ||
    name.includes('moong') ||
    name.includes('urad') ||
    name.includes('masur') ||
    name.includes('lentil')
  ) {
    return 'Pulses';
  }
  if (
    name.includes('turmeric') ||
    name.includes('haldi') ||
    name.includes('coriander') ||
    name.includes('dhaniya') ||
    name.includes('cumin') ||
    name.includes('jeera') ||
    name.includes('cardamom')
  ) {
    return 'Spices';
  }
  return 'Grains & Cereals';
};

/**
 * Parse date string from data.gov.in format (typically "DD/MM/YYYY")
 * Does NOT invent today's date if missing or invalid.
 */
const parseArrivalDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const trimmed = dateStr.trim();
  let parsed = null;

  // Format: DD/MM/YYYY or DD-MM-YYYY
  const parts = trimmed.split(/[/|-]/);
  if (parts.length === 3) {
    if (parts[0].length <= 2 && parts[2].length === 4) {
      // DD/MM/YYYY
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year >= 2000) {
        parsed = new Date(Date.UTC(year, month, day));
      }
    } else if (parts[0].length === 4 && parts[2].length <= 2) {
      // YYYY-MM-DD
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year >= 2000) {
        parsed = new Date(Date.UTC(year, month, day));
      }
    }
  }

  if (!parsed || isNaN(parsed.getTime())) {
    const isoParsed = new Date(trimmed);
    if (!isNaN(isoParsed.getTime()) && isoParsed.getUTCFullYear() >= 2000) {
      parsed = isoParsed;
    }
  }

  if (!parsed || isNaN(parsed.getTime())) {
    return null;
  }

  // Reject future dates (> today + 2 days to account for UTC zone offsets)
  const maxAllowedFuture = new Date(Date.now() + 2 * 86400000);
  if (parsed.getTime() > maxAllowedFuture.getTime()) {
    return null; // rejected: future date
  }

  return parsed;
};

/**
 * Low-level HTTP helper to call data.gov.in without adding extra dependencies
 */
const fetchOfficialGovData = (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 15000 }, (res) => {
      let rawData = '';
      res.on('data', (chunk) => (rawData += chunk));
      res.on('end', () => {
        try {
          if (res.statusCode === 429) {
            return reject(new Error('Rate limit exceeded from data.gov.in API (HTTP 429).'));
          }
          if (res.statusCode === 401 || res.statusCode === 403) {
            return reject(
              new Error('Authentication failed for data.gov.in. Verify your DATAGOV_API_KEY.')
            );
          }
          if (res.statusCode >= 400) {
            return reject(
              new Error(`data.gov.in responded with HTTP ${res.statusCode}: ${rawData.slice(0, 200)}`)
            );
          }
          const parsed = JSON.parse(rawData);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse response from data.gov.in: ${e.message}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout connecting to data.gov.in API (15s limit).'));
    });

    req.on('error', (err) => {
      reject(new Error(`Network error connecting to data.gov.in: ${err.message}`));
    });
  });
};

/**
 * Validates and maps a single record from the official response schema
 */
const validateAndMapOfficialRecord = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, reason: 'Record is not an object' };
  }

  const state = (raw.state || '').trim();
  const district = (raw.district || '').trim();
  const market = (raw.market || '').trim();
  const commodity = (raw.commodity || '').trim();
  const variety = (raw.variety || 'Standard').trim();
  const grade = (raw.grade || 'FAQ').trim();

  // Validate mandatory fields with length constraints
  if (
    !state ||
    !district ||
    !market ||
    !commodity ||
    state.length < 2 ||
    district.length < 2 ||
    market.length < 2 ||
    commodity.length < 2
  ) {
    return {
      valid: false,
      reason: 'Missing or too short geographic/commodity fields (state, district, market, commodity must be >= 2 characters)'
    };
  }

  const modalPrice = Number(raw.modal_price);
  if (isNaN(modalPrice) || modalPrice <= 0 || modalPrice > 500000) {
    return {
      valid: false,
      reason: 'Invalid modal_price (must be a positive number up to 500,000)'
    };
  }

  let minPrice =
    !isNaN(Number(raw.min_price)) && Number(raw.min_price) > 0
      ? Number(raw.min_price)
      : modalPrice;

  let maxPrice =
    !isNaN(Number(raw.max_price)) && Number(raw.max_price) > 0
      ? Number(raw.max_price)
      : modalPrice;

  // Normalize min/max if inverted
  if (minPrice > maxPrice) {
    const temp = minPrice;
    minPrice = maxPrice;
    maxPrice = temp;
  }

  const marketDate = parseArrivalDate(raw.arrival_date);
  if (!marketDate) {
    return { valid: false, reason: 'Invalid, missing, or future arrival_date' };
  }

  // Build a unique provenance record key for idempotence
  const dateKey = marketDate.toISOString().slice(0, 10);
  const sourceRecordId = [
    state.toLowerCase().replace(/\s+/g, '_'),
    district.toLowerCase().replace(/\s+/g, '_'),
    market.toLowerCase().replace(/\s+/g, '_'),
    commodity.toLowerCase().replace(/\s+/g, '_'),
    variety.toLowerCase().replace(/\s+/g, '_'),
    dateKey
  ].join(':');

  return {
    valid: true,
    data: {
      state,
      district,
      market,
      commodity,
      category: classifyCommodityCategory(commodity),
      variety,
      grade,
      minPrice,
      maxPrice,
      modalPrice,
      unit: raw.unit && typeof raw.unit === 'string' ? raw.unit.trim().toLowerCase() : 'quintal',
      arrivalQuantity: raw.arrival_quantity ? String(raw.arrival_quantity).trim() : null,
      marketDate,
      sourceRecordId,
      dataSource: 'data.gov.in / AGMARKNET (DMI)',
      isVerifiedSource: true
    }
  };
};


/**
 * Idempotently upserts an array of validated official records into MandiRate
 */
const upsertOfficialRecords = async (records, resourceId) => {
  let createdCount = 0;
  let updatedCommoditiesCount = 0;

  for (const item of records) {
    const {
      state,
      district,
      market,
      commodity,
      category,
      variety,
      grade,
      minPrice,
      maxPrice,
      modalPrice,
      unit,
      arrivalQuantity,
      marketDate,
      sourceRecordId,
      dataSource,
      isVerifiedSource
    } = item;

    // Locate existing verified mandi document
    let mandiDoc = await MandiRate.findOne({
      mandi: market,
      district,
      state,
      isVerifiedSource: true
    });

    if (!mandiDoc) {
      mandiDoc = new MandiRate({
        mandi: market,
        district,
        state,
        marketType: 'APMC Market Yard',
        marketDate,
        dataSource,
        isVerifiedSource: true,
        sourceResourceId: resourceId,
        lastSyncedAt: new Date(),
        commodities: [],
        isActive: true
      });
      createdCount++;
    } else {
      mandiDoc.lastSyncedAt = new Date();
      if (mandiDoc.marketDate < marketDate) {
        mandiDoc.marketDate = marketDate;
      }
    }

    // Check if this exact commodity rate record already exists in the mandi doc
    const existingIndex = mandiDoc.commodities.findIndex((c) => {
      if (sourceRecordId && c.sourceRecordId === sourceRecordId) {
        return true;
      }
      const matchName = c.commodity.toLowerCase() === commodity.toLowerCase();
      const matchVariety = (c.variety || '').toLowerCase() === variety.toLowerCase();
      const matchDate =
        c.marketDate &&
        marketDate &&
        c.marketDate.toISOString().slice(0, 10) === marketDate.toISOString().slice(0, 10);
      return matchName && matchVariety && matchDate;
    });

    if (existingIndex >= 0) {
      // Idempotent update: update price fields and provenance
      mandiDoc.commodities[existingIndex].minPrice = minPrice;
      mandiDoc.commodities[existingIndex].maxPrice = maxPrice;
      mandiDoc.commodities[existingIndex].modalPrice = modalPrice;
      mandiDoc.commodities[existingIndex].grade = grade;
      mandiDoc.commodities[existingIndex].dataSource = dataSource;
      mandiDoc.commodities[existingIndex].isVerifiedSource = true;
      mandiDoc.commodities[existingIndex].sourceRecordId = sourceRecordId;
      mandiDoc.commodities[existingIndex].updatedAt = new Date();
      if (arrivalQuantity) {
        mandiDoc.commodities[existingIndex].arrivalQuantity = arrivalQuantity;
      }
      updatedCommoditiesCount++;
    } else {
      // Add new commodity entry
      mandiDoc.commodities.push({
        commodity,
        category,
        variety,
        grade,
        minPrice,
        maxPrice,
        modalPrice,
        unit,
        arrivalQuantity,
        trend: 'stable',
        priceChange: 0,
        marketDate,
        dataSource,
        isVerifiedSource: true,
        sourceRecordId,
        updatedAt: new Date()
      });
      updatedCommoditiesCount++;
    }

    await mandiDoc.save();
  }

  return { createdMandis: createdCount, updatedCommodities: updatedCommoditiesCount };
};

/**
 * Main Sync Service Function
 * Bounded, manual/admin triggerable import
 */
const syncOfficialMandiRates = async (options = {}) => {
  const apiKey = env.dataGovApiKey;
  const resourceId = options.resourceId || env.dataGovResourceId;
  const baseUrl = env.dataGovBaseUrl;

  if (!apiKey || !apiKey.trim() || apiKey === 'your_datagov_api_key_here') {
    return {
      success: false,
      isConfigured: false,
      message:
        'Official Government of India (data.gov.in) API key is not configured in server environment. Set DATAGOV_API_KEY to enable live official sync.',
      resourceId,
      recordsSynced: 0
    };
  }

  const limit = Math.min(Math.max(parseInt(options.limit || 10, 10), 1), 100);
  const offset = Math.max(parseInt(options.offset || 0, 10), 0);

  // Construct target URL with bounded parameters
  const urlObj = new URL(`${baseUrl.replace(/\/$/, '')}/${resourceId}`);
  urlObj.searchParams.set('api-key', apiKey);
  urlObj.searchParams.set('format', 'json');
  urlObj.searchParams.set('limit', String(limit));
  urlObj.searchParams.set('offset', String(offset));

  if (options.state && typeof options.state === 'string') {
    urlObj.searchParams.set('filters[state]', options.state.trim());
  }
  if (options.district && typeof options.district === 'string') {
    urlObj.searchParams.set('filters[district]', options.district.trim());
  }
  if (options.market && typeof options.market === 'string') {
    urlObj.searchParams.set('filters[market]', options.market.trim());
  }

  const rawResponse = await fetchOfficialGovData(urlObj.toString());

  const rawRecords = rawResponse.records || [];
  const validatedRecords = [];
  const rejectedRecords = [];

  for (const raw of rawRecords) {
    const result = validateAndMapOfficialRecord(raw);
    if (result.valid) {
      validatedRecords.push(result.data);
    } else {
      rejectedRecords.push({ raw, reason: result.reason });
    }
  }

  const upsertStats = await upsertOfficialRecords(validatedRecords, resourceId);

  return {
    success: true,
    isConfigured: true,
    resourceId,
    totalFetched: rawRecords.length,
    validatedCount: validatedRecords.length,
    rejectedCount: rejectedRecords.length,
    createdMandis: upsertStats.createdMandis,
    updatedCommodities: upsertStats.updatedCommodities,
    rejections: rejectedRecords.slice(0, 5) // Return at most 5 rejected samples for diagnostics
  };
};

/**
 * Returns summary status of verified official vs unverified reference data
 */
const getProvenanceStatus = async () => {
  const isConfigured = Boolean(
    env.dataGovApiKey &&
      env.dataGovApiKey.trim() &&
      env.dataGovApiKey !== 'your_datagov_api_key_here'
  );

  const officialMandisCount = await MandiRate.countDocuments({ isVerifiedSource: true });
  const referenceMandisCount = await MandiRate.countDocuments({ isVerifiedSource: false });

  const latestOfficial = await MandiRate.findOne({ isVerifiedSource: true })
    .sort({ lastSyncedAt: -1 })
    .select('lastSyncedAt marketDate dataSource sourceResourceId')
    .lean();

  let officialCommoditiesCount = 0;
  let referenceCommoditiesCount = 0;

  try {
    const [officialStats, referenceStats] = await Promise.all([
      MandiRate.aggregate([
        { $match: { isVerifiedSource: true } },
        { $project: { count: { $size: { $ifNull: ['$commodities', []] } } } },
        { $group: { _id: null, total: { $sum: '$count' } } }
      ]),
      MandiRate.aggregate([
        { $match: { isVerifiedSource: false } },
        { $project: { count: { $size: { $ifNull: ['$commodities', []] } } } },
        { $group: { _id: null, total: { $sum: '$count' } } }
      ])
    ]);
    officialCommoditiesCount = officialStats[0]?.total || 0;
    referenceCommoditiesCount = referenceStats[0]?.total || 0;
  } catch (aggErr) {
    console.warn('[Provenance Status Aggregation Warn]:', aggErr.message);
  }

  let freshness = 'no_official_data';
  let freshnessDays = null;
  if (latestOfficial && latestOfficial.marketDate) {
    const diffMs = Date.now() - new Date(latestOfficial.marketDate).getTime();
    freshnessDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    if (freshnessDays <= 2) {
      freshness = 'fresh';
    } else if (freshnessDays <= 7) {
      freshness = 'recent';
    } else {
      freshness = 'stale';
    }
  }

  return {
    isConfigured,
    resourceId: env.dataGovResourceId,
    officialDataSource: 'data.gov.in / AGMARKNET (DMI)',
    counts: {
      officialMandis: officialMandisCount,
      referenceMandis: referenceMandisCount,
      totalMandis: officialMandisCount + referenceMandisCount,
      officialCommodities: officialCommoditiesCount,
      referenceCommodities: referenceCommoditiesCount,
      totalCommodities: officialCommoditiesCount + referenceCommoditiesCount
    },
    latestSync: latestOfficial
      ? {
          lastSyncedAt: latestOfficial.lastSyncedAt,
          marketDate: latestOfficial.marketDate,
          sourceResourceId: latestOfficial.sourceResourceId,
          freshness,
          freshnessDays
        }
      : {
          lastSyncedAt: null,
          marketDate: null,
          sourceResourceId: null,
          freshness: 'no_official_data',
          freshnessDays: null
        },
    syncReport: {
      status: isConfigured
        ? latestOfficial
          ? 'active_synced'
          : 'configured_pending_sync'
        : 'unconfigured',
      message: isConfigured
        ? latestOfficial
          ? `Verified AGMARKNET sync active (${officialMandisCount} markets, ${officialCommoditiesCount} commodity rate cards).`
          : 'data.gov.in API key configured. Ready to run bounded import.'
        : 'data.gov.in API key is not configured in server environment. Displaying local reference benchmarks.'
    }
  };
};

module.exports = {
  syncOfficialMandiRates,
  getProvenanceStatus,
  validateAndMapOfficialRecord,
  upsertOfficialRecords,
  parseArrivalDate,
  classifyCommodityCategory
};
