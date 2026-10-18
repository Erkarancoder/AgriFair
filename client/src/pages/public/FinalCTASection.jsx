import { Sprout, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export default function FinalCTASection({ onOpenAuthModal }) {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-br from-[#123826] via-[#164e3b] to-[#1d5c46] text-white">
      {/* Decorative background glow */}
      <div
        className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <Sprout className="w-4 h-4 text-emerald-400" />
          <span>Transforming Agricultural Trade</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Ready to Connect Directly with <br className="hidden sm:inline" />
          Indian Agricultural Markets?
        </h2>

        <p className="text-base sm:text-lg text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
          Whether you are a farmer preparing for the upcoming harvest, a wholesaler sourcing bulk lots, or a retailer keeping shelves full—AgriFair provides transparent agricultural discovery.
        </p>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={ROUTES.MARKETPLACE}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-[#164e3b] font-bold text-base hover:bg-emerald-50 shadow-lg shadow-black/20 transition-all duration-200"
          >
            <span>Explore Traded Crops</span>
            <ArrowRight className="w-4.5 h-4.5 text-[#164e3b]" />
          </a>
          <button
            type="button"
            onClick={() => onOpenAuthModal('register')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-900 text-white font-semibold text-base border border-emerald-400/40 hover:border-emerald-300 transition-all duration-200"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>Join as Participant</span>
          </button>
        </div>

        {/* Micro reassurance checklist */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-emerald-200/80">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Direct Farmer Connections
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Objective Quality Specifications
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Transparent Mandi Benchmarks
          </span>
        </div>
      </div>
    </section>
  );
}
