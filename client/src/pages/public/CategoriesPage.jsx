import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight, ShieldCheck, Sprout, RefreshCw, AlertCircle } from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import CategoryCard from '../../components/common/CategoryCard';
import { ROUTES } from '../../constants/routes';
import catalogService from '../../services/catalog.service';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    let ignore = false;

    catalogService.getCategories()
      .then((res) => {
        if (!ignore) {
          setCategories(res && res.data ? res.data : []);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('[CategoriesPage] Failed to fetch categories:', err);
          setError(err.message || 'Failed to load agricultural categories from server.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [reloadIndex]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setReloadIndex((prev) => prev + 1);
  };

  return (
    <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs items={[{ label: 'Agricultural Categories' }]} />

      {/* Header Banner */}
      <div className="mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#164e3b] text-xs font-bold uppercase tracking-wider mb-3">
          <Layers className="w-3.5 h-3.5" />
          <span>Commodity Catalog</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight">
          Agricultural Product Categories
        </h1>
        <p className="text-stone-600 text-sm sm:text-base lg:text-lg mt-3 max-w-3xl leading-relaxed">
          Discover primary agricultural produce classifications traded across Indian agricultural mandis, farm gates, and wholesale hubs. Each category features verified trade specifications and quality parameters.
        </p>

        {/* Data Integrity / Transparency Notice */}
        <div className="mt-5 p-4 rounded-xl bg-emerald-50/70 border border-emerald-100/90 flex items-start gap-3 text-xs text-stone-700 max-w-3xl">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#164e3b]">Database-Backed Classifications: </span>
            <span>
              Real-time agricultural commodity taxonomy loaded directly from AgriFair backend and MongoDB Atlas.
            </span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-stone-200 bg-white overflow-hidden h-80 flex flex-col justify-between p-4">
              <div className="w-full h-44 bg-stone-200 rounded-xl mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-stone-200 rounded w-3/4" />
                <div className="h-3 bg-stone-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State with Retry */}
      {!loading && error && (
        <div className="p-8 rounded-2xl bg-red-50/80 border border-red-200 text-center max-w-xl mx-auto my-12">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Unable to Load Categories</h3>
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

      {/* Categories Grid */}
      {!loading && !error && categories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {categories.map((category) => (
            <CategoryCard
              key={category._id || category.slug}
              category={category}
              showDetailLink={true}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && categories.length === 0 && (
        <div className="p-12 text-center bg-stone-50 rounded-2xl border border-stone-200">
          <Layers className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-800">No Categories Found</h3>
          <p className="text-sm text-stone-500 mt-1">No active agricultural categories were found in the database.</p>
        </div>
      )}

      {/* Bottom CTA to Marketplace */}
      <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-[#164e3b] to-[#205842] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Sprout className="w-4 h-4" />
            <span>Search Across All Categories</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">Looking for specific farm produce or mandi lots?</h2>
          <p className="text-stone-200 text-xs sm:text-sm max-w-xl">
            Explore the AgriFair marketplace discovery interface with full-text search, quality filters, and trade parameters.
          </p>
        </div>
        <Link
          to={ROUTES.MARKETPLACE}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#164e3b] hover:bg-emerald-50 text-sm font-bold shadow-xs hover:shadow-md transition-all shrink-0"
        >
          <span>Open Marketplace</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
