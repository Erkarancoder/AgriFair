import { useState, useEffect, useCallback, useId, useRef } from 'react';
import {
  MapPin,
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  Calendar,
  Building2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Info,
  Database,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Filter,
  RotateCcw
} from 'lucide-react';
import mandiService from '../../services/mandi.service';
import Modal from '../common/Modal';

export default function MandiRateModal({ isOpen, onClose }) {
  const searchInputId = useId();
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Search & Results state
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mandis, setMandis] = useState([]);
  const [groupedLocations, setGroupedLocations] = useState([]);
  const [selectedMandi, setSelectedMandi] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [provenanceFilter, setProvenanceFilter] = useState('all'); // 'all' | 'verified' | 'unverified'
  const [syncStatus, setSyncStatus] = useState(null);

  // Advanced Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Filter options from database
  const [filterOptions, setFilterOptions] = useState({
    states: [],
    districts: [],
    markets: [],
    commodities: [],
    dates: []
  });
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // Quick shortcuts for sample hubs
  const quickHubs = [
    'Lucknow',
    'Gorakhpur',
    'Delhi',
    'Pune',
    'Patna',
    'Indore',
    'Khanna',
    'Kota',
    'Karnal'
  ];

  // Fetch full list of mandis with combined search and filters
  const fetchMandis = useCallback(
    async (query = '', customFilters = null) => {
      try {
        setLoading(true);
        setError(null);

        const activeFilters = customFilters || {
          state: selectedState,
          district: selectedDistrict,
          market: selectedMarket,
          commodity: selectedCommodity,
          date: selectedDate,
          verified:
            provenanceFilter === 'all'
              ? undefined
              : provenanceFilter === 'verified'
        };

        const res = await mandiService.searchMandis(query, activeFilters);
        if (res && res.success) {
          setMandis(res.data || []);
          setGroupedLocations(res.locations || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch mandi benchmark rates.');
      } finally {
        setLoading(false);
      }
    },
    [
      selectedState,
      selectedDistrict,
      selectedMarket,
      selectedCommodity,
      selectedDate,
      provenanceFilter
    ]
  );

  // Fetch filter options (states, districts, markets, commodities, dates)
  const loadFilterOptions = useCallback(async (scope = {}) => {
    try {
      setFilterOptionsLoading(true);
      const res = await mandiService.getFilterOptions(scope);
      if (res && res.success && res.data) {
        setFilterOptions((prev) => ({
          states: res.data.states || prev.states,
          districts: res.data.districts || prev.districts,
          markets: res.data.markets || prev.markets,
          commodities: res.data.commodities || prev.commodities,
          dates: res.data.dates || prev.dates
        }));
      }
    } catch (err) {
      console.warn('[MandiRateModal] Failed to load filter options:', err);
    } finally {
      setFilterOptionsLoading(false);
    }
  }, []);

  // Fetch provenance / sync status
  const loadSyncStatus = useCallback(async () => {
    try {
      const res = await mandiService.getSyncStatus();
      if (res && res.success) {
        setSyncStatus(res.data);
      }
    } catch (err) {
      console.warn('[MandiRateModal] Sync status check failed:', err);
    }
  }, []);

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMandis(searchTerm);
      loadFilterOptions();
      loadSyncStatus();
    } else {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  }, [isOpen, fetchMandis, loadFilterOptions, loadSyncStatus]);

  // Click outside listener for autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced autocomplete fetch with request cancellation
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      setSuggestionsError(null);
      setShowSuggestions(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setSuggestionsLoading(true);
    setSuggestionsError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await mandiService.getSuggestions(trimmed, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(res?.suggestions || []);
          setShowSuggestions(true);
          setActiveSuggestionIndex(-1);
          setSuggestionsLoading(false);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
            console.error('[MandiRateModal] Suggestions failed:', err);
            setSuggestionsError(err.message || 'Failed to fetch suggestions.');
          }
          setSuggestionsLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm]);

  // Handle selecting an autocomplete suggestion
  const handleSelectSuggestion = async (sug) => {
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);

    if (sug.type === 'mandi') {
      setSearchTerm(sug.name);
      try {
        setLoading(true);
        setError(null);
        const res = await mandiService.getMandiById(sug.id);
        if (res && res.data) {
          setSelectedMandi(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load mandi details.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (sug.type === 'district') {
      setSearchTerm(sug.district);
      setSelectedDistrict(sug.district);
      setSelectedMandi(null);
      fetchMandis('', {
        state: selectedState,
        district: sug.district,
        market: selectedMarket,
        commodity: selectedCommodity,
        date: selectedDate,
        verified: provenanceFilter === 'all' ? undefined : provenanceFilter === 'verified'
      });
      return;
    }

    if (sug.type === 'state') {
      setSearchTerm(sug.state);
      setSelectedState(sug.state);
      setSelectedDistrict('');
      setSelectedMarket('');
      loadFilterOptions({ state: sug.state });
      setSelectedMandi(null);
      fetchMandis('', {
        state: sug.state,
        district: '',
        market: '',
        commodity: selectedCommodity,
        date: selectedDate,
        verified: provenanceFilter === 'all' ? undefined : provenanceFilter === 'verified'
      });
      return;
    }

    // 'search_all' option
    const queryToSearch = sug.query || searchTerm;
    setSearchTerm(queryToSearch);
    setSelectedMandi(null);
    fetchMandis(queryToSearch);

    window.dispatchEvent(
      new CustomEvent('agrifair:voice_speak', {
        detail: {
          hindiText: `${sug.name || sug.district || sug.state || queryToSearch} का मंडी भाव नीचे आ गया है।`,
          romanText: `${sug.name || sug.district || sug.state || queryToSearch} ka mandi bhav aa gaya hai.`,
          key: `mandi-sug-${(sug.name || sug.district || sug.state || queryToSearch).toLowerCase()}`
        }
      })
    );
  };

  // Keyboard navigation inside input / dropdown
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedMandi(null);
        fetchMandis(searchTerm);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
        handleSelectSuggestion(suggestions[activeSuggestionIndex]);
      } else {
        setShowSuggestions(false);
        setSelectedMandi(null);
        fetchMandis(searchTerm);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    setSelectedMandi(null);
    fetchMandis(searchTerm);
    if (searchTerm.trim()) {
      window.dispatchEvent(
        new CustomEvent('agrifair:voice_speak', {
          detail: {
            hindiText: `${searchTerm} के लिए मंडी भाव की सूची नीचे आ गई है। अपनी नजदीकी मंडी पर क्लिक करके पूरा भाव देखें।`,
            romanText: `${searchTerm} ke liye mandi bhav aa gaya hai. Niche click karke bhav dekhein.`,
            key: `mandi-search-${searchTerm.toLowerCase().trim()}`
          }
        })
      );
    }
  };

  const handleQuickHubClick = (city) => {
    setSearchTerm(city);
    setShowSuggestions(false);
    setSelectedMandi(null);
    fetchMandis(city);
    window.dispatchEvent(
      new CustomEvent('agrifair:voice_speak', {
        detail: {
          hindiText: `${city} मंडी का आज का ताज़ा सरकारी और आवक भाव नीचे आ गया है। इसे देखकर आप अपनी फसल का सही दाम तय कर सकते हैं।`,
          romanText: `${city} mandi ka taaza bhav niche aa gaya hai. Isse dekh kar sahi daam tay karein.`,
          key: `mandi-city-${city.toLowerCase()}`
        }
      })
    );
  };

  // Clear search and reset results
  const handleClear = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedMandi(null);
    fetchMandis('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Clear all filters and restore full list
  const handleResetAllFilters = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedMarket('');
    setSelectedCommodity('');
    setSelectedDate('');
    setProvenanceFilter('all');
    setSearchTerm('');
    setSelectedMandi(null);
    loadFilterOptions();
    fetchMandis('', {
      state: '',
      district: '',
      market: '',
      commodity: '',
      date: '',
      verified: undefined
    });
  };

  // State dropdown change with cascading
  const handleStateChange = (stateVal) => {
    setSelectedState(stateVal);
    setSelectedDistrict('');
    setSelectedMarket('');
    loadFilterOptions(stateVal ? { state: stateVal } : {});
    fetchMandis(searchTerm, {
      state: stateVal,
      district: '',
      market: '',
      commodity: selectedCommodity,
      date: selectedDate,
      verified: provenanceFilter === 'all' ? undefined : provenanceFilter === 'verified'
    });
  };

  // District dropdown change
  const handleDistrictChange = (distVal) => {
    setSelectedDistrict(distVal);
    setSelectedMarket('');
    loadFilterOptions({
      state: selectedState,
      district: distVal || undefined
    });
    fetchMandis(searchTerm, {
      state: selectedState,
      district: distVal,
      market: '',
      commodity: selectedCommodity,
      date: selectedDate,
      verified: provenanceFilter === 'all' ? undefined : provenanceFilter === 'verified'
    });
  };

  // Market dropdown change
  const handleMarketChange = (marketVal) => {
    setSelectedMarket(marketVal);
    fetchMandis(searchTerm, {
      state: selectedState,
      district: selectedDistrict,
      market: marketVal,
      commodity: selectedCommodity,
      date: selectedDate,
      verified: provenanceFilter === 'all' ? undefined : provenanceFilter === 'verified'
    });
  };

  // Commodity dropdown change
  const handleCommodityChange = (commVal) => {
    setSelectedCommodity(commVal);
    fetchMandis(searchTerm, {
      state: selectedState,
      district: selectedDistrict,
      market: selectedMarket,
      commodity: commVal,
      date: selectedDate,
      verified: provenanceFilter === 'all' ? undefined : provenanceFilter === 'verified'
    });
  };

  // Market date dropdown change
  const handleDateChange = (dateVal) => {
    setSelectedDate(dateVal);
    fetchMandis(searchTerm, {
      state: selectedState,
      district: selectedDistrict,
      market: selectedMarket,
      commodity: selectedCommodity,
      date: dateVal,
      verified: provenanceFilter === 'all' ? undefined : provenanceFilter === 'verified'
    });
  };

  // Provenance tab change
  const handleProvenanceChange = (prov) => {
    setProvenanceFilter(prov);
    fetchMandis(searchTerm, {
      state: selectedState,
      district: selectedDistrict,
      market: selectedMarket,
      commodity: selectedCommodity,
      date: selectedDate,
      verified: prov === 'all' ? undefined : prov === 'verified'
    });
  };

  const handleRetrySuggestions = () => {
    setSuggestionsError(null);
    const trimmed = searchTerm.trim();
    if (trimmed.length >= 2) {
      setSuggestionsLoading(true);
      mandiService
        .getSuggestions(trimmed)
        .then((res) => {
          setSuggestions(res?.suggestions || []);
          setShowSuggestions(true);
        })
        .catch((err) => setSuggestionsError(err.message || 'Retry failed.'))
        .finally(() => setSuggestionsLoading(false));
    }
  };

  // Count active filters
  const activeFiltersCount = [
    selectedState,
    selectedDistrict,
    selectedMarket,
    selectedCommodity,
    selectedDate
  ].filter(Boolean).length;

  const categories = [
    'all',
    'Grains & Cereals',
    'Vegetables',
    'Fruits',
    'Oilseeds',
    'Pulses',
    'Spices'
  ];

  // Filter mandis based on provenance tab
  const filteredMandis = mandis.filter((m) => {
    if (provenanceFilter === 'verified') return m.isVerifiedSource === true;
    if (provenanceFilter === 'unverified') return m.isVerifiedSource !== true;
    return true;
  });

  const verifiedCount = mandis.filter((m) => m.isVerifiedSource === true).length;
  const unverifiedCount = mandis.filter((m) => m.isVerifiedSource !== true).length;

  const filteredCommodities =
    selectedMandi?.commodities?.filter((c) => {
      if (selectedCategory === 'all') return true;
      return c.category === selectedCategory;
    }) || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="APMC Mandi Price Benchmarks & Discovery"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4 sm:space-y-5 text-stone-900">
        {/* Header Intro Banner with Data Integrity Identification */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-stone-900 via-[#164e3b] to-stone-900 text-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 mt-0.5 sm:mt-0">
              <MapPin className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  Regional Mandi Benchmark Rates & Market Discovery
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                  Sample Reference Data
                </span>
              </div>
              <p className="text-[11px] text-stone-300 mt-0.5">
                Multi-dimensional filtering across state, district, market, commodity, and date. Note: Reference benchmarks awaiting live official AGMARKNET API key.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => fetchMandis(searchTerm)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-emerald-100 transition-colors disabled:opacity-50"
              title="Refresh current mandi rates"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Integration Status Notice & Data Provenance Report */}
        {syncStatus && (
          <div
            className={`p-3 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
              syncStatus.isConfigured
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-stone-50 border-stone-200 text-stone-700'
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                  syncStatus.isConfigured ? 'bg-emerald-100 text-[#164e3b]' : 'bg-stone-200 text-stone-600'
                }`}
              >
                {syncStatus.isConfigured ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                ) : (
                  <Database className="w-4 h-4 text-stone-600" />
                )}
              </div>
              <div className="leading-snug">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-stone-900">
                    {syncStatus.isConfigured
                      ? 'Official AGMARKNET Live Provenance'
                      : 'AGMARKNET Benchmark Reference Mode'}
                  </span>
                  {syncStatus.latestSync?.freshness && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        syncStatus.latestSync.freshness === 'fresh'
                          ? 'bg-emerald-100 text-emerald-800'
                          : syncStatus.latestSync.freshness === 'recent'
                          ? 'bg-teal-100 text-teal-800'
                          : syncStatus.latestSync.freshness === 'stale'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {syncStatus.latestSync.freshness === 'no_official_data'
                        ? 'Reference Data'
                        : `${syncStatus.latestSync.freshness} (${syncStatus.latestSync.freshnessDays}d ago)`}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {syncStatus.isConfigured
                    ? `Official data.gov.in integration active (${syncStatus.counts?.officialMandis || 0} official mandis, ${syncStatus.counts?.officialCommodities || 0} verified rate cards). Resource ID: ${syncStatus.resourceId || 'Default'}`
                    : `data.gov.in API key is pending in server environment. Displaying ${syncStatus.counts?.referenceMandis || 0} sample benchmark mandis (${syncStatus.counts?.referenceCommodities || 0} rate cards).`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
              <span
                className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-xl border ${
                  syncStatus.isConfigured
                    ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300'
                    : 'bg-white text-stone-600 border-stone-200'
                }`}
              >
                {syncStatus.isConfigured ? 'Verified Live Sync' : 'Reference Mode'}
              </span>
            </div>
          </div>
        )}

        {/* Search Input with Google Maps-Style Autocomplete Dropdown */}
        <div className="relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-emerald-700 pointer-events-none flex items-center">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                id={searchInputId}
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
                aria-controls="mandi-suggestions-dropdown"
                aria-activedescendant={
                  activeSuggestionIndex >= 0
                    ? `suggestion-item-${activeSuggestionIndex}`
                    : undefined
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (searchTerm.trim().length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search city, district, state, mandi or crop (e.g. Lucknow, Gorakhpur, Wheat, Pune)..."
                className="w-full pl-10 pr-28 py-2.5 sm:py-3 rounded-2xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-xs sm:text-sm text-stone-900 bg-white transition-all shadow-2xs"
                autoComplete="off"
              />
              <div className="absolute right-2 flex items-center gap-1">
                {searchTerm && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Filter Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowFilters((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
                    showFilters || activeFiltersCount > 0
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                  title="Toggle Advanced Filters"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                  {showFilters ? (
                    <ChevronUp className="w-3 h-3 text-stone-500" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-stone-500" />
                  )}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </div>
          </form>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && searchTerm.trim().length >= 2 && (
            <div
              ref={dropdownRef}
              id="mandi-suggestions-dropdown"
              role="listbox"
              aria-label="Location and mandi suggestions"
              className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-stone-200/90 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 max-h-80 overflow-y-auto"
            >
              {suggestionsLoading && (
                <div className="p-4 flex items-center justify-center gap-2 text-xs text-stone-600 bg-stone-50/50">
                  <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
                  <span>Searching locations & mandis in database...</span>
                </div>
              )}

              {!suggestionsLoading && suggestionsError && (
                <div className="p-3.5 text-xs bg-red-50 text-red-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{suggestionsError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRetrySuggestions}
                    className="px-2.5 py-1 rounded-lg bg-white border border-red-200 text-red-900 font-bold text-xs hover:bg-red-100"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!suggestionsLoading &&
                !suggestionsError &&
                suggestions.length === 0 && (
                  <div className="p-4 text-center text-xs text-stone-500 bg-stone-50/60">
                    No matching locations or mandis found in database for &ldquo;{searchTerm}&rdquo;.
                  </div>
                )}

              {!suggestionsLoading && !suggestionsError && suggestions.length > 0 && (
                <div className="divide-y divide-stone-100">
                  <div className="px-3.5 py-1.5 bg-stone-50 text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Database Matches</span>
                    <span className="text-stone-400">Use ↑↓ keys & Enter</span>
                  </div>

                  {suggestions.map((sug, idx) => {
                    const isActive = activeSuggestionIndex === idx;

                    return (
                      <div
                        key={idx}
                        id={`suggestion-item-${idx}`}
                        role="option"
                        aria-selected={isActive}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectSuggestion(sug);
                        }}
                        onMouseEnter={() => setActiveSuggestionIndex(idx)}
                        className={`px-3.5 py-2.5 text-left cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-emerald-50/80 text-emerald-950'
                            : 'hover:bg-stone-50 text-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                              sug.type === 'state'
                                ? 'bg-sky-50 border-sky-200 text-sky-700'
                                : sug.type === 'district'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : sug.type === 'mandi'
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-stone-100 border-stone-200 text-stone-600'
                            }`}
                          >
                            {sug.type === 'state' && <MapPin className="w-3.5 h-3.5" />}
                            {sug.type === 'district' && <MapPin className="w-3.5 h-3.5" />}
                            {sug.type === 'mandi' && <Building2 className="w-3.5 h-3.5" />}
                            {sug.type === 'search_all' && <Search className="w-3.5 h-3.5" />}
                          </div>

                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                                {sug.label}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase tracking-wide shrink-0 ${
                                  sug.type === 'state'
                                    ? 'bg-sky-100 text-sky-900'
                                    : sug.type === 'district'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : sug.type === 'mandi'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-stone-200 text-stone-700'
                                }`}
                              >
                                {sug.type === 'search_all' ? 'All Mandis' : sug.type}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 truncate mt-0.5">
                              {sug.sublabel}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-stone-400">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collapsible Multi-Dimensional Filter Bar */}
        {showFilters && (
          <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-stone-200/90 shadow-2xs space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-800" />
                <h5 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Filter Mandi Records
                </h5>
                {filterOptionsLoading && (
                  <Loader2 className="w-3 h-3 text-emerald-700 animate-spin" />
                )}
              </div>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
              {/* State Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 bg-white rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-stone-800"
                >
                  <option value="">All States ({filterOptions.states.length})</option>
                  {filterOptions.states.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  District
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 bg-white rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-stone-800"
                >
                  <option value="">
                    {selectedState
                      ? `All in ${selectedState} (${filterOptions.districts.length})`
                      : `All Districts (${filterOptions.districts.length})`}
                  </option>
                  {filterOptions.districts.map((dst) => (
                    <option key={dst} value={dst}>
                      {dst}
                    </option>
                  ))}
                </select>
              </div>

              {/* Market / Mandi Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Market / Mandi
                </label>
                <select
                  value={selectedMarket}
                  onChange={(e) => handleMarketChange(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 bg-white rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-stone-800"
                >
                  <option value="">All Markets ({filterOptions.markets.length})</option>
                  {filterOptions.markets.map((mkt) => (
                    <option key={mkt} value={mkt}>
                      {mkt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Commodity Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Commodity
                </label>
                <select
                  value={selectedCommodity}
                  onChange={(e) => handleCommodityChange(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 bg-white rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-stone-800"
                >
                  <option value="">All Crops ({filterOptions.commodities.length})</option>
                  {filterOptions.commodities.map((crop) => (
                    <option key={crop} value={crop}>
                      {crop}
                    </option>
                  ))}
                </select>
              </div>

              {/* Market Date Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Market Date
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 bg-white rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-stone-800"
                >
                  <option value="">All Dates</option>
                  {filterOptions.dates.map((dt) => (
                    <option key={dt} value={dt}>
                      {dt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Badges Bar */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mr-1">
              Active Filters:
            </span>
            {selectedState && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium text-[11px]">
                <span>State: {selectedState}</span>
                <button
                  type="button"
                  onClick={() => handleStateChange('')}
                  className="hover:text-emerald-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedDistrict && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium text-[11px]">
                <span>District: {selectedDistrict}</span>
                <button
                  type="button"
                  onClick={() => handleDistrictChange('')}
                  className="hover:text-emerald-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedMarket && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium text-[11px]">
                <span>Market: {selectedMarket}</span>
                <button
                  type="button"
                  onClick={() => handleMarketChange('')}
                  className="hover:text-emerald-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCommodity && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium text-[11px]">
                <span>Crop: {selectedCommodity}</span>
                <button
                  type="button"
                  onClick={() => handleCommodityChange('')}
                  className="hover:text-emerald-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedDate && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium text-[11px]">
                <span>Date: {selectedDate}</span>
                <button
                  type="button"
                  onClick={() => handleDateChange('')}
                  className="hover:text-emerald-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="text-[11px] font-bold text-rose-700 hover:text-rose-900 ml-1 underline cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Quick Location Shortcuts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider shrink-0 px-1">
            Quick Shortcuts (Sample Hubs):
          </span>
          {quickHubs.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => handleQuickHubClick(city)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                searchTerm.toLowerCase() === city.toLowerCase()
                  ? 'bg-[#164e3b] text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between gap-2">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => fetchMandis(searchTerm)}
              className="px-2 py-0.5 rounded bg-white border border-red-200 font-bold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center space-y-2">
            <Loader2 className="w-7 h-7 text-emerald-700 animate-spin mx-auto" />
            <p className="text-xs text-stone-600">Retrieving mandi benchmark records...</p>
          </div>
        )}

        {/* MAIN VIEW: Detail Mandi Rate Card OR Mandi List */}
        {!loading && selectedMandi ? (
          // ==================== SPECIFIC MANDI RATE CARD ====================
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Back Nav & Mandi Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#faf9f5] border border-stone-200">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedMandi(null)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#164e3b] hover:underline mb-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Mandi Results</span>
                </button>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-800 text-[10px] font-extrabold uppercase tracking-wider">
                    {selectedMandi.marketType}
                  </span>
                  <span className="text-xs text-stone-600 font-medium">
                    {selectedMandi.district}, {selectedMandi.state}
                  </span>
                </div>
                <h4 className="text-lg font-extrabold text-stone-900">
                  {selectedMandi.mandi}
                </h4>

                {/* Data Provenance & Date Attribution */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-lg border ${
                      selectedMandi.isVerifiedSource
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5 text-stone-500" />
                    <span>Source: {selectedMandi.dataSource || 'Sample Reference Benchmark (Unverified)'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-lg border border-stone-200">
                    <Calendar className="w-3.5 h-3.5 text-stone-500" />
                    <span>
                      Record Date:{' '}
                      {selectedMandi.marketDate
                        ? new Date(selectedMandi.marketDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'Date Not Reported'}
                    </span>
                  </span>
                  {selectedMandi.sourceResourceId && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                      ID: {selectedMandi.sourceResourceId.slice(0, 8)}...
                    </span>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0 text-xs text-stone-600 space-y-0.5">
                <span className="text-[11px] text-stone-500 block">Record Provenance</span>
                {selectedMandi.isVerifiedSource ? (
                  <span className="inline-flex items-center gap-1 font-extrabold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Verified Official AGMARKNET</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <span>Unverified Sample Reference</span>
                  </span>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 capitalize cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {cat === 'all' ? 'All Commodities' : cat}
                </button>
              ))}
            </div>

            {/* Commodity Rates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredCommodities.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-xs text-stone-500 bg-stone-50 rounded-xl">
                  No commodities found for category &ldquo;{selectedCategory}&rdquo;.
                </div>
              ) : (
                filteredCommodities.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs hover:border-emerald-600/50 transition-all flex flex-col justify-between space-y-2.5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                            {item.category || 'General'}
                          </span>
                          <h5 className="text-sm font-extrabold text-stone-900 leading-snug">
                            {item.commodity}
                          </h5>
                          <p className="text-[11px] text-stone-500 italic mt-0.5">
                            Grade: {item.variety || item.grade || 'FAQ'}
                          </p>
                        </div>

                        {/* Trend / Status Badge */}
                        <div className="shrink-0 text-right">
                          {item.trend === 'up' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                              <TrendingUp className="w-3 h-3 text-emerald-700" />
                              <span>+₹{item.priceChange}</span>
                            </span>
                          )}
                          {item.trend === 'down' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                              <TrendingDown className="w-3 h-3 text-rose-700" />
                              <span>-₹{Math.abs(item.priceChange)}</span>
                            </span>
                          )}
                          {item.trend === 'stable' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold">
                              <Minus className="w-3 h-3 text-stone-400" />
                              <span>Stable</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price Range & Modal Rate with Date Attribution */}
                    <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#faf9f5] p-2 rounded-xl">
                        <span className="text-[10px] text-stone-500 block uppercase font-bold">
                          Modal Rate
                        </span>
                        <span className="text-sm font-extrabold text-[#164e3b]">
                          {typeof item.modalPrice === 'number' && item.modalPrice > 0 ? (
                            <>
                              ₹{item.modalPrice.toLocaleString('en-IN')}{' '}
                              <span className="text-[10px] font-normal text-stone-600">
                                /{item.unit || 'quintal'}
                              </span>
                            </>
                          ) : (
                            <span className="text-stone-500 text-xs font-normal">Price Not Reported</span>
                          )}
                        </span>
                        {typeof item.modalPrice === 'number' && item.modalPrice > 0 && (
                          <span className="text-[10px] text-stone-500 block">
                            ≈ ₹{(item.modalPrice / 100).toFixed(1)}/kg
                          </span>
                        )}
                      </div>

                      <div className="bg-stone-50 p-2 rounded-xl text-stone-700">
                        <span className="text-[10px] text-stone-500 block uppercase font-bold">
                          Min &mdash; Max Range
                        </span>
                        <span className="text-xs font-bold text-stone-900 block mt-0.5">
                          {typeof item.minPrice === 'number' && typeof item.maxPrice === 'number'
                            ? `₹${item.minPrice} — ₹${item.maxPrice}`
                            : 'Range Not Reported'}
                        </span>
                        <span className="text-[10px] text-stone-500 block mt-0.5">
                          {item.arrivalQuantity ? `Arrival: ${item.arrivalQuantity}` : 'Arrival: Not Reported'}
                        </span>
                      </div>
                    </div>

                    {/* Explicit Item Market Date & Provenance */}
                    <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-100/60">
                      <span>
                        Market Date:{' '}
                        {item.marketDate
                          ? new Date(item.marketDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : selectedMandi.marketDate
                          ? new Date(selectedMandi.marketDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Date Not Reported'}
                      </span>
                      <span>
                        {item.isVerifiedSource || selectedMandi.isVerifiedSource
                          ? 'Official'
                          : 'Reference'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          // ==================== LIST OF MANDIS MATCHING SEARCH & FILTERS ====================
          <div className="space-y-3 sm:space-y-4">
            {/* Provenance Filter Tabs & Count */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => handleProvenanceChange('all')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                    provenanceFilter === 'all'
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  All Markets ({mandis.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleProvenanceChange('verified')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                    provenanceFilter === 'verified'
                      ? 'bg-emerald-900 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Official AGMARKNET ({verifiedCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProvenanceChange('unverified')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                    provenanceFilter === 'unverified'
                      ? 'bg-amber-900 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  Sample Benchmarks ({unverifiedCount})
                </button>
              </div>

              <span className="text-[11px] text-stone-500 shrink-0">
                Click any mandi to view comprehensive rate card
              </span>
            </div>

            {/* Empty State for Verified filter if 0 verified records */}
            {provenanceFilter === 'verified' && verifiedCount === 0 && !loading && (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <ShieldCheck className="w-10 h-10 text-stone-400 mx-auto" />
                <h5 className="text-sm font-bold text-stone-900">
                  No Official AGMARKNET Rates Ingested Yet
                </h5>
                <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                  Live official government data requires setting the <code className="bg-stone-200 px-1 py-0.5 rounded font-mono text-[11px]">DATAGOV_API_KEY</code> environment variable on the server. You can explore our verified sample reference benchmarks in the meantime.
                </p>
                <button
                  type="button"
                  onClick={() => handleProvenanceChange('all')}
                  className="px-4 py-2 rounded-xl bg-[#164e3b] text-white text-xs font-bold shadow-xs hover:bg-[#123826] transition-colors cursor-pointer"
                >
                  View Sample Reference Benchmarks
                </button>
              </div>
            )}

            {/* Generic Empty State when filtered results are 0 */}
            {filteredMandis.length === 0 && provenanceFilter !== 'verified' && !loading && (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <MapPin className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-sm font-bold text-stone-800">
                  No mandis found matching your criteria
                </p>
                <p className="text-xs text-stone-600 max-w-sm mx-auto">
                  {activeFiltersCount > 0
                    ? `No records found with current active filters (${activeFiltersCount} applied). Try clearing some filters or searching for another region.`
                    : searchTerm
                    ? `No mandis found matching "${searchTerm}". Try searching state capitals or major hubs like Lucknow, Gorakhpur, Pune, Patna, or Delhi.`
                    : 'No mandi records currently available in this view.'}
                </p>
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#164e3b] text-white text-xs font-bold shadow-xs inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset All Filters & Search</span>
                </button>
              </div>
            )}

            {/* Mandi Cards List */}
            {filteredMandis.length > 0 && (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {groupedLocations.map((loc, gIdx) => {
                  const locMandis = loc.mandis.filter((m) => {
                    if (provenanceFilter === 'verified') return m.isVerifiedSource === true;
                    if (provenanceFilter === 'unverified') return m.isVerifiedSource !== true;
                    return true;
                  });

                  if (locMandis.length === 0) return null;

                  return (
                    <div key={gIdx} className="space-y-2">
                      <div className="flex items-center gap-2 pt-2 first:pt-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                          {loc.district}, {loc.state}
                        </h4>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100/70 text-emerald-800 font-bold">
                          {locMandis.length} {locMandis.length === 1 ? 'Mandi' : 'Mandis'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {locMandis.map((mandi) => (
                          <button
                            key={mandi._id}
                            type="button"
                            onClick={() => setSelectedMandi(mandis.find((m) => m._id === mandi._id))}
                            className="text-left p-3.5 rounded-2xl bg-white border border-stone-200/90 hover:border-emerald-600 hover:shadow-xs transition-all group flex flex-col justify-between space-y-2 cursor-pointer"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                {mandi.isVerifiedSource ? (
                                  <span className="text-[9px] font-extrabold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded uppercase block border border-emerald-300">
                                    ✓ Official AGMARKNET
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded uppercase block border border-amber-200">
                                    Sample Reference
                                  </span>
                                )}
                                <span className="text-[11px] font-bold text-[#164e3b] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                  <span>View Rates</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                              </div>
                              <h5 className="text-sm font-extrabold text-stone-900 leading-snug group-hover:text-emerald-950 mt-1">
                                {mandi.mandi}
                              </h5>
                              <span className="text-[11px] text-stone-500 block mt-0.5">
                                {mandi.district}, {mandi.state} &bull; {mandi.marketType}
                              </span>
                            </div>

                            {/* Top Commodities Snippet with Prices */}
                            {mandi.topCommodities && mandi.topCommodities.length > 0 && (
                              <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-1">
                                {mandi.topCommodities.map((crop, cIdx) => (
                                  <span
                                    key={cIdx}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-medium"
                                  >
                                    {crop.commodity.split(' ')[0]}:{' '}
                                    {typeof crop.modalPrice === 'number' && crop.modalPrice > 0
                                      ? `₹${crop.modalPrice}`
                                      : 'Price N/A'}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Source & Market Date Footer */}
                            <div className="pt-1 text-[10px] text-stone-400 flex items-center justify-between">
                              <span>
                                {mandi.marketDate
                                  ? new Date(mandi.marketDate).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })
                                  : 'Date Not Reported'}
                              </span>
                              <span>
                                {mandi.isVerifiedSource ? 'Verified AGMARKNET' : 'Sample Benchmark'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Note with Honest Data Attribution */}
        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>Data Integrity Notice:</strong> Mandi rate records currently labeled as &ldquo;Sample Reference&rdquo; are unverified benchmarks for platform testing. Verified records imported from the Government of India (<a href="https://data.gov.in" target="_blank" rel="noreferrer" className="underline font-bold">data.gov.in</a> / AGMARKNET) are explicitly designated with the &ldquo;✓ Official AGMARKNET&rdquo; provenance badge.
          </p>
        </div>
      </div>
    </Modal>
  );
}
