import { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  ChevronRight,
  ExternalLink,
  Store,
  Layers,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import MandiRateModal from '../../components/mandi/MandiRateModal';
import { ROUTES } from '../../constants/routes';

// ==================== STATE BENCHMARK DATA ====================
const STATES_DATA = {
  UP: {
    id: 'UP',
    name: 'Uttar Pradesh',
    hindiName: 'उत्तर प्रदेश',
    mandisCount: 4,
    majorMandi: 'Sitapur Road & Dubagga (Lucknow), Sahjanwa (Gorakhpur)',
    keyCommodities: ['Wheat (Sharbati)', 'Paddy (Basmati)', 'Potato (Aloo)', 'Mustard'],
    modalRange: '₹1,600 — ₹5,400 / quintal',
    primaryCrop: 'Wheat (Gehun)',
    todayRate: 2550,
    prevRate: 2505,
    change: 45,
    changePct: 1.8,
    trend: 'up',
    colorCategory: 'high', // 80-100%
    fundTransferredRate: '98.4%'
  },
  MH: {
    id: 'MH',
    name: 'Maharashtra',
    hindiName: 'महाराष्ट्र',
    mandisCount: 3,
    majorMandi: 'Gultekdi (Pune), Lasalgaon (Nashik), Vashi (Navi Mumbai)',
    keyCommodities: ['Onion (Pyaz)', 'Soybean', 'Pomegranate', 'Cotton'],
    modalRange: '₹2,450 — ₹7,200 / quintal',
    primaryCrop: 'Onion (Pyaz)',
    todayRate: 2450,
    prevRate: 2490,
    change: -40,
    changePct: -1.6,
    trend: 'down',
    colorCategory: 'high',
    fundTransferredRate: '96.2%'
  },
  PB: {
    id: 'PB',
    name: 'Punjab',
    hindiName: 'पंजाब',
    mandisCount: 2,
    majorMandi: 'Khanna Mandi (Asia Largest Grain Market), Ludhiana APMC',
    keyCommodities: ['Wheat (HD-3086)', 'Basmati 1121', 'Maize', 'Sunflower'],
    modalRange: '₹2,450 — ₹3,850 / quintal',
    primaryCrop: 'Basmati Paddy (Dhan)',
    todayRate: 3650,
    prevRate: 3580,
    change: 70,
    changePct: 1.95,
    trend: 'up',
    colorCategory: 'high',
    fundTransferredRate: '99.1%'
  },
  DL: {
    id: 'DL',
    name: 'Delhi (NCT)',
    hindiName: 'दिल्ली',
    mandisCount: 2,
    majorMandi: 'Azadpur National Terminal Market, Ghazipur Produce Market',
    keyCommodities: ['Apple (Kinnaur)', 'Potato (Chipsona)', 'Tomato', 'Onion'],
    modalRange: '₹1,780 — ₹9,400 / quintal',
    primaryCrop: 'Potato (Aloo)',
    todayRate: 1780,
    prevRate: 1740,
    change: 40,
    changePct: 2.3,
    trend: 'up',
    colorCategory: 'high',
    fundTransferredRate: '100%'
  },
  BR: {
    id: 'BR',
    name: 'Bihar',
    hindiName: 'बिहार',
    mandisCount: 2,
    majorMandi: 'Musallahpur Bazar (Patna), Muzaffarpur Shahi Mandi',
    keyCommodities: ['Maize (Makka)', 'Paddy', 'Wheat', 'Shahi Litchi'],
    modalRange: '₹2,050 — ₹3,200 / quintal',
    primaryCrop: 'Maize (Makka)',
    todayRate: 2150,
    prevRate: 2120,
    change: 30,
    changePct: 1.41,
    trend: 'up',
    colorCategory: 'med-high',
    fundTransferredRate: '94.5%'
  },
  MP: {
    id: 'MP',
    name: 'Madhya Pradesh',
    hindiName: 'मध्य प्रदेश',
    mandisCount: 2,
    majorMandi: 'Chhavani Krishi Upaj Mandi (Indore), Ujjain Grain Market',
    keyCommodities: ['Soybean (Yellow)', 'Wheat (Sharbati)', 'Garlic', 'Chana'],
    modalRange: '₹2,650 — ₹5,800 / quintal',
    primaryCrop: 'Soybean',
    todayRate: 4650,
    prevRate: 4620,
    change: 30,
    changePct: 0.65,
    trend: 'up',
    colorCategory: 'high',
    fundTransferredRate: '97.8%'
  },
  HR: {
    id: 'HR',
    name: 'Haryana',
    hindiName: 'हरियाणा',
    mandisCount: 2,
    majorMandi: 'Karnal Basmati Yard, Ambala City Mandi',
    keyCommodities: ['Basmati Paddy', 'Wheat (WH-1105)', 'Mustard', 'Barley'],
    modalRange: '₹2,420 — ₹3,700 / quintal',
    primaryCrop: 'Wheat (Gehun)',
    todayRate: 2460,
    prevRate: 2460,
    change: 0,
    changePct: 0.0,
    trend: 'stable',
    colorCategory: 'med-high',
    fundTransferredRate: '98.9%'
  },
  RJ: {
    id: 'RJ',
    name: 'Rajasthan',
    hindiName: 'राजस्थान',
    mandisCount: 2,
    majorMandi: 'Bhamashah Mandi (Kota), Sri Ganganagar Grain Market',
    keyCommodities: ['Mustard (Sarson)', 'Soybean', 'Coriander (Dhaniya)', 'Bajra'],
    modalRange: '₹2,100 — ₹6,500 / quintal',
    primaryCrop: 'Mustard (Sarson)',
    todayRate: 5400,
    prevRate: 5320,
    change: 80,
    changePct: 1.5,
    trend: 'up',
    colorCategory: 'high',
    fundTransferredRate: '95.6%'
  },
  WB: {
    id: 'WB',
    name: 'West Bengal',
    hindiName: 'पश्चिम बंगाल',
    mandisCount: 2,
    majorMandi: 'Siliguri Regulated Market, Barasat APMC Yard',
    keyCommodities: ['Paddy (Swarna)', 'Potato (Jyoti)', 'Jute', 'Pineapple'],
    modalRange: '₹1,500 — ₹4,600 / quintal',
    primaryCrop: 'Paddy (Dhan)',
    todayRate: 2350,
    prevRate: 2315,
    change: 35,
    changePct: 1.51,
    trend: 'up',
    colorCategory: 'med-high',
    fundTransferredRate: '100%'
  },
  GJ: {
    id: 'GJ',
    name: 'Gujarat',
    hindiName: 'गुजरात',
    mandisCount: 2,
    majorMandi: 'Surat APMC, Rajkot Grain & Cotton Yard',
    keyCommodities: ['Cotton (Kapas)', 'Groundnut', 'Cumin (Jeera)', 'Wheat'],
    modalRange: '₹2,300 — ₹8,500 / quintal',
    primaryCrop: 'Groundnut',
    todayRate: 5850,
    prevRate: 5800,
    change: 50,
    changePct: 0.86,
    trend: 'up',
    colorCategory: 'med-high',
    fundTransferredRate: '96.8%'
  },
  KA: {
    id: 'KA',
    name: 'Karnataka',
    hindiName: 'कर्नाटक',
    mandisCount: 2,
    majorMandi: 'Yeshwanthpur (Bengaluru), Hubballi APMC Yard',
    keyCommodities: ['Tomato', 'Arecanut', 'Maize', 'Turmeric'],
    modalRange: '₹2,100 — ₹12,000 / quintal',
    primaryCrop: 'Tomato (Tamatar)',
    todayRate: 2250,
    prevRate: 2350,
    change: -100,
    changePct: -4.25,
    trend: 'down',
    colorCategory: 'medium',
    fundTransferredRate: '95.1%'
  },
  AP: {
    id: 'AP',
    name: 'Andhra Pradesh & Telangana',
    hindiName: 'आंध्र प्रदेश व तेलंगाना',
    mandisCount: 2,
    majorMandi: 'Guntur Chilli Market, Warangal Grain Yard',
    keyCommodities: ['Red Chilli (Teja)', 'Cotton', 'Paddy', 'Turmeric'],
    modalRange: '₹2,200 — ₹16,500 / quintal',
    primaryCrop: 'Red Chilli (Mirch)',
    todayRate: 14500,
    prevRate: 14200,
    change: 300,
    changePct: 2.11,
    trend: 'up',
    colorCategory: 'med-high',
    fundTransferredRate: '97.2%'
  },
  TN: {
    id: 'TN',
    name: 'Tamil Nadu',
    hindiName: 'तमिलनाडु',
    mandisCount: 2,
    majorMandi: 'Koyambedu Wholesale Market (Chennai), Madurai Yard',
    keyCommodities: ['Banana', 'Coconut', 'Paddy', 'Small Onion (Shallots)'],
    modalRange: '₹2,200 — ₹6,800 / quintal',
    primaryCrop: 'Onion (Shallots)',
    todayRate: 3800,
    prevRate: 3750,
    change: 50,
    changePct: 1.33,
    trend: 'up',
    colorCategory: 'medium',
    fundTransferredRate: '98.0%'
  },
  OR: {
    id: 'OR',
    name: 'Odisha',
    hindiName: 'ओडिशा',
    mandisCount: 2,
    majorMandi: 'Cuttack APMC, Sambalpur Grain Market',
    keyCommodities: ['Paddy', 'Green Gram (Moong)', 'Groundnut', 'Ginger'],
    modalRange: '₹2,180 — ₹4,200 / quintal',
    primaryCrop: 'Paddy (Dhan)',
    todayRate: 2280,
    prevRate: 2260,
    change: 20,
    changePct: 0.88,
    trend: 'up',
    colorCategory: 'medium',
    fundTransferredRate: '93.4%'
  },
  JK: {
    id: 'JK',
    name: 'Jammu & Kashmir / Ladakh',
    hindiName: 'जम्मू व कश्मीर',
    mandisCount: 2,
    majorMandi: 'Parimpora Fruit Market (Srinagar), Narwal Mandi (Jammu)',
    keyCommodities: ['Apple (Delicious)', 'Walnut', 'Saffron', 'Cherry'],
    modalRange: '₹6,500 — ₹22,000 / quintal',
    primaryCrop: 'Apple (Seb)',
    todayRate: 8800,
    prevRate: 8600,
    change: 200,
    changePct: 2.32,
    trend: 'up',
    colorCategory: 'medium',
    fundTransferredRate: '99.5%'
  },
  NE: {
    id: 'NE',
    name: 'Assam & North East',
    hindiName: 'असम व पूर्वोत्तर',
    mandisCount: 2,
    majorMandi: 'Guwahati Regulated Market, Jorhat APMC',
    keyCommodities: ['Ginger (Adrak)', 'Turmeric', 'Assam Tea', 'Bhut Jolokia'],
    modalRange: '₹3,400 — ₹11,500 / quintal',
    primaryCrop: 'Ginger (Adrak)',
    todayRate: 6400,
    prevRate: 6250,
    change: 150,
    changePct: 2.4,
    trend: 'up',
    colorCategory: 'low-med',
    fundTransferredRate: '92.1%'
  }
};

// ==================== CROP LIVE TRENDS & FORECAST DATA ====================
// Covers Past 7 Days -> Today's Live Rate -> Tomorrow's Forecast & Next Day
const COMMODITY_TRENDS = {
  wheat: {
    id: 'wheat',
    name: 'Wheat (Sharbati / Lokwan)',
    hindiName: 'गेहूं (शरबती / लोकवान)',
    category: 'Grains & Cereals',
    unit: 'quintal',
    todayRate: 2550,
    prevRate: 2505,
    change: 45,
    changePct: 1.8,
    trend: 'up',
    tomorrowForecast: 2585,
    forecastChange: 35,
    forecastPct: 1.37,
    forecastDirection: 'up',
    sentiment: 'Bullish (मंडी में भारी मांग)',
    peakMandi: 'Sitapur Road Mandi (Lucknow)',
    chartData: [
      { date: '19 Oct', rate: 2470, arrival: '185T', status: 'Historical' },
      { date: '20 Oct', rate: 2490, arrival: '195T', status: 'Historical' },
      { date: '21 Oct', rate: 2510, arrival: '210T', status: 'Historical' },
      { date: '22 Oct', rate: 2495, arrival: '225T', status: 'Historical' },
      { date: '23 Oct', rate: 2520, arrival: '200T', status: 'Historical' },
      { date: '24 Oct', rate: 2505, arrival: '215T', status: 'Historical' },
      { date: 'Today (Live)', rate: 2550, arrival: '230T', status: 'Live APMC Rate' },
      { date: 'Tomorrow', rate: 2585, arrival: '245T', status: 'Predicted Forecast' },
      { date: 'Day +2', rate: 2610, arrival: '260T', status: 'Estimated Influx' }
    ]
  },
  paddy: {
    id: 'paddy',
    name: 'Paddy / Basmati 1509',
    hindiName: 'धान (बासमती 1509)',
    category: 'Grains & Cereals',
    unit: 'quintal',
    todayRate: 3450,
    prevRate: 3375,
    change: 75,
    changePct: 2.22,
    trend: 'up',
    tomorrowForecast: 3510,
    forecastChange: 60,
    forecastPct: 1.74,
    forecastDirection: 'up',
    sentiment: 'High Influx (तेज़ मांग)',
    peakMandi: 'Khanna Mandi (Punjab)',
    chartData: [
      { date: '19 Oct', rate: 3320, arrival: '140T', status: 'Historical' },
      { date: '20 Oct', rate: 3340, arrival: '155T', status: 'Historical' },
      { date: '21 Oct', rate: 3350, arrival: '160T', status: 'Historical' },
      { date: '22 Oct', rate: 3360, arrival: '170T', status: 'Historical' },
      { date: '23 Oct', rate: 3390, arrival: '165T', status: 'Historical' },
      { date: '24 Oct', rate: 3375, arrival: '175T', status: 'Historical' },
      { date: 'Today (Live)', rate: 3450, arrival: '180T', status: 'Live APMC Rate' },
      { date: 'Tomorrow', rate: 3510, arrival: '195T', status: 'Predicted Forecast' },
      { date: 'Day +2', rate: 3540, arrival: '210T', status: 'Estimated Influx' }
    ]
  },
  potato: {
    id: 'potato',
    name: 'Potato (Kufri / Agra Red)',
    hindiName: 'आलू (कुफरी / आगरा लाल)',
    category: 'Vegetables',
    unit: 'quintal',
    todayRate: 1600,
    prevRate: 1550,
    change: 50,
    changePct: 3.23,
    trend: 'up',
    tomorrowForecast: 1630,
    forecastChange: 30,
    forecastPct: 1.88,
    forecastDirection: 'up',
    sentiment: 'Moderate Bullish (मजबूत भाव)',
    peakMandi: 'Dubagga Mandi (Lucknow)',
    chartData: [
      { date: '19 Oct', rate: 1480, arrival: '120T', status: 'Historical' },
      { date: '20 Oct', rate: 1510, arrival: '130T', status: 'Historical' },
      { date: '21 Oct', rate: 1530, arrival: '135T', status: 'Historical' },
      { date: '22 Oct', rate: 1520, arrival: '145T', status: 'Historical' },
      { date: '23 Oct', rate: 1540, arrival: '138T', status: 'Historical' },
      { date: '24 Oct', rate: 1550, arrival: '142T', status: 'Historical' },
      { date: 'Today (Live)', rate: 1600, arrival: '140T', status: 'Live APMC Rate' },
      { date: 'Tomorrow', rate: 1630, arrival: '150T', status: 'Predicted Forecast' },
      { date: 'Day +2', rate: 1650, arrival: '160T', status: 'Estimated Influx' }
    ]
  },
  onion: {
    id: 'onion',
    name: 'Onion (Nasik Red Medium)',
    hindiName: 'प्याज (नासिक लाल)',
    category: 'Vegetables',
    unit: 'quintal',
    todayRate: 2450,
    prevRate: 2490,
    change: -40,
    changePct: -1.61,
    trend: 'down',
    tomorrowForecast: 2420,
    forecastChange: -30,
    forecastPct: -1.22,
    forecastDirection: 'down',
    sentiment: 'Slight Decline (आवक बढ़ने से हल्का दबाव)',
    peakMandi: 'Lasalgaon APMC (Maharashtra)',
    chartData: [
      { date: '19 Oct', rate: 2560, arrival: '80T', status: 'Historical' },
      { date: '20 Oct', rate: 2540, arrival: '85T', status: 'Historical' },
      { date: '21 Oct', rate: 2520, arrival: '90T', status: 'Historical' },
      { date: '22 Oct', rate: 2500, arrival: '92T', status: 'Historical' },
      { date: '23 Oct', rate: 2510, arrival: '88T', status: 'Historical' },
      { date: '24 Oct', rate: 2490, arrival: '94T', status: 'Historical' },
      { date: 'Today (Live)', rate: 2450, arrival: '95T', status: 'Live APMC Rate' },
      { date: 'Tomorrow', rate: 2420, arrival: '105T', status: 'Predicted Forecast' },
      { date: 'Day +2', rate: 2390, arrival: '115T', status: 'Estimated Influx' }
    ]
  },
  mustard: {
    id: 'mustard',
    name: 'Mustard (Sarson / Black)',
    hindiName: 'सरसों (काली / पीली)',
    category: 'Oilseeds',
    unit: 'quintal',
    todayRate: 5400,
    prevRate: 5340,
    change: 60,
    changePct: 1.12,
    trend: 'up',
    tomorrowForecast: 5460,
    forecastChange: 60,
    forecastPct: 1.11,
    forecastDirection: 'up',
    sentiment: 'High Oil Mill Demand (मजबूत मांग)',
    peakMandi: 'Bhamashah Mandi (Kota, Rajasthan)',
    chartData: [
      { date: '19 Oct', rate: 5240, arrival: '50T', status: 'Historical' },
      { date: '20 Oct', rate: 5270, arrival: '55T', status: 'Historical' },
      { date: '21 Oct', rate: 5300, arrival: '58T', status: 'Historical' },
      { date: '22 Oct', rate: 2310, arrival: '60T', status: 'Historical' },
      { date: '23 Oct', rate: 5320, arrival: '62T', status: 'Historical' },
      { date: '24 Oct', rate: 5340, arrival: '64T', status: 'Historical' },
      { date: 'Today (Live)', rate: 5400, arrival: '65T', status: 'Live APMC Rate' },
      { date: 'Tomorrow', rate: 5460, arrival: '70T', status: 'Predicted Forecast' },
      { date: 'Day +2', rate: 5500, arrival: '75T', status: 'Estimated Influx' }
    ]
  }
};

export default function IndiaMapMarketTrendsSection() {
  const [selectedCrop, setSelectedCrop] = useState('wheat');
  const [hoveredState, setHoveredState] = useState(STATES_DATA.UP);
  const [selectedState, setSelectedState] = useState(null);
  const [isMandiModalOpen, setIsMandiModalOpen] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false });

  const mapContainerRef = useRef(null);

  const activeCrop = COMMODITY_TRENDS[selectedCrop] || COMMODITY_TRENDS.wheat;

  // Handle mouse move over India Map to track cursor tooltip
  const handleMapMouseMove = (e, stateData) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setTooltipPos({
      x: Math.min(Math.max(x, 10), rect.width - 240),
      y: Math.min(Math.max(y - 120, 10), rect.height - 180),
      visible: true
    });
    setHoveredState(stateData);
  };

  const handleMapMouseLeave = () => {
    setTooltipPos((prev) => ({ ...prev, visible: false }));
  };

  const handleStateClick = (stateData) => {
    setSelectedState(stateData);
    setIsMandiModalOpen(true);
  };

  // Color lookup based on mandi density (matching user's uploaded Image 1 legend)
  const getStateColor = (cat, isHovered) => {
    if (isHovered) return '#059669'; // Emerald-600
    switch (cat) {
      case 'high':
        return '#047857'; // 80-100% (Dark Emerald)
      case 'med-high':
        return '#0d9488'; // 60-80% (Teal)
      case 'medium':
        return '#14b8a6'; // 40-60%
      case 'low-med':
        return '#5eead4'; // 20-40%
      default:
        return '#0f766e';
    }
  };

  return (
    <section className="py-12 sm:py-16 bg-[#faf9f5] border-y border-stone-200/90 relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-teal-100/30 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-950 text-xs font-bold uppercase tracking-wider mb-3.5 border border-emerald-200/60 shadow-2xs">
            <Activity className="w-3.5 h-3.5 text-emerald-700" />
            <span>National Agricultural Intelligence & Live APMC Feeds</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
            Pan-India Mandi Network & Live Market Price Trends
          </h2>
          <p className="text-stone-600 text-xs sm:text-base mt-2.5 leading-relaxed">
            Hover over any state on the interactive map to explore regional APMC benchmark rates, or track 7-day market movements with tomorrow&rsquo;s predictive crop rate forecasts.
          </p>
        </div>

        {/* 50 / 50 Side-by-Side Cohesive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          {/* ========================================================= */}
          {/* LEFT 50%: Interactive India Geospatial APMC Network Map    */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden group">
            {/* Map Top Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Geospatial Market Coverage
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-stone-900 flex items-center gap-1.5">
                  <span>Interactive India Mandi Map</span>
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMandiModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#164e3b] hover:text-[#123826] bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>Search All Mandis</span>
              </button>
            </div>

            {/* Map Canvas Container */}
            <div
              ref={mapContainerRef}
              onMouseLeave={handleMapMouseLeave}
              className="relative w-full h-[360px] sm:h-[400px] flex items-center justify-center bg-gradient-to-b from-stone-50/50 to-white rounded-2xl border border-stone-100 overflow-hidden"
            >
              {/* Detailed Stylized SVG Map of India with accurate States */}
              <svg
                viewBox="0 0 650 720"
                className="w-full h-full max-h-[380px] drop-shadow-sm select-none transition-all duration-300"
              >
                <defs>
                  <linearGradient id="mapGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                  <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.12" />
                  </filter>
                </defs>

                {/* State Paths Group */}
                <g filter="url(#shadow)" className="cursor-pointer transition-colors duration-150">
                  {/* Jammu & Kashmir / Ladakh */}
                  <path
                    d="M 230 45 L 290 35 L 340 70 L 310 130 L 250 140 L 220 100 Z"
                    fill={getStateColor(STATES_DATA.JK.colorCategory, hoveredState?.id === 'JK')}
                    stroke="#ffffff"
                    strokeWidth="2"
                    onMouseEnter={(e) => handleMapMouseMove(e, STATES_DATA.JK)}
                    onMouseMove={(e) => handleMapMouseMove(e, STATES_DATA.JK)}
                    onClick={() => handleStateClick(STATES_DATA.JK)}
                  />
                  <text x="260" y="85" fontSize="10" fontWeight="bold" fill="#ffffff" pointerEvents="none">LADAKH / J&K</text>

                  {/* Punjab */}
                  <path
                    d="M 200 140 L 240 140 L 235 185 L 195 180 Z"
                    fill={getStateColor(STATES_DATA.PB.colorCategory, hoveredState?.id === 'PB')}
                    stroke="#ffffff"
                    strokeWidth="2"
                    onMouseEnter={(e) => handleMapMouseMove(e, STATES_DATA.PB)}
                    onMouseMove={(e) => handleMapMouseMove(e, STATES_DATA.PB)}
                    onClick={() => handleStateClick(STATES_DATA.PB)}
                  />
                  <text x="202" y="165" fontSize="9" fontWeight="bold" fill="#ffffff" pointerEvents="none">PUNJAB</text>

                  {/* Haryana & Delhi */}
                  <path
                    d="M 235 155 L 265 155 L 265 195 L 235 195 Z"
                    fill={getStateColor(STATES_DATA.HR.colorCategory, hoveredState?.id === 'HR' || hoveredState?.id === 'DL')}
                    stroke="#ffffff"
                    strokeWidth="2"
                    onMouseEnter={(e) => handleMapMouseMove(e, STATES_DATA.HR)}
                    onMouseMove={(e) => handleMapMouseMove(e, STATES_DATA.HR)}
                    onClick={() => handleStateClick(STATES_DATA.DL)}
                  />
                  <text x="238" y="178" fontSize="8" fontWeight="bold" fill="#ffffff" pointerEvents="none">HARYANA</text>
                  <circle cx="255" cy="182" r="4" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />

                  {/* Rajasthan */}
                  <path
                    d="M 120 180 L 205 180 L 230 240 L 190 310 L 120 250 Z"
                    fill={getStateColor(STATES_DATA.RJ.colorCategory, hoveredState?.id === 'RJ')}
                    stroke="#ffffff"
                    strokeWidth="2"
                    onMouseEnter={(e) => handleMapMouseMove(e, STATES_DATA.RJ)}
                    onMouseMove={(e) => handleMapMouseMove(e, STATES_DATA.RJ)}
                    onClick={() => handleStateClick(STATES_DATA.RJ)}
                  />
                  <text x="145" y="240" fontSize="11" fontWeight="bold" fill="#ffffff" pointerEvents="none">RAJASTHAN</text>

                  {/* Uttar Pradesh */}
                  <path
                    d="M 240 185 L 360 190 L 390 270 L 270 270 L 240 215 Z"
                    fill={getStateColor(STATES_DATA.UP.colorCategory, hoveredState?.id === 'UP')}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="hover:opacity-90"
                    onMouseEnter={(e) => handleMapMouseMove(e, STATES_DATA.UP)}
                    onMouseMove={(e) => handleMapMouseMove(e, STATES_DATA.UP)}
                    onClick={() => handleStateClick(STATES_DATA.UP)}
                  />
                  <text x="280" y="235" fontSize="12" fontWeight="bold" fill="#ffffff" pointerEvents="none">UTTAR PRADESH</text>

                  {/* Bihar */}
                  <path
                    d="M 390 220 L 460 220 L 460 275 L 390 275 Z"
                    fill={getStateColor(STATES_DATA.BR.colorCategory, hoveredState?.id === 'BR')}
                    stroke="#ffffff"
                    strokeWidth="2"
                    onMouseEnter={(e) => handleMapMouseMove(e, STATES_DATA.BR)}
                    onMouseMove={(e) => handleMapMouseMove(e, STATES_DATA.BR)}
                    onClick={() => handleStateClick(STATES_DATA.BR)}
                  />
                  <text x="408" y="250" fontSize="10" fontWeight="bold" fill="#ffffff" pointerEvents="none">BIHAR</text>

                  {/* West Bengal */}
                  <path
                    d="M 460 230 L 495 240 L 485 320 L 445 320 L 460 275 Z"
                    fill={hoveredState?.id === 'WB' ? '#059669' : '#312e81'} // Distinct shade as featured in user reference
                    stroke="#ffffff"
                    strokeWidth="2"
                    onMouseEnter={(e) => handleMapMouseMove(e, STATES_DATA.WB)}
                    onMouseMove={(e) => handleMapMouseMove(e, STATES_DATA.WB)}
                    onClick={() => handleStateClick(STATES_DATA.WB)}
                  />
                  <text x="448" y="295" fontSize="8" fontWeight="bold" fill="#ffffff" pointerEvents="none">WEST BENGAL</text>

                  {/* Assam & North East */}
                  <path
                    d="M 495 210 L 580 200 L 590 260 L 510 260 Z"
                    fill={getStateColor(STATES_DATA.NE.colorCategory, hoveredState?.id === 'NE')}
                    stroke="#ffffff"
                    strokeWidth="2"
                    onMouseEnter={(e) => handleMapMouseMove(e, STATES_DATA.NE)}
                    onMouseMove={(e) => handleMapMouseMove(e, STATES_DATA.NE)}
                    onClick={() => handleStateClick(STATES_DATA.NE)}
                  />
                  <text x="520" y="235" fontSize="9" fontWeight="bold" fill="#ffffff" pointerEvents="none">ASSAM / NE</text>

                  {/* Gujarat */}
                  <path
                    d="M 85 270 L 150 270 L 165 350 L 95 350 L 80 300 Z"
                    fill={getStateColor(STATES_DATA.GJ.colorCategory, hoveredState?.id === 'GJ')}
                    stroke="#ffffff"
                    strokeWidth="2"
                    onMouseEnter={(e) => handleMapMouseMove(e, STATES_DATA.GJ)}
                    onMouseMove={(e) => handleMapMouseMove(e, STATES_DATA.GJ)}
                    onClick={() => handleStateClick(STATES_DATA.GJ)}
                  />
                  <text x="95" y="315" fontSize="10" fontWeight="bold" fill="#ffffff" pointerEvents="none">GUJARAT</text>

                  {/* Madhya Pradesh */}
                  <path
                    d="M 180 275 L 340 275 L 350 355 L 200 355 Z"
                    fill={getStateColor(STATES_DATA.MP.colorCategory, hoveredState?.id === 'MP')}
                    stroke="#ffffff"
                    strokeWidth="2"
                    onMouseEnter={(e) => handleMapMouseMove(e, STATES_DATA.MP)}
                    onMouseMove={(e) => handleMapMouseMove(e, STATES_DATA.MP)}
                    onClick={() => handleStateClick(STATES_DATA.MP)}
                  />
                  <text x="215" y="315" fontSize="11" fontWeight="bold" fill="#ffffff" pointerEvents="none">MADHYA PRADESH</text>

                  {/* Odisha */}
                  <path
                    d="M 370 330 L 450 330 L 430 410 L 370 390 Z"
                    fill={getStateColor(STATES_DATA.OR.colorCategory, hoveredState?.id === 'OR')}
                    stroke="#ffffff"
                    strokeWidth="2"
                    onMouseEnter={(e) => handleMapMouseMove(e, STATES_DATA.OR)}
                    onMouseMove={(e) => handleMapMouseMove(e, STATES_DATA.OR)}
                    onClick={() => handleStateClick(STATES_DATA.OR)}
                  />
                  <text x="385" y="370" fontSize="10" fontWeight="bold" fill="#ffffff" pointerEvents="none">ODISHA</text>

                  {/* Maharashtra */}
                  <path
                    d="M 140 355 L 290 355 L 295 460 L 175 460 L 140 400 Z"
                    fill={getStateColor(STATES_DATA.MH.colorCategory, hoveredState?.id === 'MH')}
                    stroke="#ffffff"
                    strokeWidth="2"
                    onMouseEnter={(e) => handleMapMouseMove(e, STATES_DATA.MH)}
                    onMouseMove={(e) => handleMapMouseMove(e, STATES_DATA.MH)}
                    onClick={() => handleStateClick(STATES_DATA.MH)}
                  />
                  <text x="180" y="415" fontSize="11" fontWeight="bold" fill="#ffffff" pointerEvents="none">MAHARASHTRA</text>

                  {/* Andhra Pradesh & Telangana */}
                  <path
                    d="M 280 430 L 365 420 L 360 520 L 265 520 Z"
                    fill={getStateColor(STATES_DATA.AP.colorCategory, hoveredState?.id === 'AP')}
                    stroke="#ffffff"
                    strokeWidth="2"
                    onMouseEnter={(e) => handleMapMouseMove(e, STATES_DATA.AP)}
                    onMouseMove={(e) => handleMapMouseMove(e, STATES_DATA.AP)}
                    onClick={() => handleStateClick(STATES_DATA.AP)}
                  />
                  <text x="280" y="475" fontSize="9" fontWeight="bold" fill="#ffffff" pointerEvents="none">ANDHRA / TELANGANA</text>

                  {/* Karnataka */}
                  <path
                    d="M 175 460 L 250 460 L 240 570 L 185 570 Z"
                    fill={getStateColor(STATES_DATA.KA.colorCategory, hoveredState?.id === 'KA')}
                    stroke="#ffffff"
                    strokeWidth="2"
                    onMouseEnter={(e) => handleMapMouseMove(e, STATES_DATA.KA)}
                    onMouseMove={(e) => handleMapMouseMove(e, STATES_DATA.KA)}
                    onClick={() => handleStateClick(STATES_DATA.KA)}
                  />
                  <text x="190" y="520" fontSize="9" fontWeight="bold" fill="#ffffff" pointerEvents="none">KARNATAKA</text>

                  {/* Tamil Nadu & Kerala */}
                  <path
                    d="M 215 570 L 280 570 L 250 670 L 210 650 Z"
                    fill={getStateColor(STATES_DATA.TN.colorCategory, hoveredState?.id === 'TN')}
                    stroke="#ffffff"
                    strokeWidth="2"
                    onMouseEnter={(e) => handleMapMouseMove(e, STATES_DATA.TN)}
                    onMouseMove={(e) => handleMapMouseMove(e, STATES_DATA.TN)}
                    onClick={() => handleStateClick(STATES_DATA.TN)}
                  />
                  <text x="215" y="615" fontSize="9" fontWeight="bold" fill="#ffffff" pointerEvents="none">TAMIL NADU</text>
                </g>
              </svg>

              {/* Exact Government Data.gov.in Style Floating Tooltip Card */}
              {hoveredState && (
                <div
                  className="absolute pointer-events-none z-30 transition-all duration-75 ease-out shadow-2xl rounded-xl border border-teal-600 bg-white/95 backdrop-blur-md p-3 max-w-[260px] text-left text-xs"
                  style={{
                    left: tooltipPos.visible ? `${tooltipPos.x}px` : '20px',
                    top: tooltipPos.visible ? `${tooltipPos.y}px` : '20px'
                  }}
                >
                  <div className="flex items-center justify-between border-b border-teal-100 pb-1.5 mb-1.5">
                    <h4 className="font-extrabold text-stone-900 text-sm tracking-wide">
                      {hoveredState.name.toUpperCase()}
                    </h4>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.2 rounded">
                      {hoveredState.fundTransferredRate || '100%'} APMC
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-stone-700">
                    <p>
                      <strong className="text-stone-900">Connected Mandis : </strong>
                      {hoveredState.mandisCount} Active APMC Yards
                    </p>
                    <p>
                      <strong className="text-stone-900">Key Commodities : </strong>
                      {hoveredState.keyCommodities.slice(0, 3).join(', ')}
                    </p>
                    <p>
                      <strong className="text-stone-900">Benchmark Rate : </strong>
                      <span className="font-extrabold text-[#164e3b]">
                        ₹{hoveredState.todayRate?.toLocaleString('en-IN')}{' '}
                        <span className="font-normal text-[10px] text-stone-500">/ quintal</span>
                      </span>
                    </p>
                    <p className="flex items-center gap-1 font-semibold pt-0.5">
                      <span className="text-stone-900">24h Market Trend : </span>
                      {hoveredState.trend === 'up' ? (
                        <span className="text-emerald-700 font-bold flex items-center">
                          <ArrowUpRight className="w-3 h-3" />
                          +₹{hoveredState.change} (+{hoveredState.changePct}%)
                        </span>
                      ) : hoveredState.trend === 'down' ? (
                        <span className="text-rose-700 font-bold flex items-center">
                          <ArrowDownRight className="w-3 h-3" />
                          -₹{Math.abs(hoveredState.change)} ({hoveredState.changePct}%)
                        </span>
                      ) : (
                        <span className="text-stone-600 font-bold">Stable</span>
                      )}
                    </p>
                  </div>

                  <div className="mt-2 pt-1 border-t border-stone-100 text-[10px] text-emerald-800 font-bold flex items-center justify-between">
                    <span>Click state to view rate card</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Color Density Legend (Matched with Reference Image 1) */}
            <div className="pt-3 border-t border-stone-100 mt-2">
              <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] sm:text-[11px] text-stone-600 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#047857]" />
                  <span>80.00 – 100.00%</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488]" />
                  <span>60.00 – 80.00%</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#14b8a6]" />
                  <span>40.00 – 60.00%</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5eead4]" />
                  <span>20.00 – 40.00%</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#312e81]" />
                  <span>Special Terminal</span>
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT 50%: Live Market Trends & Tomorrow's Forecast Graph  */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-4 sm:p-6 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Real-Time Mandi Benchmark & Forecast
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-stone-900 flex items-center gap-1.5">
                    <span>Live Market Trends (बाज़ार भाव रुझान)</span>
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>कल का अनुमान (Forecast)</span>
                </span>
              </div>

              {/* Commodity Selector Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar">
                {[
                  { id: 'wheat', label: '🌾 Wheat', sub: 'गेहूं' },
                  { id: 'paddy', label: '🍚 Basmati Paddy', sub: 'धान' },
                  { id: 'potato', label: '🥔 Potato', sub: 'आलू' },
                  { id: 'onion', label: '🧅 Onion', sub: 'प्याज' },
                  { id: 'mustard', label: '🌼 Mustard', sub: 'सरसों' }
                ].map((crop) => (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => setSelectedCrop(crop.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedCrop === crop.id
                        ? 'bg-[#164e3b] text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    <span>{crop.label}</span>
                  </button>
                ))}
              </div>

              {/* Top 3 Live Price Metric Cards (Aaj Ka Bhav, Upper/Loss, Kal Ka Forecast) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
                {/* 1. Today's Modal Rate */}
                <div className="p-3 rounded-2xl bg-[#faf9f5] border border-stone-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                    आज का भाव (Today Live)
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-extrabold text-[#164e3b]">
                      ₹{activeCrop.todayRate.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-stone-500 font-medium">
                      /{activeCrop.unit}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500 block mt-0.5">
                    ≈ ₹{(activeCrop.todayRate / 100).toFixed(1)}/kg
                  </span>
                </div>

                {/* 2. 24h Trend (Upper chal raha hai / Loss) */}
                <div
                  className={`p-3 rounded-2xl border ${
                    activeCrop.trend === 'up'
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : activeCrop.trend === 'down'
                      ? 'bg-rose-50/70 border-rose-200'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">
                    रुझान (24h Trend)
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {activeCrop.trend === 'up' ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-800 text-lg font-extrabold">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        <span>+₹{activeCrop.change}</span>
                      </span>
                    ) : activeCrop.trend === 'down' ? (
                      <span className="inline-flex items-center gap-0.5 text-rose-800 text-lg font-extrabold">
                        <TrendingDown className="w-5 h-5 text-rose-600" />
                        <span>-₹{Math.abs(activeCrop.change)}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-stone-700 text-lg font-extrabold">
                        <Minus className="w-5 h-5 text-stone-400" />
                        <span>Stable</span>
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                        activeCrop.trend === 'up'
                          ? 'bg-emerald-200/80 text-emerald-950'
                          : 'bg-rose-200/80 text-rose-950'
                      }`}
                    >
                      {activeCrop.changePct > 0 ? `+${activeCrop.changePct}%` : `${activeCrop.changePct}%`}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-600 font-medium block mt-0.5">
                    {activeCrop.trend === 'up' ? '▲ Upper Chal Raha Hai (Gain)' : '▼ Loss / Halka Dabav'}
                  </span>
                </div>

                {/* 3. Tomorrow's Predictive Forecast (कल का अनुमान) */}
                <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50/60 border border-violet-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-900 block">
                      कल का अनुमान (Tomorrow)
                    </span>
                    <Sparkles className="w-3 h-3 text-violet-600" />
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-extrabold text-violet-950">
                      ₹{activeCrop.tomorrowForecast.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-violet-700 font-medium">
                      /{activeCrop.unit}
                    </span>
                  </div>
                  <span className="text-[10px] text-violet-800 font-bold block mt-0.5">
                    {activeCrop.forecastPct > 0 ? `+${activeCrop.forecastPct}% Expected Surge` : 'Stable Arrival'}
                  </span>
                </div>
              </div>

              {/* Interactive Recharts Graph */}
              <div className="w-full h-56 sm:h-60 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={activeCrop.chartData}
                    margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#78716c' }}
                      axisLine={{ stroke: '#d6d3d1' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 10, fill: '#78716c' }}
                      axisLine={{ stroke: '#d6d3d1' }}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          const isTomorrow = item.date === 'Tomorrow' || item.date === 'Day +2';
                          const isToday = item.date.includes('Today');

                          return (
                            <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-stone-300 shadow-xl text-xs space-y-1">
                              <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1">
                                <span className="font-bold text-stone-900">{item.date}</span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                    isTomorrow
                                      ? 'bg-violet-100 text-violet-900'
                                      : isToday
                                      ? 'bg-emerald-100 text-emerald-950 font-extrabold'
                                      : 'bg-stone-100 text-stone-600'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </div>
                              <p className="text-stone-800 font-extrabold text-sm text-[#164e3b]">
                                ₹{item.rate.toLocaleString('en-IN')}{' '}
                                <span className="text-[10px] font-normal text-stone-500">/{activeCrop.unit}</span>
                              </p>
                              <p className="text-[10px] text-stone-500">
                                Mandi Influx Arrival: <strong className="text-stone-700">{item.arrival}</strong>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      x="Today (Live)"
                      stroke="#059669"
                      strokeDasharray="3 3"
                      label={{
                        value: 'Live APMC Today',
                        position: 'top',
                        fill: '#047857',
                        fontSize: 9,
                        fontWeight: 'bold'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#rateGradient)"
                      activeDot={{ r: 6, fill: '#047857', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-[11px] text-stone-500">
                Peak Yard: <strong className="text-stone-800">{activeCrop.peakMandi}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMandiModalOpen(true)}
                  className="inline-flex items-center gap-1 font-bold text-xs text-[#164e3b] hover:text-[#123826] bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Check Mandi Rates</span>
                </button>
                <Link
                  to={`${ROUTES.MARKETPLACE}?q=${encodeURIComponent(activeCrop.name.split(' ')[0])}`}
                  className="inline-flex items-center gap-1 font-bold text-xs text-white bg-[#164e3b] hover:bg-[#123826] px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Buy in Market</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mandi Rate Modal Integration */}
      {isMandiModalOpen && (
        <MandiRateModal
          isOpen={isMandiModalOpen}
          onClose={() => setIsMandiModalOpen(false)}
        />
      )}
    </section>
  );
}
