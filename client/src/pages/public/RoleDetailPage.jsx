import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Tractor,
  Building2,
  Store,
  Briefcase,
  ShoppingBag,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Compass,
  FileText,
  UserX,
  Sparkles
} from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import Modal from '../../components/common/Modal';
import { ROLE_PROFILES, USER_ROLES } from '../../constants/roles';
import { ROUTES, rolePath } from '../../constants/routes';

const ROLE_ICON_MAP = {
  Tractor,
  Building2,
  Store,
  Briefcase,
  ShoppingBag,
  Users
};

// Map URL slug to USER_ROLES id
const SLUG_TO_ROLE_ID = {
  'farmer': USER_ROLES.FARMER,
  'wholesaler': USER_ROLES.WHOLESALER,
  'retailer': USER_ROLES.RETAILER,
  'bulk-buyer': USER_ROLES.BUYER,
  'consumer': USER_ROLES.CONSUMER
};

// Rich role-specific data for who it is for, needs, benefits, steps, and real next actions
const ROLE_DETAILS = {
  [USER_ROLES.FARMER]: {
    targetAudience: 'Smallholder farmers, progressive agriculturalists, grower producer organizations (FPOs), and farming cooperatives across India.',
    marketNeeds: [
      'Freedom from local intermediary cartels and unfair weighbridge practices',
      'Direct discovery of bulk commercial buyers offering transparent pricing',
      'Accurate daily mandi benchmark data to negotiate from strength',
      'Timely payment assurances and agreed quality acceptance parameters'
    ],
    intendedBenefits: [
      'Maximized farm-gate realization by removing redundant commission layers',
      'Transparent crop grading specs (moisture, purity, lot size) defined upfront',
      'Freedom to review, accept, or counter commercial purchasing offers',
      'Direct market visibility across state lines and consuming industrial zones'
    ],
    intendedSteps: [
      { step: '01', title: 'Review Quality & Packaging Standards', detail: 'Inspect standard mandi specifications for your crop (e.g. moisture limits, sack types).' },
      { step: '02', title: 'Prepare Lot Specifications', detail: 'Prepare produce with verified harvest metrics and minimum lot sizes.' },
      { step: '03', title: 'Receive & Review Commercial Bids', detail: 'Evaluate structured purchasing bids directly from verified aggregators and retailers.' },
      { step: '04', title: 'Confirm Trade Terms & Dispatch', detail: 'Agree on dispatch dates with secure escrow-backed fulfillment.' }
    ],
    primaryActionLabel: 'Explore Traded Crop Specifications',
    primaryActionHref: ROUTES.MARKETPLACE,
    secondaryActionLabel: 'Browse Product Categories',
    secondaryActionHref: ROUTES.CATEGORIES
  },
  [USER_ROLES.WHOLESALER]: {
    targetAudience: 'Licensed APMC commission agents, mandi aggregators, inter-state agricultural trading firms, and supply chain consolidators.',
    marketNeeds: [
      'Consistent multi-quintal and multi-ton supply pipelines from harvesting clusters',
      'Verifiable produce specifications prior to physical lot dispatch',
      'Predictable harvest calendars to schedule regional warehousing capacity',
      'Reduced negotiation friction and standardized trading terms'
    ],
    intendedBenefits: [
      'Direct sourcing access to regional grower clusters and FPOs',
      'Objective quality benchmarking minimizing post-arrival lot rejections',
      'Volume-based bid placement with customized delivery milestones',
      'Consolidated sourcing records and documented supply traceability'
    ],
    intendedSteps: [
      { step: '01', title: 'Identify Producing Regions & Harvests', detail: 'Scan seasonal crop availability across major agricultural belts in India.' },
      { step: '02', title: 'Review Grade & Packaging Tolerances', detail: 'Examine standard lot sizing, moisture tolerances, and packaging sacks.' },
      { step: '03', title: 'Submit Commercial Bids', detail: 'Place volume-based purchase offers tailored to regional supply dynamics.' },
      { step: '04', title: 'Coordinate Bulk Dispatch', detail: 'Execute freight documentation and inventory intake with structured inspection.' }
    ],
    primaryActionLabel: 'Explore Wholesale Lots in Marketplace',
    primaryActionHref: `${ROUTES.MARKETPLACE}?sort=category`,
    secondaryActionLabel: 'View High-Volume Categories',
    secondaryActionHref: ROUTES.CATEGORIES
  },
  [USER_ROLES.RETAILER]: {
    targetAudience: 'Independent grocery stores, supermarket retail chains, local fruit & vegetable merchants, and modern quick-commerce fulfillment centers.',
    marketNeeds: [
      'Guaranteed freshness and minimal transit lag from field harvest to store shelves',
      'Predictable weekly replenishment schedules without daily mandi haggling',
      'Competitive farm-gate acquisition rates to protect retail operating margins',
      'Transparent produce grading to satisfy consumer quality expectations'
    ],
    intendedBenefits: [
      'Fresh produce batches sourced directly from peri-urban and regional farm hubs',
      'Traceable harvest dates enabling superior shelf-life management',
      'Lower procurement overhead through direct relationship building',
      'Standardized crate and packaging options optimized for retail handling'
    ],
    intendedSteps: [
      { step: '01', title: 'Determine Weekly Store Demand', detail: 'Calculate weekly replenishment requirements for vegetables, fruits, and staples.' },
      { step: '02', title: 'Browse Fresh Produce Classifications', detail: 'Filter commodities by origin, grade, and packaging crate standards.' },
      { step: '03', title: 'Establish Recurring Orders', detail: 'Connect with dependable regional suppliers for steady weekly batches.' },
      { step: '04', title: 'Receive Verified Store Delivery', detail: 'Inspect batch quality against upfront agreed specifications.' }
    ],
    primaryActionLabel: 'Browse Fresh Produce Categories',
    primaryActionHref: ROUTES.CATEGORIES,
    secondaryActionLabel: 'Search Marketplace Produce',
    secondaryActionHref: ROUTES.MARKETPLACE
  },
  [USER_ROLES.BUYER]: {
    targetAudience: 'Flour mills, oil extraction plants, food processing conglomerates, institutional caterers, hospital networks, educational trusts, and commodity exporters.',
    marketNeeds: [
      'Rigid adherence to industrial raw material specifications (moisture, purity, foreign matter)',
      'Contractual reliability for multi-month supply commitments',
      'Institutional procurement documentation, certified lab testing, and GST-compliant invoicing',
      'Multi-origin supply aggregation to mitigate localized crop failure risks'
    ],
    intendedBenefits: [
      'Standardized quality parameter sheets aligned with FSSAI and industrial benchmarks',
      'Centralized discovery of commercial farm clusters capable of high-tonnage supply',
      'Contract farming and advance delivery workflow integration in future phases',
      'Transparent mandi price indexation for objective cost models'
    ],
    intendedSteps: [
      { step: '01', title: 'Specify Industrial Raw Material Criteria', detail: 'Review moisture thresholds, packaging types, and quality tolerances.' },
      { step: '02', title: 'Broadcast Procurement Tenders', detail: 'Publish formal institutional RFPs to qualified agricultural cooperatives.' },
      { step: '03', title: 'Audit Specifications & Testing', detail: 'Inspect certified sample benchmarks and regional quality profiles.' },
      { step: '04', title: 'Execute Commercial Supply Contracts', detail: 'Finalize multi-ton delivery schedules with escrow payment security.' }
    ],
    primaryActionLabel: 'Review Quality & Trade Parameters',
    primaryActionHref: ROUTES.MARKETPLACE,
    secondaryActionLabel: 'Explore Industrial Categories',
    secondaryActionHref: ROUTES.CATEGORIES
  },
  [USER_ROLES.CONSUMER]: {
    targetAudience: 'Households, residential communities, apartment consumer groups, and conscious individuals seeking unadulterated farm produce.',
    marketNeeds: [
      'Authentic farm-fresh produce harvested at peak nutritional ripeness',
      'Complete transparency regarding agricultural origin and growing practices',
      'Fair pricing that directly supports agricultural families rather than middlemen',
      'Dependable, clean packaging and honest commodity grading'
    ],
    intendedBenefits: [
      'Direct connection to regional farmer groups and natural farming collectives',
      'Insight into where, when, and how your household staples were cultivated',
      'Access to heirloom pulses, unpolished grains, and fresh seasonal harvests',
      'Ethical consumption contributing to rural agricultural sustainability'
    ],
    intendedSteps: [
      { step: '01', title: 'Discover Seasonal Harvests', detail: 'Explore seasonal produce calendars and crop specifications across India.' },
      { step: '02', title: 'Learn Produce Origins', detail: 'Check origin regions for grains, pulses, spices, and orchard produce.' },
      { step: '03', title: 'Support Farming Families', detail: 'Prepare for direct community buying collectives and regional baskets.' },
      { step: '04', title: 'Enjoy Honest Farm Goods', detail: 'Receive farm produce with genuine quality standards and traceability.' }
    ],
    primaryActionLabel: 'Explore Farm Produce Categories',
    primaryActionHref: ROUTES.CATEGORIES,
    secondaryActionLabel: 'Discover Commodities Marketplace',
    secondaryActionHref: ROUTES.MARKETPLACE
  }
};

