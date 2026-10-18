import { useState } from 'react';
import AnnouncementBar from '../../components/common/AnnouncementBar';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import AuthModalPreview from '../../components/common/AuthModalPreview';
import Modal from '../../components/common/Modal';

import HeroSection from './HeroSection';
import SearchSection from './SearchSection';
import CategoriesSection from './CategoriesSection';
import MarketplacePreviewSection from './MarketplacePreviewSection';
import HowItWorksSection from './HowItWorksSection';
import PlatformBenefitsSection from './PlatformBenefitsSection';
import RoleDiscoverySection from './RoleDiscoverySection';
import FinalCTASection from './FinalCTASection';

import { CATEGORIES } from '../../constants/categories';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Auth / Role preview modal state
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });
  const [roleModalData, setRoleModalData] = useState(null);

  const handleOpenAuthModal = (mode = 'login') => {
    setAuthModal({ isOpen: true, mode });
  };

  const handleCloseAuthModal = () => {
    setAuthModal({ isOpen: false, mode: 'login' });
  };

  const handleSelectRoleAction = (role) => {
    setRoleModalData(role);
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
  };

  const handleSearchSubmit = (query) => {
    setSearchQuery(query);
    const marketplaceEl = document.getElementById('marketplace');
    if (marketplaceEl) {
      marketplaceEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResetSearch = () => {
    setSearchQuery('');
  };

  // Compute total filtered count for search feedback
  const allCommodities = CATEGORIES.flatMap((c) => c.sampleItems);
  const totalResultsCount = allCommodities.filter((item) => {
    const matchesCat =
      selectedCategory === 'all' ||
      CATEGORIES.find((c) => c.id === selectedCategory)?.sampleItems.some((s) => s.id === item.id);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesCat;
    return (
      matchesCat &&
      (item.name.toLowerCase().includes(q) ||
        item.variety.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q))
    );
  }).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f5] text-stone-900 selection:bg-emerald-200 selection:text-emerald-950">
      {/* 1. Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Main Navigation Bar */}
      <Navbar onOpenAuthModal={handleOpenAuthModal} />

      <main className="flex-1">
        {/* 3. Hero Section */}
        <HeroSection onOpenAuthModal={handleOpenAuthModal} />

        {/* 4. Product Search Interface */}
        <SearchSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          onSubmitSearch={handleSearchSubmit}
          totalResultsCount={totalResultsCount}
        />

        {/* 5. Product Categories */}
        <CategoriesSection
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />

        {/* 6. Traded Commodities & Specification Discovery */}
        <MarketplacePreviewSection
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          searchQuery={searchQuery}
          onResetSearch={handleResetSearch}
        />

        {/* 7. How AgriFair Works */}
        <HowItWorksSection onOpenAuthModal={handleOpenAuthModal} />

        {/* 8. Platform Benefits */}
        <PlatformBenefitsSection />

        {/* 9. Role-Oriented Entry Section */}
        <RoleDiscoverySection onSelectRoleAction={handleSelectRoleAction} />

        {/* 10. Final Call to Action */}
        <FinalCTASection onOpenAuthModal={handleOpenAuthModal} />
      </main>

      {/* 11. Footer */}
      <Footer
        onCategorySelect={handleCategorySelect}
        onOpenAuthModal={handleOpenAuthModal}
      />

      {/* Auth Preview Modal */}
      <AuthModalPreview
        isOpen={authModal.isOpen}
        onClose={handleCloseAuthModal}
        mode={authModal.mode}
        onSelectRole={() => {
          const el = document.getElementById('roles');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Role Action Preview Modal */}
      {roleModalData && (
        <Modal
          isOpen={Boolean(roleModalData)}
          onClose={() => setRoleModalData(null)}
          title={`${roleModalData.title} — Portal Preview`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-950">
              <span className="font-bold block mb-1">Notice for {roleModalData.badge}:</span>
              <p className="leading-relaxed">{roleModalData.modalNote}</p>
            </div>

            <div>
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-2">
                Planned Features for this Role:
              </span>
              <ul className="space-y-2 text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200">
                {roleModalData.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setRoleModalData(null)}
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
