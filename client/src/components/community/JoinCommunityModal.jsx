import { useState, useEffect } from 'react';
import {
  Users,
  Sparkles,
  CheckCircle2,
  MapPin,
  Sprout,
  ShieldCheck,
  UserPlus,
  Search,
  Filter,
  Image as ImageIcon,
  Award,
  Calendar,
  Layers,
  ChevronRight,
  ArrowRight,
  Loader2,
  X
} from 'lucide-react';
import Modal from '../common/Modal';
import { communityService } from '../../services/community.service';

const INDIAN_STATES = [
  'Punjab',
  'Uttar Pradesh',
  'Maharashtra',
  'Madhya Pradesh',
  'Gujarat',
  'Haryana',
  'Rajasthan',
  'Bihar',
  'West Bengal',
  'Karnataka',
  'Tamil Nadu',
  'Andhra Pradesh',
  'Odisha',
  'Himachal Pradesh',
  'Kerala',
  'Assam',
  'Delhi',
  'Telangana',
  'Chhattisgarh',
  'Jharkhand',
  'Uttarakhand'
];

const PRESET_AVATARS = [
  {
    id: 'av-1',
    label: 'Kisan Leader',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },
  {
    id: 'av-2',
    label: 'Progressive Farmer',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },
  {
    id: 'av-3',
    label: 'FPO Director',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },
  {
    id: 'av-4',
    label: 'Horticulturist',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },
  {
    id: 'av-5',
    label: 'Grain Trader',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },
  {
    id: 'av-6',
    label: 'Organic Cultivator',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },
  {
    id: 'av-7',
    label: 'Spices Grower',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  },
  {
    id: 'av-8',
    label: 'Young Agronomist',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
  }
];

