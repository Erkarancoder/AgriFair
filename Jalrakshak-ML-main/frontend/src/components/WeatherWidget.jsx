import React from 'react';
import { CloudRain, Sun, Droplets, Thermometer, Clock } from 'lucide-react';

export default function WeatherWidget({ weather, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs animate-pulse space-y-4">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-20 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 text-center text-slate-500">
        <CloudRain className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-medium">Weather forecast will appear once you run an irrigation check.</p>
        <p className="text-xs text-slate-400 mt-1">Live data from Open-Meteo satellite forecast</p>
      </div>
    );
  }

  const {
    temperature_c,
    humidity_percent,
    rainfall_next_24h_mm = 0,
    timezone,
    hourly_forecast = [],
  } = weather;

  const maxPrecipitation = Math.max(
    1,
    ...hourly_forecast.map((h) => Number(h.precipitation_mm) || 0)
  );

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Weather & 24h Rain Radar</h3>
            <p className="text-[11px] text-slate-500">{timezone || 'Local Field Location'}</p>
          </div>
        </div>
        
        {rainfall_next_24h_mm > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full">
            <CloudRain className="w-3.5 h-3.5" />
            Rain Expected ({rainfall_next_24h_mm} mm)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
            <Sun className="w-3.5 h-3.5" />
            No Rain (Dry 24h)
          </span>
        )}
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100/80">
          <div className="flex items-center gap-1 text-amber-700 text-xs font-semibold">
            <Thermometer className="w-3.5 h-3.5" />
            Temp
          </div>
          <div className="text-xl font-extrabold text-amber-950 mt-0.5">
            {temperature_c}°C
          </div>
          <div className="text-[10px] text-amber-700/80">Live field reading</div>
        </div>

        <div className="p-3 rounded-xl bg-cyan-50/60 border border-cyan-100/80">
          <div className="flex items-center gap-1 text-cyan-700 text-xs font-semibold">
            <Droplets className="w-3.5 h-3.5" />
            Humidity
          </div>
          <div className="text-xl font-extrabold text-cyan-950 mt-0.5">
            {humidity_percent}%
          </div>
          <div className="text-[10px] text-cyan-700/80">Relative air moisture</div>
        </div>

        <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100/80">
          <div className="flex items-center gap-1 text-sky-700 text-xs font-semibold">
            <CloudRain className="w-3.5 h-3.5" />
            24h Rain
          </div>
          <div className="text-xl font-extrabold text-sky-950 mt-0.5">
            {rainfall_next_24h_mm} <span className="text-xs font-normal">mm</span>
          </div>
          <div className="text-[10px] text-sky-700/80">Next 24 hours total</div>
        </div>
      </div>

      {/* Hourly Timeline */}
      {hourly_forecast.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Hourly Precipitation (Next 24h)
            </span>
            <span className="text-[11px] text-slate-400">Scroll ➔</span>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            {hourly_forecast.map((hour, idx) => {
              const timeString = hour.time ? hour.time.split('T')[1] || hour.time : `${idx}:00`;
              const rain = Number(hour.precipitation_mm) || 0;
              const barHeightPct = Math.min(100, Math.max(12, Math.round((rain / maxPrecipitation) * 100)));

              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-end p-1.5 rounded-lg border min-w-[44px] transition-all ${
                    rain > 0
                      ? 'bg-sky-50 border-sky-200 text-sky-900 font-bold'
                      : 'bg-slate-50/60 border-slate-100 text-slate-500'
                  }`}
                >
                  <div className="h-10 w-full flex items-end justify-center mb-1">
                    <div
                      style={{ height: `${barHeightPct}%` }}
                      className={`w-3 rounded-t-xs transition-all ${
                        rain > 0 ? 'bg-sky-500' : 'bg-slate-200'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] leading-tight font-semibold">
                    {rain > 0 ? `${rain}m` : '0'}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">{timeString}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
