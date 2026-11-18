import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Droplets,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sprout,
  CloudRain,
  Cpu,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// ── All bilingual strings for AuthPage ───────────────────────────────────────
const AUTH_TEXT = {
  en: {
    tagline: 'Smart Irrigation · ML',
    heroTitle: "Farmer Friend,\nSave Water\nGrow More.",
    heroDesc: 'Know when, how much, and why to irrigate — using AI and Machine Learning. Stop water waste, save electricity.',
    feat1: 'Random Forest ML Model — 6 Feature AI Prediction',
    feat2: '24h Satellite Rainfall Radar (Open-Meteo)',
    feat3: 'IoT Soil Moisture Sensor Integration',
    stat1: '35% Water Saved',
    stat2: '6 ML Features',
    stat3: '100% Free APIs',
    modeLogin: 'Login',
    modeRegister: 'Register',
    headingLogin: 'Login',
    headingRegister: 'Create Account',
    subLogin: 'Sign in to your Jalrakshak account.',
    subRegister: 'Create a free account and get AI irrigation advice.',
    googleBtn: (m) => `${m === 'login' ? 'Login' : 'Register'} with Google`,
    divider: 'or with email',
    labelName: 'Full Name *',
    labelEmail: 'Email Address *',
    labelPassword: 'Password *',
    placeholderName: 'e.g. Ramesh Kumar',
    placeholderEmail: 'yourname@gmail.com',
    placeholderPassLogin: '••••••••',
    placeholderPassReg: 'At least 6 characters',
    submitLogin: 'Login',
    submitRegister: 'Create Account',
    loadingLogin: 'Logging in...',
    loadingRegister: 'Creating account...',
    switchToReg: "Don't have an account?",
    switchToRegLink: 'Create one now',
    switchToLogin: 'Already have an account?',
    switchToLoginLink: 'Login',
    privacy: 'By logging in you agree to our Privacy Policy and Terms.\nYour data is secure.',
    successMsg: 'Account created! You are now logged in.',
    errEmail: 'Please enter email and password.',
    errPassLen: 'Password must be at least 6 characters.',
    errName: 'Please enter your name.',
    errGoogle: 'Google login failed. Please try again.',
  },
  hi: {
    tagline: 'स्मार्ट सिंचाई · ML',
    heroTitle: 'किसान भाई,\nपानी बचाओ\nफसल बढ़ाओ।',
    heroDesc: 'AI और Machine Learning से जानें — कब, कितना और क्यों सिंचाई करनी है। पानी की बर्बादी रोकें, बिजली बचाएं।',
    feat1: 'Random Forest ML Model — 6 Feature AI Prediction',
    feat2: '24h Satellite Rainfall Radar (Open-Meteo)',
    feat3: 'IoT Soil Moisture Sensor Integration',
    stat1: '35% पानी की बचत',
    stat2: '6 ML फ़ीचर्स',
    stat3: '100% Free APIs',
    modeLogin: 'लॉगिन',
    modeRegister: 'रजिस्टर',
    headingLogin: 'लॉगिन करें',
    headingRegister: 'खाता बनाएं',
    subLogin: 'अपने Jalrakshak खाते में प्रवेश करें।',
    subRegister: 'मुफ़्त खाता बनाएं और AI सिंचाई सलाह पाएं।',
    googleBtn: (m) => `Google से ${m === 'login' ? 'लॉगिन करें' : 'रजिस्टर करें'}`,
    divider: 'या ईमेल से',
    labelName: 'पूरा नाम *',
    labelEmail: 'ईमेल पता *',
    labelPassword: 'पासवर्ड *',
    placeholderName: 'जैसे: Ramesh Kumar',
    placeholderEmail: 'yourname@gmail.com',
    placeholderPassLogin: '••••••••',
    placeholderPassReg: 'कम से कम 6 अक्षर',
    submitLogin: 'लॉगिन करें',
    submitRegister: 'खाता बनाएं',
    loadingLogin: 'लॉगिन हो रहा है...',
    loadingRegister: 'खाता बन रहा है...',
    switchToReg: 'खाता नहीं है?',
    switchToRegLink: 'अभी बनाएं',
    switchToLogin: 'पहले से खाता है?',
    switchToLoginLink: 'लॉगिन करें',
    privacy: 'लॉगिन करके आप हमारी Privacy Policy और Terms से सहमत होते हैं।\nआपका डेटा सुरक्षित है।',
    successMsg: 'खाता बन गया! अब आप लॉगिन हैं।',
    errEmail: 'ईमेल और पासवर्ड डालें।',
    errPassLen: 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए।',
    errName: 'अपना नाम डालें।',
    errGoogle: 'Google से लॉगिन नहीं हो पाया। फिर कोशिश करें।',
  },
};

// ── Google G Icon (SVG) ───────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

// ── Feature bullet for the left panel ────────────────────────────────────────
function FeatureBullet({ icon: Icon, color, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="text-sm text-emerald-100/90">{text}</span>
    </div>
  );
}

