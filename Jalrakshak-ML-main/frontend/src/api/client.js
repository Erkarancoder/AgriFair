import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Health check to verify backend status.
 */
export async function checkBackendHealth() {
  try {
    const response = await apiClient.get('/health');
    return response.data?.status === 'healthy';
  } catch {
    return false;
  }
}

/**
 * Fetch live weather and 24h rainfall forecast for given coordinates.
 * Fetches rich Google Weather style data from Open-Meteo with fallback to FastAPI.
 */
export async function fetchLiveWeather(latitude, longitude) {
  try {
    const res = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude,
        longitude,
        current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
        hourly: 'temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
        forecast_days: 8,
        timezone: 'auto',
      },
      timeout: 10000,
    });
    const d = res.data;
    const current = d.current || {};
    const hourly = d.hourly || {};
    const daily = d.daily || {};
    const times = hourly.time || [];
    const precip = (hourly.precipitation || []).map(Number);
    const temps = (hourly.temperature_2m || []).map(Number);
    const precipProb = (hourly.precipitation_probability || []).map(Number);
    const windSpeed = (hourly.wind_speed_10m || []).map(Number);
    const weatherCodes = (hourly.weather_code || []).map(Number);

    const nowIso = new Date().toISOString().slice(0, 13);
    let startIdx = times.findIndex((t) => t >= nowIso);
    if (startIdx === -1) startIdx = 0;

    const selTimes = times.slice(startIdx, startIdx + 24);
    const selPrecip = precip.slice(startIdx, startIdx + 24);
    const selTemps = temps.slice(startIdx, startIdx + 24);
    const selPrecipProb = precipProb.slice(startIdx, startIdx + 24);
    const selWind = windSpeed.slice(startIdx, startIdx + 24);
    const selCodes = weatherCodes.slice(startIdx, startIdx + 24);

    const dailyTimes = daily.time || [];
    const dailyForecast = dailyTimes.map((dayStr, i) => {
      const dateObj = new Date(dayStr + 'T00:00:00');
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      return {
        date: dayStr,
        dayName: i === 0 ? 'Today' : dayName,
        weather_code: daily.weather_code?.[i] ?? 0,
        temp_max: Math.round(daily.temperature_2m_max?.[i] ?? 30),
        temp_min: Math.round(daily.temperature_2m_min?.[i] ?? 20),
        precipitation_probability_max: daily.precipitation_probability_max?.[i] ?? 0,
        precipitation_sum: daily.precipitation_sum?.[i] ?? 0,
      };
    });

    return {
      latitude: d.latitude,
      longitude: d.longitude,
      timezone: d.timezone || 'Asia/Kolkata',
      temperature_c: Math.round(current.temperature_2m ?? 28.0),
      humidity_percent: Math.round(current.relative_humidity_2m ?? 50.0),
      wind_speed_kmh: Math.round(current.wind_speed_10m ?? 5.0),
      weather_code: current.weather_code ?? 0,
      precipitation_mm: current.precipitation ?? 0,
      precipitation_probability: selPrecipProb[0] ?? 10,
      forecast_hours: selPrecip.length,
      rainfall_next_24h_mm: Number(selPrecip.reduce((a, b) => a + b, 0).toFixed(2)),
      hourly_forecast: selTimes.map((t, i) => ({
        time: t,
        precipitation_mm: selPrecip[i] ?? 0,
        precipitation_probability: selPrecipProb[i] ?? 0,
        temperature_c: Math.round(selTemps[i] ?? 28),
        wind_speed_kmh: Math.round(selWind[i] ?? 5),
        weather_code: selCodes[i] ?? 0,
      })),
      daily_forecast: dailyForecast,
    };
  } catch {
    // Fallback to FastAPI backend endpoint
    const response = await apiClient.get('/weather', {
      params: { latitude, longitude },
    });
    return response.data;
  }
}

/**
 * Request ML irrigation prediction & live weather forecast.
 * @param {Object} payload
 * @param {number} payload.Soil_Moisture - percentage 0-100
 * @param {string} payload.Crop_Type - Rice, Wheat, Maize, Sugarcane, Potato, Cotton
 * @param {string} payload.Crop_Growth_Stage - Sowing, Vegetative, Flowering, Harvest
 * @param {string} payload.Soil_Type - Sandy, Silt, Loamy, Clay
 * @param {number} payload.latitude - e.g. 26.93
 * @param {number} payload.longitude - e.g. 81.18
 */
export async function requestIrrigationPrediction(payload) {
  try {
    const response = await apiClient.post('/predict', payload);
    return response.data;
  } catch (error) {
    if (error.response) {
      const detail = error.response.data?.detail;
      const message =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
          ? detail.map((d) => d.msg || d.message).join(', ')
          : 'Failed to process prediction.';
      throw new Error(message);
    } else if (error.request) {
      throw new Error(
        'Backend server unreachable. Make sure the FastAPI backend is running at ' + API_BASE_URL
      );
    } else {
      throw new Error(error.message || 'An unexpected error occurred.');
    }
  }
}
