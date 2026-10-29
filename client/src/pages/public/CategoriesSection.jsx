import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../../constants/categories';
import { ROUTES } from '../../constants/routes';

export default function CategoriesSection({ selectedCategory, onSelectCategory }) {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section id="categories" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#164e3b] text-xs font-bold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Commodity Classification</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Agricultural Categories
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-2xl">
            Explore primary crop classifications traded across Indian agricultural mandis and distribution corridors.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className="px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Show All</span>
            </button>
          )}
          <Link
            to={ROUTES.CATEGORIES}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-emerald-200"
          >
            <span>All Categories Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.id);
                const el = document.getElementById('marketplace');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectCategory(cat.id);
                  const el = document.getElementById('marketplace');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col bg-white text-left focus:outline-none focus:ring-2 focus:ring-emerald-700 ${
                isSelected
                  ? 'ring-2 ring-[#164e3b] shadow-xl border-emerald-600 translate-y-[-2px]'
                  : 'border-stone-200/90 hover:border-emerald-500/60 shadow-xs hover:shadow-xl hover:translate-y-[-3px]'
              }`}
            >
              {/* Category Image Header */}
              <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                {!imageErrors[cat.id] ? (
                  <img
                    src={cat.image}
                    alt={`${cat.name} produce`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={() => handleImageError(cat.id)}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-bold text-lg p-4"
                    style={{ backgroundColor: cat.fallbackBg }}
                  >
                    <span>{cat.name}</span>
                  </div>
                )}

                {/* Subtle gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                {/* Top Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-md text-[11px] font-bold text-stone-900 shadow-xs">
                    {cat.badge}
                  </span>
                </div>

                {/* Bottom title in image container */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-xl font-bold leading-tight">{cat.name}</h3>
                  <span className="text-xs text-emerald-200 font-medium">{cat.tagline}</span>
                </div>
              </div>

              {/* Category Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {cat.description}
                </p>

                {/* Popular crops pills */}
                <div>
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1.5">
                    Traded Crops:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.popularCrops.slice(0, 3).map((crop) => (
                      <span
                        key={crop}
                        className="px-2 py-0.5 rounded-md bg-stone-100 text-[11px] font-medium text-stone-700"
                      >
                        {crop}
                      </span>
                    ))}
                    {cat.popularCrops.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-[11px] font-semibold text-stone-500">
                        +{cat.popularCrops.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Interactive Action Footer */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold">
                  <span className={isSelected ? 'text-emerald-800' : 'text-stone-700 group-hover:text-emerald-800'}>
                    {isSelected ? 'Active Filter Applied' : 'Explore Category Lots'}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-stone-100 group-hover:bg-[#164e3b] text-stone-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
