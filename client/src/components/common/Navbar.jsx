import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  User,
  Sparkles,
  LogOut,
  Tractor,
  ShoppingBag,
  ClipboardList,
  ChevronDown,
  LogIn,
  Settings,
  MapPin,
  MessageSquare,
  Plus,
  ShieldCheck
} from 'lucide-react';
import MandiRateModal from '../mandi/MandiRateModal';
import NotificationBell from '../notifications/NotificationBell';
import { ROUTES } from '../../constants/routes';
import { BUYER_ROLES } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMandiModalOpen, setIsMandiModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsProfileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { label: 'Home', href: ROUTES.HOME },
    { label: 'Marketplace', href: ROUTES.MARKETPLACE },
    { label: 'Categories', href: ROUTES.CATEGORIES },
    { label: 'How It Works', href: ROUTES.HOW_IT_WORKS },
    { label: 'Who It Is For', href: ROUTES.ROLES },
    { label: 'Benefits', href: ROUTES.BENEFITS },
    { label: 'About', href: ROUTES.ABOUT }
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  const handleLogout = async () => {
    handleLinkClick();
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-200/90'
          : 'bg-[#faf9f5]/90 backdrop-blur-xs border-b border-stone-200/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo & Emblem */}
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-emerald-600 rounded-xl p-1 -ml-1 transition-transform"
          >
            {/* Real AgriFair Generated Image Emblem */}
            <div className="relative">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-br from-emerald-600 via-[#164e3b] to-amber-500 shadow-md shadow-emerald-950/15 group-hover:shadow-emerald-950/25 group-hover:scale-105 transition-all duration-300">
                <img
                  src="/agrifair-logo.png"
                  alt="AgriFair Logo"
                  className="w-full h-full object-cover rounded-[14px] bg-white transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-emerald-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            </div>

            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 group-hover:text-[#164e3b] transition-colors leading-none flex items-center gap-1.5">
                Agri<span className="text-emerald-700">Fair</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              </span>
              <span className="text-[10px] font-bold text-stone-700 tracking-wider uppercase mt-1">
                
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isHash = link.href.includes('#');
              return isHash ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="relative px-3 py-2 text-sm font-semibold text-stone-700 hover:text-[#164e3b] hover:bg-stone-100/80 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {link.label}
                </a>
              ) : (
                <NavLink
                  key={link.label}
                  to={link.href}
                  className={({ isActive }) =>
                    `relative px-3.5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 group flex items-center gap-1 ${
                      isActive
                        ? 'text-[#164e3b] font-bold bg-emerald-50/90 shadow-2xs'
                        : 'text-stone-700 hover:text-emerald-950 hover:bg-stone-100/80'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{link.label}</span>
                      {isActive && (
                        <span className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-emerald-600 animate-in fade-in zoom-in duration-200" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Desktop Action & Profile Section */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Mandi Benchmark Rates Trigger */}
            <button
              type="button"
              onClick={() => setIsMandiModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-300 text-[#164e3b] text-xs font-bold transition-all shadow-2xs hover:scale-102 group cursor-pointer"
              title="Search and check mandi benchmark rates across Indian states"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-700 animate-bounce" />
              <span>Mandi Rates</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                {/* Farmer Quick Actions */}
                {user.role === 'farmer' && (
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={ROUTES.FARMER_SELL}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs font-bold transition-all shadow-2xs hover:scale-102"
                      title="List and Sell Your Agricultural Produce"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Sell Crop</span>
                    </Link>
                    <Link
                      to={ROUTES.FARMER_LISTINGS}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/90 border border-amber-200 text-amber-950 text-xs font-bold transition-all shadow-2xs hover:scale-102"
                      title="Manage My Produce Listings"
                    >
                      <Tractor className="w-3.5 h-3.5 text-amber-700" />
                      <span className="hidden lg:inline">Listings</span>
                    </Link>
                    <Link
                      to={ROUTES.FARMER_ORDERS}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/90 border border-stone-200 text-stone-800 text-xs font-bold transition-all shadow-2xs hover:scale-102"
                      title="Review Incoming Purchase Requests"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-stone-700" />
                      <span className="hidden lg:inline">Orders</span>
                    </Link>
                  </div>
                )}

                {/* Buyer Quick Action */}
                {BUYER_ROLES.includes(user.role) && (
                  <Link
                    to={ROUTES.BUYER_ORDERS}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/90 border border-stone-200 text-stone-800 text-xs font-bold transition-all shadow-2xs hover:scale-102"
                    title="View My Purchase Requests"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                    <span>My Orders</span>
                  </Link>
                )}

                {/* Admin Quick Action */}
                {user.role === 'admin' && (
                  <Link
                    to={ROUTES.ADMIN}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-2xs hover:scale-102"
                    title="Admin & Operations Control Center"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-200" />
                    <span>Admin Portal</span>
                  </Link>
                )}

                {/* Common Real-Time Conversations Button */}
                <Link
                  to={ROUTES.CONVERSATIONS}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 text-emerald-950 text-xs font-bold transition-all shadow-2xs hover:scale-102"
                  title="Trade Conversations & Price Bargaining"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Chat</span>
                </Link>

                {/* Real-Time Idempotent Notifications Bell */}
                <NotificationBell isAuthenticated={isAuthenticated} />

                {/* Sleek User Profile Avatar Button & Dropdown */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="relative flex items-center gap-1.5 p-1 rounded-2xl border border-stone-200 bg-white hover:border-emerald-500/60 transition-all duration-200 shadow-2xs group focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    title={`${user.name} (${user.role}) - Account Menu`}
                    aria-expanded={isProfileMenuOpen}
                    aria-haspopup="true"
                  >
                    {/* Circle Avatar with Active Presence Dot */}
                    <div className="relative">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#164e3b] to-[#2d6a4f] text-white flex items-center justify-center text-xs font-bold uppercase shadow-inner group-hover:scale-105 transition-transform">
                        {user.name ? user.name[0] : <User className="w-4 h-4" />}
                      </div>
                      <span
                        className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute -bottom-0.5 -right-0.5"
                        title="Online Session"
                      />
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 pr-0.5 ${
                        isProfileMenuOpen ? 'rotate-180 text-emerald-700' : ''
                      }`}
                    />
                  </button>

                  {/* Profile Dropdown Popup Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-stone-200/90 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                      {/* User Header Details */}
                      <div className="p-4 bg-[#faf9f5] border-b border-stone-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-[#164e3b] text-white flex items-center justify-center font-bold text-sm shadow-xs uppercase">
                            {user.name ? user.name[0] : 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-extrabold text-stone-900 truncate">
                              {user.name}
                            </p>
                            <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.2 rounded-md bg-emerald-100 text-[#164e3b] text-[10px] font-bold uppercase tracking-wider">
                              {user.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Options */}
                      <div className="p-2 space-y-1">
                        <Link
                          to={ROUTES.PROFILE}
                          onClick={handleLinkClick}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-emerald-950 hover:bg-stone-50 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-stone-500" />
                          <span>Profile & Account Settings</span>
                        </Link>

                        <Link
                          to={ROUTES.CONVERSATIONS}
                          onClick={handleLinkClick}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-emerald-950 hover:bg-emerald-50/70 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-700" />
                          <span>Trade Conversations & Chat</span>
                        </Link>

                        {user.role === 'farmer' && (
                          <>
                            <Link
                              to={ROUTES.FARMER_SELL}
                              onClick={handleLinkClick}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#164e3b] bg-emerald-50/80 hover:bg-emerald-100 transition-colors"
                            >
                              <Plus className="w-4 h-4 text-emerald-700" />
                              <span>Sell New Produce</span>
                            </Link>
                            <Link
                              to={ROUTES.FARMER_LISTINGS}
                              onClick={handleLinkClick}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-amber-950 hover:bg-amber-50/70 transition-colors"
                            >
                              <Tractor className="w-4 h-4 text-amber-700" />
                              <span>My Produce Listings</span>
                            </Link>
                            <Link
                              to={ROUTES.FARMER_ORDERS}
                              onClick={handleLinkClick}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-emerald-950 hover:bg-emerald-50/70 transition-colors"
                            >
                              <ClipboardList className="w-4 h-4 text-emerald-700" />
                              <span>Incoming Purchase Orders</span>
                            </Link>
                          </>
                        )}

                        {BUYER_ROLES.includes(user.role) && (
                          <Link
                            to={ROUTES.BUYER_ORDERS}
                            onClick={handleLinkClick}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-emerald-950 hover:bg-emerald-50/70 transition-colors"
                          >
                            <ShoppingBag className="w-4 h-4 text-emerald-700" />
                            <span>My Purchase Requests</span>
                          </Link>
                        )}

                        {user.role === 'admin' && (
                          <Link
                            to={ROUTES.ADMIN}
                            onClick={handleLinkClick}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-purple-700" />
                            <span>Admin & Operations Portal</span>
                          </Link>
                        )}
                      </div>

                      {/* Logout Row */}
                      <div className="p-2 border-t border-stone-100 bg-stone-50/50">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Log Out Icon Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-all duration-200"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to={ROUTES.LOGIN}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-stone-700 hover:text-[#164e3b] hover:bg-stone-100 rounded-xl transition-all border border-stone-200 shadow-2xs"
                >
                  <LogIn className="w-4 h-4 text-stone-500" />
                  <span>Log In</span>
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="inline-flex items-center gap-1.5 px-4.5 py-2 text-xs sm:text-sm font-bold text-white bg-[#164e3b] hover:bg-[#123826] active:bg-[#0c2619] rounded-xl shadow-xs hover:shadow-md transition-all duration-200 group hover:scale-102"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300 group-hover:rotate-12 transition-transform" />
                  <span>Join AgriFair</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Action & Hamburger Section */}
          <div className="flex items-center gap-1.5 lg:hidden">
            {isAuthenticated && (
              <NotificationBell isAuthenticated={isAuthenticated} />
            )}

            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-stone-600 hover:text-rose-700 rounded-lg"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className="p-2 text-stone-600 hover:text-emerald-800 rounded-lg"
                aria-label="User sign in"
              >
                <LogIn className="w-5 h-5" />
              </Link>
            )}
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

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden border-t border-stone-200 bg-white shadow-xl animate-in slide-in-from-top-2 duration-200"
          id="mobile-menu"
        >
          <div className="px-4 pt-3 pb-6 space-y-1">
            {navLinks.map((link) => {
              const isHash = link.href.includes('#');
              return isHash ? (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={handleLinkClick}
                  className="block px-3 py-2.5 text-base font-semibold text-stone-800 hover:text-[#164e3b] hover:bg-emerald-50/60 rounded-xl transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={handleLinkClick}
                  className="block px-3 py-2.5 text-base font-semibold text-stone-800 hover:text-[#164e3b] hover:bg-emerald-50/60 rounded-xl transition-colors"
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Mobile Mandi Rate Search Trigger */}
            <button
              type="button"
              onClick={() => {
                setIsMandiModalOpen(true);
                handleLinkClick();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-bold text-emerald-900 bg-emerald-50/80 hover:bg-emerald-100/90 border border-emerald-200/90 rounded-xl transition-all shadow-xs"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700 animate-pulse" />
                <span>Mandi Rates / मंडी भाव</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                APMC Benchmarks
              </span>
            </button>

            <div className="pt-4 mt-3 border-t border-stone-100 flex flex-col gap-2.5">
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#164e3b] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                        {user.name ? user.name[0] : 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-900">{user.name}</p>
                        <p className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider">
                          {user.role}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={ROUTES.PROFILE}
                      onClick={handleLinkClick}
                      className="text-[11px] font-bold text-[#164e3b] bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs"
                    >
                      Settings
                    </Link>
                  </div>

                  {/* Common Conversations Link */}
                  <Link
                    to={ROUTES.CONVERSATIONS}
                    onClick={handleLinkClick}
                    className="block p-3 rounded-xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-800" />
                      <span className="text-xs font-bold text-emerald-950">Trade Conversations & Bargaining</span>
                    </div>
                  </Link>

                  {user.role === 'farmer' && (
                    <>
                      <Link
                        to={ROUTES.FARMER_SELL}
                        onClick={handleLinkClick}
                        className="block p-3 rounded-xl bg-[#164e3b] text-white hover:bg-[#123826] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-emerald-300" />
                          <span className="text-xs font-bold text-white">Sell Produce (+ Add Crop)</span>
                        </div>
                      </Link>
                      <Link
                        to={ROUTES.FARMER_LISTINGS}
                        onClick={handleLinkClick}
                        className="block p-3 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Tractor className="w-4 h-4 text-amber-700" />
                          <span className="text-xs font-bold text-amber-950">My Produce Listings</span>
                        </div>
                      </Link>
                      <Link
                        to={ROUTES.FARMER_ORDERS}
                        onClick={handleLinkClick}
                        className="block p-3 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-emerald-700" />
                          <span className="text-xs font-bold text-emerald-950">Incoming Purchase Orders</span>
                        </div>
                      </Link>
                    </>
                  )}

                  {BUYER_ROLES.includes(user.role) && (
                    <Link
                      to={ROUTES.BUYER_ORDERS}
                      onClick={handleLinkClick}
                      className="block p-3 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold text-emerald-950">My Purchase Requests</span>
                      </div>
                    </Link>
                  )}

                  {user.role === 'admin' && (
                    <Link
                      to={ROUTES.ADMIN}
                      onClick={handleLinkClick}
                      className="block p-3 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-700" />
                        <span className="text-xs font-bold text-purple-950">Admin & Operations Portal</span>
                      </div>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/50 font-semibold text-sm hover:bg-rose-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to={ROUTES.LOGIN}
                    onClick={handleLinkClick}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-stone-300 text-stone-800 font-semibold text-sm hover:bg-stone-50 transition-colors"
                  >
                    <LogIn className="w-4 h-4 text-stone-500" />
                    <span>Log In</span>
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    onClick={handleLinkClick}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#164e3b] text-white font-semibold text-sm shadow-sm hover:bg-[#123826] transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span>Join AgriFair</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mandi Rate Search & Benchmark Modal */}
      <MandiRateModal
        isOpen={isMandiModalOpen}
        onClose={() => setIsMandiModalOpen(false)}
      />
    </header>
  );
}
