import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sprout, KeyRound, AlertCircle, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();

  const emailFromState = location.state?.email || '';
  const purpose = location.state?.purpose || 'registration_verification';
  const initialMessage = location.state?.message || '';
  const devOtpFromState = location.state?.devOtp || '';

  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState(devOtpFromState);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(initialMessage);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyOtp({
        email: email.trim(),
        otp: otp.trim(),
        purpose
      });

      if (res.success) {
        if (purpose === 'password_reset') {
          navigate('/reset-password', {
            state: { email: email.trim(), otp: otp.trim() }
          });
        } else {
          // Registration complete & user authenticated
          navigate(ROUTES.HOME, { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setError('');
    setSuccessMsg('');
    setIsResending(true);

    try {
      const res = await resendOtp({
        email: email.trim(),
        purpose
      });
      setSuccessMsg(res.message || 'A fresh verification code has been dispatched.');
      if (res.devOtp) {
        setOtp(res.devOtp);
      }
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
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
          Verify Your Account
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Enter the 6-digit verification code dispatched to your registered mobile number and email
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-stone-200/60 rounded-3xl border border-stone-200/80">
          {successMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-medium text-emerald-900 leading-relaxed">
                {successMsg}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-medium text-rose-800 leading-relaxed">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="verify-email"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
              >
                Account Email
              </label>
              <input
                id="verify-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="block w-full px-4 py-2.5 bg-stone-50/50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#164e3b] transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="otp"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
              >
                6-Digit Security Code
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="h-5 h-5" />
                </div>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="block w-full pl-11 pr-4 py-3 bg-stone-50/50 border border-stone-300 rounded-xl text-stone-900 text-lg font-mono tracking-widest text-center placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#164e3b] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#164e3b] hover:bg-[#123826] active:bg-[#0c2619] disabled:opacity-60 shadow-md shadow-emerald-950/20 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#164e3b] focus:ring-offset-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify & Proceed</span>
                  <ArrowRight className="w-4 h-4 text-emerald-300" />
                </>
              )}
            </button>
          </form>

          {/* Resend Actions */}
          <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">Didn't receive the code?</span>
            <button
              type="button"
              disabled={resendCooldown > 0 || isResending}
              onClick={handleResend}
              className="font-bold text-[#164e3b] hover:text-[#123826] disabled:text-stone-400 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link
              to={ROUTES.LOGIN}
              className="text-xs text-stone-500 hover:text-stone-800 transition-colors"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
