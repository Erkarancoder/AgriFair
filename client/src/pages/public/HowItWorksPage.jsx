import { Link } from 'react-router-dom';
import {
  Search,
  Users,
  MessagesSquare,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Layers,
  Store,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { ROUTES } from '../../constants/routes';

export default function HowItWorksPage() {
  const steps = [
    {
      step: '01',
      title: 'Discover Produce & Mandi Benchmarks',
      // status: 'Implemented in Phase 2',
      statusType: 'active',
      icon: Search,
      tagline: 'Standard Specifications & Regional Crops',
      description:
        'Browse agricultural crop classifications, examine standardized grading specifications (moisture limits, packaging styles, minimum lot sizing), and review representative mandi rate benchmarks.',
      farmerAction: 'Farmers view standard lot packaging conventions and evaluate regional benchmark ranges before preparing produce for market.',
      buyerAction: 'Wholesalers, retailers, and bulk buyers search by variety, region, or category to evaluate suitable produce specifications.'
    },
    {
      step: '02',
      title: 'Identify & Connect Market Stakeholders',
      status: 'Role Discovery Active (Direct Messaging in Phase 3)',
      statusType: 'roadmap',
      icon: Users,
      tagline: 'Producer Groups, Wholesalers & Aggregators',
      description:
        'Explore dedicated participant profiles tailored to farmers, wholesale aggregators, supermarkets, institutional buyers, and direct consumers. Learn who participates and their intended trading scope.',
      farmerAction: 'Identify authorized commercial aggregators and institutional buyers looking for specific crop categories.',
      buyerAction: 'Locate primary producer clusters and regional farming cooperatives matching commercial volume requirements.'
    },
    {
      step: '03',
      title: 'Discuss Lot Requirements & Negotiate Bids',
      status: 'Planned for Phase 3 (Backend API Integration)',
      statusType: 'roadmap',
      icon: MessagesSquare,
      tagline: 'Structured Offers, Counter-Bids & Terms',
      description:
        'Once backend bidding systems are connected, buyers will submit structured purchasing offers with custom packaging, moisture acceptance thresholds, delivery timelines, and transparent rate negotiations.',
      farmerAction: 'Review incoming bids, accept transparent market pricing, or offer counter-rates without middleman pressure.',
      buyerAction: 'Issue formal bids against listed harvests with explicit grade tolerances and delivery stipulations.'
    },
    {
      step: '04',
      title: 'Progress to Trade, Dispatch & Settlement',
      status: 'Planned for Phase 4 (Orders & Escrow)',
      statusType: 'roadmap',
      icon: FileCheck2,
      tagline: 'Standardized Contracts & Safe Settlement',
      description:
        'Future fulfillment workflows will coordinate digital trade confirmations, standardized transport documentation with regional freight partners, and escrow-backed payment protection for agricultural commerce.',
      farmerAction: 'Dispatch produce with confidence backed by confirmed buyer payment security.',
      buyerAction: 'Receive verified delivery inspections before final trade settlement release.'
    }
  ];

  const operationalStatus = [
    {
      feature: 'Agricultural Category Catalog & Specifications',
      phase: 'Phase 2 (Current)',
      isLive: true,
      notes: 'Active navigation across 6 categories with mandi benchmarks & moisture specs.'
    },
    {
      feature: 'Marketplace Search & Multi-Criteria Filtering',
      phase: 'Phase 2 (Current)',
      isLive: true,
      notes: 'Full client-side search, variety filtering, and sorting across benchmark commodities.'
    },
    {
      feature: 'Participant Role Exploration & Portals Overview',
      phase: 'Phase 2 (Current)',
      isLive: true,
      notes: 'Detailed role guides for farmers, wholesalers, retailers, bulk buyers, and consumers.'
    },
    {
      feature: 'Real Farmer Account Registration & Produce Posting',
      phase: 'Phase 3 (Upcoming)',
      isLive: false,
      notes: 'Requires backend API services and database persistence.'
    },
    {
      feature: 'Real-Time Bid Submission & Offer Negotiation',
      phase: 'Phase 3 (Upcoming)',
      isLive: false,
      notes: 'Requires messaging server, notification relays, and user authentication.'
    },
    {
      feature: 'Digital Orders, Escrow Payments & Delivery Tracking',
      phase: 'Phase 4 (Future)',
      isLive: false,
      notes: 'Requires payment gateway, banking partner escrow, and logistics integrations.'
    }
  ];

  return (
    <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'How AgriFair Works' }]} />

      {/* Header Banner */}
      <div className="mb-12 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#164e3b] text-xs font-bold uppercase tracking-wider mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Trading Workflow & Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight">
          How AgriFair Operates
        </h1>
        <p className="text-stone-600 text-sm sm:text-base lg:text-lg mt-3 leading-relaxed">
          AgriFair replaces fragmented, opaque agricultural intermediary chains with structured produce discovery, transparent quality metrics, and direct communication between farmers and commercial buyers.
        </p>

        {/* Status Disclaimer */}
        <div className="mt-5 p-4 rounded-xl bg-stone-100 border border-stone-200/90 flex items-start gap-3 text-xs text-stone-700">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-stone-900">Current Phase Implementation: </span>
            <span>
              Phase 2 delivers complete public product discovery, category specifications, and participant information. Transactional systems—such as real account creation, live bids, payments, and dispatch tracking—will be connected genuinely during the backend and payment implementation phases.
            </span>
          </div>
        </div>
      </div>

      {/* 4-Step Journey */}
      <div className="space-y-8 mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
          The 4-Step Agricultural Trading Journey
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {steps.map((item) => {
            const Icon = item.icon;
            const isActive = item.statusType === 'active';

            return (
              <div
                key={item.step}
                className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between hover:border-emerald-600/60 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#164e3b] flex items-center justify-center font-black text-lg shadow-2xs">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-stone-400 block uppercase tracking-wider">
                          Step {item.step}
                        </span>
                        <span className="text-xs font-semibold text-emerald-800">
                          {item.tagline}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {isActive ? 'Available Now' : 'Roadmap Phase'}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-stone-900 mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-5">
                    {item.description}
                  </p>

                  {/* Two perspectives: Farmer vs Buyer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-stone-100 text-xs">
                    <div className="p-3 rounded-xl bg-[#faf9f5] border border-stone-200/70">
                      <span className="font-bold text-[#164e3b] block mb-1">
                        For Farmers & Growers:
                      </span>
                      <p className="text-stone-600 leading-relaxed">
                        {item.farmerAction}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#faf9f5] border border-stone-200/70">
                      <span className="font-bold text-stone-800 block mb-1">
                        For Buyers & Wholesalers:
                      </span>
                      <p className="text-stone-600 leading-relaxed">
                        {item.buyerAction}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{item.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Reality & Roadmap Transparency Matrix */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs mb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Platform Transparency Matrix</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
              Operational Status vs Planned Modules
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Honest breakdown of what is live today versus what will be released in subsequent project phases.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-700">
                <th className="py-3 px-4 font-bold">Feature / Capability</th>
                <th className="py-3 px-4 font-bold">Project Phase</th>
                <th className="py-3 px-4 font-bold">Current Status</th>
                <th className="py-3 px-4 font-bold">Implementation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {operationalStatus.map((row) => (
                <tr key={row.feature} className="hover:bg-stone-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-stone-900">
                    {row.feature}
                  </td>
                  <td className="py-3.5 px-4 text-stone-600 font-medium whitespace-nowrap">
                    {row.phase}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {row.isLive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Live in Phase 2</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Upcoming Phase</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-stone-600 leading-relaxed">
                    {row.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation CTAs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 sm:p-8 rounded-2xl bg-[#faf9f5] border border-stone-200 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Store className="w-4 h-4" />
              <span>Explore The Platform</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-stone-900">
              Explore Active Marketplace Listings
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
              Test the functional search and filter controls across all 6 primary commodity categories with real specifications.
            </p>
          </div>
          <Link
            to={ROUTES.MARKETPLACE}
            className="inline-flex items-center justify-between px-5 py-3 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            <span>Open Marketplace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200 flex flex-col justify-between space-y-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4" />
              <span>Understand Stakeholder Needs</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-stone-900">
              Explore Participant Roles
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
              Learn how AgriFair is uniquely structured for farmers, wholesalers, retailers, bulk institutions, and consumers.
            </p>
          </div>
          <Link
            to={ROUTES.ROLES}
            className="inline-flex items-center justify-between px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs sm:text-sm font-semibold transition-colors"
          >
            <span>View All Participant Roles</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
