import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  Battery,
  Radio,
  Activity,
  Loader2,
  Cpu,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  simulateSensorReading,
  getSignalQuality,
  getBatteryStatus,
  SENSOR_NODES,
} from '../api/sensor';
import { useLanguage } from '../context/LanguageContext';

export default function IoTSensorWidget({ land, onMoistureRead }) {
  const { lang, t } = useLanguage();
  const [sensorData, setSensorData] = useState(null);
  const [reading, setReading] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [readCount, setReadCount] = useState(0);
  const liveIntervalRef = useRef(null);

  const node = SENSOR_NODES[land?.id] || {
    nodeId: `JS-NODE-${land?.id?.slice(-2)?.toUpperCase() || '01'}`,
    probeDepthCm: 15,
    location: land?.name || 'Field',
  };

  // Stop live mode if land changes
  useEffect(() => {
    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, [land?.id]);

  useEffect(() => {
    if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    if (liveMode) {
      liveIntervalRef.current = setInterval(() => {
        pollSensor(true);
      }, 5000); // Poll every 5s in live mode
    }
    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, [liveMode, land?.id, sensorData?.soil_moisture]);

  async function pollSensor(silent = false) {
    if (!silent) setReading(true);

    const delay = 600 + Math.random() * 600;
    await new Promise((r) => setTimeout(r, delay));

    const result = simulateSensorReading(land, sensorData?.soil_moisture ?? null);
    setSensorData(result);
    setReadCount((c) => c + 1);
    onMoistureRead(result.soil_moisture);

    if (!silent) setReading(false);
  }

  function handleToggleLive() {
    if (liveMode) {
      setLiveMode(false);
    } else {
      setLiveMode(true);
      pollSensor(true);
    }
  }

  const signal = sensorData ? getSignalQuality(sensorData.signal_rssi) : null;
  const battery = sensorData ? getBatteryStatus(sensorData.battery_pct) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">

      {/* Header Row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${sensorData ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />

          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-extrabold text-slate-800">{node.nodeId}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {t('simulatedIot')}
            </span>
          </div>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Reading Row */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
              {t('soilMoistureReading')} • {node.probeDepthCm}cm {t('rootDepth')}
            </div>
            <div className="flex items-baseline gap-1.5">
              {sensorData ? (
                <>
                  <span className="text-3xl font-black text-slate-900">
                    {sensorData.soil_moisture}
                  </span>
                  <span className="text-sm font-bold text-slate-500">%</span>
                </>
              ) : (
                <span className="text-sm text-slate-400 font-medium">
                  {t('noReadingYet')}
                </span>
              )}
            </div>
            {sensorData && (
              <div className="text-[11px] text-slate-400 mt-0.5">
                {lang === 'hi' ? 'जांच संख्या' : 'Read #'} {readCount} • {new Date(sensorData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Live Toggle */}
            <button
              onClick={handleToggleLive}
              className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                liveMode
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title={liveMode ? 'Stop live telemetry stream' : 'Start live sensor polling every 5s'}
            >
              <Activity className={`w-3.5 h-3.5 ${liveMode ? 'animate-pulse' : ''}`} />
              {liveMode ? t('liveOn') : t('live')}
            </button>

            {/* Manual Poll */}
            <button
              onClick={() => pollSensor(false)}
              disabled={reading}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
              title="Poll sensor for a fresh moisture reading"
            >
              {reading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Radio className="w-3.5 h-3.5" />
              )}
              {reading ? t('polling') : t('pollSensor')}
            </button>
          </div>
        </div>

        {/* Status Pills Row */}
        {sensorData && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
            {/* Battery */}
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 ${battery.color}`}>
              {battery.icon} {lang === 'hi' ? 'बैटरी' : 'Battery'} {battery.label}
            </span>

            {/* Signal */}
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 ${signal.color}`}>
              <Wifi className="w-3 h-3" />
              {signal.label} ({sensorData.signal_rssi} dBm)
            </span>

            {/* Signal Type */}
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              📡 {sensorData.signal_type}
            </span>

            {/* Simulated Badge */}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 ml-auto">
              {t('hackathonSimMode')}
            </span>
          </div>
        )}
      </div>

      {/* Expanded Technical Details */}
      {expanded && sensorData && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {t('rawTelemetry')}
          </div>
          <pre className="bg-slate-900 text-emerald-400 text-[11px] rounded-xl p-3 overflow-x-auto font-mono leading-relaxed select-all">
{JSON.stringify({
  sensor_id: sensorData.sensor_id,
  land_id: sensorData.land_id,
  soil_moisture: sensorData.soil_moisture,
  probe_depth_cm: sensorData.probe_depth_cm,
  battery_pct: sensorData.battery_pct,
  signal_rssi: sensorData.signal_rssi,
  signal_type: sensorData.signal_type,
  status: sensorData.status,
  simulated: sensorData.simulated,
  timestamp: sensorData.timestamp,
}, null, 2)}
          </pre>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            🔌 {t('futureHardwareNote')}
          </p>
        </div>
      )}

    </div>
  );
}
