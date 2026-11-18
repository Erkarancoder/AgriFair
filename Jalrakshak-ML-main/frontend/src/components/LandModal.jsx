import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader2, Sprout, Compass, Gauge, Droplets } from 'lucide-react';
import { useLand } from '../context/LandContext';
import { useLanguage } from '../context/LanguageContext';

const CROPS = [
  { id: 'Rice', en: 'Rice (Paddy)', hi: 'धान (चावल)' },
  { id: 'Wheat', en: 'Wheat', hi: 'गेहूं' },
  { id: 'Maize', en: 'Maize', hi: 'मक्का' },
  { id: 'Sugarcane', en: 'Sugarcane', hi: 'गन्ना' },
  { id: 'Potato', en: 'Potato', hi: 'आलू' },
  { id: 'Cotton', en: 'Cotton', hi: 'कपास' },
];

const STAGES = [
  { id: 'Sowing', en: 'Sowing', hi: 'बुवाई (Sowing)' },
  { id: 'Vegetative', en: 'Vegetative', hi: 'बढ़वार / वानस्पतिक' },
  { id: 'Flowering', en: 'Flowering', hi: 'फूल आना (Flowering)' },
  { id: 'Harvest', en: 'Harvest', hi: 'कटाई (Harvest)' },
];

const SOILS = [
  { id: 'Sandy', en: 'Sandy', hi: 'बलुई मिट्टी', descEn: 'Fast draining, low moisture retention', descHi: 'तेजी से पानी सूखता है, हल्की सिंचाई चाहिए' },
  { id: 'Silt', en: 'Silt', hi: 'गाद मिट्टी (Silt)', descEn: 'Medium texture, moderate retention', descHi: 'मध्यम बनावट, सामान्य जल धारण' },
  { id: 'Loamy', en: 'Loamy', hi: 'दोमट मिट्टी', descEn: 'Ideal balance of drainage & moisture', descHi: 'उपजाऊ व संतुलित जल धारण क्षमता' },
  { id: 'Clay', en: 'Clay', hi: 'चिकनी मिट्टी', descEn: 'Heavy, holds high water volume', descHi: 'भारी मिट्टी, लंबे समय तक नमी रोकती है' },
];

const PIPE_SIZES = [
  { value: 2.0, labelEn: '2.0 inch (50 mm) - Small Pump', labelHi: '2.0 इंच (50 मिमी) - छोटा पंप' },
  { value: 2.5, labelEn: '2.5 inch (65 mm) - Standard Tubewell', labelHi: '2.5 इंच (65 मिमी) - मानक बोरवेल' },
  { value: 3.0, labelEn: '3.0 inch (75 mm) - High Flow Tubewell', labelHi: '3.0 इंच (75 मिमी) - उच्च प्रवाह नलकूप' },
  { value: 4.0, labelEn: '4.0 inch (100 mm) - Community / Heavy', labelHi: '4.0 इंच (100 मिमी) - भारी नलकूप' },
];

const MOTOR_POWERS = [
  { value: 3.0, label: '3 HP (2.2 kW)' },
  { value: 5.0, label: '5 HP (3.7 kW) - Standard' },
  { value: 7.5, label: '7.5 HP (5.5 kW)' },
  { value: 10.0, label: '10 HP (7.5 kW)' },
];

const IRRIGATION_METHODS = [
  { id: 'Flood', en: 'Flood / Furrow (60% Eff.)', hi: 'पारंपरिक / क्यारी सिंचाई (60% दक्षता)' },
  { id: 'Drip', en: 'Drip Irrigation (90% Eff.)', hi: 'ड्रिप / टपक सिंचाई (90% दक्षता)' },
  { id: 'Sprinkler', en: 'Sprinkler System (75% Eff.)', hi: 'फव्वारा / स्प्रिंकलर (75% दक्षता)' },
];

