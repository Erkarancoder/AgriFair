import { useState } from 'react';
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Sprout, Store, Tractor } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export default function HeroSection({ onOpenAuthModal }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24 bg-gradient-to-b from-[#faf9f5] via-[#f4f7f4]/40 to-[#faf9f5] border-b border-stone-200/60">
      {/* Subtle organic background decoration */}
      <div
        className="absolute top-0 right-0 -translate-y-12 translate-x-1/4 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[400px] h-[400px] bg-amber-100/30 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline & Value Messaging */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200/90 text-[#164e3b] text-xs font-bold tracking-wide uppercase shadow-2xs">
              <Sprout className="w-4 h-4 text-emerald-700" />
              <span>Direct Agricultural Marketplace</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight leading-[1.12]">
              From the Farm <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#164e3b] via-[#20634c] to-[#2d6a4f]">
                to the Market.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-lg sm:text-xl text-stone-700 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
              AgriFair connects farmers directly with wholesalers, retailers, and commercial buyers. Discover farm-fresh harvests, review transparent specifications, and build trustworthy trade connections across India.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <a
                href={ROUTES.MARKETPLACE}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] active:bg-[#0c2619] text-white font-semibold text-base shadow-md shadow-emerald-950/15 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
              >
                <span>Explore Marketplace</span>
                <ArrowRight className="w-4.5 h-4.5 text-emerald-300" />
              </a>
              <button
                type="button"
                onClick={() => onOpenAuthModal('register')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-800 font-semibold text-base border border-stone-300 shadow-2xs hover:border-emerald-700 hover:text-emerald-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <Sparkles className="w-4.5 h-4.5 text-emerald-600" />
                <span>Join AgriFair</span>
              </button>
            </div>

            {/* Value Checkpoints */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left border-t border-stone-200/80">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-stone-900">Direct Sourcing</h4>
                  <p className="text-[11px] text-stone-600 leading-tight mt-0.5">Connect straight with regional producer clusters</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-stone-900">Clear Specifications</h4>
                  <p className="text-[11px] text-stone-600 leading-tight mt-0.5">Standardized variety, moisture, and lot metrics</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-stone-900">Multi-Role Trade</h4>
                  <p className="text-[11px] text-stone-600 leading-tight mt-0.5">Designed for farmers, wholesalers & retailers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: High Quality Agricultural Visual Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Visual Frame */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-emerald-900 aspect-4/3 sm:aspect-5/4">
                {!imgError ? (
                  <img
                    src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80"
                    alt="Lush green wheat field and agricultural farmlands under open sky"
                    className={`w-full h-full object-cover transition-all duration-700 ${
                      imgLoaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
                    }`}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#164e3b] to-[#2d6a4f] text-white text-center">
                    <Sprout className="w-16 h-16 text-emerald-300 mb-3" />
                    <h3 className="text-xl font-bold">AgriFair Marketplace</h3>
                    <p className="text-xs text-emerald-100/90 mt-1 max-w-xs">
                      Connecting Indian farmers directly with commercial buyers & local retailers
                    </p>
                  </div>
                )}

                {/* Subtle gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Overlay bottom caption */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-300">
                        Field to Market Discovery
                      </span>
                      <p className="text-sm font-bold text-white leading-tight">
                        Authentic Crops & Direct Farm Lots
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-medium text-emerald-100">
                      Standardized Grades
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Badge 1: Top Left - Farmer Producers */}
              <div className="absolute -top-4 -left-4 sm:-left-6 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-stone-200/80 flex items-center gap-3 max-w-[210px] animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Tractor className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Producer Hub
                  </span>
                  <p className="text-xs font-bold text-stone-900 leading-tight">
                    Empowering Indian Farmers
                  </p>
                </div>
              </div>

              {/* Floating Badge 2: Bottom Right - Bulk Buyers & Wholesalers */}
              <div className="absolute -bottom-5 -right-4 sm:-right-6 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-stone-200/80 flex items-center gap-3 max-w-[240px] animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                      Commercial Trade
                    </span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-xs font-bold text-stone-900 leading-tight mt-0.5">
                    Direct Wholesaler & Retail Deals
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
