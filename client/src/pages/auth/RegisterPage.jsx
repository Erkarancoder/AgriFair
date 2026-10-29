import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Sprout,
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Tractor,
  Building2,
  Store,
  Briefcase,
  ShoppingBag
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { USER_ROLES } from '../../constants/roles';

const ROLES_LIST = [
  { id: USER_ROLES.FARMER, label: 'Farmer / Grower', desc: 'List crops & get direct fair market offers', icon: Tractor },
  { id: USER_ROLES.WHOLESALER, label: 'Wholesaler / Trader', desc: 'Source multi-ton commercial commodity lots', icon: Building2 },
  { id: USER_ROLES.RETAILER, label: 'Retailer / Grocery', desc: 'Fresh direct produce for shops & stores', icon: Store },
  { id: USER_ROLES.BUYER, label: 'Bulk / Institutional', desc: 'Procure raw materials at scale for processing', icon: Briefcase },
  { id: USER_ROLES.CONSUMER, label: 'Consumer', desc: 'Farm-fresh goods for household use', icon: ShoppingBag }
];

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: USER_ROLES.FARMER,
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError('');
  };

  const handleRoleSelect = (roleId) => {
    setFormData((prev) => ({ ...prev, role: roleId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please provide your email address.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        password: formData.password
      });

      if (res.success) {
        navigate('/verify-otp', {
          state: {
            email: formData.email.trim(),
            purpose: 'registration_verification',
            message: res.message,
            devOtp: res.devOtp
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-emerald-600 rounded-xl p-1"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#164e3b] to-[#2d6a4f] text-white flex items-center justify-center shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform duration-200">
            <Sprout className="w-6 h-6 text-emerald-300" />
          </div>
          <span className="text-2xl font-black tracking-tight text-stone-900 group-hover:text-[#164e3b] transition-colors">
            Agri<span className="text-emerald-700">Fair</span>
          </span>
        </Link>
        <h2 className="mt-6 text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Create an AgriFair Account
        </h2>
        <p className="mt-2 text-sm text-stone-600 max-w-md mx-auto">
          Join thousands of agricultural producers and commercial buyers trading with transparent market rates
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-stone-200/60 rounded-3xl border border-stone-200/80">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-medium text-rose-800 leading-relaxed">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                Select Your Role in the AgriFair Network
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ROLES_LIST.map((r) => {
                  const Icon = r.icon;
                  const isSelected = formData.role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleRoleSelect(r.id)}
                      className={`p-3 text-left rounded-2xl border transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-emerald-700 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-700/20'
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          isSelected ? 'bg-[#164e3b] text-white' : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div
                          className={`text-xs font-bold leading-tight ${
                            isSelected ? 'text-[#164e3b]' : 'text-stone-900'
                          }`}
                        >
                          {r.label}
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                          {r.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <UserIcon className="h-4 h-4" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Patel"
                    className="block w-full pl-10 pr-4 py-2.5 bg-stone-50/50 border border-stone-300 rounded-xl text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#164e3b] transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
                >
                  Phone Number (Required)
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Phone className="h-4 h-4" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="block w-full pl-10 pr-4 py-2.5 bg-stone-50/50 border border-stone-300 rounded-xl text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#164e3b] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="h-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ramesh@example.com"
                  className="block w-full pl-10 pr-4 py-2.5 bg-stone-50/50 border border-stone-300 rounded-xl text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#164e3b] transition-all"
                />
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                A verification code will be sent to this email to verify account ownership.
              </p>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
                >
                  Password (min. 6 chars)
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="h-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 bg-stone-50/50 border border-stone-300 rounded-xl text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#164e3b] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <ShieldCheck className="h-4 h-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-4 py-2.5 bg-stone-50/50 border border-stone-300 rounded-xl text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#164e3b] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#164e3b] hover:bg-[#123826] active:bg-[#0c2619] disabled:opacity-60 shadow-md shadow-emerald-950/20 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#164e3b] focus:ring-offset-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Verify</span>
                  <ArrowRight className="w-4 h-4 text-emerald-300" />
                </>
              )}
            </button>
          </form>

          {/* Social Sign-in Divider & Google Button */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-stone-500 font-semibold tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => alert('Google OAuth sign-in will be enabled with your Google Cloud Client ID.')}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-stone-300 rounded-xl bg-white hover:bg-stone-50 text-stone-700 text-sm font-semibold shadow-xs transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-100 text-center">
            <p className="text-sm text-stone-600">
              Already registered on AgriFair?{' '}
              <Link
                to={ROUTES.LOGIN}
                className="font-bold text-[#164e3b] hover:text-[#123826] underline underline-offset-4 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
