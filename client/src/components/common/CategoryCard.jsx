import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';
import { categoryPath } from '../../constants/routes';

export default function CategoryCard({ category, showDetailLink = true }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group rounded-2xl overflow-hidden border border-stone-200/90 bg-white hover:border-emerald-500/70 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
      {/* Visual Header */}
      <div>
        <div className="relative h-48 w-full overflow-hidden bg-stone-100">
          {!imageError ? (
            <img
              src={category.image}
              alt={`${category.name} agricultural category`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold text-lg p-4"
              style={{ backgroundColor: category.fallbackBg || '#164e3b' }}
            >
              <span>{category.name}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />

          {/* Badge */}
          {category.badge && (
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-md text-[11px] font-bold text-stone-900 shadow-xs">
                {category.badge}
              </span>
            </div>
          )}

          {/* Title on image */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <h3 className="text-xl font-bold leading-tight drop-shadow-xs">{category.name}</h3>
            {category.tagline && (
              <span className="text-xs text-emerald-200 font-medium block mt-0.5">
                {category.tagline}
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed line-clamp-3">
            {category.description}
          </p>

          {/* Traded Crops */}
          {category.popularCrops && category.popularCrops.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3 text-emerald-700" />
                <span>Traded Crops</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {category.popularCrops.map((crop) => (
                  <span
                    key={crop}
                    className="px-2 py-0.5 rounded-md bg-stone-100 text-[11px] font-medium text-stone-700"
                  >
                    {crop}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation Link */}
      {showDetailLink && (
        <div className="p-5 pt-0">
          <Link
            to={categoryPath(category.slug || category.id)}
            className="w-full inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-stone-50 hover:bg-[#164e3b] text-stone-800 hover:text-white font-semibold text-xs sm:text-sm transition-all duration-200 border border-stone-200/80 group/btn"
          >
            <span>Explore Category Details</span>
            <ArrowRight className="w-4 h-4 text-emerald-700 group-hover/btn:text-emerald-300 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
}
