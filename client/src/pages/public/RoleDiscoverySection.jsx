import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Tractor,
  Building2,
  Store,
  Briefcase,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users
} from 'lucide-react';
import { ROLE_PROFILES } from '../../constants/roles';
import { rolePath } from '../../constants/routes';

const ROLE_ICON_MAP = {
  Tractor,
  Building2,
  Store,
  Briefcase,
  ShoppingBag,
  Users
};

function RoleIcon({ name, className = 'w-4 h-4' }) {
  const IconComponent = ROLE_ICON_MAP[name] || Users;
  return <IconComponent className={className} />;
}

export default function RoleDiscoverySection({ onSelectRoleAction }) {
  const [activeRoleId, setActiveRoleId] = useState(ROLE_PROFILES[0].id);

  const activeRole = ROLE_PROFILES.find((r) => r.id === activeRoleId) || ROLE_PROFILES[0];

  return (
    <section id="roles" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#164e3b] text-xs font-bold uppercase tracking-wider mb-3">
          <Users className="w-3.5 h-3.5" />
          <span>Tailored Participant Portals</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          Who Is AgriFair For?
        </h2>
        <p className="text-stone-600 text-sm sm:text-base mt-3 leading-relaxed">
          Agricultural commerce succeeds when every participant has tools tailored to their scale, trading frequency, and operational needs.
        </p>
      </div>

      {/* Role Selection Tabs / Selector */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        {ROLE_PROFILES.map((role) => {
          const isSelected = activeRoleId === role.id;

          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setActiveRoleId(role.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#164e3b] text-white shadow-md shadow-emerald-950/10'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
              }`}
            >
              <RoleIcon name={role.iconName} className="w-4 h-4" />
              <span>{role.title}</span>
            </button>
          );
        })}
      </div>

      {/* Active Role Feature Spotlight Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden p-6 sm:p-10 transition-all duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Description & Tagline */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <RoleIcon name={activeRole.iconName} className="w-4 h-4 text-emerald-700" />
              <span>{activeRole.badge}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight">
              {activeRole.title}
            </h3>

            <p className="text-sm font-semibold text-emerald-800">
              {activeRole.tagline}
            </p>

            <p className="text-sm text-stone-600 leading-relaxed">
              {activeRole.description}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to={rolePath(activeRole.id)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#164e3b] hover:bg-[#123826] active:bg-[#0c2619] text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <span>{activeRole.actionLabel}</span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </Link>
              <button
                type="button"
                onClick={() => onSelectRoleAction(activeRole)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm transition-colors cursor-pointer"
              >
                <span>Quick Preview</span>
              </button>
            </div>
          </div>

          {/* Right Column: Key Feature Highlights for this role */}
          <div className="lg:col-span-5 bg-stone-50 rounded-2xl p-6 border border-stone-200/80 space-y-4">
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider block flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              Dedicated Capabilities:
            </span>

            <ul className="space-y-3">
              {activeRole.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span className="leading-snug">{feat}</span>
                </li>
              ))}
            </ul>

            <div className="pt-3 border-t border-stone-200/80 text-[11px] text-stone-500">
              Role authentication and dedicated operational dashboards are scheduled for Phase 2.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
