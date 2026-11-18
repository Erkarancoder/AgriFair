import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandProvider } from './context/LandContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandModal from './components/LandModal';
import HomePage from './pages/HomePage';
import AdvisorPage from './pages/AdvisorPage';
import WeatherPage from './pages/WeatherPage';
import DashboardPage from './pages/DashboardPage';
import AuthPage from './pages/AuthPage';
import { Droplets, ShieldCheck } from 'lucide-react';

function AppContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLand, setEditingLand] = useState(null);
  const { t } = useLanguage();

  function handleOpenAdd() {
    setEditingLand(null);
    setModalOpen(true);
  }

  function handleOpenEdit(land) {
    setEditingLand(land);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingLand(null);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar onOpenAddLand={handleOpenAdd} />

      {/* Main Routed Content */}
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={<HomePage onOpenAddLand={handleOpenAdd} />}
          />
          <Route
            path="/advisor"
            element={
              <AdvisorPage
                onOpenAddLand={handleOpenAdd}
                onOpenEditLand={handleOpenEdit}
              />
            }
          />
          <Route
            path="/weather"
            element={<WeatherPage />}
          />
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                onOpenAddLand={handleOpenAdd}
                onOpenEditLand={handleOpenEdit}
              />
            }
          />
          <Route path="/login" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Land Management Modal */}
      <LandModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        landToEdit={editingLand}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center">
              <Droplets className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900">Jalrakshak-ML</span>
            <span>• {t('footerTagline')}</span>
          </div>

          <div className="flex items-center gap-2 font-medium text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('footerReview')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <LandProvider>
            <AppContent />
          </LandProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
