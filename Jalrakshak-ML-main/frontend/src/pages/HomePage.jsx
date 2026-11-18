import React from 'react';
import { Link } from 'react-router-dom';
import {
  Droplets,
  Sprout,
  CloudRain,
  Cpu,
  LayoutDashboard,
  ShieldCheck,
  ArrowRight,
  MapPin,
  Zap,
  BarChart2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const FEATURES = [
  {
    icon: <Sprout className="w-6 h-6 text-emerald-600" />,
    bg: 'bg-emerald-50',
    titleEn: 'AI Irrigation Advisor',
    titleHi: 'AI सिंचाई सलाहकार',
    descEn: 'Random Forest ML model predicts Low / Medium / High water need from real-time soil and weather data.',
    descHi: 'रैंडम फॉरेस्ट ML मॉडल मिट्टी और मौसम डेटा से Low / Medium / High पानी की ज़रूरत बताता है।',
  },
  {
    icon: <CloudRain className="w-6 h-6 text-sky-600" />,
    bg: 'bg-sky-50',
    titleEn: 'Live Weather Radar',
    titleHi: 'लाइव मौसम रडार',
    descEn: '24-hour hourly rainfall forecast pulled from Open-Meteo satellite data for your exact field coordinates.',
    descHi: 'Open-Meteo सेटेलाइट से आपके खेत के सटीक GPS पर 24 घंटे की वर्षा पूर्वानुमान।',
  },
  {
    icon: <Cpu className="w-6 h-6 text-violet-600" />,
    bg: 'bg-violet-50',
    titleEn: 'IoT Sensor Ready',
    titleHi: 'IoT सेंसर तैयार',
    descEn: 'Simulates ESP32 capacitive soil moisture sensors. Plug in real hardware — only one file changes.',
    descHi: 'ESP32 कैपेसिटिव सॉइल सेंसर सिमुलेट करता है। असली हार्डवेयर जोड़ने पर केवल एक फ़ाइल बदलती है।',
  },
  {
    icon: <LayoutDashboard className="w-6 h-6 text-amber-600" />,
    bg: 'bg-amber-50',
    titleEn: 'Multi-Land Dashboard',
    titleHi: 'बहु-खेत डैशबोर्ड',
    descEn: 'Manage multiple farm plots with different crops, soil types, and GPS coordinates in one place.',
    descHi: 'अलग-अलग फसलें, मिट्टी, और GPS वाले कई खेत एक जगह से प्रबंधित करें।',
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-teal-600" />,
    bg: 'bg-teal-50',
    titleEn: 'Responsible ML',
    titleHi: 'जिम्मेदार ML',
    descEn: 'Never auto-irrigates. Always gives a clear IRRIGATE_NOW / MONITOR / SKIP decision with rainfall context.',
    descHi: 'कभी स्वचालित सिंचाई नहीं करता। हमेशा वर्षा संदर्भ के साथ स्पष्ट निर्णय देता है।',
  },
  {
    icon: <BarChart2 className="w-6 h-6 text-rose-600" />,
    bg: 'bg-rose-50',
    titleEn: 'Hindi + English UI',
    titleHi: 'हिंदी + अंग्रेज़ी UI',
    descEn: 'Full bilingual interface — every label, advisory, and error message is available in Hindi and English.',
    descHi: 'पूर्ण द्विभाषी इंटरफ़ेस — हर लेबल, सलाह और त्रुटि संदेश हिंदी और अंग्रेज़ी में उपलब्ध।',
  },
];

const STEPS = [
  {
    num: '01',
    titleEn: 'Register Your Field',
    titleHi: 'खेत दर्ज करें',
    descEn: 'Add your farm plot — set crop type, soil type, growth stage and auto-detect your GPS location.',
    descHi: 'खेत जोड़ें — फसल, मिट्टी, अवस्था चुनें और GPS से लोकेशन स्वतः पकड़ें।',
    color: 'bg-emerald-600',
  },
  {
    num: '02',
    titleEn: 'Poll the IoT Sensor',
    titleHi: 'IoT सेंसर से पढ़ें',
    descEn: 'Tap "Poll Sensor" to get a live (or simulated) soil moisture reading from your ESP32 node.',
    descHi: '"Poll Sensor" दबाएं और अपने ESP32 नोड से मिट्टी की नमी पढ़ें।',
    color: 'bg-violet-600',
  },
  {
    num: '03',
    titleEn: 'Run the AI Advisor',
    titleHi: 'AI सलाहकार चलाएं',
    descEn: 'One click fetches live weather, runs the ML model and returns a clear irrigation decision.',
    descHi: 'एक क्लिक से लाइव मौसम आता है, ML मॉडल चलता है और स्पष्ट सिंचाई निर्णय मिलता है।',
    color: 'bg-sky-600',
  },
];

export default function HomePage({ onOpenAddLand }) {
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 text-white">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12">

          {/* Left: Copy */}
          <div className="flex-1 text-center md:text-left space-y-6">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 text-xs font-bold bg-white/15 border border-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              {lang === 'hi' ? 'AI-संचालित कृषि सलाह • भारत के किसानों के लिए' : 'AI-Powered Agri Advisory · Built for Indian Farmers'}
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              {lang === 'hi' ? (
                <><span className="text-amber-300">जल</span>रक्षक</>
              ) : (
                <>Jal<span className="text-amber-300">rakshak</span></>
              )}
              <br />
              <span className="text-2xl sm:text-3xl font-bold text-white/80">
                {lang === 'hi' ? 'स्मार्ट सिंचाई सहायक' : 'Smart Irrigation Assistant'}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-white/80 max-w-xl leading-relaxed">
              {lang === 'hi'
                ? 'रियल-टाइम मिट्टी की नमी, सेटेलाइट मौसम पूर्वानुमान और ML मॉडल से जानें — कब, कितनी, और क्यों सिंचाई करनी है।'
                : 'Combine real-time soil moisture, satellite weather forecasts, and a trained ML model to know exactly when to irrigate — and when to save water.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center md:items-start gap-3">
              <Link
                to="/advisor"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-800 font-extrabold rounded-xl shadow-lg hover:bg-emerald-50 transition-all text-sm"
              >
                <Sprout className="w-4 h-4" />
                {lang === 'hi' ? 'AI सलाहकार खोलें' : 'Open AI Advisor'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={onOpenAddLand}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/15 border border-white/30 text-white font-bold rounded-xl hover:bg-white/25 transition-all text-sm backdrop-blur-sm"
              >
                <MapPin className="w-4 h-4" />
                {lang === 'hi' ? 'पहला खेत जोड़ें' : 'Register First Field'}
              </button>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2 text-sm">
              {[
                { val: '6', label: lang === 'hi' ? 'ML फ़ीचर्स' : 'ML Features' },
                { val: '4', label: lang === 'hi' ? 'निर्णय क्रियाएं' : 'Decision Actions' },
                { val: '35', label: lang === 'hi' ? 'ऑटोमेटेड टेस्ट' : 'Automated Tests' },
                { val: '100%', label: lang === 'hi' ? 'निःशुल्क API' : 'Free APIs' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-black text-amber-300">{s.val}</div>
                  <div className="text-xs text-white/70 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Farmer working in field image */}
          <div className="flex-shrink-0 w-full max-w-md flex items-center justify-center">
            <div className="relative group w-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-amber-300 rounded-3xl blur-lg opacity-40 group-hover:opacity-60 transition duration-500" />
              <img
                src="/farmer-field.jpg"
                alt="Farmer working in agricultural field"
                className="relative rounded-3xl shadow-2xl border-2 border-white/30 w-full h-[320px] sm:h-[360px] object-cover transform hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              {lang === 'hi' ? 'कैसे काम करता है?' : 'How It Works'}
            </h2>
            <p className="text-slate-500 mt-2 text-sm max-w-lg mx-auto">
              {lang === 'hi'
                ? 'तीन सरल चरणों में AI-आधारित सिंचाई निर्णय पाएं'
                : 'Get an AI-powered irrigation decision in three simple steps'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div key={step.num} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
                <span className="absolute top-4 right-4 text-5xl font-black text-slate-100 select-none leading-none">
                  {step.num}
                </span>
                <div className={`w-9 h-9 rounded-xl ${step.color} flex items-center justify-center text-white font-black text-sm`}>
                  {step.num}
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {lang === 'hi' ? step.titleHi : step.titleEn}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {lang === 'hi' ? step.descHi : step.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ─────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              {lang === 'hi' ? 'मुख्य विशेषताएं' : 'Key Features'}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.titleEn} className="flex gap-4 p-5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
                <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center shrink-0`}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {lang === 'hi' ? f.titleHi : f.titleEn}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    {lang === 'hi' ? f.descHi : f.descEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-emerald-700 to-teal-700 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black">
            {lang === 'hi' ? 'आज ही शुरू करें' : 'Get Started Today'}
          </h2>
          <p className="text-white/75 text-sm sm:text-base">
            {lang === 'hi'
              ? 'अपना पहला खेत दर्ज करें और बिना इंटरनेट कुंजी के लाइव मौसम और AI सिंचाई सलाह पाएं।'
              : 'Register your first field and get live weather + AI irrigation advice — no API keys needed.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/advisor"
              className="inline-flex items-center gap-2 px-7 py-3 bg-white text-emerald-800 font-extrabold rounded-xl shadow-md hover:bg-emerald-50 transition-all text-sm"
            >
              <Sprout className="w-4 h-4" />
              {lang === 'hi' ? 'AI सलाहकार खोलें' : 'Open AI Advisor'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={onOpenAddLand}
              className="inline-flex items-center gap-2 px-7 py-3 bg-white/15 border border-white/30 text-white font-bold rounded-xl hover:bg-white/25 transition-all text-sm"
            >
              <MapPin className="w-4 h-4" />
              {lang === 'hi' ? 'खेत जोड़ें' : 'Register a Field'}
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
