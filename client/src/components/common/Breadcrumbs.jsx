import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export default function Breadcrumbs({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex items-center space-x-2 text-xs text-stone-500">
      <Link
        to={ROUTES.HOME}
        className="inline-flex items-center gap-1 hover:text-[#164e3b] transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="sr-only">Home</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="hover:text-[#164e3b] font-medium transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={`font-semibold ${isLast ? 'text-stone-900' : 'text-stone-600'}`}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