export default function JoinCommunityModal({
  isOpen,
  onClose,
  onMemberJoined,
  initialTab = 'join'
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'join' | 'directory'
  const [members, setMembers] = useState([]);
  const [totalCount, setTotalCount] = useState(2440);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: 'farmer',
    roleTitle: '',
    state: 'Punjab',
    district: '',
    primaryCrop: '',
    farmSize: '8 Acres',
    experienceYears: 7,
    avatar: PRESET_AVATARS[0].url,
    bio: ''
  });
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [joinedSuccess, setJoinedSuccess] = useState(null);

  // Fetch directory members
  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen, roleFilter, searchQuery]);

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const res = await communityService.getMembers({
        limit: 30,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        search: searchQuery || undefined
      });
      if (res.success) {
        setMembers(res.members || []);
        if (res.stats?.displayTotalCount) {
          setTotalCount(res.stats.displayTotalCount);
        }
      }
    } catch (err) {
      console.error('Error fetching community members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarSelect = (url) => {
    setFormData((prev) => ({ ...prev, avatar: url }));
    setCustomAvatarUrl('');
  };

  const handleCustomAvatarBlur = () => {
    if (customAvatarUrl.trim()) {
      setFormData((prev) => ({ ...prev, avatar: customAvatarUrl.trim() }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!formData.state) {
      setErrorMsg('Please select your state.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await communityService.joinCommunity(formData);
      if (res.success) {
        setJoinedSuccess(res.member);
        if (res.stats?.displayTotalCount) {
          setTotalCount(res.stats.displayTotalCount);
        }
        if (onMemberJoined) {
          onMemberJoined(res.member, res.stats?.displayTotalCount);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit community registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setJoinedSuccess(null);
    setFormData({
      name: '',
      role: 'farmer',
      roleTitle: '',
      state: 'Punjab',
      district: '',
      primaryCrop: '',
      farmSize: '8 Acres',
      experienceYears: 7,
      avatar: PRESET_AVATARS[0].url,
      bio: ''
    });
    setCustomAvatarUrl('');
    setErrorMsg('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AgriFair Community Network"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Banner with Stats */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c3626] via-[#164e3b] to-[#1e5d48] p-5 sm:p-6 text-white shadow-lg">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-xs border border-emerald-400/30 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>Pan-India Agricultural Network</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Join the AgriFair Farming Community
              </h2>
              <p className="text-sm text-emerald-100/90 max-w-xl mt-1">
                Directly connect with {totalCount.toLocaleString()}+ verified farmers, FPO directors, and mandi traders across 20+ states with transparent produce pricing.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/20 flex items-center justify-center text-emerald-300">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-emerald-200 uppercase font-semibold tracking-wider">Joined Members</p>
                <p className="text-xl font-black text-white">{totalCount.toLocaleString()}+</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-t border-emerald-700/50 pt-4">
            <button
              type="button"
              onClick={() => { setActiveTab('join'); resetForm(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'join'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-emerald-100 hover:bg-emerald-700/50'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Join as Member</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'directory'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-emerald-100 hover:bg-emerald-700/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>View Member Directory ({members.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Registration Form */}
        {activeTab === 'join' && (
          <div>
            {joinedSuccess ? (
              /* Success Screen */
              <div className="text-center py-8 px-4 bg-emerald-50/60 rounded-3xl border border-emerald-200/80 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-700/20 animate-bounce">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-stone-900">
                    Welcome to AgriFair, {joinedSuccess.name}!
                  </h3>
                  <p className="text-stone-600 text-sm max-w-md mx-auto mt-1">
                    Your profile is now live in the community showcase and visible on our home network banner.
                  </p>
                </div>

                {/* Member Preview Card */}
                <div className="max-w-md mx-auto bg-white rounded-2xl p-4 border border-emerald-200 shadow-sm text-left flex items-start gap-3.5">
                  <img
                    src={joinedSuccess.avatar}
                    alt={joinedSuccess.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-stone-900 truncate">{joinedSuccess.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0">
                        {joinedSuccess.badge || 'Verified Kisan'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 font-medium truncate mt-0.5">{joinedSuccess.roleTitle}</p>
                    <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {joinedSuccess.district ? `${joinedSuccess.district}, ` : ''}{joinedSuccess.state}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold truncate">
                        <Sprout className="w-3 h-3" />
                        {joinedSuccess.primaryCrop}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('directory')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#164e3b] text-white text-sm font-bold hover:bg-[#123826] transition-all shadow-sm"
                  >
                    <span>View Directory</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-sm font-bold hover:bg-stone-200 transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Actual Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Photo / Avatar Selector */}
                <div className="bg-stone-50 p-4.5 rounded-2xl border border-stone-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-bold text-stone-900 block">
                        Select Member Photo / Avatar <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-stone-500">
                        Choose a photo preset representing your role or paste your custom image link
                      </p>
                    </div>
                    {/* Active Avatar Preview */}
                    <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
                      <img
                        src={formData.avatar}
                        alt="Selected Avatar"
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-600"
                      />
                      <span className="text-xs font-bold text-emerald-800">Preview</span>
                    </div>
                  </div>

                  {/* Preset Avatars Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 pt-1">
                    {PRESET_AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => handleAvatarSelect(av.url)}
                        className={`group relative rounded-2xl p-1 transition-all ${
                          formData.avatar === av.url
                            ? 'ring-2 ring-emerald-600 bg-emerald-50 scale-105'
                            : 'hover:bg-stone-200/70'
                        }`}
                      >
                        <img
                          src={av.url}
                          alt={av.label}
                          className="w-12 h-12 rounded-xl object-cover mx-auto"
                        />
                        <span className="text-[10px] text-stone-600 block text-center truncate mt-1 group-hover:text-stone-900 font-medium">
                          {av.label.split(' ')[0]}
                        </span>
                        {formData.avatar === av.url && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom URL Input */}
                  <div className="pt-1">
                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                      Or paste an online photo URL (JPEG/PNG/WebP):
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/your-photo.jpg"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      onBlur={handleCustomAvatarBlur}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                    />
                  </div>
                </div>

                {/* Form Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Sardar Balwinder Singh / Ramesh Patel"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-1.5">
                      Community Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                    >
                      <option value="farmer">Farmer / Kisan Producer</option>
                      <option value="trader">Mandi Trader / Merchant</option>
                      <option value="wholesaler">Bulk Wholesaler</option>
                      <option value="fpo_head">FPO Director / Representative</option>
                      <option value="retailer">Agri Retailer & Distributor</option>
                      <option value="agritech">Modern AgriTech Specialist</option>
                    </select>
                  </div>

                  {/* State */}
                  <div>
                    <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-1.5">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* District / Mandi */}
                  <div>
                    <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-1.5">
                      District / Mandi Belt
                    </label>
                    <input
                      type="text"
                      name="district"
                      placeholder="e.g. Khanna, Nashik, Indore, Rajkot"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                    />
                  </div>

                  {/* Primary Crop / Produce */}
                  <div>
                    <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-1.5">
                      Primary Crop / Produce
                    </label>
                    <input
                      type="text"
                      name="primaryCrop"
                      placeholder="e.g. Basmati 1121 Rice, Red Onion, Mustard"
                      value={formData.primaryCrop}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                    />
                  </div>

                  {/* Farm Size or Capacity */}
                  <div>
                    <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-1.5">
                      Land Holding / Capacity
                    </label>
                    <input
                      type="text"
                      name="farmSize"
                      placeholder="e.g. 12 Acres or 50 MT Cold Store"
                      value={formData.farmSize}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                    />
                  </div>
                </div>

                {/* Role Title / Headline */}
                <div>
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-1.5">
                    Profile Headline / Role Title
                  </label>
                  <input
                    type="text"
                    name="roleTitle"
                    placeholder="e.g. Progressive Wheat & Mustard Producer"
                    value={formData.roleTitle}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>

                {/* Short Bio */}
                <div>
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-1.5">
                    Short Note / Farming Practice
                  </label>
                  <textarea
                    name="bio"
                    rows={2}
                    placeholder="Share brief details about your farm methods, harvest seasons, or trading capacity..."
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white resize-none"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-stone-600 hover:text-stone-900 text-sm font-semibold hover:bg-stone-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] active:bg-[#0c2619] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                        <span>Saving to AgriFair Database...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-300" />
                        <span>Join AgriFair Community</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Directory Showcase (20+ Seeded & Joined Members) */}
        {activeTab === 'directory' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by farmer name, crop, or state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-stone-500 shrink-0" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full sm:w-auto text-xs font-semibold px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="all">All Roles ({members.length})</option>
                  <option value="farmer">Farmers / Kisans</option>
                  <option value="trader">Traders / Mandi</option>
                  <option value="fpo_head">FPO Leaders</option>
                  <option value="wholesaler">Wholesalers</option>
                </select>
              </div>
            </div>

            {/* Members Grid */}
            {loadingMembers ? (
              <div className="text-center py-12">
                <Loader2 className="w-7 h-7 text-emerald-700 animate-spin mx-auto" />
                <p className="text-xs text-stone-500 mt-2 font-medium">Loading community directory from database...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-200">
                <Users className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-sm font-bold text-stone-700 mt-2">No members match your search</p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setRoleFilter('all'); }}
                  className="text-xs text-emerald-700 font-bold hover:underline mt-1"
                >
                  Clear search filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {members.map((member) => (
                  <div
                    key={member._id}
                    className="p-3.5 rounded-2xl bg-white border border-stone-200/90 hover:border-emerald-500 hover:shadow-md transition-all flex items-start gap-3.5"
                  >
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-13 h-13 rounded-2xl object-cover ring-2 ring-stone-200 shrink-0"
                      onError={(e) => {
                        e.target.src = PRESET_AVATARS[0].url;
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-stone-900 text-sm truncate">{member.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0">
                          {member.badge || 'Verified'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 font-medium truncate mt-0.5">
                        {member.roleTitle || member.role}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-stone-500 mt-1.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                          {member.district ? `${member.district}, ` : ''}{member.state}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-emerald-800 font-semibold truncate">
                          <Sprout className="w-3 h-3 text-emerald-600 shrink-0" />
                          {member.primaryCrop}
                        </span>
                      </div>

                      {member.bio && (
                        <p className="text-[11px] text-stone-600 line-clamp-1 italic mt-1.5 pt-1 border-t border-stone-100">
                          "{member.bio}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
