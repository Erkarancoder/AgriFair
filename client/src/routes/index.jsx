import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/public/HomePage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* Fallback unknown paths to homepage */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
