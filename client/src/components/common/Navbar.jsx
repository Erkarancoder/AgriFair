import { useState, useEffect } from 'react';
import { Sprout, Menu, X, ArrowRight, User, Sparkles } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export default function Navbar({ onOpenAuthModal }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const navLinks = [
    { label: 'Home', href: ROUTES.HOME },
    { label: 'Marketplace', href: ROUTES.MARKETPLACE },
    { label: 'Categories', href: ROUTES.CATEGORIES },
    { label: 'How It Works', href: ROUTES.HOW_IT_WORKS },
    { label: 'Who It Is For', href: ROUTES.ROLES },
    { label: 'Benefits', href: ROUTES.BENEFITS },
    { label: 'About', href: ROUTES.ABOUT },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-stone-200/90'
          : 'bg-[#faf9f5]/90 backdrop-blur-xs border-b border-stone-200/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo & Identity */}
          <a
            href={ROUTES.HOME}
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-emerald-600 rounded-lg p-1 -ml-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#164e3b] to-[#2d6a4f] text-white flex items-center justify-center shadow-md shadow-emerald-950/10 group-hover:scale-105 transition-transform duration-200">
              <Sprout className="w-5.5 h-5.5 text-emerald-300" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-stone-900 group-hover:text-[#164e3b] transition-colors leading-none">
                Agri<span className="text-emerald-700">Fair</span>
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-stone-700 tracking-wider uppercase mt-1">
                Connecting Farmers to Markets
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-2 text-sm font-semibold text-stone-700 hover:text-[#164e3b] hover:bg-stone-100/70 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenAuthModal('login')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-stone-700 hover:text-[#164e3b] hover:bg-stone-100/80 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <User className="w-4 h-4 text-stone-500" />
              <span>Log In</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAuthModal('register')}
              className="inline-flex items-center gap-2 px-4.5 py-2 text-sm font-semibold text-white bg-[#164e3b] hover:bg-[#123826] active:bg-[#0c2619] rounded-xl shadow-xs hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Join AgriFair</span>
            </button>
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => onOpenAuthModal('login')}
              className="sm:hidden p-2 text-stone-700 hover:text-emerald-800 rounded-lg"
              aria-label="User sign in"
            >
              <User className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-stone-700 hover:text-emerald-800 hover:bg-stone-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close main navigation' : 'Open main navigation'}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden border-t border-stone-200 bg-white shadow-xl animate-in slide-in-from-top-2 duration-200"
          id="mobile-menu"
        >
          <div className="px-4 pt-3 pb-6 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={handleLinkClick}
                className="block px-3 py-2.5 text-base font-semibold text-stone-800 hover:text-[#164e3b] hover:bg-emerald-50/60 rounded-xl transition-colors"
              >
                {link.label}
              </a>
            ))}

            <div className="pt-4 mt-3 border-t border-stone-100 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  handleLinkClick();
                  onOpenAuthModal('login');
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-stone-300 text-stone-800 font-semibold text-sm hover:bg-stone-50 transition-colors"
              >
                <User className="w-4 h-4 text-stone-500" />
                <span>Log In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleLinkClick();
                  onOpenAuthModal('register');
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#164e3b] text-white font-semibold text-sm shadow-sm hover:bg-[#123826] transition-colors"
              >
                <span>Join AgriFair</span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
