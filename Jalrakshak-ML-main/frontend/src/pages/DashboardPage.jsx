import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  ArrowRight,
  Droplets,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  History,
  Radio,
  Cpu,
  Loader2,
  Activity,
} from 'lucide-react';
import { useLand } from '../context/LandContext';
import { useLanguage } from '../context/LanguageContext';
import { simulateSensorReading, SENSOR_NODES } from '../api/sensor';

export default function DashboardPage({ onOpenAddLand, onOpenEditLand }) {
  const { lands, setSelectedLandId, deleteLand, updateLand, history } = useLand();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  const [pollingIds, setPollingIds] = useState(new Set());
  const [sensorReadings, setSensorReadings] = useState({});

  const totalAcres      = lands.reduce((acc, l) => acc + (Number(l.areaAcres) || 0), 0);
  const highNeedCount   = lands.filter((l) => l.latestPrediction?.need === 'High').length;
  const mediumNeedCount = lands.filter((l) => l.latestPrediction?.need === 'Medium').length;
  const sensorsOnline   = Object.keys(sensorReadings).length;

  function handleCheckPlot(landId) {
    setSelectedLandId(landId);
    navigate('/advisor');
  }

  function handleDelete(id, name) {
    const confirmMsg = lang === 'hi'
      ? `क्या आप वाकई "${name}" को हटाना चाहते हैं?`
      : `Are you sure you want to delete ${name}?`;
    if (window.confirm(confirmMsg)) {
      deleteLand(id);
    }
  }

  async function handleQuickPoll(land) {
    setPollingIds((prev) => new Set([...prev, land.id]));

    const delay = 600 + Math.random() * 600;
    await new Promise((r) => setTimeout(r, delay));

    const reading = simulateSensorReading(land, sensorReadings[land.id]?.soil_moisture ?? null);
    setSensorReadings((prev) => ({ ...prev, [land.id]: reading }));
    updateLand(land.id, { soilMoisture: reading.soil_moisture });

    setPollingIds((prev) => {
      const next = new Set(prev);
      next.delete(land.id);
      return next;
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ── Page Title & Top Actions ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t('dashboardTitle')}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {t('dashboardSubtitle')}
          </p>
        </div>
        <button
          onClick={onOpenAddLand}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t('registerNewLand')}
        </button>
      </div>

      {/* ── KPI Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('totalPlots')}</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{lands.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">{t('registeredFields')}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('totalArea')}</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {totalAcres.toFixed(1)} <span className="text-sm font-normal text-slate-500">{t('acres')}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{t('underManagement')}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-2xs">
          <div className="text-xs font-bold text-rose-500 uppercase tracking-wider">{t('highWaterDeficit')}</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{highNeedCount}</div>
          <div className="text-xs text-rose-500/80 mt-0.5">{t('urgentIrrigationNeeded')}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> {t('iotNodesPolled')}
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{sensorsOnline}</div>
          <div className="text-xs text-slate-500 mt-0.5">{t('ofNodes')} ({lands.length})</div>
        </div>
      </div>

      {/* ── IoT Node Status Overview Strip ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">{t('iotNodeStatus')}</h3>
          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-full ml-1">
            {t('simulatedIot')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {lands.map((land) => {
            const node    = SENSOR_NODES[land.id] || { nodeId: `JS-NODE-${land.id.slice(-2).toUpperCase()}`, probeDepthCm: 15 };
            const reading = sensorReadings[land.id];
            const polling = pollingIds.has(land.id);

            return (
              <div
                key={land.id}
                className={`rounded-xl border p-3 space-y-1.5 transition-all ${
                  reading
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${polling ? 'bg-amber-400 animate-ping' : reading ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span className="text-[11px] font-extrabold text-slate-700">{node.nodeId}</span>
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-500 truncate">{land.name}</div>
                {reading ? (
                  <>
                    <div className="text-lg font-black text-slate-900">{reading.soil_moisture}%</div>
                    <div className="flex gap-1 flex-wrap">
                      <span className="text-[10px] font-semibold text-emerald-700 bg-white border border-emerald-200 px-1.5 py-0.5 rounded-md">
                        🔋 {reading.battery_pct}%
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
                        📡 {reading.signal_rssi} dBm
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-slate-400">{polling ? t('polling') : (lang === 'hi' ? 'रीडिंग नहीं मिली' : 'No reading yet')}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Lands Grid ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-600" />
          {lang === 'hi' ? 'किसान के खेत' : 'My Land Plots'} ({lands.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {lands.map((land) => {
            const need      = land.latestPrediction?.need;
            const needBadge = {
              High:   { bg: 'bg-rose-100 text-rose-800 border-rose-200', label: lang === 'hi' ? 'तुरंत सिंचाई' : 'High Need', icon: AlertCircle },
              Medium: { bg: 'bg-amber-100 text-amber-800 border-amber-200', label: lang === 'hi' ? 'मध्यम सिंचाई' : 'Medium Need', icon: AlertTriangle },
              Low:    { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: lang === 'hi' ? 'पर्याप्त नमी' : 'Low Need', icon: CheckCircle2 },
            }[need] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: lang === 'hi' ? 'जांच नहीं हुई' : 'Not Checked Yet', icon: Clock };

            const Icon        = needBadge.icon;
            const node        = SENSOR_NODES[land.id] || { nodeId: `JS-NODE-${land.id.slice(-2).toUpperCase()}` };
            const reading     = sensorReadings[land.id];
            const polling     = pollingIds.has(land.id);
            const moisture    = reading ? reading.soil_moisture : (land.soilMoisture ?? 0);

            const cropDisplay = lang === 'hi' ? {
              Rice: 'धान', Wheat: 'गेहूं', Maize: 'मक्का', Sugarcane: 'गन्ना', Potato: 'आलू', Cotton: 'कपास'
            }[land.cropType] || land.cropType : land.cropType;

            const stageDisplay = lang === 'hi' ? {
              Sowing: 'बुवाई', Vegetative: 'बढ़वार', Flowering: 'फूल', Harvest: 'कटाई'
            }[land.growthStage] || land.growthStage : land.growthStage;

            const soilDisplay = lang === 'hi' ? {
              Sandy: 'बलुई', Silt: 'गाद', Loamy: 'दोमट', Clay: 'चिकनी'
            }[land.soilType] || land.soilType : land.soilType;

            return (
              <div
                key={land.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                {/* Land Title & Area */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 leading-tight">{land.name}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {land.latitude}°N, {land.longitude}°E
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                      {land.areaAcres} {t('acres')}
                    </span>
                  </div>

                  {/* Crop / Stage / Soil badges */}
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">🌾 {cropDisplay}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">🌱 {stageDisplay}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">🟤 {soilDisplay}</span>
                  </div>
                </div>

                {/* Moisture Bar */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-cyan-500" /> {t('moistureLevel')}
                    </span>
                    <span className="font-bold text-slate-900">{moisture}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, moisture)}%` }}
                      className={`h-full rounded-full transition-all ${
                        moisture < 20 ? 'bg-rose-500' : moisture < 35 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* IoT Sensor Status Strip */}
                <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[11px] font-semibold transition-all ${
                  reading
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${polling ? 'bg-amber-400 animate-ping' : reading ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <Cpu className="w-3 h-3 opacity-70" />
                    <span>{node.nodeId}</span>
                    {reading && <span className="text-[10px] text-slate-400">• 🔋{reading.battery_pct}%</span>}
                  </div>
                  <button
                    onClick={() => handleQuickPoll(land)}
                    disabled={polling}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-60 font-bold ${
                      reading
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                    title="Quick poll sensor reading"
                  >
                    {polling
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Radio className="w-3 h-3" />}
                    {polling ? t('polling') : t('pollSensor')}
                  </button>
                </div>

                {/* Irrigation Need & Row Actions */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                      {lang === 'hi' ? 'सिंचाई की जरूरत' : 'Irrigation Need'}
                    </span>
                    <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md border text-xs mt-0.5 ${needBadge.bg}`}>
                      <Icon className="w-3 h-3" />
                      {needBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenEditLand(land)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title={t('editPlot')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(land.id, land.name)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title={t('deletePlot')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Navigate to Advisor */}
                <button
                  onClick={() => handleCheckPlot(land.id)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{t('checkPlot')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {/* New Plot Trigger Card */}
          <button
            onClick={onOpenAddLand}
            className="rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 p-8 text-center flex flex-col items-center justify-center gap-3 transition-colors group cursor-pointer min-h-[260px]"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800 group-hover:text-emerald-700">
                {t('registerNewLand')}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
                {lang === 'hi' ? 'अलग-अलग फसल, बढ़वार अवस्था या जीपीएस लोकेशन के साथ नया खेत जोड़ें।' : 'Add fields with distinct crops, growth stages, or different GPS coordinates.'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ── Prediction History Table ──────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              {t('recentActivityLog')}
            </h3>
            <span className="text-xs text-slate-400">{t('lastRecords')} {Math.min(history.length, 10)}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-2.5 px-3">{lang === 'hi' ? 'समय' : 'Timestamp'}</th>
                  <th className="py-2.5 px-3">{lang === 'hi' ? 'खेत' : 'Land Plot'}</th>
                  <th className="py-2.5 px-3">{lang === 'hi' ? 'फसल व मिट्टी' : 'Crop & Soil'}</th>
                  <th className="py-2.5 px-3">{lang === 'hi' ? 'नमी' : 'Moisture'}</th>
                  <th className="py-2.5 px-3">{lang === 'hi' ? '24h बारिश' : '24h Rain'}</th>
                  <th className="py-2.5 px-3">{lang === 'hi' ? 'एआई सलाह' : 'AI Prediction'}</th>
                  <th className="py-2.5 px-3">{lang === 'hi' ? 'प्रोटोकॉल' : 'Protocol'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {history.slice(0, 10).map((h) => {
                  const dateStr = new Date(h.timestamp).toLocaleString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    month: 'short',
                    day: 'numeric',
                  });
                  return (
                    <tr key={h.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{dateStr}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{h.landName}</td>
                      <td className="py-2.5 px-3">{h.cropType} ({h.soilType})</td>
                      <td className="py-2.5 px-3 font-bold">{h.moisture}%</td>
                      <td className="py-2.5 px-3 text-sky-700">{h.prediction?.rainfall24h ?? 0} mm</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            h.prediction?.need === 'High'
                              ? 'bg-rose-100 text-rose-800'
                              : h.prediction?.need === 'Medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {h.prediction?.need === 'High'
                            ? (lang === 'hi' ? 'अधिक' : 'High')
                            : h.prediction?.need === 'Medium'
                            ? (lang === 'hi' ? 'मध्यम' : 'Medium')
                            : (lang === 'hi' ? 'पर्याप्त' : 'Low')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{h.prediction?.action}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
