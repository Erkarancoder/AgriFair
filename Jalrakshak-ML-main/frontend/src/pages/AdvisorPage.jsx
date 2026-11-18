import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Sprout,
  Layers,
  MapPin,
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Plus,
  Sliders,
  Terminal,
} from 'lucide-react';
import { useLand } from '../context/LandContext';
import { useLanguage } from '../context/LanguageContext';
import { requestIrrigationPrediction } from '../api/client';
import WeatherWidget from '../components/WeatherWidget';
import PredictionResultCard from '../components/PredictionResultCard';
import IoTSensorWidget from '../components/IoTSensorWidget';

export default function AdvisorPage({ onOpenAddLand, onOpenEditLand }) {
  const { lands, selectedLand, recordPrediction } = useLand();
  const { lang, t } = useLanguage();

  const [moisture, setMoisture] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentResult, setCurrentResult] = useState(null);

  useEffect(() => {
    if (selectedLand) {
      setMoisture(selectedLand.soilMoisture ?? 25);
      setError('');
      // Show existing prediction if already calculated for this land
      if (selectedLand.latestPrediction) {
        setCurrentResult({
          prediction: { irrigation_need: selectedLand.latestPrediction.need },
          decision: {
            action: selectedLand.latestPrediction.action,
            reason: selectedLand.latestPrediction.reason,
          },
          weather: {
            rainfall_next_24h_mm: selectedLand.latestPrediction.rainfall24h,
            temperature_c: selectedLand.latestPrediction.temperature ?? 28.5,
            humidity_percent: selectedLand.latestPrediction.humidity ?? 52.0,
            timezone: 'Asia/Kolkata',
            hourly_forecast: [],
          },
        });
      } else {
        setCurrentResult(null);
      }
    }
  }, [selectedLand?.id]);

  if (!selectedLand) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sprout className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Agricultural Lands Registered</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
          Add your first field or farm plot to start getting live weather forecasts and AI-powered irrigation recommendations.
        </p>
        <button
          onClick={onOpenAddLand}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add First Land
        </button>
      </div>
    );
  }

  async function handleCheckIrrigation(e) {
    e?.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        Soil_Moisture: Number(moisture),
        Crop_Type: selectedLand.cropType,
        Crop_Growth_Stage: selectedLand.growthStage,
        Soil_Type: selectedLand.soilType,
        latitude: Number(selectedLand.latitude),
        longitude: Number(selectedLand.longitude),
        area_acres: Number(selectedLand.areaAcres) || 2.5,
        pipe_diameter_inches: Number(selectedLand.pipeDiameterInches) || 2.5,
        motor_hp: Number(selectedLand.motorHp) || 5.0,
        irrigation_method: selectedLand.irrigationMethod || 'Flood',
      };

      const result = await requestIrrigationPrediction(payload);
      setCurrentResult(result);
      recordPrediction(selectedLand.id, Number(moisture), result);
    } catch (err) {
      setError(err.message || 'Failed to complete irrigation prediction.');
    } finally {
      setLoading(false);
    }
  }

  const moistureStatus =
    moisture < 20
      ? { label: t('criticallyDry'), color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' }
      : moisture < 35
      ? { label: t('lowMoisture'), color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }
      : moisture <= 70
      ? { label: t('optimalMoisture'), color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' }
      : { label: t('saturatedWet'), color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200' };

  const cropDisplay = lang === 'hi' ? {
    Rice: 'धान (चावल)', Wheat: 'गेहूं', Maize: 'मक्का', Sugarcane: 'गन्ना', Potato: 'आलू', Cotton: 'कपास'
  }[selectedLand.cropType] || selectedLand.cropType : selectedLand.cropType;

  const stageDisplay = lang === 'hi' ? {
    Sowing: 'बुवाई', Vegetative: 'बढ़वार / वानस्पतिक', Flowering: 'फूल आना', Harvest: 'कटाई'
  }[selectedLand.growthStage] || selectedLand.growthStage : selectedLand.growthStage;

  const soilDisplay = lang === 'hi' ? {
    Sandy: 'बलुई मिट्टी', Silt: 'गाद मिट्टी', Loamy: 'दोमट मिट्टी', Clay: 'चिकनी मिट्टी'
  }[selectedLand.soilType] || selectedLand.soilType : selectedLand.soilType;

  return (
    <div key={selectedLand.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      
      {/* Active Land Header Banner with Barabanki, UP Context */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {t('activeFieldPlot')}
            </span>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
              📍 {selectedLand.locationName || 'Location not set'}
            </span>
            <span className="text-xs text-slate-400">({selectedLand.areaAcres} {t('acres')})</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            {selectedLand.name}
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            {t('fieldGps')}: {selectedLand.latitude}° N, {selectedLand.longitude}° E • {selectedLand.locationName || 'Location not set'}
          </p>
        </div>

        {/* Quick parameters pill row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Sprout className="w-3.5 h-3.5 text-emerald-600" />
            {lang === 'hi' ? 'फसल:' : 'Crop:'} <span className="text-slate-900 font-bold">{cropDisplay}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            {lang === 'hi' ? 'अवस्था:' : 'Stage:'} <span className="text-slate-900 font-bold">{stageDisplay}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            {lang === 'hi' ? 'मिट्टी:' : 'Soil:'} <span className="text-slate-900 font-bold">{soilDisplay}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-800 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-sky-600" />
            {lang === 'hi' ? 'पंप:' : 'Pump:'} <span className="text-slate-900 font-bold">{selectedLand.motorHp ?? 5} HP • {selectedLand.pipeDiameterInches ?? 2.5}"</span>
          </div>

          <button
            onClick={() => onOpenEditLand(selectedLand)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
          >
            {t('editPlot')}
          </button>
        </div>
      </div>

      {/* Main Grid: Input Column & Results/Weather Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: IoT Sensor + Soil Moisture & Execution Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">

          {/* IoT Sensor Widget — wires into moisture slider */}
          <IoTSensorWidget land={selectedLand} onMoistureRead={setMoisture} />

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t('soilMoistureInput')}</h3>
                  <p className="text-[11px] text-slate-500">{t('sensorReadingFor')} {selectedLand.name}</p>
                </div>
              </div>

              <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${moistureStatus.bg} ${moistureStatus.color}`}>
                {moistureStatus.label}
              </div>
            </div>

            {/* Slider & Numeric Display */}
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {t('moistureLevel')}
                </span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={moisture}
                    onChange={(e) => setMoisture(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    className="w-16 text-center text-2xl font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-lg py-1 px-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-sm font-extrabold text-slate-500">%</span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={moisture}
                onChange={(e) => setMoisture(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />

              {/* Color Gauge Legend */}
              <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-bold">
                <div className="p-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  {t('dryLegend')}
                </div>
                <div className="p-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  {t('lowLegend')}
                </div>
                <div className="p-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {t('optimalLegend')}
                </div>
                <div className="p-1 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                  {t('wetLegend')}
                </div>
              </div>

              {/* Quick Steppers */}
              <div className="flex items-center justify-between gap-1 pt-1">
                {[-10, -5, +5, +10].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => setMoisture((prev) => Math.min(100, Math.max(0, prev + delta)))}
                    className="flex-1 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    {delta > 0 ? `+${delta}%` : `${delta}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message with Help to Start Backend */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed">{error}</p>
                </div>
                {error.includes('unreachable') && (
                  <div className="bg-white/80 p-2.5 rounded-lg border border-rose-200 font-mono text-[11px] text-slate-800 space-y-1">
                    <p className="text-slate-600 font-sans font-medium flex items-center gap-1">
                      <Terminal className="w-3.5 h-3.5 text-slate-500" /> Start FastAPI backend in your project terminal:
                    </p>
                    <code className="text-emerald-700 block bg-slate-100 p-1.5 rounded font-bold select-all">
                      .\.venv\Scripts\uvicorn src.api:app --reload --port 8000
                    </code>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleCheckIrrigation}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('fetchingWeatherCalc')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t('runAdvisorBtn')}</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-400 text-center">
              {t('pullsSatelliteWeather')}
            </p>

          </div>
        </div>

        {/* Right Column: Prediction Result & Weather Widget (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Prediction Result Card */}
          <PredictionResultCard result={currentResult} land={selectedLand} />

          {/* Live Weather & Rainfall Radar */}
          <WeatherWidget
            weather={currentResult?.weather}
            loading={loading}
          />
        </div>

      </div>

    </div>
  );
}