export default function RoleDetailPage() {
  const { roleSlug } = useParams();
  const [modalOpen, setModalOpen] = useState(false);

  // Look up role by slug
  const roleId = SLUG_TO_ROLE_ID[roleSlug];
  const roleProfile = useMemo(
    () => (roleId ? ROLE_PROFILES.find((r) => r.id === roleId) : null),
    [roleId]
  );
  const roleDetail = useMemo(
    () => (roleId ? ROLE_DETAILS[roleId] : null),
    [roleId]
  );

  // Handle invalid role slug gracefully
  if (!roleProfile || !roleDetail) {
    return (
      <div className="py-16 sm:py-24 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <Breadcrumbs
          items={[
            { label: 'Participant Roles', href: ROUTES.ROLES },
            { label: 'Role Not Found' },
          ]}
        />

        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-5 border border-amber-200">
          <UserX className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mb-3">
          Participant Role Not Found
        </h1>
        <p className="text-stone-600 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
          The requested role slug <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-800">"{roleSlug}"</span> is not recognized. Please choose from our five verified participant categories.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={ROUTES.ROLES}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#164e3b] text-white text-sm font-semibold hover:bg-[#123826] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>View All Participant Roles</span>
          </Link>
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-stone-800 border border-stone-300 text-sm font-semibold hover:bg-stone-50 transition-colors"
          >
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = ROLE_ICON_MAP[roleProfile.iconName] || Users;
  const otherRoles = ROLE_PROFILES.filter((r) => r.id !== roleProfile.id);

  return (
    <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Participant Roles', href: ROUTES.ROLES },
          { label: roleProfile.title },
        ]}
      />

      {/* Hero Header Card */}
      <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-10 shadow-xs mb-10">
        <div className="max-w-4xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#164e3b] flex items-center justify-center shadow-2xs">
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 uppercase tracking-wider">
              {roleProfile.badge}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight">
            AgriFair for {roleProfile.title}
          </h1>

          <p className="text-base sm:text-lg font-semibold text-emerald-800">
            {roleProfile.tagline}
          </p>

          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            {roleProfile.description}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to={roleDetail.primaryActionHref}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all"
            >
              <span>{roleDetail.primaryActionLabel}</span>
              <ArrowRight className="w-4 h-4 text-emerald-300" />
            </Link>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs sm:text-sm font-semibold transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Portal Access Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Details & Right Navigation Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Who It Is For */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>Participant Target Group</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
              Who This Role Is Designed For
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              {roleDetail.targetAudience}
            </p>
          </div>

          {/* Marketplace Needs */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>Core Commercial Requirements</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
              Primary Marketplace Needs Addressed
            </h2>
            <ul className="space-y-3">
              {roleDetail.marketNeeds.map((need) => (
                <li key={need} className="flex items-start gap-3 text-xs sm:text-sm text-stone-700">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span className="leading-snug">{need}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Intended Benefits */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Platform Advantages</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
              Key Benefits for {roleProfile.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roleDetail.intendedBenefits.map((benefit) => (
                <div
                  key={benefit}
                  className="p-3.5 rounded-xl bg-[#faf9f5] border border-stone-200/80 text-xs text-stone-700 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Steps for this User */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Platform Flow</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
              How {roleProfile.title} Will Transact on AgriFair
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {roleDetail.intendedSteps.map((s) => (
                <div
                  key={s.step}
                  className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-black text-emerald-800 block mb-1">
                      Step {s.step}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 mb-1.5">{s.title}</h3>
                    <p className="text-xs text-stone-600 leading-relaxed">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Other Roles & Actions (1 Col) */}
        <div className="space-y-6">
          {/* Action Box */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-stone-900">Explore Relevant Actions</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Explore currently available product specifications, mandi rate ranges, and commodity categories.
            </p>
            <div className="space-y-2">
              <Link
                to={roleDetail.primaryActionHref}
                className="w-full inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs font-semibold transition-colors"
              >
                <span>{roleDetail.primaryActionLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={roleDetail.secondaryActionHref}
                className="w-full inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors"
              >
                <span>{roleDetail.secondaryActionLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Other Roles Navigator */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Other Participant Types</span>
            </h3>

            <div className="space-y-2">
              {otherRoles.map((other) => {
                const OtherIcon = ROLE_ICON_MAP[other.iconName] || Users;
                return (
                  <Link
                    key={other.id}
                    to={rolePath(other.id)}
                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50/80 transition-colors border border-transparent hover:border-emerald-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-stone-100 group-hover:bg-[#164e3b] text-stone-700 group-hover:text-emerald-200 flex items-center justify-center transition-colors">
                        <OtherIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-stone-900 group-hover:text-[#164e3b] transition-colors block">
                          {other.title}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          {other.badge}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-stone-100">
              <Link
                to={ROUTES.ROLES}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors"
              >
                <span>View All 5 Roles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Scope Transparency Card */}
          <div className="bg-amber-50/90 rounded-2xl border border-amber-200/80 p-5 text-xs text-amber-950 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Authentic Phase Status</span>
            </div>
            <p className="leading-relaxed">
              Dedicated operational dashboards and user login for {roleProfile.title} require backend API microservices and database integration. They will be launched genuinely in upcoming project phases.
            </p>
          </div>
        </div>
      </div>

      {/* Portal Status Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`${roleProfile.title} — Portal Status`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
              <span className="font-bold block mb-1">Honest Implementation Boundary:</span>
              <p className="leading-relaxed">{roleProfile.modalNote}</p>
            </div>

            <div>
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-2">
                Planned Features for this Role:
              </span>
              <ul className="space-y-2 text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200">
                {roleProfile.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#164e3b] text-white text-xs font-semibold hover:bg-[#123826] transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
