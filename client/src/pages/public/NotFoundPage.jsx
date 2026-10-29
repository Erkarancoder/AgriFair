import { Link } from 'react-router-dom';
import { Compass, Home, Store, Layers } from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { ROUTES } from '../../constants/routes';

export default function NotFoundPage() {
  return (
    <div className="py-16 sm:py-24 max-w-3xl mx-auto px-4 sm:px-6 text-center">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs items={[{ label: 'Page Not Found' }]} />

      <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-[#164e3b] flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-xs">
        <Compass className="w-10 h-10 text-emerald-700 animate-spin-slow" />
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full mb-3 inline-block">
        404 — Destination Not Found
      </span>

      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight mb-4">
        This Field Has Not Been Planted Yet
      </h1>

      <p className="text-stone-600 text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed">
        The page or agricultural resource you requested does not exist or may have been moved. You can navigate back to the AgriFair homepage or explore the active marketplace.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to={ROUTES.HOME}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#164e3b] text-white text-sm font-semibold hover:bg-[#123826] shadow-xs hover:shadow-md transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
        <Link
          to={ROUTES.MARKETPLACE}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-stone-800 border border-stone-300 text-sm font-semibold hover:bg-stone-50 transition-colors"
        >
          <Store className="w-4 h-4 text-emerald-700" />
          <span>Open Marketplace</span>
        </Link>
        <Link
          to={ROUTES.CATEGORIES}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-stone-800 border border-stone-300 text-sm font-semibold hover:bg-stone-50 transition-colors"
        >
          <Layers className="w-4 h-4 text-stone-500" />
          <span>Browse Categories</span>
        </Link>
      </div>
    </div>
  );
}
