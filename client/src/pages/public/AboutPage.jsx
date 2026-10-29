import { Link } from 'react-router-dom';
import {
  Compass,
  Target,
  Users,
  Eye,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Store,
  Layers,
  Sprout
} from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { ROUTES } from '../../constants/routes';

export default function AboutPage() {
  const challenges = [
    {
      title: 'Information Asymmetry at Farm Gate',
      description: 'Farmers frequently sell harvested lots without real-time insight into regional demand or mandi rates, accepting lower prices from local intermediaries.',
      solution: 'Direct visibility into published mandi benchmarks, category standards, and transparent lot requirements.'
    },
    {
      title: 'Vague Quality Specs & Post-Arrival Disputes',
      description: 'Traditional oral agricultural trades lack documented moisture, grading, and packaging tolerances, leading to frequent deductions and rejected dispatches.',
      solution: 'Standardized commodity profiles specifying variety, grade, packaging styles, and verifiable moisture thresholds.'
    },
    {
      title: 'Fragmented Commercial Sourcing for Buyers',
      description: 'Wholesalers, retailers, and food processors struggle to identify verified producer groups and aggregate multi-quintal batches efficiently.',
      solution: 'Centralized product discovery organized by crop classifications, harvesting seasons, and regional producing belts.'
    }
  ];

  const audiences = [
    {
      role: 'Farmers & Agricultural Cooperatives',
      focus: 'Expanded reach to commercial buyers, fair pricing benchmarks, and reduced intermediary deductions.'
    },
    {
      role: 'Wholesalers & Mandi Traders',
      focus: 'Predictable multi-ton lot sourcing from known agricultural hubs with defined lot parameters.'
    },
    {
      role: 'Retailers & Supermarkets',
      focus: 'Fresh produce replenishment with verifiable farm origins and consistent quality grades.'
    },
    {
      role: 'Food Processors & Institutional Buyers',
      focus: 'Standardized raw material procurement at commercial scale meeting strict industrial quality criteria.'
    },
    {
      role: 'Direct Consumers & Communities',
      focus: 'Wholesome, traceable produce that supports fair remuneration for agricultural producer families.'
    }
  ];

  return (
    <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'About AgriFair' }]} />

      {/* Header Banner */}
      <div className="mb-12 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#164e3b] text-xs font-bold uppercase tracking-wider mb-3">
          <Compass className="w-3.5 h-3.5" />
          <span>Platform Mission & Scope</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight">
          About AgriFair
        </h1>
        <p className="text-stone-600 text-sm sm:text-base lg:text-lg mt-3 leading-relaxed">
          AgriFair is built to modernize agricultural discovery and trade across India. Our platform connects producers, traders, processors, retailers, and consumers with clear product specifications, honest market benchmarks, and direct trading terms.
        </p>

        {/* Data Integrity / Credibility Notice */}
        <div className="mt-5 p-4 rounded-xl bg-stone-100 border border-stone-200/90 flex items-start gap-3 text-xs text-stone-700">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-stone-900">Credibility Principle: </span>
            <span>
              AgriFair communicates platform capabilities and development roadmaps honestly. We do not publish fabricated user testimonials, artificial partner logos, or fake transaction metrics. What you see is what is genuinely engineered.
            </span>
          </div>
        </div>
      </div>

      {/* Mission & Purpose Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#164e3b] flex items-center justify-center shadow-2xs">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
            Our Purpose & Mission
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Agriculture is the backbone of the Indian economy, yet agricultural commerce remains fragmented by multiple intermediary layers. AgriFair’s mission is to democratize agricultural market access.
          </p>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            By establishing an open discovery framework with clear commodity grading, origin verification, and mandi benchmark references, we empower growers to obtain fair economic value and enable commercial buyers to source with certainty.
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#164e3b] to-[#205842] text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 text-emerald-300 flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">
              Long-Term Vision
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              We envision a future where an agricultural producer in rural Madhya Pradesh or Maharashtra can present their harvest batch to nationwide institutional buyers with verified quality specifications, receive binding bids, and execute secure delivery contracts without middleman exploitation.
            </p>
          </div>

          <div className="pt-4 border-t border-emerald-800/80 text-xs text-emerald-200">
            Phase 1 & 2 establish the product architecture and discovery experience.
          </div>
        </div>
      </div>

      {/* The Market Discovery Problem AgriFair Solves */}
      <div className="mb-16">
        <div className="max-w-2xl mb-8">
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Problem & Solution</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
            The Agricultural Market Challenges We Address
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Traditional mandi discovery suffers from structural limitations that affect both farmers and commercial purchasers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {challenges.map((item, index) => (
            <div
              key={item.title}
              className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-bold text-stone-400 block mb-2">
                  0{index + 1} • Market Challenge
                </span>
                <h3 className="text-base font-bold text-stone-900 mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950">
                <span className="font-bold block text-emerald-900 mb-0.5">AgriFair Approach:</span>
                <p className="leading-relaxed">{item.solution}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Intended Audience / Stakeholders */}
      <div className="bg-[#faf9f5] rounded-3xl border border-stone-200/90 p-6 sm:p-10 mb-16">
        <div className="max-w-2xl mb-8">
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Inclusive Ecosystem</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
            Who AgriFair Is Built For
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            The platform serves multiple tiers of the agricultural supply chain, each with distinct needs and transaction volumes.
          </p>
        </div>

        <div className="space-y-3">
          {audiences.map((aud) => (
            <div
              key={aud.role}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-stone-900">{aud.role}</h3>
                </div>
                <p className="text-xs text-stone-600 pl-6 sm:pl-6 leading-relaxed">
                  {aud.focus}
                </p>
              </div>

              <Link
                to={ROUTES.ROLES}
                className="self-end sm:self-auto text-xs font-bold text-[#164e3b] hover:text-[#123826] flex items-center gap-1 shrink-0"
              >
                <span>Role Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="p-8 rounded-2xl bg-white border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Sprout className="w-4 h-4" />
            <span>Discover AgriFair Today</span>
          </div>
          <h3 className="text-xl font-bold text-stone-900">Explore AgriFair in Action</h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-xl">
            Browse our agricultural produce marketplace or learn more about the end-to-end trading process.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to={ROUTES.MARKETPLACE}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            <Store className="w-4 h-4" />
            <span>Open Marketplace</span>
          </Link>
          <Link
            to={ROUTES.HOW_IT_WORKS}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs sm:text-sm font-semibold transition-colors"
          >
            <Layers className="w-4 h-4 text-stone-600" />
            <span>How It Works</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
