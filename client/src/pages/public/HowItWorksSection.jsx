import { Search, Users, MessagesSquare, FileCheck2, ArrowRight } from 'lucide-react';

export default function HowItWorksSection({ onOpenAuthModal }) {
  const steps = [
    {
      step: '01',
      title: 'Discover Produce & Mandi Benchmarks',
      description: 'Browse regional crop listings, verify harvest timing, and compare current mandi price indices to understand fair market valuations before initiating trades.',
      icon: Search,
      highlight: 'Transparent Crop Specs'
    },
    {
      step: '02',
      title: 'Connect with Verified Market Stakeholders',
      description: 'Reach out directly to producer cooperatives, farmer clusters, licensed wholesalers, or retail buyers based on precise lot requirements.',
      icon: Users,
      highlight: 'Direct Contact'
    },
    {
      step: '03',
      title: 'Discuss Requirements & Negotiate Bids',
      description: 'Submit formal bids, propose counter-offers, agree upon moisture tolerances, packaging styles, and delivery deadlines with complete mutual visibility.',
      icon: MessagesSquare,
      highlight: 'Clear Negotiation'
    },
    {
      step: '04',
      title: 'Move Toward Trade & Settlement',
      description: 'Finalize trade agreements with standardized contracts, clear dispatch schedules, and secure escrow payment workflows designed for agricultural commerce.',
      icon: FileCheck2,
      highlight: 'Safe Fulfillment'
    }
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#164e3b] text-xs font-bold uppercase tracking-wider mb-3">
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Platform Workflow</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          How AgriFair Works
        </h2>
        <p className="text-stone-600 text-sm sm:text-base mt-3 leading-relaxed">
          A four-step agricultural commerce model designed to replace uncoordinated intermediaries with direct, transparent, and mutually beneficial trade.
        </p>
      </div>

      {/* Steps Flow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
        {steps.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={item.step}
              className="relative bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:border-emerald-600/60"
            >
              <div>
                {/* Step number badge & icon */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#164e3b] flex items-center justify-center group-hover:bg-[#164e3b] group-hover:text-emerald-200 transition-colors shadow-2xs">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-stone-300 group-hover:text-emerald-700/40 transition-colors">
                    {item.step}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-stone-100 text-[10px] font-bold text-stone-600 uppercase tracking-wide">
                    {item.highlight}
                  </span>
                </div>

                <h3 className="text-base font-bold text-stone-900 group-hover:text-[#164e3b] transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-stone-600 mt-2.5 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400 font-medium">
                <span>Phase {index === 0 ? '1 & 2' : '2 & 3'} Workflow</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom note */}
      <div className="mt-12 text-center">
        <div className="inline-flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl bg-stone-100/80 border border-stone-200 max-w-2xl mx-auto text-xs sm:text-sm text-stone-700">
          <p className="leading-relaxed">
            These stages represent the intended end-to-end AgriFair roadmap. <strong>Phase 1</strong> provides the public marketplace foundation and commodity discovery.
          </p>
          <button
            type="button"
            onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
            className="px-4 py-2 rounded-xl bg-[#164e3b] text-white font-semibold text-xs shrink-0 hover:bg-[#123826] transition-colors flex items-center gap-1.5"
          >
            <span>Join AgriFair</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
