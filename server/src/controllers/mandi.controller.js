const MandiRate = require('../models/MandiRate');
const MANDI_SEED_DATA = require('../seeds/mandiSeedData');
const mandiSyncService = require('../services/mandiSync.service');

/**
 * Ensures real mandi benchmark records exist in database
 */
const autoSeedMandiRates = async () => {
  try {
    const count = await MandiRate.countDocuments();
    if (count === 0) {
      console.log('[Mandi Rates] Auto-seeding initial benchmark mandi data...');
      await MandiRate.insertMany(MANDI_SEED_DATA);
      console.log(`[Mandi Rates] Seeded ${MANDI_SEED_DATA.length} mandis across Indian states.`);
    } else {
      // Ensure existing records have data audit & integrity fields without touching verified records
      await MandiRate.updateMany(
        { dataSource: { $exists: false }, isVerifiedSource: { $ne: true } },
        {
          $set: {
            dataSource: 'Sample Reference Benchmark (Unverified)',
            isVerifiedSource: false,
            marketDate: new Date('2026-10-15')
          }
        }
      );
    }
  } catch (error) {
    console.error(`[Mandi Rates Auto-Seed Error]: ${error.message}`);
  }
};

/**
 * GET /api/mandi-rates/suggestions?q=luck
 * Returns bounded, categorized location and mandi suggestions backed by real database records
 */
