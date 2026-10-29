import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Sparkles } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f5] px-4 relative overflow-hidden">
        {/* Ambient decorative background glow */}
        <div className="absolute w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl -top-20 -left-20 pointer-events-none" />
        <div className="absolute w-96 h-96 rounded-full bg-amber-400/10 blur-3xl -bottom-20 -right-20 pointer-events-none" />

        {/* Central Loading Box */}
        <div className="relative flex flex-col items-center max-w-sm text-center">
          {/* Logo with pulsing glow aura */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-white p-1.5 shadow-xl shadow-emerald-950/10 border border-emerald-100 flex items-center justify-center relative z-10 transition-transform duration-300">
              <img
                src="/agrifair-logo.png"
                alt="AgriFair"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            {/* Animated glowing auras */}
            <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 blur-xl animate-pulse-glow" />
            <div className="absolute -inset-2 rounded-3xl border-2 border-dashed border-emerald-500/30 animate-spin [animation-duration:14s]" />
          </div>

          {/* Brand Name */}
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-1.5 justify-center">
            Agri<span className="text-emerald-700">Fair</span>
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          </h2>

          <p className="text-[11px] font-bold text-stone-700 uppercase tracking-widest mt-1">
            Fair Agricultural Trade Portal
          </p>

          {/* Shimmer Progress Indicator Bar */}
          <div className="w-56 h-1.5 bg-stone-200/80 rounded-full overflow-hidden mt-6 relative">
            <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-amber-500 rounded-full animate-shimmer" />
          </div>

          {/* Status Label */}
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-stone-700 bg-white/90 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-stone-200/80 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 animate-spin [animation-duration:3s]" />
            <span>Verifying secure session...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve the location they attempted to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && Array.isArray(allowedRoles) && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }

  return children;
}
