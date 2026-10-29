import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Store,
  Search,
  X,
  MapPin,
  Layers,
  ArrowRight,
  Info,
  ShieldCheck,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  Sprout,
  ChevronLeft,
  ChevronRight,
  Tractor,
  ShoppingCart
} from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import OrderRequestModal from '../../components/orders/OrderRequestModal';
import { ROUTES, categoryPath } from '../../constants/routes';
import { BUYER_ROLES } from '../../constants/roles';
import catalogService from '../../services/catalog.service';
import { useAuth } from '../../context/AuthContext';

export default function MarketplacePage() {
  const { user } = useAuth();
  const [activeOrderModalItem, setActiveOrderModalItem] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state
  const selectedCategory = searchParams.get('category') || 'all';
  const queryParam = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  // Local state for search input
  const [searchInput, setSearchInput] = useState(queryParam);
  const [prevQuery, setPrevQuery] = useState(queryParam);

  // Sync search input if queryParam changes via URL without effect
  if (queryParam !== prevQuery) {
    setPrevQuery(queryParam);
    setSearchInput(queryParam);
  }

  // Data states
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadIndex, setReloadIndex] = useState(0);

  // Active item detail modal
  const [activeItemModal, setActiveItemModal] = useState(null);

  // Fetch real categories from MongoDB
  useEffect(() => {
    let ignore = false;

    catalogService.getCategories()
      .then((res) => {
        if (!ignore) {
          setCategories(res && res.data ? res.data : []);
          setCategoriesLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('[Marketplace] Failed to fetch categories:', err);
          setCategoriesLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Update URL helper (resets page on filter/search changes)
  const updateUrlParams = useCallback((cat, query, sort, page = 1) => {
    const params = new URLSearchParams();
    if (cat && cat !== 'all') params.set('category', cat);
    if (query && query.trim()) params.set('q', query.trim());
    if (sort && sort !== 'newest') params.set('sort', sort);
    if (page > 1) params.set('page', page.toString());
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Debounced search sync to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== queryParam) {
        updateUrlParams(selectedCategory, searchInput, sortBy, 1);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, queryParam, selectedCategory, sortBy, updateUrlParams]);

  // Fetch products from backend API
  useEffect(() => {
    let ignore = false;

    catalogService.getProducts({
      category: selectedCategory,
      q: queryParam,
      sort: sortBy,
      page: currentPage,
      limit: 12
    })
      .then((res) => {
        if (!ignore) {
          if (res && res.success) {
            setProducts(res.data || []);
            setTotalProducts(res.total || 0);
            setTotalPages(res.totalPages || 1);
          } else {
            setProducts([]);
            setTotalProducts(0);
            setTotalPages(1);
          }
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('[Marketplace] Failed to fetch products:', err);
          setError(err.message || 'Failed to connect to marketplace server.');
          setProducts([]);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedCategory, queryParam, sortBy, currentPage, reloadIndex]);

  const handleCategoryChange = (slug) => {
    setLoading(true);
    updateUrlParams(slug, queryParam, sortBy, 1);
  };

  const handleSortChange = (newSort) => {
    setLoading(true);
    updateUrlParams(selectedCategory, queryParam, newSort, 1);
  };

  const handlePageChange = (newPage) => {
    setLoading(true);
    updateUrlParams(selectedCategory, queryParam, sortBy, newPage);
  };

  const handleResetFilters = () => {
    setLoading(true);
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setReloadIndex((prev) => prev + 1);
  };

  const hasActiveFilters = queryParam.trim() !== '' || selectedCategory !== 'all' || sortBy !== 'newest';

  // Find active category label
  const activeCategoryObj = useMemo(() => {
    return categories.find((c) => c.slug === selectedCategory);
  }, [categories, selectedCategory]);

  return (
    <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs items={[{ label: 'Marketplace Discovery' }]} />

      {/* Header Banner */}
      <div className="mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#164e3b] text-xs font-bold uppercase tracking-wider mb-3">
          <Store className="w-3.5 h-3.5" />
          <span>Agricultural Marketplace</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight">
          Agricultural Produce & Commodity Discovery
        </h1>
        <p className="text-stone-600 text-sm sm:text-base lg:text-lg mt-3 max-w-3xl leading-relaxed">
          Search live agricultural lots from registered farmers. Real database inventory powered by MongoDB Atlas.
        </p>

        {/* Database Live Banner */}
        <div className="mt-5 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3 text-xs text-stone-800 max-w-3xl">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-[#164e3b]">Live MongoDB Connection: </span>
            <span>
              Real-time produce inventory fetched directly from AgriFair backend APIs. Displays actual stored farmer listings only.
            </span>
          </div>
        </div>

        {/* Farmer Quick Action Banner */}
        {user?.role === 'farmer' && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50/90 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-3xl shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Tractor className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <span className="font-bold text-amber-950 text-xs sm:text-sm">Farmer Action: </span>
                <span className="text-xs text-amber-900">Have crops or produce to sell? Publish your lot to the marketplace.</span>
              </div>
            </div>
            <Link
              to={ROUTES.FARMER_LISTINGS}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <span>+ Post / Manage Produce</span>
            </Link>
          </div>
        )}
      </div>

      {/* Controls Container: Search, Category Filters & Sorting */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs mb-8 space-y-5">
        {/* Top Row: Search and Sort */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Full Search Bar */}
          <div className="md:col-span-2 relative">
            <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by crop name or description (e.g. Sharbati Wheat, Mustard, Chana)..."
              className="w-full pl-12 pr-10 py-3 text-sm sm:text-base bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                aria-label="Clear search input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full py-3 px-4 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-colors appearance-none cursor-pointer font-medium text-stone-800"
            >
              <option value="newest">Sort: Newest Listings First</option>
              <option value="oldest">Sort: Oldest Listings First</option>
              <option value="price-asc">Sort: Price (Low to High)</option>
              <option value="price-desc">Sort: Price (High to Low)</option>
            </select>
            <ArrowUpDown className="w-4 h-4 text-stone-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Category Pills Strip */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>Category Filter</span>
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-emerald-800 hover:text-[#123826] underline underline-offset-2 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCategoryChange('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#164e3b] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              All Categories
            </button>
            {!categoriesLoading && categories.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat._id || cat.slug}
                  type="button"
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#164e3b] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Header / Summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-stone-900">
            {loading ? 'Searching database...' : `${totalProducts} ${totalProducts === 1 ? 'Live Listing' : 'Live Listings'} Available`}
          </span>
          {queryParam && (
            <span className="text-xs text-stone-500">
              matching <span className="font-semibold text-stone-800">"{queryParam}"</span>
            </span>
          )}
          {activeCategoryObj && (
            <span className="text-xs text-stone-500">
              in <span className="font-semibold text-stone-800">{activeCategoryObj.name}</span>
            </span>
          )}
        </div>

        <Link
          to={ROUTES.CATEGORIES}
          className="text-xs sm:text-sm font-semibold text-emerald-800 hover:text-[#123826] flex items-center gap-1 transition-colors"
        >
          <span>View category directory</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 h-72 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-4 bg-stone-200 rounded w-1/3" />
                <div className="h-6 bg-stone-200 rounded w-3/4" />
                <div className="h-4 bg-stone-200 rounded w-1/2" />
                <div className="h-16 bg-stone-100 rounded-xl" />
              </div>
              <div className="h-8 bg-stone-200 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Error State with Retry */}
      {!loading && error && (
        <div className="p-8 rounded-2xl bg-red-50/80 border border-red-200 text-center max-w-xl mx-auto my-12">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Unable to Connect to Marketplace</h3>
          <p className="text-sm text-red-700 mb-5 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#164e3b] text-white text-xs sm:text-sm font-semibold hover:bg-[#123826] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && products.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((item) => {
              const locationText = [
                item.location?.mandi,
                item.location?.district,
                item.location?.state
              ]
                .filter(Boolean)
                .join(', ');

              const hasImage = item.images && item.images.length > 0 && item.images[0];

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-500/60 transition-all flex flex-col justify-between"
                >
                  {/* Optional Product Image or Neutral Agricultural Placeholder */}
                  <Link to={`/marketplace/${item._id}`} className="block group">
                    {hasImage ? (
                      <div className="h-44 w-full overflow-hidden bg-stone-100 relative">
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-28 w-full bg-gradient-to-r from-emerald-900 to-[#164e3b] p-4 flex items-center justify-between text-white relative group-hover:brightness-105 transition-all">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                            {item.category?.name || 'Farm Produce'}
                          </span>
                          <span className="text-xs text-stone-200">Mandi Lot</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-200">
                          <Sprout className="w-5 h-5" />
                        </div>
                      </div>
                    )}
                  </Link>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Category & Date */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {item.category?.slug ? (
                          <Link
                            to={categoryPath(item.category.slug)}
                            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 uppercase tracking-wider hover:underline"
                          >
                            {item.category.name}
                          </Link>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                            Agricultural Lot
                          </span>
                        )}
                        <span className="text-[11px] text-stone-500">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Live'}
                        </span>
                      </div>

                      {/* Product Name */}
                      <Link to={`/marketplace/${item._id}`}>
                        <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug mb-1 hover:text-emerald-800 transition-colors">
                          {item.name}
                        </h3>
                      </Link>

                      {/* Location */}
                      {locationText && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-3">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="truncate">{locationText}</span>
                        </div>
                      )}

                      {/* Price & Quantity Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-[#faf9f5] p-3 rounded-xl border border-stone-200/70 mb-4">
                        <div>
                          <span className="text-stone-500 block text-[11px]">Price</span>
                          <span className="font-extrabold text-stone-900 text-sm">
                            ₹{item.price?.toLocaleString('en-IN')}{' '}
                            <span className="text-xs font-normal text-stone-600">/ {item.unit || 'quintal'}</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[11px]">Stock</span>
                          <span className="font-bold text-stone-900 text-sm">
                            {item.quantity} <span className="text-xs font-normal text-stone-600">{item.unit || 'quintal'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Farmer Info */}
                      {item.owner && (
                        <div className="flex items-center gap-2 text-xs text-stone-700 mb-2">
                          <span className="text-stone-500">Producer:</span>
                          <span className="font-semibold text-stone-900">{item.owner.name}</span>
                          <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 text-[10px] font-semibold uppercase">
                            {item.owner.role || 'Farmer'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-stone-100 flex flex-col gap-2 mt-2">
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          to={`/marketplace/${item._id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#164e3b] hover:text-[#123826] transition-colors"
                        >
                          <Info className="w-3.5 h-3.5 text-emerald-700" />
                          <span>View Lot Details</span>
                        </Link>

                        {item.category?.slug && (
                          <Link
                            to={categoryPath(item.category.slug)}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-[#164e3b] hover:text-white text-stone-700 transition-colors"
                          >
                            <span>Category</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>

                      {/* Buyer Purchase / Inquiry Action */}
                      {item.owner?._id === user?._id ? (
                        <div className="text-center py-1.5 rounded-xl bg-amber-50 text-[11px] font-bold text-amber-900 border border-amber-200/70">
                          Your Active Listing
                        </div>
                      ) : BUYER_ROLES.includes(user?.role) ? (
                        <button
                          type="button"
                          onClick={() => setActiveOrderModalItem(item)}
                          className="w-full py-2 px-3 rounded-xl bg-[#164e3b] hover:bg-[#123826] active:bg-[#0c2619] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-xs"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Submit Purchase Request</span>
                        </button>
                      ) : user?.role === 'farmer' ? (
                        <div className="text-center py-1.5 rounded-xl bg-stone-100 text-[11px] font-medium text-stone-600">
                          Producer Account (Selling Only)
                        </div>
                      ) : (
                        <Link
                          to={ROUTES.LOGIN}
                          className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Sign in to Inquire / Buy</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs sm:text-sm text-stone-600 font-medium px-2">
                Page <span className="font-bold text-stone-900">{currentPage}</span> of{' '}
                <span className="font-bold text-stone-900">{totalPages}</span>
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State: When filter yields 0 matches */}
      {!loading && !error && products.length === 0 && hasActiveFilters && (
        <EmptyState
          title="No produce listings match your query"
          description={`No agricultural listings matching "${queryParam || selectedCategory}" were found in MongoDB. Try adjusting your search query or reset filters.`}
          actionLabel="Reset Marketplace Filters"
          onAction={handleResetFilters}
        />
      )}

      {/* Genuine Empty Marketplace: When MongoDB has 0 products stored */}
      {!loading && !error && products.length === 0 && !hasActiveFilters && (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <Store className="w-8 h-8 text-emerald-700" />
          </div>
          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight mb-2">
            Marketplace Inventory Empty
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed mb-6 max-w-lg mx-auto">
            The database connection is active and 7 agricultural categories are ready, but no farmer produce listings have been published to MongoDB yet.
          </p>
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-600 text-left max-w-md mx-auto space-y-1.5 mb-6">
            <div className="font-bold text-stone-800">Database Status:</div>
            <div>• Database: Connected to MongoDB Atlas Cloud</div>
            <div>• Active Categories: 7 Categories Initialized</div>
            <div>• Real Products Stored: 0 Records</div>
          </div>
          <Link
            to={ROUTES.CATEGORIES}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#164e3b] text-white hover:bg-[#123826] text-sm font-bold shadow-xs transition-colors"
          >
            <span>Browse Agricultural Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Product Detail Modal */}
      {activeItemModal && (
        <Modal
          isOpen={Boolean(activeItemModal)}
          onClose={() => setActiveItemModal(null)}
          title={activeItemModal.name}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-950 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Direct Produce Listing</span>
                <p className="leading-relaxed">
                  Farm lot stored in MongoDB Atlas. Listed by authenticated producer.
                </p>
              </div>
            </div>

            {activeItemModal.description && (
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {activeItemModal.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-500 block mb-0.5">Category</span>
                <span className="font-bold text-stone-900">
                  {activeItemModal.category?.name || 'General Agriculture'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-500 block mb-0.5">Rate / Price</span>
                <span className="font-extrabold text-emerald-800 text-sm">
                  ₹{activeItemModal.price?.toLocaleString('en-IN')} / {activeItemModal.unit || 'quintal'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-500 block mb-0.5">Available Stock</span>
                <span className="font-bold text-stone-900">
                  {activeItemModal.quantity} {activeItemModal.unit || 'quintal'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-500 block mb-0.5">Origin Location</span>
                <span className="font-bold text-stone-900 truncate">
                  {[
                    activeItemModal.location?.mandi,
                    activeItemModal.location?.district,
                    activeItemModal.location?.state
                  ]
                    .filter(Boolean)
                    .join(', ') || 'India'}
                </span>
              </div>
            </div>

            {activeItemModal.owner && (
              <div className="p-3.5 rounded-xl bg-[#faf9f5] border border-stone-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[11px]">Producer</span>
                  <span className="font-bold text-stone-900">{activeItemModal.owner.name}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-semibold text-[11px] uppercase">
                  {activeItemModal.owner.role || 'Farmer'}
                </span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              {activeItemModal.owner?._id !== user?._id && BUYER_ROLES.includes(user?.role) && (
                <button
                  type="button"
                  onClick={() => {
                    const targetItem = activeItemModal;
                    setActiveItemModal(null);
                    setActiveOrderModalItem(targetItem);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Request Purchase Lot</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveItemModal(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold transition-colors ml-auto"
              >
                Close Listing Details
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Order Request Modal */}
      {activeOrderModalItem && (
        <OrderRequestModal
          product={activeOrderModalItem}
          isOpen={Boolean(activeOrderModalItem)}
          onClose={() => setActiveOrderModalItem(null)}
          onSuccess={() => setActiveOrderModalItem(null)}
        />
      )}
    </div>
  );
}
