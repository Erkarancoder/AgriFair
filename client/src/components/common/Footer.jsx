import { Link } from 'react-router-dom';
import { Sprout, ShieldCheck, ArrowUpRight, Heart } from 'lucide-react';
import { ROUTES, categoryPath } from '../../constants/routes';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const marketplaceLinks = [
    { label: 'Grains & Cereals', categoryId: 'grains-cereals' },
    { label: 'Fresh Vegetables', categoryId: 'fresh-vegetables' },
    { label: 'Fruits & Orchards', categoryId: 'fruits-orchards' },
    { label: 'Pulses & Legumes', categoryId: 'pulses-legumes' },
    { label: 'Oilseeds & Commercial', categoryId: 'oilseeds-commercial' },
    { label: 'Spices & Organics', categoryId: 'spices-organics' },
  ];

  const participantLinks = [
    { label: 'For Farmers & Growers', href: ROUTES.ROLE_FARMER },
    { label: 'For Wholesalers & Aggregators', href: ROUTES.ROLE_WHOLESALER },
    { label: 'For Retailers & Supermarkets', href: ROUTES.ROLE_RETAILER },
    { label: 'For Institutional Bulk Buyers', href: ROUTES.ROLE_BULK_BUYER },
    { label: 'For Direct Consumers', href: ROUTES.ROLE_CONSUMER },
  ];

  const platformLinks = [
    { label: 'How AgriFair Works', href: ROUTES.HOW_IT_WORKS },
    { label: 'About AgriFair Platform', href: ROUTES.ABOUT },
    { label: 'Platform Value & Benefits', href: ROUTES.BENEFITS },
    { label: 'Marketplace Discovery', href: ROUTES.MARKETPLACE },
  ];

  return (
    <footer id="about" className="bg-[#0f2e22] text-stone-300 border-t border-[#1a4a37] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-[#1b4e3a]">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to={ROUTES.HOME} className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center shadow-md">
                <Sprout className="w-6 h-6 text-emerald-200" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold tracking-tight text-white leading-none">
                  Agri<span className="text-emerald-400">Fair</span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-300/80 tracking-widest uppercase mt-1">
                  Connecting Farmers to Markets
                </span>
              </div>
            </Link>
            <p className="text-sm text-stone-300/90 leading-relaxed max-w-sm">
              AgriFair is a dedicated agricultural marketplace platform designed to bridge the gap between farmers, wholesalers, retailers, and bulk buyers with transparent produce discovery, direct trading terms, and honest specifications.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#164332] text-emerald-300 text-xs border border-[#205842]">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Phase 2 Architecture — Marketplace Foundation</span>
            </div>
          </div>

          {/* Marketplace Categories */}
          <div>
            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-4">
              Marketplace
            </h4>
            <ul className="space-y-2.5 text-sm">
              {marketplaceLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={categoryPath(item.categoryId)}
                    className="text-stone-300 hover:text-white transition-colors text-left flex items-center gap-1 group"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Participants */}
          <div>
            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-4">
              Participants
            </h4>
            <ul className="space-y-2.5 text-sm">
              {participantLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-stone-300 hover:text-white transition-colors block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link
                  to={ROUTES.ROLES}
                  className="text-xs font-semibold text-emerald-300 hover:text-white underline underline-offset-4"
                >
                  View All Roles →
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Transparency */}
          <div>
            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-4">
              Platform & Mission
            </h4>
            <ul className="space-y-2.5 text-sm">
              {platformLinks.map((item) => {
                const isHash = item.href.includes('#');
                return (
                  <li key={item.label}>
                    {isHash ? (
                      <a
                        href={item.href}
                        className="text-stone-300 hover:text-white transition-colors block"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        to={item.href}
                        className="text-stone-300 hover:text-white transition-colors block"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 pt-4 border-t border-[#1b4e3a]">
              <p className="text-xs text-stone-400 leading-relaxed">
                Aiming to bring transparency to Mandi price benchmarks and foster direct agricultural trade relations across India.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>© {currentYear} AgriFair Platform. All agricultural rights reserved.</p>
          <div className="flex items-center gap-2 text-stone-400">
            <span>Built with commitment for Indian Agriculture</span>
            <Heart className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
          </div>
        </div>
      </div>
    </footer>
  );
}
