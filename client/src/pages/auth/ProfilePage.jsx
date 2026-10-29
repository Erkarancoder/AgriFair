import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  Tractor
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (successMsg) setSuccessMsg('');
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }

    if (formData.phone.trim() && formData.phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim()
      });
      if (res.success) {
        setSuccessMsg('Your profile has been updated successfully!');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Recent Member';

  return (
    <div className="min-h-screen bg-[#faf9f5] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-[#164e3b] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Account Management
          </span>
        </div>

        {/* Profile Header Banner */}
        <div className="bg-gradient-to-r from-[#164e3b] to-[#2d6a4f] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center text-3xl font-black uppercase shadow-inner">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {user?.name}
                </h1>
                <span className="px-3 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                  {user?.role}
                </span>
              </div>
              <p className="text-sm text-emerald-100/90 font-medium">{user?.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-emerald-200/80">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {formattedDate}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Verified Member</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-emerald-900">{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-rose-800">{errorMsg}</p>
          </div>
        )}

        {/* Edit Profile Form & Account Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Edit Form */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-md shadow-stone-200/50">
            <h2 className="text-lg font-bold text-stone-900 mb-1">Personal Details</h2>
            <p className="text-xs text-stone-500 mb-6">
              Update your account details and contact information
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <User className="h-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-4 py-2.5 bg-stone-50/50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#164e3b] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Registered Mobile Number
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Phone className="h-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="block w-full pl-10 pr-4 py-2.5 bg-stone-50/50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#164e3b] transition-all"
                  />
                </div>
                <p className="mt-1 text-[11px] text-stone-500">
                  Used for trade negotiations, lot updates, and buyer inquiries.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Email Address (Primary)
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="h-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="block w-full pl-10 pr-4 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 text-sm cursor-not-allowed"
                  />
                </div>
                <span className="text-[11px] text-stone-500 mt-1 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Email verified and locked to this account</span>
                </span>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#164e3b] hover:bg-[#123826] active:bg-[#0c2619] disabled:opacity-60 shadow-md shadow-emerald-950/20 hover:shadow-lg transition-all"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Account Badges & Status Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-md shadow-stone-200/50">
              <h3 className="text-sm font-bold text-stone-900 mb-3">Marketplace Role</h3>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#164e3b] text-white">
                  <Tractor className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 capitalize">
                    {user?.role} Portal
                  </h4>
                  <p className="text-[11px] text-emerald-800/90 mt-0.5">
                    Authorized to participate and post trades in the AgriFair network.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-md shadow-stone-200/50">
              <h3 className="text-sm font-bold text-stone-900 mb-3">Security & Trust</h3>
              <ul className="space-y-2.5 text-xs text-stone-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Unique verified mobile number</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Protected by encrypted session cookies</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Cloud MongoDB Atlas cluster data backup</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
