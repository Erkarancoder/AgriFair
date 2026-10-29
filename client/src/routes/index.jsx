import { Routes, Route } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Public Pages
import HowItWorksPage from '../pages/public/HowItWorksPage';
import AboutPage from '../pages/public/AboutPage';
import RolesOverviewPage from '../pages/public/RolesOverviewPage';
import RoleDetailPage from '../pages/public/RoleDetailPage';
import NotFoundPage from '../pages/public/NotFoundPage';

// Authenticated Application & Marketplace Pages
import HomePage from '../pages/public/HomePage';
import MarketplacePage from '../pages/public/MarketplacePage';
import ProductDetailPage from '../pages/public/ProductDetailPage';
import CategoriesPage from '../pages/public/CategoriesPage';
import CategoryDetailPage from '../pages/public/CategoryDetailPage';
import ConversationsPage from '../pages/chat/ConversationsPage';

// Authentication Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import VerifyOtpPage from '../pages/auth/VerifyOtpPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import ProfilePage from '../pages/auth/ProfilePage';
import FarmerListingsPage from '../pages/farmer/FarmerListingsPage';
import FarmerOrdersPage from '../pages/farmer/FarmerOrdersPage';
import BuyerOrdersPage from '../pages/buyer/BuyerOrdersPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import { BUYER_ROLES } from '../constants/roles';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Standalone Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Main Layout */}
      <Route element={<PublicLayout />}>
        {/* Core Marketplace & Application Routes (Protected: Requires Authenticated Session) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace"
          element={
            <ProtectedRoute>
              <MarketplacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace/:id"
          element={
            <ProtectedRoute>
              <ProductDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conversations"
          element={
            <ProtectedRoute>
              <ConversationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <CategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories/:categorySlug"
          element={
            <ProtectedRoute>
              <CategoryDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/listings"
          element={
            <ProtectedRoute allowedRoles={['farmer']}>
              <FarmerListingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/sell"
          element={
            <ProtectedRoute allowedRoles={['farmer']}>
              <FarmerListingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/orders"
          element={
            <ProtectedRoute allowedRoles={['farmer']}>
              <FarmerOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/orders"
          element={
            <ProtectedRoute allowedRoles={BUYER_ROLES}>
              <BuyerOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Informational & Process Routes (Public) */}
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/roles" element={<RolesOverviewPage />} />
        <Route path="/roles/:roleSlug" element={<RoleDetailPage />} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
