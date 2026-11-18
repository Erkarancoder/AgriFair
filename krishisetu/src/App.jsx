import { useState, useEffect } from 'react';
import {
  Sprout,
  Droplets,
  ShoppingCart,
  TrendingUp,
  Wifi,
  Cloud,
  CloudRain,
  MapPin,
  CreditCard,
  Truck,
  Mic,
  MicOff,
  ChevronRight,
  Cpu,
  Activity,
  Star,
  ArrowRight,
  Leaf,
  BarChart3,
  Shield,
  Zap,
  Globe2,
} from 'lucide-react';

// ── URLs for each module (update these to match your running dev servers) ──
const AGRIFAIR_URL = 'http://localhost:5175';
const JALRAKSHAK_URL = 'http://localhost:5174';

// ── Web Speech API voice helper (Hindi) ──────────────────────────────────────
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'hi-IN';
  u.rate = 0.93;
  u.pitch = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const hi = voices.find((v) => v.lang === 'hi-IN' || v.lang.startsWith('hi')) || voices[0];
  if (hi) u.voice = hi;
  window.speechSynthesis.speak(u);
}

export default function App() {
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statsAnimated, setStatsAnimated] = useState(false);

  useEffect(() => {
    // Ensure voices are loaded before first auto-greet
    const loadAndGreet = () => {
      setStatsAnimated(true);
      if (!voiceMuted) {
        const greeting =
          'नमस्ते किसान भाई! कृषि सेतु में आपका स्वागत है। ' +
          'यह पोर्टल दो शक्तिशाली प्लेटफ़ॉर्म को जोड़ता है। ' +
          'पहला है — जल रक्षक, जो आपकी फसल के लिए AI और मशीन लर्निंग से बताता है कि कब और कितना पानी देना है। ' +
          'दूसरा है — एग्रीफेयर, जहाँ आप अपनी कटी हुई फसल सीधे खरीदारों को बेच सकते हैं और मंडी भाव देख सकते हैं। ' +
          'नीचे दो बटन दिए हैं — अपनी ज़रूरत के हिसाब से किसी भी प्लेटफ़ॉर्म में प्रवेश करें।';
        setVoiceText(greeting);
        setIsSpeaking(true);
        speak(greeting);
        setTimeout(() => setIsSpeaking(false), 18000);
      }
    };

    // Voices sometimes load async
    if (window.speechSynthesis.getVoices().length > 0) {
      loadAndGreet();
    } else {
      window.speechSynthesis.onvoiceschanged = loadAndGreet;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHoverSpeak = (text, key) => {
    if (voiceMuted) return;
    setVoiceText(text);
    setIsSpeaking(true);
    speak(text);
    setTimeout(() => setIsSpeaking(false), 5000);
  };

  const handleEnterJalrakshak = () => {
    handleHoverSpeak(
      'जल रक्षक डैशबोर्ड खुल रहा है। यहाँ आप अपना खेत दर्ज करें, मिट्टी की नमी देखें और AI मशीन लर्निंग से जानें कि आपकी फसल को अभी पानी की ज़रूरत है या नहीं। पानी और बिजली दोनों बचाएं।',
      'jalrakshak-enter'
    );
    setTimeout(() => window.open(JALRAKSHAK_URL, '_blank'), 600);
  };

  const handleEnterAgriFair = () => {
    handleHoverSpeak(
      'एग्रीफेयर मार्केटप्लेस खुल रहा है। यहाँ आप अपनी कटी हुई फसल की लिस्टिंग डालें, मंडी भाव देखें, खरीदार से सीधे बात करें और रेजरपे से सुरक्षित भुगतान पाएं।',
      'agrifair-enter'
    );
    setTimeout(() => window.open(AGRIFAIR_URL, '_blank'), 600);
  };

  const toggleMute = () => {
    const next = !voiceMuted;
    setVoiceMuted(next);
    if (next) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setVoiceText('');
    } else {
      const t = 'बोलता सहायक चालू हो गया है। किसी भी बटन पर जाएं, मैं बोलकर समझाऊंगा।';
      setVoiceText(t);
      setIsSpeaking(true);
      speak(t);
      setTimeout(() => setIsSpeaking(false), 4000);
    }
  };

  // ── Stats (animated on load) ─────────────────────────────────────────────
  const stats = [
    { label: 'Farmer Registrations', value: '12,400+', icon: Leaf, color: 'text-emerald-600' },
    { label: 'Mandi Rates Live', value: '1,200+', icon: TrendingUp, color: 'text-amber-600' },
    { label: 'Water Saved (avg)', value: '35%', icon: Droplets, color: 'text-blue-600' },
    { label: 'States Covered', value: '18', icon: Globe2, color: 'text-violet-600' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">

      {/* ─────────── NAVBAR ─────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-md">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">KrishiSetu</span>
              <span className="ml-2 hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                कृषि सेतु
              </span>
            </div>
          </div>

          {/* Center nav pills */}
          <div className="hidden md:flex items-center gap-1">
            <span className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-default transition-colors">
              Smart Farming
            </span>
            <span className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-default transition-colors">
              Mandi Rates
            </span>
            <span className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-default transition-colors">
              IoT Sensors
            </span>
            <span className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-default transition-colors">
              GPS Logistics
            </span>
          </div>

          {/* Right: Badge + Lang + Voice */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm">
              <Shield className="w-3 h-3" />
              Unified National Agri-Tech Portal
            </span>

            {/* Voice toggle */}
            <button
              type="button"
              onClick={toggleMute}
              title={voiceMuted ? 'Turn Voice On' : 'Turn Voice Off'}
              className={`p-2 rounded-xl border transition-colors ${
                voiceMuted
                  ? 'bg-slate-100 border-slate-200 text-slate-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {voiceMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ─────────── HERO ─────────── */}
      <section className="relative bg-gradient-to-br from-[#052e16] via-[#064e3b] to-[#065f46] text-white overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-teal-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-emerald-600/5 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-sm font-semibold text-emerald-200 mb-8">
            <Zap className="w-4 h-4 text-amber-400" />
            India's First Unified Agri-Tech Ecosystem — Seed to Sale
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            <span className="block text-white">KrishiSetu</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 mt-1">
              Khet Se Mandi Tak
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-emerald-100/80 leading-relaxed mb-10">
            One platform. Two powerful modules. From AI-powered smart irrigation at the field to
            transparent, direct-to-buyer produce trading — every step of the farmer's journey,
            connected.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleEnterJalrakshak}
              className="group flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm shadow-xl shadow-blue-900/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Droplets className="w-5 h-5 text-cyan-200" />
              <span>Open Jalrakshak AI</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              type="button"
              onClick={handleEnterAgriFair}
              className="group flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm shadow-xl shadow-amber-900/30 hover:scale-105 active:scale-95 transition-all"
            >
              <ShoppingCart className="w-5 h-5 text-amber-100" />
              <span>Open AgriFair Market</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ─────────── STATS BAR ─────────── */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1.5">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
              <span className="text-xs text-slate-500 font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── GATEWAY CARDS ─────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
            Choose Your Module
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto">
            Both modules work independently. Click a card to enter — you can switch between them
            anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── JALRAKSHAK CARD ── */}
          <div
            onMouseEnter={() =>
              handleHoverSpeak(
                'जल रक्षक: किसान भाई, यह AI सिंचाई सहायक है। अपना खेत जोड़ें, मिट्टी की नमी देखें और Random Forest ML मॉडल से जानें कि आज पानी देना है या नहीं। Open-Meteo सेटेलाइट से 24 घंटे की बारिश की जानकारी भी मिलती है।',
                'jalrakshak-hover'
              )
            }
            className="relative group bg-white rounded-3xl border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            {/* Card color bar */}
            <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500" />

            <div className="p-7 sm:p-8">
              {/* Badge */}
              <div className="flex items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <Cpu className="w-3 h-3" />
                  Pre-Harvest · AI Irrigation
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Activity className="w-3 h-3" />
                  ML Live
                </span>
              </div>

              {/* Title */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
                  <Droplets className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Jalrakshak</h3>
                  <p className="text-xs text-slate-500 font-medium">जल रक्षक — Water Guardian</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                AI-powered irrigation advisory system. Tells the farmer exactly{' '}
                <strong className="text-slate-900">when, how much and whether</strong> to irrigate —
                using live soil sensors, 24h satellite rain radar and a trained Random Forest ML
                model.
              </p>

              {/* Feature List */}
              <ul className="space-y-2.5 mb-7">
                {[
                  { icon: Cpu, text: '6-Feature Random Forest ML Model', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { icon: CloudRain, text: '24h Satellite Rainfall Radar (Open-Meteo)', color: 'text-cyan-600', bg: 'bg-cyan-50' },
                  { icon: Wifi, text: 'ESP32 IoT Soil Moisture Sensor Integration', color: 'text-teal-600', bg: 'bg-teal-50' },
                  { icon: Activity, text: 'Multi-Plot Land & Crop Manager', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { icon: Zap, text: 'Save 35% Water, Electricity & Diesel Costs', color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((f) => (
                  <li key={f.text} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <span className={`w-6 h-6 rounded-lg ${f.bg} flex items-center justify-center shrink-0`}>
                      <f.icon className={`w-3.5 h-3.5 ${f.color}`} />
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>

              {/* Savings banner */}
              <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 flex items-center gap-3">
                <Star className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="text-xs text-blue-900 font-semibold">
                  Avg. farmer saves <span className="text-blue-700 font-black">₹4,200 / season</span> in
                  water and pumping costs using Jalrakshak.
                </span>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={handleEnterJalrakshak}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Droplets className="w-4 h-4" />
                Enter Jalrakshak AI Dashboard
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            </div>
          </div>

          {/* ── AGRIFAIR CARD ── */}
          <div
            onMouseEnter={() =>
              handleHoverSpeak(
                'एग्रीफेयर: किसान भाई, यह फसल बेचने का बाज़ार है। यहाँ अपनी कटी हुई फसल की लिस्टिंग डालें, पिन कोड से गाँव का नाम अपने आप आएगा। मंडी भाव देखें, खरीदार से सीधे सौदा करें और रेजरपे से ऑनलाइन पैसे पाएं। GPS से गाड़ी ट्रैक भी होती है।',
                'agrifair-hover'
              )
            }
            className="relative group bg-white rounded-3xl border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            {/* Card color bar */}
            <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500" />

            <div className="p-7 sm:p-8">
              {/* Badge */}
              <div className="flex items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <ShoppingCart className="w-3 h-3" />
                  Post-Harvest · Fair Trade
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <TrendingUp className="w-3 h-3" />
                  APMC Live
                </span>
              </div>

              {/* Title */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center shadow-md">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">AgriFair</h3>
                  <p className="text-xs text-slate-500 font-medium">एग्रीफेयर — Fair Crop Marketplace</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                National produce marketplace connecting farmers directly to wholesalers, retailers
                and institutional buyers — with{' '}
                <strong className="text-slate-900">real mandi rates, direct negotiation</strong>,
                verified payments and live GPS consignment tracking.
              </p>

              {/* Feature List */}
              <ul className="space-y-2.5 mb-7">
                {[
                  { icon: TrendingUp, text: '1,200+ Live APMC Mandi Rates (Real-time)', color: 'text-amber-600', bg: 'bg-amber-50' },
                  { icon: Cloud, text: 'PIN Code Auto-fetch: Village, District, State', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { icon: BarChart3, text: 'Direct Chat, Deal & Price Negotiation', color: 'text-violet-600', bg: 'bg-violet-50' },
                  { icon: CreditCard, text: '100% Real Razorpay Payment Gateway', color: 'text-rose-600', bg: 'bg-rose-50' },
                  { icon: Truck, text: 'Live GPS Highway Route Map Tracking', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { icon: Mic, text: 'किसान बोलता सहायक (AI Hindi Voice Guide)', color: 'text-teal-600', bg: 'bg-teal-50' },
                ].map((f) => (
                  <li key={f.text} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <span className={`w-6 h-6 rounded-lg ${f.bg} flex items-center justify-center shrink-0`}>
                      <f.icon className={`w-3.5 h-3.5 ${f.color}`} />
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>

              {/* Trust banner */}
              <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-700 shrink-0" />
                <span className="text-xs text-emerald-900 font-semibold">
                  Farmer earns{' '}
                  <span className="text-emerald-700 font-black">18-22% more</span> per quintal vs.
                  traditional mandi agents — direct trade, zero middlemen.
                </span>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={handleEnterAgriFair}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-bold text-sm shadow-lg shadow-amber-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sprout className="w-4 h-4" />
                Enter AgriFair Marketplace
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── HOW IT CONNECTS ─────────── */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-3">
            The Complete Farmer Journey
          </h2>
          <p className="text-sm text-slate-500 mb-10 max-w-lg mx-auto">
            Both modules are designed to work as a complete lifecycle — from the very first seed to
            the final payment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
            {[
              { step: '1', label: 'Register Land', sub: 'Add plot in Jalrakshak', icon: MapPin, color: 'bg-blue-600' },
              { step: '→', label: '', sub: '', icon: null, color: '' },
              { step: '2', label: 'AI Irrigate', sub: 'ML decides water schedule', icon: Droplets, color: 'bg-cyan-600' },
              { step: '→', label: '', sub: '', icon: null, color: '' },
              { step: '3', label: 'Harvest Ready', sub: 'Stage reaches "Harvest"', icon: Leaf, color: 'bg-emerald-600' },
              { step: '→', label: '', sub: '', icon: null, color: '' },
              { step: '4', label: 'List on AgriFair', sub: 'Post produce, set price', icon: ShoppingCart, color: 'bg-amber-500' },
              { step: '→', label: '', sub: '', icon: null, color: '' },
              { step: '5', label: 'Sell & Get Paid', sub: 'Razorpay + GPS Track', icon: CreditCard, color: 'bg-rose-500' },
            ].map((item, idx) =>
              item.icon ? (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-white shadow-md`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{item.label}</span>
                  <span className="text-[10px] text-slate-400 max-w-[80px] text-center leading-tight">{item.sub}</span>
                </div>
              ) : (
                <ChevronRight key={idx} className="w-5 h-5 text-slate-300 hidden sm:block mx-2" />
              )
            )}
          </div>
        </div>
      </section>

      {/* ─────────── FOOTER ─────────── */}
      <footer className="bg-[#052e16] text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <Sprout className="w-4 h-4 text-emerald-300" />
            </div>
            <span className="font-black text-lg">KrishiSetu</span>
            <span className="text-emerald-400 text-sm font-medium">कृषि सेतु</span>
          </div>
          <p className="text-emerald-200/70 text-xs max-w-sm mx-auto">
            Khet Se Mandi Tak — Empowering Indian Farmers at Every Stage of Agriculture
          </p>
          <div className="flex items-center justify-center gap-4 pt-2 text-xs text-emerald-300/60 font-medium">
            <span>Jalrakshak ML · Smart Irrigation</span>
            <span className="text-emerald-600">|</span>
            <span>AgriFair · Fair Produce Trade</span>
          </div>
        </div>
      </footer>

      {/* ─────────── FLOATING VOICE HUD ─────────── */}
      <div className="fixed bottom-6 left-4 sm:left-6 z-50">
        <button
          type="button"
          onClick={toggleMute}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-xl border text-xs font-bold transition-all duration-200 ${
            voiceMuted
              ? 'bg-slate-900/90 text-amber-300 border-amber-500/40'
              : isSpeaking
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-400 scale-105 shadow-emerald-900/40'
              : 'bg-white text-stone-800 border-emerald-500/50 hover:bg-emerald-50 shadow-md'
          }`}
        >
          <div className="relative">
            {voiceMuted ? (
              <MicOff className="w-4 h-4 text-amber-400" />
            ) : (
              <Mic className={`w-4 h-4 ${isSpeaking ? 'text-white animate-pulse' : 'text-emerald-600'}`} />
            )}
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            )}
          </div>
          <span>
            {voiceMuted
              ? 'बोलता सहायक: बंद'
              : isSpeaking
              ? 'बोलता सहायक: बोल रहा है...'
              : '🎙️ किसान बोलता सहायक'}
          </span>
        </button>

        {/* Subtitle caption */}
        {voiceText && isSpeaking && !voiceMuted && (
          <div className="absolute bottom-14 left-0 max-w-[340px] bg-slate-900/95 text-white text-xs font-medium px-3.5 py-2.5 rounded-2xl border border-emerald-500/30 shadow-xl leading-relaxed">
            {voiceText}
          </div>
        )}
      </div>

    </div>
  );
}

