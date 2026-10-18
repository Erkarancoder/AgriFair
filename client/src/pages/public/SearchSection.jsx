import { useState } from 'react';
import { Search, X, Filter, Sparkles, MapPin } from 'lucide-react';
import { CATEGORIES } from '../../constants/categories';

export default function SearchSection({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  onSubmitSearch,
  totalResultsCount
}) {
  const [localInput, setLocalInput] = useState(searchQuery);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearchChange(localInput);
    setHasSearched(true);
    if (onSubmitSearch) onSubmitSearch(localInput);
  };

  const handleClear = () => {
    setLocalInput('');
    onSearchChange('');
    setHasSearched(false);
  };

  const quickSuggestions = [
    'Sharbati Wheat',
    'Nashik Red Onion',
    'Basmati Rice',
    'Desi Chana',
    'Mustard Seeds',
    'Nagpur Oranges'
  ];

  return (
    <section className="relative -mt-8 sm:-mt-10 z-20 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200/90 p-4 sm:p-6 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Main search row */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input Box */}
            <div className="relative flex-1 flex items-center">
              <label htmlFor="crop-search-input" className="sr-only">
                Search crops, grains, vegetables, or regions
              </label>
              <div className="absolute left-3.5 text-stone-400 pointer-events-none flex items-center">
                <Search className="w-5 h-5 text-emerald-800" />
              </div>
              <input
                id="crop-search-input"
                type="text"
                value={localInput}
                onChange={(e) => setLocalInput(e.target.value)}
                placeholder="Search crops, grains, pulses, or regions (e.g. Sharbati Wheat, Nashik Onion)..."
                className="w-full pl-11 pr-10 py-3.5 text-sm sm:text-base rounded-xl border border-stone-200 bg-stone-50/60 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
              />
              {localInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-md transition-colors"
                  aria-label="Clear search input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Select */}
            <div className="w-full md:w-56 relative flex items-center">
              <label htmlFor="category-select" className="sr-only">
                Filter by Agricultural Category
              </label>
              <div className="absolute left-3 text-stone-400 pointer-events-none flex items-center">
                <Filter className="w-4 h-4 text-emerald-700" />
              </div>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => onCategorySelect(e.target.value)}
                className="w-full pl-9 pr-8 py-3.5 text-sm font-medium rounded-xl border border-stone-200 bg-stone-50/60 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Crop Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 pointer-events-none text-stone-400 text-xs">
                ▼
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3.5 bg-[#164e3b] hover:bg-[#123826] active:bg-[#0c2619] text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
            >
              <Search className="w-4 h-4" />
              <span>Search Produce</span>
            </button>
          </div>

          {/* Quick Suggestions / Filter chips */}
          <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
            <span className="font-semibold text-stone-700 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Popular Searches:
            </span>
            {quickSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setLocalInput(item);
                  onSearchChange(item);
                  setHasSearched(true);
                  if (onSubmitSearch) onSubmitSearch(item);
                }}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 border border-stone-200/60 text-stone-600 transition-colors cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Search Result Feedback Banner when searched */}
          {(hasSearched || searchQuery) && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-xs sm:text-sm text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span>
                  Showing results matching{' '}
                  <strong className="text-emerald-900 font-bold">"{searchQuery || localInput}"</strong>{' '}
                  {selectedCategory !== 'all' && (
                    <span>in <strong>{CATEGORIES.find((c) => c.id === selectedCategory)?.name}</strong></span>
                  )}
                  {totalResultsCount !== undefined && (
                    <span className="ml-1 text-emerald-800">({totalResultsCount} commodities found)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <a
                  href="#marketplace"
                  className="font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  View below in Marketplace
                </a>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-stone-500 hover:text-stone-800 font-medium"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
