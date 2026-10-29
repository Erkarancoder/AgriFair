import { Link } from 'react-router-dom';
import {
  Tractor,
  Building2,
  Store,
  Briefcase,
  ShoppingBag,
  Users,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Layers
} from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { ROLE_PROFILES } from '../../constants/roles';
import { rolePath, ROUTES } from '../../constants/routes';

const ROLE_ICON_MAP = {
  Tractor,
  Building2,
  Store,
  Briefcase,
  ShoppingBag,
  Users
};

export default function RolesOverviewPage() {
  return (
    <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Participant Roles & Portals' }]} />

      {/* Header Banner */}
      <div className="mb-12 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#164e3b] text-xs font-bold uppercase tracking-wider mb-3">
          <Users className="w-3.5 h-3.5" />
          <span>Marketplace Participants</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight">
          Who Is AgriFair For?
        </h1>
        <p className="text-stone-600 text-sm sm:text-base lg:text-lg mt-3 leading-relaxed">
          Agricultural commerce succeeds when every participant has workflows tailored to their specific commercial scale, lot size, and trading frequency. Explore our 5 core stakeholder groups below.
        </p>

        {/* Phase Boundary Notice */}
        <div className="mt-5 p-4 rounded-xl bg-stone-100 border border-stone-200/90 flex items-start gap-3 text-xs text-stone-700">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-stone-900">Phase 2 Scope Notice: </span>
            <span>
              These pages present verified role expectations, intended use cases, and feature roadmaps. Account creation, authentication, and role-specific dashboards will be delivered during the backend integration phase.
            </span>
          </div>
        </div>
      </div>

      {/* 5 User Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16">
        {ROLE_PROFILES.map((role) => {
          const Icon = ROLE_ICON_MAP[role.iconName] || Users;
          const roleUrl = rolePath(role.id);

          return (
            <div
              key={role.id}
              className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs hover:shadow-xl hover:border-emerald-600/70 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
            >
              <div>
                {/* Header Badge & Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#164e3b] group-hover:bg-[#164e3b] group-hover:text-emerald-200 flex items-center justify-center transition-colors shadow-2xs">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 group-hover:bg-emerald-100 group-hover:text-emerald-900 transition-colors">
                    {role.badge}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-stone-900 group-hover:text-[#164e3b] transition-colors mb-1.5">
                  {role.title}
                </h2>

                <p className="text-xs font-semibold text-emerald-800 mb-3">
                  {role.tagline}
                </p>

                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-5">
                  {role.description}
                </p>

                {/* Features preview */}
                <div className="pt-4 border-t border-stone-100">
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Intended Capabilities</span>
                  </span>
                  <ul className="space-y-2">
                    {role.features.slice(0, 3).map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-xs text-stone-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button linking to individual role page */}
              <div className="mt-6 pt-4 border-t border-stone-100">
                <Link
                  to={roleUrl}
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-stone-50 hover:bg-[#164e3b] text-stone-800 hover:text-white font-semibold text-xs sm:text-sm transition-all border border-stone-200 group/btn"
                >
                  <span>Explore {role.title}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-700 group-hover/btn:text-emerald-300 group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cross Navigation Strip */}
      <div className="p-8 rounded-3xl bg-[#faf9f5] border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Discover The Process</span>
          </div>
          <h3 className="text-xl font-bold text-stone-900">See How Trades Move Forward</h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-xl mt-1">
            Read our step-by-step trading guide to see how each participant collaborates from commodity discovery to delivery dispatch.
          </p>
        </div>

        <Link
          to={ROUTES.HOW_IT_WORKS}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs sm:text-sm font-semibold transition-colors shrink-0"
        >
          <span>Read How It Works</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