// ── Input field component ────────────────────────────────────────────────────
function InputField({ label, id, type = 'text', value, onChange, placeholder, icon: Icon, rightSlot, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Icon className="w-4 h-4" />
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, loading, error, clearError } = useAuth();
  const { lang } = useLanguage();
  const tx = AUTH_TEXT[lang] || AUTH_TEXT.en;
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function switchMode(m) {
    setMode(m);
    clearError();
    setSuccess('');
    setName('');
    setEmail('');
    setPassword('');
    setShowPass(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    clearError();
    setSuccess('');

    if (mode === 'login') {
      const res = await loginWithEmail(email, password);
      if (res.success) navigate('/');
    } else {
      const res = await registerWithEmail(name, email, password);
      if (res.success) {
        setSuccess(tx.successMsg);
        setTimeout(() => navigate('/'), 1200);
      }
    }
  }

  async function handleGoogle() {
    clearError();
    const res = await loginWithGoogle();
    if (res.success) navigate('/');
  }

  // Left panel hero text split by \n
  const heroLines = tx.heroTitle.split('\n');

  return (
    <div className="min-h-screen flex">

      {/* ── Left Panel (decorative) ─────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 p-10 relative overflow-hidden">
        {/* Blobs */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
            <Droplets className="w-6 h-6 text-white fill-white/20" />
          </div>
          <div>
            <span className="text-2xl font-black text-white tracking-tight">
              Jal<span className="text-amber-300">rakshak</span>
            </span>
            <p className="text-xs text-emerald-200/80 font-medium leading-none mt-0.5">
              {tx.tagline}
            </p>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-3xl font-black text-white leading-snug">
              {heroLines[0]}<br />
              <span className="text-amber-300">{heroLines[1]}</span><br />
              {heroLines[2]}
            </h2>
            <p className="text-emerald-100/75 text-sm mt-3 leading-relaxed max-w-xs">
              {tx.heroDesc}
            </p>
          </div>

          <div className="space-y-3">
            <FeatureBullet icon={Cpu}       color="bg-violet-500" text={tx.feat1} />
            <FeatureBullet icon={CloudRain} color="bg-sky-500"    text={tx.feat2} />
            <FeatureBullet icon={Sprout}    color="bg-emerald-500" text={tx.feat3} />
          </div>

          {/* Stats row */}
          <div className="flex gap-6 pt-2">
            {[tx.stat1, tx.stat2, tx.stat3].map((label) => {
              const [val, ...rest] = label.split(' ');
              return (
                <div key={label} className="text-center">
                  <div className="text-xl font-black text-amber-300">{val}</div>
                  <div className="text-[11px] text-emerald-200/70 font-medium">{rest.join(' ')}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom credit */}
        <p className="text-emerald-300/50 text-xs relative z-10">
          Powered by Open-Meteo · Scikit-learn · React 19
        </p>
      </div>

      {/* ── Right Panel (form) ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-white fill-white/20" />
          </div>
          <span className="text-xl font-black text-slate-900">
            Jal<span className="text-emerald-600">rakshak</span>
          </span>
        </div>

        <div className="w-full max-w-md">

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-black text-slate-900">
              {mode === 'login' ? tx.headingLogin : tx.headingRegister}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {mode === 'login' ? tx.subLogin : tx.subRegister}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  mode === m
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m === 'login' ? tx.modeLogin : tx.modeRegister}
              </button>
            ))}
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-4"
          >
            <GoogleIcon />
            {tx.googleBtn(mode)}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">{tx.divider}</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Error / Success Banner */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm mb-4">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <InputField
                label={tx.labelName}
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tx.placeholderName}
                icon={User}
                autoComplete="name"
              />
            )}

            <InputField
              label={tx.labelEmail}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tx.placeholderEmail}
              icon={Mail}
              autoComplete="email"
            />

            <InputField
              label={tx.labelPassword}
              id="password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'login' ? tx.placeholderPassLogin : tx.placeholderPassReg}
              icon={Lock}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {mode === 'login' ? tx.loadingLogin : tx.loadingRegister}
                </>
              ) : (
                <>
                  {mode === 'login' ? tx.submitLogin : tx.submitRegister}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch mode link */}
          <p className="text-center text-sm text-slate-500 mt-5">
            {mode === 'login' ? (
              <>
                {tx.switchToReg}{' '}
                <button type="button" onClick={() => switchMode('register')} className="text-emerald-600 font-bold hover:underline">
                  {tx.switchToRegLink}
                </button>
              </>
            ) : (
              <>
                {tx.switchToLogin}{' '}
                <button type="button" onClick={() => switchMode('login')} className="text-emerald-600 font-bold hover:underline">
                  {tx.switchToLoginLink}
                </button>
              </>
            )}
          </p>

          {/* Privacy note */}
          <p className="text-center text-[11px] text-slate-400 mt-6 leading-relaxed whitespace-pre-line">
            {tx.privacy}
          </p>
        </div>
      </div>
    </div>
  );
}

