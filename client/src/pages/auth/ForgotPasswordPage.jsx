import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sprout, Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please provide your account email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await forgotPassword({ email: email.trim() });
      setSuccess(res.message || 'If an account exists, a reset code has been sent.');
      setTimeout(() => {
        navigate('/reset-password', { state: { email: email.trim() } });
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to dispatch reset code. Please try again.');
    } finally {
      setIsLoading(false);
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
          Reset Your Password
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Enter your registered email to receive a password recovery verification code
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-stone-200/60 rounded-3xl border border-stone-200/80">
          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-medium text-emerald-900 leading-relaxed">
                {success}
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
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
              >
                Account Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="h-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="block w-full pl-11 pr-4 py-3 bg-stone-50/50 border border-stone-300 rounded-xl text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#164e3b] transition-all"
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
                  <span>Sending Recovery Code...</span>
                </>
              ) : (
                <>
                  <span>Send Recovery Code</span>
                  <ArrowRight className="w-4 h-4 text-emerald-300" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-stone-100 text-center">
            <Link
              to={ROUTES.LOGIN}
              className="text-xs font-bold text-[#164e3b] hover:text-[#123826] transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
