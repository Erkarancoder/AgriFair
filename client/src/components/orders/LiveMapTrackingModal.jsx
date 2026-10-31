import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Truck,
  Navigation,
  Compass,
  ArrowLeft,
  Plus,
  RotateCcw,
  Volume2,
  CheckCircle2,
  Clock,
  Layers,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  Radio,
  Pencil
} from 'lucide-react';
import { computeOrderRoute } from '../../utils/geoRouteHelper';
import voiceGuideService from '../../services/voiceGuide.service';

export default function LiveMapTrackingModal({ order, onClose }) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState('live_map'); // 'live_map' | 'hud_details'
  const [isCopied, setIsCopied] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);

  if (!order) return null;

  const routeData = computeOrderRoute(order);
  const product = order.product || {};
  const farmer = order.farmer || {};
  const buyer = order.buyer || {};

  // Animate the vehicle moving along the highway on open
  useEffect(() => {
    let frameId;
    let startVal = 0;
    const targetVal = routeData.progressPct;
    const step = () => {
      startVal += 1.5;
      if (startVal >= targetVal) {
        setAnimProgress(targetVal);
      } else {
        setAnimProgress(startVal);
        frameId = requestAnimationFrame(step);
      }
    };
    frameId = requestAnimationFrame(step);

    // Bolta Sahayak Hindi Voice guidance when map opens
    const speakText = `लाइव मैप ट्रैकिंग खुल गई है। ${product.name || 'फसल'} की गाड़ी ${routeData.origin.title} से ${routeData.destination.title} के लिए निकल चुकी है। कुल दूरी ${routeData.distanceKm} किलोमीटर है और लगभग ${routeData.etaHindiText} का समय लगेगा।`;
    voiceGuideService.speak({
      hindiText: speakText,
      romanText: `Live map tracking open: Distance ${routeData.distanceKm} km, ETA ~${routeData.etaText}.`,
      key: `map-tracking-${order._id}`,
      force: true
    });

    return () => cancelAnimationFrame(frameId);
  }, [order._id]);

  // Interpolate vehicle position along the curve (matching Image 1 geometry)
  // Image 1 coordinates approx:
  // Origin: X: 160, Y: 130
  // Road control points: (160, 130) -> (240, 155) -> (380, 260) -> (600, 390) -> (780, 480)
  const originX = 140;
  const originY = 120;
  const destX = 720;
  const destY = 460;

  // Calculate current vehicle location based on animProgress (0 to 100)
  const t = animProgress / 100;
  // Cubic Bezier interpolation for the highway bend
  const p0 = { x: originX, y: originY };
  const p1 = { x: 280, y: 170 };
  const p2 = { x: 480, y: 310 };
  const p3 = { x: destX, y: destY };

  const currentX =
    Math.pow(1 - t, 3) * p0.x +
    3 * Math.pow(1 - t, 2) * t * p1.x +
    3 * (1 - t) * Math.pow(t, 2) * p2.x +
    Math.pow(t, 3) * p3.x;

  const currentY =
    Math.pow(1 - t, 3) * p0.y +
    3 * Math.pow(1 - t, 2) * t * p1.y +
    3 * (1 - t) * Math.pow(t, 2) * p2.y +
    Math.pow(t, 3) * p3.y;

  const handleHearVoice = () => {
    voiceGuideService.speak({
      hindiText: `गाड़ी इस समय ${routeData.highwayTag} पर चल रही है। कुल दूरी ${routeData.distanceKm} किलोमीटर है और पहुँचने में लगभग ${routeData.etaHindiText} लगेंगे।`,
      romanText: `Vehicle on ${routeData.highwayTag}, distance ${routeData.distanceKm} km, ETA ${routeData.etaText}.`,
      key: `map-replay-${order._id}-${Date.now()}`,
      force: true
    });
  };

  return (
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden transform transition-all text-left flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-emerald-900 via-[#164e3b] to-emerald-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Navigation className="w-4 h-4 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                  Live GPS Route Tracking
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  GPS ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 truncate max-w-[280px] sm:max-w-md">
                Order: <strong className="text-white capitalize">{product.name || 'Crop'}</strong> • {order.requestedQuantity} {order.unit}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleHearVoice}
              title="आवाज़ में सुनें (Bolta Sahayak)"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors border border-white/15"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>सुनें</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAP CANVAS CONTAINER (Matches Image 1 layout) */}
        <div className="relative w-full h-[360px] sm:h-[420px] bg-[#f8fafc] overflow-hidden select-none border-b border-stone-200">
          {/* SVG Map Canvas */}
          <svg
            className="w-full h-full"
            viewBox="0 0 850 540"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background Grid & Land Boundaries (Stylized Indian Road Atlas) */}
            <defs>
              <pattern id="roadGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#f1f5f9" strokeWidth="1" />
              </pattern>
              <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.12" />
              </filter>
            </defs>

            {/* Light Grid Pattern */}
            <rect width="850" height="540" fill="#f8fafc" />
            <rect width="850" height="540" fill="url(#roadGrid)" />

            {/* Stylized Farmland / Vegetation Geometries */}
            <path d="M 40,40 Q 120,80 200,40 T 360,90 L 320,200 L 80,180 Z" fill="#f0fdf4" opacity="0.6" />
            <path d="M 450,80 Q 550,110 680,60 L 750,190 L 520,220 Z" fill="#fefce8" opacity="0.7" />
            <path d="M 180,300 Q 280,340 380,290 L 420,440 L 220,460 Z" fill="#f1f5f9" opacity="0.8" />
            <path d="M 520,320 Q 640,360 780,310 L 820,480 L 560,500 Z" fill="#ecfdf5" opacity="0.5" />

            {/* Secondary Inter-Village Roads (Grey connecting networks) */}
            <path d="M 80,110 L 140,120 L 190,200 L 120,310" stroke="#e2e8f0" strokeWidth="3" fill="none" />
            <path d="M 280,60 L 340,180 L 260,340" stroke="#e2e8f0" strokeWidth="2.5" fill="none" strokeDasharray="4 4" />
            <path d="M 480,90 L 540,220 L 480,380" stroke="#e2e8f0" strokeWidth="3" fill="none" />
            <path d="M 640,160 L 720,280 L 680,440" stroke="#e2e8f0" strokeWidth="2.5" fill="none" />
            <path d="M 200,420 L 380,430 L 520,450 L 720,460" stroke="#cbd5e1" strokeWidth="3" fill="none" strokeDasharray="6 3" />

            {/* MAIN TRANSIT HIGHWAY ROUTE (Black bold route matching Image 1) */}
            {/* Route Outer Border */}
            <path
              d="M 140,120 C 280,170 480,310 720,460"
              stroke="#ffffff"
              strokeWidth="9"
              fill="none"
              strokeLinecap="round"
            />
            {/* Route Solid Body */}
            <path
              d="M 140,120 C 280,170 480,310 720,460"
              stroke="#0f172a"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Traveled Distance Glow (Emerald path behind vehicle) */}
            <path
              d="M 140,120 C 280,170 480,310 720,460"
              stroke="#10b981"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="900"
              strokeDashoffset={900 - (900 * animProgress) / 100}
            />

            {/* HIGHWAY BADGES ALONG THE ROAD (205AG & 205A yellow badges as in Image 1) */}
            {/* Badge 1 (Near origin) */}
            <g transform="translate(265, 175)" filter="url(#badgeShadow)">
              <rect x="0" y="0" width="56" height="22" rx="4" fill="#ffffff" stroke="#eab308" strokeWidth="1.5" />
              <text x="28" y="15" fill="#ca8a04" fontSize="10" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
                {routeData.highwayNumber}
              </text>
            </g>

            {/* Badge 2 (Midway) */}
            <g transform="translate(390, 275)" filter="url(#badgeShadow)">
              <rect x="0" y="0" width="56" height="22" rx="4" fill="#ffffff" stroke="#eab308" strokeWidth="1.5" />
              <text x="28" y="15" fill="#ca8a04" fontSize="10" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
                {routeData.isChandigarhLocal ? '205A' : 'NH-31'}
              </text>
            </g>

            {/* Badge 3 (Near destination) */}
            <g transform="translate(635, 415)" filter="url(#badgeShadow)">
              <rect x="0" y="0" width="56" height="22" rx="4" fill="#ffffff" stroke="#eab308" strokeWidth="1.5" />
              <text x="28" y="15" fill="#ca8a04" fontSize="10" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
                {routeData.highwayNumber}
              </text>
            </g>

            {/* Intermediate Checkpoint / Toll Plaza */}
            <g transform="translate(470, 310)">
              <circle cx="0" cy="0" r="4" fill="#64748b" />
              <text x="8" y="4" fill="#64748b" fontSize="9" fontWeight="600" fontFamily="sans-serif">
                Agri-Toll Checkpoint
              </text>
            </g>

            {/* ORIGIN PIN & ADDRESS CARD (Matches Image 1 "Shivalik Hostel... CU") */}
            <g transform="translate(140, 120)">
              {/* Green Pin Head with concentric circles */}
              <circle cx="0" cy="0" r="14" fill="#10b981" opacity="0.25" className="animate-ping" />
              <circle cx="0" cy="0" r="9" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="3.5" fill="#ffffff" />

              {/* Origin Floating Address Bubble (Above pin) */}
              <g transform="translate(-80, -56)" filter="url(#badgeShadow)">
                <rect x="0" y="0" width="165" height="38" rx="10" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                <text x="12" y="18" fill="#0f172a" fontSize="11" fontWeight="700" fontFamily="sans-serif">
                  {routeData.origin.title.slice(0, 18)}...
                </text>
                <text x="12" y="30" fill="#64748b" fontSize="8.5" fontWeight="500" fontFamily="sans-serif">
                  {routeData.origin.subtitle.slice(0, 24)}
                </text>
                {/* Pencil icon */}
                <circle cx="150" cy="18" r="8" fill="#f8fafc" />
                <path d="M 148,15 L 152,19 M 151,14 L 153,16" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            </g>

            {/* DESTINATION PIN & ADDRESS CARD (Matches Image 1 "Kharar Bus Stand...") */}
            <g transform="translate(720, 460)">
              {/* Red Target Pin Head */}
              <circle cx="0" cy="0" r="14" fill="#ef4444" opacity="0.2" />
              <circle cx="0" cy="0" r="9" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="3.5" fill="#ffffff" />

              {/* Destination Floating Address Bubble */}
              <g transform="translate(-110, -56)" filter="url(#badgeShadow)">
                <rect x="0" y="0" width="165" height="38" rx="10" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                <text x="12" y="18" fill="#0f172a" fontSize="11" fontWeight="700" fontFamily="sans-serif">
                  {routeData.destination.title.slice(0, 18)}...
                </text>
                <text x="12" y="30" fill="#64748b" fontSize="8.5" fontWeight="500" fontFamily="sans-serif">
                  {routeData.destination.subtitle.slice(0, 24)}
                </text>
                {/* Pencil icon */}
                <circle cx="150" cy="18" r="8" fill="#f8fafc" />
                <path d="M 148,15 L 152,19 M 151,14 L 153,16" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
              </g>
              <text x="0" y="24" fill="#475569" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">
                {routeData.isChandigarhLocal ? 'ਖਰੜ (Kharar)' : 'Delivery Mandi'}
              </text>
            </g>

            {/* LIVE MOVING VEHICLE / DRIVERS (Exact driver icons from Image 1) */}
            <g transform={`translate(${currentX}, ${currentY})`} filter="url(#badgeShadow)">
              {/* Radar pulse beacon */}
              <circle cx="0" cy="0" r="22" fill="#10b981" opacity="0.25" className="animate-ping" />
              <circle cx="0" cy="0" r="12" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />

              {/* Vehicle / Rider SVG Icon (Truck / Delivery rider with yellow helmet as in Image 1) */}
              <g transform="translate(-10, -10) scale(0.9)">
                {/* Front cab */}
                <rect x="4" y="5" width="14" height="12" rx="3" fill="#eab308" />
                <circle cx="8" cy="11" r="2.5" fill="#1e293b" />
                <circle cx="14" cy="11" r="2.5" fill="#1e293b" />
                <rect x="5" y="6" width="5" height="3" fill="#ffffff" opacity="0.8" />
              </g>
            </g>
          </svg>

          {/* OVERLAY CONTROLS (Exactly matching Image 1 buttons) */}
          {/* Bottom-Left Back Arrow Button (Image 1 style) */}
          <button
            type="button"
            onClick={onClose}
            title="Back to Orders"
            className="absolute bottom-4 left-4 w-10 h-10 rounded-full bg-white shadow-lg border border-stone-200/90 flex items-center justify-center text-stone-700 hover:text-stone-950 hover:scale-105 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Bottom-Right Navigation Actions (Image 1 style) */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2.5">
            {/* Add Stop / Route Info Button */}
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white shadow-lg border border-stone-200/90 text-xs font-bold text-stone-800">
              <Plus className="w-4 h-4 text-stone-900" />
              <span>Direct Transit</span>
            </div>

            {/* Compass / Route Direction Button */}
            <button
              type="button"
              onClick={handleHearVoice}
              title="Speak GPS Transit Update"
              className="w-10 h-10 rounded-full bg-white shadow-lg border border-stone-200/90 flex items-center justify-center text-stone-700 hover:text-emerald-700 hover:scale-105 active:scale-95 transition-all"
            >
              <Compass className="w-5 h-5" />
            </button>

            {/* Recenter GPS Pin Button */}
            <button
              type="button"
              onClick={() => setAnimProgress(routeData.progressPct)}
              title="Recenter On Transit Vehicle"
              className="w-10 h-10 rounded-full bg-white shadow-lg border border-stone-200/90 flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all"
            >
              <Navigation className="w-5 h-5 fill-current" />
            </button>
          </div>

          {/* Top-Right Speed & Live Highway Pill */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-md border border-stone-200 px-3 py-1.5 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="text-[11px] font-bold text-stone-800">
              {routeData.speedKmH > 0 ? `${routeData.speedKmH} km/h` : 'At Loading Bay'}
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-[10px] font-mono font-semibold text-stone-500 uppercase">
              {routeData.highwayTag}
            </span>
          </div>
        </div>

        {/* BOTTOM RICH GPS STATS & CONSIGNMENT HUD (User Requested: Distance, Hours/Days ETA) */}
        <div className="p-4 sm:p-5 bg-white space-y-4 shrink-0 overflow-y-auto">
          {/* Main KPI Row: Distance & Estimated Travel Time */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Distance */}
            <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/90">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Total Route Distance
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-emerald-950">
                  {routeData.distanceKm}
                </span>
                <span className="text-xs font-bold text-emerald-800">km</span>
              </div>
              <span className="text-[10px] text-emerald-700/80 mt-0.5 block truncate">
                Via {routeData.highwayTag}
              </span>
            </div>

            {/* 2. Estimated Time (Hours / Days as requested) */}
            <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200/90">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                Estimated Transit Time
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-black text-blue-950 truncate">
                  {routeData.etaHindiText}
                </span>
              </div>
              <span className="text-[10px] font-medium text-blue-700 mt-0.5 block truncate">
                (~{routeData.etaText})
              </span>
            </div>

            {/* 3. Current Live Status */}
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/90">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Consignment Status
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                <span className="text-xs sm:text-sm font-extrabold text-amber-950 truncate">
                  {routeData.statusHindi}
                </span>
              </div>
              <span className="text-[10px] text-amber-800/80 mt-0.5 block truncate">
                {routeData.statusBadge}
              </span>
            </div>

            {/* 4. Carrier & Vehicle */}
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                Carrier & Vehicle
              </span>
              <div className="mt-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                <span className="text-xs font-bold text-stone-900 font-mono truncate">
                  {routeData.vehicleNo}
                </span>
              </div>
              <span className="text-[10px] text-stone-500 mt-0.5 block truncate">
                {routeData.transporter}
              </span>
            </div>
          </div>

          {/* Origin & Destination Route Summary Line */}
          <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              {/* Origin Icon */}
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block font-semibold">From (Farmer):</span>
                  <span className="font-bold text-stone-900">{routeData.origin.title}</span>
                </div>
              </div>

              <span className="text-stone-400 font-bold px-1">→</span>

              {/* Destination Icon */}
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block font-semibold">To (Buyer Hub):</span>
                  <span className="font-bold text-stone-900">{routeData.destination.title}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleHearVoice}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300 transition-colors inline-flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>बोलकर समझें</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