const getMandiSuggestions = async (req, res, next) => {
  try {
    await autoSeedMandiRates();

    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        query: q || '',
        count: 0,
        suggestions: []
      });
    }

    const cleanQ = q.trim();
    const escaped = cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const suggestions = [];

    // 1. Geographic State Matches
    const matchingStates = await MandiRate.distinct('state', {
      state: regex,
      isActive: true
    });

    for (const st of matchingStates.slice(0, 3)) {
      const count = await MandiRate.countDocuments({ state: st, isActive: true });
      suggestions.push({
        type: 'state',
        name: st,
        state: st,
        label: st,
        sublabel: `State • ${count} ${count === 1 ? 'Mandi' : 'Mandis'} available`,
        mandiCount: count
      });
    }

    // 2. Geographic District Matches
    const matchingDistricts = await MandiRate.distinct('district', {
      district: regex,
      isActive: true
    });

    for (const dist of matchingDistricts.slice(0, 5)) {
      const sample = await MandiRate.findOne({ district: dist, isActive: true }).select('state').lean();
      const count = await MandiRate.countDocuments({ district: dist, isActive: true });
      suggestions.push({
        type: 'district',
        name: dist,
        district: dist,
        state: sample?.state || '',
        label: dist,
        sublabel: `District, ${sample?.state || ''} • ${count} ${count === 1 ? 'Mandi' : 'Mandis'}`,
        mandiCount: count
      });
    }

    // 3. Exact Mandi Name Matches
    const matchingMandis = await MandiRate.find({
      mandi: regex,
      isActive: true
    })
      .select('_id mandi district state marketType commodities')
      .limit(6)
      .lean();

    for (const m of matchingMandis) {
      suggestions.push({
        type: 'mandi',
        id: m._id,
        name: m.mandi,
        district: m.district,
        state: m.state,
        marketType: m.marketType,
        label: m.mandi,
        sublabel: `${m.marketType} • ${m.district}, ${m.state}`,
        commoditiesCount: m.commodities?.length || 0,
        commodityPreview: (m.commodities || []).slice(0, 3).map((c) => c.commodity).join(', ')
      });
    }

    // 4. Clearly labelled "Search all matching" option
    suggestions.push({
      type: 'search_all',
      name: `Search all mandis for "${cleanQ}"`,
      query: cleanQ,
      label: `Search all mandis for "${cleanQ}"`,
      sublabel: 'View all regional matching markets and rate cards'
    });

    // Bound suggestions to at most 12 items
    const boundedSuggestions = suggestions.slice(0, 12);

    return res.status(200).json({
      success: true,
      query: cleanQ,
      count: boundedSuggestions.length,
      suggestions: boundedSuggestions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deduplicate commodities consistently across commodity, variety, grade, and marketDate
 * Non-destructive: Does not alter or remove MongoDB documents
 */
const deduplicateCommodities = (commodities = []) => {
  if (!Array.isArray(commodities)) return [];
  const map = new Map();

  for (const c of commodities) {
    if (!c || !c.commodity) continue;
    const comm = String(c.commodity).trim().toLowerCase();
    const variety = String(c.variety || '').trim().toLowerCase();
    const grade = String(c.grade || '').trim().toLowerCase();
    const dateStr = c.marketDate
      ? (c.marketDate instanceof Date ? c.marketDate : new Date(c.marketDate)).toISOString().slice(0, 10)
      : 'nodate';

    const key = `${comm}::${variety}::${grade}::${dateStr}`;

    if (!map.has(key)) {
      map.set(key, c);
    } else {
      const existing = map.get(key);
      // Prioritize verified records over unverified
      if (!existing.isVerifiedSource && c.isVerifiedSource) {
        map.set(key, c);
      } else if (
        c.updatedAt &&
        existing.updatedAt &&
        new Date(c.updatedAt) > new Date(existing.updatedAt)
      ) {
        map.set(key, c);
      }
    }
  }

  return Array.from(map.values());
};

/**
 * Deduplicate mandi records by mandi name, district, state, and verification status
 */
const deduplicateMandis = (mandis = []) => {
  if (!Array.isArray(mandis)) return [];
  const map = new Map();

  for (const m of mandis) {
    if (!m || !m.mandi) continue;
    const key = `${m.mandi.trim().toLowerCase()}::${m.district.trim().toLowerCase()}::${m.state.trim().toLowerCase()}::${m.isVerifiedSource === true}`;

    if (!map.has(key)) {
      map.set(key, m);
    } else {
      const existing = map.get(key);
      const existingDate = existing.marketDate ? new Date(existing.marketDate) : new Date(0);
      const currentDate = m.marketDate ? new Date(m.marketDate) : new Date(0);
      if (currentDate > existingDate) {
        map.set(key, m);
      }
    }
  }

  return Array.from(map.values());
};

/**
 * GET /api/mandi-rates/filter-options
 * Returns distinct filter options (states, districts, markets, commodities, dates)
 * Supports cascading: ?state=... ?district=...
 */
const getMandiFilterOptions = async (req, res, next) => {
  try {
    await autoSeedMandiRates();
    const { state, district } = req.query;

    const queryFilter = { isActive: true };
    if (state && typeof state === 'string' && state.trim()) {
      const cleanState = state.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      queryFilter.state = new RegExp(`^${cleanState}$`, 'i');
    }
    if (district && typeof district === 'string' && district.trim()) {
      const cleanDist = district.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      queryFilter.district = new RegExp(`^${cleanDist}$`, 'i');
    }

    // 1. All available states
    const states = await MandiRate.distinct('state', { isActive: true });
    states.sort();

    // 2. Districts (scoped by state if provided)
    const districts = await MandiRate.distinct('district', queryFilter);
    districts.sort();

    // 3. Markets / Mandis (scoped by queryFilter)
    const markets = await MandiRate.distinct('mandi', queryFilter);
    markets.sort();

    // 4. Commodities
    const commodities = await MandiRate.distinct('commodities.commodity', { isActive: true });
    commodities.sort();

    // 5. Distinct market dates formatted as YYYY-MM-DD
    const rawDates = await MandiRate.distinct('marketDate', { isActive: true });
    const formattedDates = Array.from(
      new Set(
        rawDates
          .filter(Boolean)
          .map((d) => (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10))
      )
    )
      .sort()
      .reverse();

    return res.status(200).json({
      success: true,
      data: {
        states,
        districts,
        markets,
        commodities,
        dates: formattedDates
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mandi-rates/search?q=lucknow
 * Search mandis by city, district, state, mandi name, crop name, market date, and provenance
 */
const searchMandis = async (req, res, next) => {
  try {
    await autoSeedMandiRates();

    const { q, state, district, market, mandi, commodity, date, marketDate } = req.query;
    const queryFilter = { isActive: true };

    if (q && typeof q === 'string' && q.trim()) {
      const cleanQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(cleanQ, 'i');
      queryFilter.$or = [
        { mandi: regex },
        { district: regex },
        { state: regex },
        { 'commodities.commodity': regex }
      ];
    }

    if (state && typeof state === 'string' && state.trim()) {
      const cleanState = state.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      queryFilter.state = new RegExp(`^${cleanState}$`, 'i');
    }

    if (district && typeof district === 'string' && district.trim()) {
      const cleanDist = district.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      queryFilter.district = new RegExp(`^${cleanDist}$`, 'i');
    }

    const marketFilter = market || mandi;
    if (marketFilter && typeof marketFilter === 'string' && marketFilter.trim()) {
      const cleanMarket = marketFilter.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      queryFilter.mandi = new RegExp(`^${cleanMarket}$`, 'i');
    }

    if (commodity && typeof commodity === 'string' && commodity.trim()) {
      const cleanComm = commodity.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      queryFilter['commodities.commodity'] = new RegExp(cleanComm, 'i');
    }

    const dateFilter = date || marketDate;
    if (dateFilter && typeof dateFilter === 'string' && dateFilter.trim()) {
      const parsedDate = new Date(dateFilter.trim());
      if (!isNaN(parsedDate.getTime())) {
        const startOfDay = new Date(parsedDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(parsedDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        queryFilter.marketDate = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    if (req.query.verified === 'true') {
      queryFilter.isVerifiedSource = true;
    } else if (req.query.verified === 'false') {
      queryFilter.isVerifiedSource = false;
    }

    const rawResults = await MandiRate.find(queryFilter)
      .sort({ marketDate: -1, isVerifiedSource: -1, state: 1, district: 1, mandi: 1 })
      .lean();

    // Deduplicate mandi records if identical markets exist
    const results = deduplicateMandis(rawResults);

    // Grouping by state & district for smart UI categorization
    const grouped = {};
    const sanitizedData = results.map((m) => {
      // Deduplicate commodity subdocuments
      let dedupedCommodities = deduplicateCommodities(m.commodities || []);

      // If commodity filter is active, filter commodities to matching items
      if (commodity && typeof commodity === 'string' && commodity.trim()) {
        const commRegex = new RegExp(commodity.trim(), 'i');
        const matched = dedupedCommodities.filter((c) => commRegex.test(c.commodity));
        if (matched.length > 0) {
          dedupedCommodities = matched;
        }
      }

      const mandiCopy = {
        ...m,
        commodities: dedupedCommodities,
        commoditiesCount: dedupedCommodities.length
      };

      const locationKey = `${m.district}, ${m.state}`;
      if (!grouped[locationKey]) {
        grouped[locationKey] = {
          district: m.district,
          state: m.state,
          mandis: []
        };
      }

      grouped[locationKey].mandis.push({
        _id: m._id,
        mandi: m.mandi,
        district: m.district,
        state: m.state,
        marketType: m.marketType,
        marketDate: m.marketDate,
        dataSource: m.dataSource,
        isVerifiedSource: m.isVerifiedSource,
        sourceResourceId: m.sourceResourceId,
        lastSyncedAt: m.lastSyncedAt,
        commoditiesCount: dedupedCommodities.length,
        topCommodities: dedupedCommodities.slice(0, 4).map((c) => ({
          commodity: c.commodity,
          variety: c.variety,
          grade: c.grade,
          modalPrice: c.modalPrice,
          minPrice: c.minPrice,
          maxPrice: c.maxPrice,
          unit: c.unit,
          trend: c.trend,
          marketDate: c.marketDate
        }))
      });

      return mandiCopy;
    });

    return res.status(200).json({
      success: true,
      query: q || '',
      state: state || '',
      district: district || '',
      market: marketFilter || '',
      commodity: commodity || '',
      marketDate: dateFilter || '',
      count: sanitizedData.length,
      locations: Object.values(grouped),
      data: sanitizedData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mandi-rates/popular
 * Returns curated high-volume mandis across top agricultural hubs
 */
const getPopularMandis = async (req, res, next) => {
  try {
    await autoSeedMandiRates();

    const popular = await MandiRate.find({ isActive: true })
      .sort({ isVerifiedSource: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      count: popular.length,
      data: popular
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mandi-rates/:id
 * Retrieve comprehensive rate card for a single specific mandi
 */
const getMandiById = async (req, res, next) => {
  try {
    await autoSeedMandiRates();
    const { id } = req.params;

    const mandi = await MandiRate.findById(id).lean();
    if (!mandi) {
      return res.status(404).json({
        success: false,
        message: 'Mandi record not found.'
      });
    }

    // Apply deduplication on commodities
    mandi.commodities = deduplicateCommodities(mandi.commodities || []);
    mandi.commoditiesCount = mandi.commodities.length;

    return res.status(200).json({
      success: true,
      data: mandi
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/mandi-rates/sync
 * Bounded, on-demand sync from official Government of India data.gov.in AGMARKNET API
 */
const triggerOfficialSync = async (req, res, next) => {
  try {
    const payload = { ...(req.query || {}), ...(req.body || {}) };
    const syncResult = await mandiSyncService.syncOfficialMandiRates(payload);
    return res.status(syncResult.isConfigured ? 200 : 503).json(syncResult);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mandi-rates/sync/status
 * Returns provenance breakdown (official vs unverified sample) and API configuration status
 */
const getMandiSyncStatus = async (req, res, next) => {
  try {
    const status = await mandiSyncService.getProvenanceStatus();
    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  autoSeedMandiRates,
  getMandiSuggestions,
  getMandiFilterOptions,
  searchMandis,
  getPopularMandis,
  getMandiById,
  triggerOfficialSync,
  getMandiSyncStatus
};