export default function LandModal({ isOpen, onClose, landToEdit = null }) {
  const { addLand, updateLand } = useLand();
  const { lang, t } = useLanguage();
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    locationName: 'Field Location',
    areaAcres: 2.5,
    cropType: 'Wheat',
    growthStage: 'Vegetative',
    soilType: 'Loamy',
    pipeDiameterInches: 2.5,
    motorHp: 5.0,
    irrigationMethod: 'Flood',
    latitude: 26.93,
    longitude: 81.18,
  });

  useEffect(() => {
    if (landToEdit) {
      setFormData({
        name: landToEdit.name || '',
        locationName: landToEdit.locationName || 'Field Location',
        areaAcres: landToEdit.areaAcres ?? 2.5,
        cropType: landToEdit.cropType || 'Wheat',
        growthStage: landToEdit.growthStage || 'Vegetative',
        soilType: landToEdit.soilType || 'Loamy',
        pipeDiameterInches: landToEdit.pipeDiameterInches ?? 2.5,
        motorHp: landToEdit.motorHp ?? 5.0,
        irrigationMethod: landToEdit.irrigationMethod || 'Flood',
        latitude: landToEdit.latitude ?? 26.93,
        longitude: landToEdit.longitude ?? 81.18,
      });
    } else {
      setFormData({
        name: 'Primary Agricultural Field',
        locationName: 'Barabanki, Uttar Pradesh, India',
        areaAcres: 2.5,
        cropType: 'Wheat',
        growthStage: 'Vegetative',
        soilType: 'Loamy',
        pipeDiameterInches: 2.5,
        motorHp: 5.0,
        irrigationMethod: 'Flood',
        latitude: 26.93,
        longitude: 81.18,
      });
    }
    setLocError('');
  }, [landToEdit, isOpen]);

  if (!isOpen) return null;

  function handleDetectGPS() {
    if (!navigator.geolocation) {
      setLocError(lang === 'hi' ? 'ब्राउज़र में जीपीएस समर्थित नहीं है।' : 'Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
          locationName: `${lat}° N, ${lon}° E (GPS Detected)`,
        }));
      },
      () => {
        setLocating(false);
        setLocError(lang === 'hi' ? 'जीपीएस लोकेशन प्राप्त नहीं हो सकी। कृपया अनुमति दें या निर्देशांक दर्ज करें।' : 'Could not detect GPS location. Please allow browser location access or enter coordinates manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (landToEdit) {
      updateLand(landToEdit.id, formData);
    } else {
      addLand(formData);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-700 text-white">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-lg">
              {landToEdit ? (lang === 'hi' ? 'खेत विवरण संपादित करें' : 'Edit Registered Field') : (lang === 'hi' ? 'खेत व पंप पंजीकृत करें' : 'Register Agricultural Field')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Plot Name & Area */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                {lang === 'hi' ? 'खेत का नाम *' : 'Field / Plot Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={lang === 'hi' ? 'उदा. मुख्य नलकूप खेत' : 'e.g. Primary Tubewell Field'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                {lang === 'hi' ? 'रकबा (एकड़)' : 'Area (Acres)'}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={formData.areaAcres}
                onChange={(e) => setFormData({ ...formData, areaAcres: parseFloat(e.target.value) || 0 })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Crop Type & Growth Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                {lang === 'hi' ? 'बोई गई फसल' : 'Crop Cultivated'}
              </label>
              <select
                value={formData.cropType}
                onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
              >
                {CROPS.map((c) => (
                  <option key={c.id} value={c.id}>
                    🌾 {lang === 'hi' ? c.hi : c.en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                {lang === 'hi' ? 'बढ़वार की अवस्था' : 'Growth Stage'}
              </label>
              <select
                value={formData.growthStage}
                onChange={(e) => setFormData({ ...formData, growthStage: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    🌱 {lang === 'hi' ? s.hi : s.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Soil Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              {lang === 'hi' ? 'मिट्टी का प्रकार' : 'Soil Type'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SOILS.map((soil) => (
                <button
                  type="button"
                  key={soil.id}
                  onClick={() => setFormData({ ...formData, soilType: soil.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                    formData.soilType === soil.id
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-1 ring-emerald-600 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900">{lang === 'hi' ? soil.hi : soil.en}</div>
                  <div className="text-[11px] text-slate-500 leading-tight">{lang === 'hi' ? soil.descHi : soil.descEn}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pump & Delivery Pipe Specification */}
          <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900 uppercase tracking-wider">
              <Droplets className="w-4 h-4 text-sky-600" />
              <span>{lang === 'hi' ? 'सिंचाई पंप व पाइप विनिर्देश' : 'Irrigation Pump & Pipe Specs'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'डिलीवरी पाइप का आकार' : 'Delivery Pipe Diameter'}
                </label>
                <select
                  value={formData.pipeDiameterInches}
                  onChange={(e) => setFormData({ ...formData, pipeDiameterInches: parseFloat(e.target.value) || 2.5 })}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-sky-300 bg-white focus:ring-1 focus:ring-sky-500 focus:outline-none cursor-pointer"
                >
                  {PIPE_SIZES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {lang === 'hi' ? p.labelHi : p.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'मोटर पावर (HP)' : 'Motor Power (HP)'}
                </label>
                <select
                  value={formData.motorHp}
                  onChange={(e) => setFormData({ ...formData, motorHp: parseFloat(e.target.value) || 5.0 })}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-sky-300 bg-white focus:ring-1 focus:ring-sky-500 focus:outline-none cursor-pointer"
                >
                  {MOTOR_POWERS.map((m) => (
                    <option key={m.value} value={m.value}>
                      ⚡ {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {lang === 'hi' ? 'सिंचाई विधि' : 'Irrigation Method'}
              </label>
              <select
                value={formData.irrigationMethod}
                onChange={(e) => setFormData({ ...formData, irrigationMethod: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-sky-300 bg-white focus:ring-1 focus:ring-sky-500 focus:outline-none cursor-pointer"
              >
                {IRRIGATION_METHODS.map((im) => (
                  <option key={im.id} value={im.id}>
                    {lang === 'hi' ? im.hi : im.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location Coordinates & GPS Only */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {lang === 'hi' ? 'खेत की जीपीएस लोकेशन' : 'Field GPS Location'}
              </span>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={locating}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
                {locating ? (lang === 'hi' ? 'जीपीएस खोज रहे हैं...' : 'Detecting GPS...') : (lang === 'hi' ? 'वर्तमान जीपीएस लें' : 'Auto-Detect GPS')}
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              {lang === 'hi'
                ? 'अपने खेत पर रहकर "वर्तमान जीपीएस लें" बटन दबाएं या सीधे निर्देशांक दर्ज करें।'
                : 'Tap "Auto-Detect GPS" while at your field or enter latitude & longitude directly.'}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 font-medium">{lang === 'hi' ? 'अक्षांश (Latitude °N)' : 'Latitude (North)'}</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-medium">{lang === 'hi' ? 'देशांतर (Longitude °E)' : 'Longitude (East)'}</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {locError && <p className="text-[11px] text-rose-600 font-medium">{locError}</p>}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {landToEdit ? (lang === 'hi' ? 'बदलाव सहेजें' : 'Save Field Profile') : (lang === 'hi' ? 'खेत पंजीकृत करें' : 'Save Field Profile')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
