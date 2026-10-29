import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  MapPin,
  Calendar,
  Package,
  Droplets,
  Scale,
  ArrowRight,
  Info,
  Sparkles,
  SearchX
} from 'lucide-react';
import { CATEGORIES } from '../../constants/categories';
import { ROUTES } from '../../constants/routes';
import Modal from '../../components/common/Modal';

export default function MarketplacePreviewSection({
  selectedCategory,
  onCategorySelect,
  searchQuery,
  onResetSearch
}) {
  const [activeItemModal, setActiveItemModal] = useState(null);

  // Aggregate commodities across categories
  const allCommodities = CATEGORIES.flatMap((cat) =>
    cat.sampleItems.map((item) => ({
      ...item,
      categoryId: cat.id,
      categoryName: cat.name,
      categoryBadge: cat.badge
    }))
  );

  // Filter based on selectedCategory and searchQuery
  const filteredCommodities = allCommodities.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.categoryId === selectedCategory;

    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory;

    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.variety.toLowerCase().includes(query) ||
      item.region.toLowerCase().includes(query) ||
      item.categoryName.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <section id="marketplace" className="py-16 sm:py-20 bg-[#f4f7f4]/50 border-y border-stone-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#164e3b] text-xs font-bold uppercase tracking-wider mb-2">
              <Store className="w-3.5 h-3.5" />
              <span>Marketplace Discovery</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              Explore Traded Produce & Specifications
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-2xl">
              Representative harvest lots and specifications available across regional producer hubs.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="text-xs text-stone-500 bg-white px-3.5 py-2 rounded-xl border border-stone-200/80 shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Showing {filteredCommodities.length} of {allCommodities.length} Commodities</span>
            </div>
            <Link
              to={ROUTES.MARKETPLACE}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <span>Full Marketplace Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Category Pills Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
          <button
            type="button"
            onClick={() => onCategorySelect('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#164e3b] text-white shadow-sm'
                : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
            }`}
          >
            All Categories ({allCommodities.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = cat.sampleItems.length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategorySelect(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#164e3b] text-white shadow-sm'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Active Filter Indicators */}
        {(selectedCategory !== 'all' || searchQuery) && (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-stone-600">Active Filters:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-medium">
                Category: {CATEGORIES.find((c) => c.id === selectedCategory)?.name}
                <button
                  type="button"
                  onClick={() => onCategorySelect('all')}
                  className="hover:text-emerald-700 text-stone-500 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-medium">
                Query: "{searchQuery}"
                <button
                  type="button"
                  onClick={onResetSearch}
                  className="hover:text-emerald-700 text-stone-500 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                onCategorySelect('all');
                onResetSearch();
              }}
              className="text-stone-500 hover:text-stone-800 underline underline-offset-2 ml-2"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Grid of Produce Lots */}
        {filteredCommodities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommodities.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-lg transition-all duration-300 p-5 flex flex-col justify-between group hover:border-emerald-600/60"
              >
                {/* Top Badge & Category */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-stone-100 text-[11px] font-bold text-stone-700">
                      {item.categoryName}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      {item.season}
                    </span>
                  </div>

                  {/* Commodity Name & Variety */}
                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-emerald-800 transition-colors leading-tight">
                    {item.name}
                  </h3>
                  <p className="text-xs font-semibold text-stone-700 mt-0.5">
                    Grade: {item.variety}
                  </p>

                  {/* Cultivation / Origin Region */}
                  <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-2.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="font-medium">{item.region}</span>
                  </div>

                  {/* Specification Matrix */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-stone-100 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-50">
                      <Droplets className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <div>
                        <span className="text-[10px] text-stone-500 block leading-none">Moisture</span>
                        <span className="font-bold text-stone-800 text-[11px]">{item.moisture}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-50">
                      <Package className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <div>
                        <span className="text-[10px] text-stone-500 block leading-none">Packaging</span>
                        <span className="font-bold text-stone-800 text-[11px]">{item.packaging}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-50">
                      <Scale className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <div>
                        <span className="text-[10px] text-stone-500 block leading-none">Min Lot Size</span>
                        <span className="font-bold text-stone-800 text-[11px]">{item.minLot}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-50">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <div>
                        <span className="text-[10px] text-stone-500 block leading-none">Harvest Term</span>
                        <span className="font-bold text-stone-800 text-[11px]">{item.season}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Benchmark & Action */}
                <div className="mt-5 pt-4 border-t border-stone-100 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      Mandi Benchmark:
                    </span>
                    <span className="text-sm font-extrabold text-[#164e3b]">
                      {item.sampleRateRange}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveItemModal(item)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-[#164e3b] text-stone-800 hover:text-white font-semibold text-xs transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <span>Inspect Crop Specifications</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty Search / Filter Fallback */
          <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/90 shadow-xs max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
              <SearchX className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">No matching commodities found</h3>
            <p className="text-xs text-stone-500 mt-1">
              No crops matched your current filter or query "{searchQuery}". Try searching for wheat, onion, mustard, or rice.
            </p>
            <button
              type="button"
              onClick={() => {
                onCategorySelect('all');
                onResetSearch();
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#164e3b] text-white text-xs font-semibold hover:bg-[#123826] transition-colors"
            >
              Reset Filters & Show All
            </button>
          </div>
        )}
      </div>

      {/* Item Specification Sheet Modal */}
      {activeItemModal && (
        <Modal
          isOpen={Boolean(activeItemModal)}
          onClose={() => setActiveItemModal(null)}
          title={activeItemModal.name}
          maxWidth="max-w-xl"
        >
          <div className="space-y-5">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  {activeItemModal.categoryName} • {activeItemModal.season}
                </span>
                <span className="text-xs text-stone-600">Cultivated in {activeItemModal.region}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-500 block">Typical Benchmark</span>
                <span className="text-sm font-extrabold text-[#164e3b]">
                  {activeItemModal.sampleRateRange}
                </span>
              </div>
            </div>

            {/* Technical Parameters Table */}
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-700" />
                Technical Quality Parameters
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <div>
                  <span className="text-stone-500 block text-[11px]">Grade / Variety:</span>
                  <span className="font-bold text-stone-900">{activeItemModal.variety}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Moisture Level:</span>
                  <span className="font-bold text-stone-900">{activeItemModal.moisture}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Standard Packaging:</span>
                  <span className="font-bold text-stone-900">{activeItemModal.packaging}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Minimum Lot Size:</span>
                  <span className="font-bold text-stone-900">{activeItemModal.minLot}</span>
                </div>
              </div>
            </div>

            {/* Future Trading Workflow notice */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-600 space-y-1.5">
              <span className="font-bold text-stone-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                Trading Workflow Preview:
              </span>
              <p className="leading-relaxed">
                In upcoming platform phases, verified buyers and wholesalers will be able to submit binding or negotiable bids directly to the producer of this lot, request certified lab test reports, and arrange multimodal transport through AgriFair logistics partners.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveItemModal(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors"
              >
                Close Specifications
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
