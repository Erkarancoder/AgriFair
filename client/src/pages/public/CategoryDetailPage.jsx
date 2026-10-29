import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Package,
  Droplets,
  Scale,
  Sparkles,
  Info,
  Search,
  SlidersHorizontal,
  X,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FolderX,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import Modal from '../../components/common/Modal';
import { ROUTES, categoryPath } from '../../constants/routes';
import catalogService from '../../services/catalog.service';

export default function CategoryDetailPage() {
  const { categorySlug } = useParams();

  const [category, setCategory] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [activeItemModal, setActiveItemModal] = useState(null);
  const [itemSearch, setItemSearch] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('all');
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    let ignore = false;

    Promise.all([
      catalogService.getCategoryBySlug(categorySlug),
      catalogService.getCategories().catch(() => ({ data: [] }))
    ])
      .then(([catRes, allCatsRes]) => {
        if (!ignore) {
          setCategory(catRes && catRes.data ? catRes.data : null);
          setAllCategories(allCatsRes && allCatsRes.data ? allCatsRes.data : []);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('[CategoryDetailPage] Failed to fetch category details:', err);
          setError(err.status === 404 ? 'NOT_FOUND' : (err.message || 'Failed to load category from server.'));
          setCategory(null);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [categorySlug, reloadIndex]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setReloadIndex((prev) => prev + 1);
  };

  // Loading state
  if (loading) {
    return (
      <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse space-y-8">
        <div className="h-6 bg-stone-200 rounded w-48 mb-6" />
        <div className="h-72 bg-stone-200 rounded-3xl w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 h-96 bg-stone-200 rounded-2xl" />
          <div className="h-96 bg-stone-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Error / Not Found handling
  if (error === 'NOT_FOUND' || !category) {
    return (
      <div className="py-16 sm:py-24 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <Breadcrumbs
          items={[
            { label: 'Categories', href: ROUTES.CATEGORIES },
            { label: 'Category Not Found' },
          ]}
        />

        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-5 border border-amber-200">
          <FolderX className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mb-3">
          Agricultural Category Not Found
        </h1>
        <p className="text-stone-600 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
          The category slug <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-800">"{categorySlug}"</span> does not match any active AgriFair commodity classification in MongoDB.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={ROUTES.CATEGORIES}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#164e3b] text-white text-sm font-semibold hover:bg-[#123826] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>View All Categories</span>
          </Link>
          <Link
            to={ROUTES.MARKETPLACE}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-stone-800 border border-stone-300 text-sm font-semibold hover:bg-stone-50 transition-colors"
          >
            <span>Open Marketplace</span>
          </Link>
        </div>
      </div>
    );
  }

  // Server error with retry
  if (error && error !== 'NOT_FOUND') {
    return (
      <div className="py-16 sm:py-24 max-w-xl mx-auto px-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-stone-900 mb-2">Failed to Load Category</h2>
        <p className="text-sm text-stone-600 mb-6">{error}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#164e3b] text-white text-sm font-semibold hover:bg-[#123826] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const sampleItems = category.sampleItems || [];
  const popularCrops = category.popularCrops || [];

  // Harvest seasons available in benchmark items
  const availableSeasons = Array.from(
    new Set(sampleItems.map((item) => item.season).filter(Boolean))
  );

  // Filter items based on local search and season filter
  const filteredItems = sampleItems.filter((item) => {
    const matchesSeason = seasonFilter === 'all' || item.season === seasonFilter;
    const q = itemSearch.trim().toLowerCase();
    if (!q) return matchesSeason;
    const matchesText =
      (item.name || '').toLowerCase().includes(q) ||
      (item.variety || '').toLowerCase().includes(q) ||
      (item.region || '').toLowerCase().includes(q);
    return matchesSeason && matchesText;
  });

  // Other categories for sidebar / navigation
  const otherCategories = allCategories.filter((c) => c.slug !== category.slug);

  return (
    <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Agricultural Categories', href: ROUTES.CATEGORIES },
          { label: category.name },
        ]}
      />

      {/* Hero Header Card */}
      <div className="rounded-3xl overflow-hidden border border-stone-200/90 bg-white shadow-sm mb-10">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-stone-900">
          {!imageError && category.image ? (
            <img
              src={category.image}
              alt={`${category.name} category banner`}
              className="w-full h-full object-cover opacity-90"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold text-2xl p-6"
              style={{ backgroundColor: category.fallbackBg || '#164e3b' }}
            >
              <span>{category.name}</span>
            </div>
          )}

          {/* Vignette gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent" />

          {/* Content inside hero */}
          <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end text-white">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {category.tagline && (
                <span className="px-3 py-1 rounded-md bg-emerald-700/90 backdrop-blur-md text-xs font-bold text-emerald-100">
                  {category.tagline}
                </span>
              )}
              <span className="text-xs text-stone-300 font-medium">
                Standard Mandi Classification
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-sm sm:text-base text-stone-200 mt-2 max-w-2xl leading-relaxed">
                {category.description}
              </p>
            )}
          </div>
        </div>

        {/* Popular traded crops strip / Marketplace link */}
        <div className="p-6 bg-[#faf9f5] border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {popularCrops.length > 0 ? (
              <>
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  Primary Traded Crops:
                </span>
                <div className="flex flex-wrap gap-2">
                  {popularCrops.map((crop) => (
                    <span
                      key={crop}
                      className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs font-semibold text-stone-800 shadow-2xs"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-xs text-stone-600">
                <span className="font-semibold text-stone-900">Database Slug:</span>{' '}
                <span className="font-mono bg-stone-100 px-2 py-0.5 rounded">{category.slug}</span>
              </div>
            )}
          </div>

          <Link
            to={`${ROUTES.MARKETPLACE}?category=${category.slug}`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#164e3b] hover:text-[#123826] transition-colors self-start sm:self-auto"
          >
            <span>Search lots in Marketplace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main Grid: Left Listings / Specification Benchmarks & Right Category Navigator */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Commodities & Specifications (3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Section Header & Search/Filters */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                  Standard Specifications & Mandi Benchmarks
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  Illustrative trade grades, moisture tolerances, and packaging standards for {category.name}.
                </p>
              </div>

              {/* Data transparency badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-900 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Trade Specs Standard</span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search Within Category */}
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder={`Search ${category.name} varieties, regions...`}
                  className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-colors"
                />
                {itemSearch && (
                  <button
                    type="button"
                    onClick={() => setItemSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Season Filter */}
              <div className="relative">
                <select
                  value={seasonFilter}
                  onChange={(e) => setSeasonFilter(e.target.value)}
                  className="w-full py-2 px-3 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-colors appearance-none cursor-pointer"
                >
                  <option value="all">All Harvest Seasons</option>
                  {availableSeasons.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Commodity Cards Grid */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-2xs hover:shadow-md hover:border-emerald-500/60 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Name and Season */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                          {item.variety}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                          {item.name}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-[11px] font-semibold text-stone-700 shrink-0">
                        {item.season}
                      </span>
                    </div>

                    {/* Region */}
                    <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-4">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{item.region}</span>
                    </div>

                    {/* Specification Badges */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#faf9f5] p-3 rounded-xl border border-stone-200/80 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="text-stone-600">Moisture:</span>
                        <span className="font-semibold text-stone-900">{item.moisture}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="text-stone-600">Packing:</span>
                        <span className="font-semibold text-stone-900 truncate" title={item.packaging}>
                          {item.packaging}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                        <span className="text-stone-600">Min Lot:</span>
                        <span className="font-semibold text-stone-900">{item.minLot}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                        <span className="text-stone-600">Rate Guideline:</span>
                        <span className="font-semibold text-stone-900 truncate" title={item.sampleRateRange}>
                          {item.sampleRateRange}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveItemModal(item)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#164e3b] hover:text-[#123826] transition-colors"
                    >
                      <Info className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Specification Sheet</span>
                    </button>

                    <Link
                      to={`${ROUTES.MARKETPLACE}?q=${encodeURIComponent(item.name)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-[#164e3b] hover:text-white text-stone-700 transition-colors"
                    >
                      <span>Find Lots</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
              <Search className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-900 mb-1">
                No matching specification items
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto mb-4">
                No produce specifications in {category.name} matched your filter query.
              </p>
              <button
                type="button"
                onClick={() => {
                  setItemSearch('');
                  setSeasonFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors"
              >
                Reset Category Filters
              </button>
            </div>
          )}

          {/* Database Live Listings Status */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200/90 p-6 flex flex-col sm:flex-row items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#164e3b] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-stone-900">
                Live Inventory Status for {category.name}
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Category definition is verified and stored in MongoDB Atlas. Real farmer listings query the active database in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Other Agricultural Categories (1 Col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>Other Categories</span>
            </h3>

            <div className="space-y-2">
              {otherCategories.map((other) => (
                <Link
                  key={other._id || other.slug}
                  to={categoryPath(other.slug)}
                  className="group flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50/80 transition-colors border border-transparent hover:border-emerald-200"
                >
                  <div>
                    <span className="text-xs font-bold text-stone-900 group-hover:text-[#164e3b] transition-colors block">
                      {other.name}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {other.tagline || other.slug}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-stone-100">
              <Link
                to={ROUTES.CATEGORIES}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors"
              >
                <span>View All Categories</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quality & Trading Standards Notice */}
          <div className="bg-gradient-to-br from-emerald-900 to-[#164e3b] text-white p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Trading Protocol</span>
            </div>
            <h4 className="text-sm font-bold">Standardized Trade Parameters</h4>
            <p className="text-xs text-stone-200 leading-relaxed">
              Every commodity listing on AgriFair mandates moisture percentage, grading specifications, packaging type, and lot sizing to protect both farmer and buyer.
            </p>
          </div>
        </div>
      </div>

      {/* Specification Detail Modal */}
      {activeItemModal && (
        <Modal
          isOpen={Boolean(activeItemModal)}
          onClose={() => setActiveItemModal(null)}
          title={`${activeItemModal.name} — Commodity Specifications`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-950 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Trade Benchmark Data:</span>
                <p className="leading-relaxed">
                  These quality parameters represent industry benchmarks for {activeItemModal.variety} produced in {activeItemModal.region}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-500 block mb-0.5">Crop Variety</span>
                <span className="font-bold text-stone-900">{activeItemModal.variety}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-500 block mb-0.5">Primary Origin Region</span>
                <span className="font-bold text-stone-900">{activeItemModal.region}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-500 block mb-0.5">Maximum Moisture Tolerance</span>
                <span className="font-bold text-stone-900">{activeItemModal.moisture}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-500 block mb-0.5">Standard Packaging</span>
                <span className="font-bold text-stone-900">{activeItemModal.packaging}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-500 block mb-0.5">Minimum Trade Lot</span>
                <span className="font-bold text-stone-900">{activeItemModal.minLot}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-500 block mb-0.5">Marketplace Rate Guideline</span>
                <span className="font-bold text-emerald-800">{activeItemModal.sampleRateRange}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveItemModal(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold transition-colors"
              >
                Close Specifications
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
