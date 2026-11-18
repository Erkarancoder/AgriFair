import React, { useState, useEffect, useRef } from 'react';
import {
  CloudRain,
  Sun,
  Droplets,
  Thermometer,
  Wind,
  RefreshCw,
  MapPin,
  Clock,
  AlertCircle,
  Search,
  Loader2,
  Compass,
  ShieldAlert,
  X,
  Cloud,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
} from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { fetchLiveWeather } from '../api/client';

// ── All Indian States & UTs with major cities ────────────────────────────────
const INDIA_REGIONS = [
  // ── North India ──────────────────────────────────────────────────────────
  {
    label: 'Uttar Pradesh',
    cities: [
      { name: 'Barabanki',    lat: 26.93, lon: 81.18 },
      { name: 'Lucknow',      lat: 26.85, lon: 80.95 },
      { name: 'Kanpur',       lat: 26.46, lon: 80.33 },
      { name: 'Varanasi',     lat: 25.32, lon: 83.00 },
      { name: 'Agra',         lat: 27.18, lon: 78.01 },
      { name: 'Prayagraj',    lat: 25.44, lon: 81.84 },
      { name: 'Meerut',       lat: 28.98, lon: 77.71 },
      { name: 'Gorakhpur',    lat: 26.76, lon: 83.37 },
      { name: 'Bareilly',     lat: 28.35, lon: 79.43 },
      { name: 'Aligarh',      lat: 27.88, lon: 78.08 },
      { name: 'Mathura',      lat: 27.49, lon: 77.68 },
      { name: 'Moradabad',    lat: 28.84, lon: 78.77 },
    ],
  },
  {
    label: 'Punjab',
    cities: [
      { name: 'Ludhiana',     lat: 30.90, lon: 75.85 },
      { name: 'Amritsar',     lat: 31.63, lon: 74.87 },
      { name: 'Patiala',      lat: 30.34, lon: 76.39 },
      { name: 'Jalandhar',    lat: 31.33, lon: 75.58 },
      { name: 'Bathinda',     lat: 30.21, lon: 74.95 },
      { name: 'Pathankot',    lat: 32.27, lon: 75.65 },
      { name: 'Mohali',       lat: 30.70, lon: 76.72 },
      { name: 'Ferozepur',    lat: 30.93, lon: 74.62 },
    ],
  },
  {
    label: 'Haryana',
    cities: [
      { name: 'Gurugram',     lat: 28.46, lon: 77.03 },
      { name: 'Faridabad',    lat: 28.41, lon: 77.31 },
      { name: 'Karnal',       lat: 29.69, lon: 76.99 },
      { name: 'Hisar',        lat: 29.15, lon: 75.72 },
      { name: 'Rohtak',       lat: 28.89, lon: 76.60 },
      { name: 'Panipat',      lat: 29.39, lon: 76.97 },
      { name: 'Ambala',       lat: 30.38, lon: 76.78 },
      { name: 'Sirsa',        lat: 29.54, lon: 75.03 },
    ],
  },
  {
    label: 'Himachal Pradesh',
    cities: [
      { name: 'Shimla',       lat: 31.10, lon: 77.17 },
      { name: 'Dharamsala',   lat: 32.22, lon: 76.32 },
      { name: 'Manali',       lat: 32.24, lon: 77.19 },
      { name: 'Solan',        lat: 30.91, lon: 77.10 },
      { name: 'Mandi',        lat: 31.71, lon: 76.93 },
      { name: 'Kullu',        lat: 31.96, lon: 77.10 },
    ],
  },
  {
    label: 'Uttarakhand',
    cities: [
      { name: 'Dehradun',     lat: 30.32, lon: 78.03 },
      { name: 'Haridwar',     lat: 29.94, lon: 78.16 },
      { name: 'Rishikesh',    lat: 30.09, lon: 78.27 },
      { name: 'Nainital',     lat: 29.38, lon: 79.46 },
      { name: 'Haldwani',     lat: 29.22, lon: 79.52 },
      { name: 'Rudrapur',     lat: 28.97, lon: 79.39 },
    ],
  },
  {
    label: 'Delhi (NCT)',
    cities: [
      { name: 'New Delhi',    lat: 28.61, lon: 77.20 },
      { name: 'North Delhi',  lat: 28.72, lon: 77.20 },
      { name: 'South Delhi',  lat: 28.50, lon: 77.25 },
      { name: 'Dwarka',       lat: 28.59, lon: 77.04 },
      { name: 'Noida',        lat: 28.54, lon: 77.39 },
      { name: 'Ghaziabad',    lat: 28.67, lon: 77.45 },
    ],
  },
  {
    label: 'Jammu & Kashmir',
    cities: [
      { name: 'Srinagar',     lat: 34.08, lon: 74.80 },
      { name: 'Jammu',        lat: 32.73, lon: 74.87 },
      { name: 'Anantnag',     lat: 33.73, lon: 75.15 },
      { name: 'Baramulla',    lat: 34.20, lon: 74.36 },
      { name: 'Udhampur',     lat: 32.92, lon: 75.14 },
      { name: 'Katra',        lat: 32.99, lon: 74.93 },
    ],
  },
  {
    label: 'Ladakh',
    cities: [
      { name: 'Leh',          lat: 34.16, lon: 77.58 },
      { name: 'Kargil',       lat: 34.55, lon: 76.13 },
      { name: 'Nubra',        lat: 34.70, lon: 77.54 },
      { name: 'Zanskar',      lat: 33.47, lon: 76.53 },
    ],
  },

  // ── East India ───────────────────────────────────────────────────────────
  {
    label: 'West Bengal',
    cities: [
      { name: 'Kolkata',      lat: 22.57, lon: 88.36 },
      { name: 'Howrah',       lat: 22.59, lon: 88.31 },
      { name: 'Durgapur',     lat: 23.48, lon: 87.32 },
      { name: 'Asansol',      lat: 23.68, lon: 86.98 },
      { name: 'Siliguri',     lat: 26.72, lon: 88.43 },
      { name: 'Murshidabad',  lat: 24.18, lon: 88.27 },
      { name: 'Bardhaman',    lat: 23.23, lon: 87.86 },
      { name: 'Darjeeling',   lat: 27.04, lon: 88.27 },
    ],
  },
  {
    label: 'Bihar',
    cities: [
      { name: 'Patna',        lat: 25.60, lon: 85.12 },
      { name: 'Gaya',         lat: 24.80, lon: 85.00 },
      { name: 'Muzaffarpur',  lat: 26.12, lon: 85.39 },
      { name: 'Bhagalpur',    lat: 25.25, lon: 87.00 },
      { name: 'Darbhanga',    lat: 26.15, lon: 85.90 },
      { name: 'Arrah',        lat: 25.56, lon: 84.66 },
      { name: 'Begusarai',    lat: 25.42, lon: 86.13 },
    ],
  },
  {
    label: 'Jharkhand',
    cities: [
      { name: 'Ranchi',       lat: 23.34, lon: 85.31 },
      { name: 'Jamshedpur',   lat: 22.80, lon: 86.18 },
      { name: 'Dhanbad',      lat: 23.80, lon: 86.43 },
      { name: 'Bokaro',       lat: 23.67, lon: 86.15 },
      { name: 'Hazaribagh',   lat: 23.99, lon: 85.36 },
      { name: 'Deoghar',      lat: 24.48, lon: 86.69 },
    ],
  },
  {
    label: 'Odisha',
    cities: [
      { name: 'Bhubaneswar',  lat: 20.30, lon: 85.82 },
      { name: 'Cuttack',      lat: 20.46, lon: 85.88 },
      { name: 'Rourkela',     lat: 22.26, lon: 84.86 },
      { name: 'Puri',         lat: 19.81, lon: 85.83 },
      { name: 'Sambalpur',    lat: 21.47, lon: 83.97 },
      { name: 'Berhampur',    lat: 19.31, lon: 84.79 },
    ],
  },
  {
    label: 'Assam',
    cities: [
      { name: 'Guwahati',     lat: 26.14, lon: 91.74 },
      { name: 'Dibrugarh',    lat: 27.48, lon: 95.00 },
      { name: 'Silchar',      lat: 24.82, lon: 92.80 },
      { name: 'Jorhat',       lat: 26.75, lon: 94.21 },
      { name: 'Nagaon',       lat: 26.35, lon: 92.68 },
      { name: 'Tezpur',       lat: 26.63, lon: 92.80 },
    ],
  },
  {
    label: 'Northeast',
    cities: [
      { name: 'Imphal',       lat: 24.81, lon: 93.95 },
      { name: 'Shillong',     lat: 25.58, lon: 91.88 },
      { name: 'Aizawl',       lat: 23.73, lon: 92.72 },
      { name: 'Kohima',       lat: 25.67, lon: 94.11 },
      { name: 'Agartala',     lat: 23.84, lon: 91.28 },
      { name: 'Itanagar',     lat: 27.10, lon: 93.62 },
      { name: 'Gangtok',      lat: 27.33, lon: 88.62 },
    ],
  },

  // ── West India ───────────────────────────────────────────────────────────
  {
    label: 'Maharashtra',
    cities: [
      { name: 'Mumbai',       lat: 19.07, lon: 72.88 },
      { name: 'Pune',         lat: 18.52, lon: 73.86 },
      { name: 'Nagpur',       lat: 21.15, lon: 79.09 },
      { name: 'Nashik',       lat: 20.00, lon: 73.78 },
      { name: 'Aurangabad',   lat: 19.88, lon: 75.34 },
      { name: 'Solapur',      lat: 17.68, lon: 75.91 },
      { name: 'Kolhapur',     lat: 16.70, lon: 74.24 },
      { name: 'Amravati',     lat: 20.93, lon: 77.75 },
    ],
  },
  {
    label: 'Gujarat',
    cities: [
      { name: 'Ahmedabad',    lat: 23.03, lon: 72.59 },
      { name: 'Surat',        lat: 21.17, lon: 72.83 },
      { name: 'Vadodara',     lat: 22.31, lon: 73.18 },
      { name: 'Rajkot',       lat: 22.30, lon: 70.80 },
      { name: 'Gandhinagar',  lat: 23.22, lon: 72.64 },
      { name: 'Bhavnagar',    lat: 21.77, lon: 72.15 },
      { name: 'Junagadh',     lat: 21.52, lon: 70.46 },
      { name: 'Anand',        lat: 22.56, lon: 72.95 },
    ],
  },
  {
    label: 'Rajasthan',
    cities: [
      { name: 'Jaipur',       lat: 26.91, lon: 75.79 },
      { name: 'Jodhpur',      lat: 26.29, lon: 73.02 },
      { name: 'Udaipur',      lat: 24.58, lon: 73.69 },
      { name: 'Kota',         lat: 25.18, lon: 75.83 },
      { name: 'Bikaner',      lat: 28.02, lon: 73.31 },
      { name: 'Ajmer',        lat: 26.45, lon: 74.64 },
      { name: 'Alwar',        lat: 27.56, lon: 76.60 },
      { name: 'Bharatpur',    lat: 27.22, lon: 77.49 },
    ],
  },
  {
    label: 'Madhya Pradesh',
    cities: [
      { name: 'Bhopal',       lat: 23.26, lon: 77.41 },
      { name: 'Indore',       lat: 22.72, lon: 75.86 },
      { name: 'Gwalior',      lat: 26.22, lon: 78.18 },
      { name: 'Jabalpur',     lat: 23.16, lon: 79.94 },
      { name: 'Ujjain',       lat: 23.18, lon: 75.77 },
      { name: 'Sagar',        lat: 23.84, lon: 78.74 },
      { name: 'Rewa',         lat: 24.53, lon: 81.30 },
      { name: 'Satna',        lat: 24.60, lon: 80.83 },
    ],
  },
  {
    label: 'Goa',
    cities: [
      { name: 'Panaji',       lat: 15.50, lon: 73.83 },
      { name: 'Margao',       lat: 15.27, lon: 73.96 },
      { name: 'Vasco',        lat: 15.39, lon: 73.81 },
      { name: 'Mapusa',       lat: 15.59, lon: 73.80 },
    ],
  },
  {
    label: 'Chhattisgarh',
    cities: [
      { name: 'Raipur',       lat: 21.25, lon: 81.63 },
      { name: 'Bhilai',       lat: 21.21, lon: 81.38 },
      { name: 'Bilaspur',     lat: 22.08, lon: 82.15 },
      { name: 'Durg',         lat: 21.19, lon: 81.28 },
      { name: 'Korba',        lat: 22.35, lon: 82.68 },
      { name: 'Jagdalpur',    lat: 19.07, lon: 82.03 },
    ],
  },

  // ── South India ──────────────────────────────────────────────────────────
  {
    label: 'Karnataka',
    cities: [
      { name: 'Bengaluru',    lat: 12.97, lon: 77.59 },
      { name: 'Mysuru',       lat: 12.30, lon: 76.65 },
      { name: 'Hubli',        lat: 15.36, lon: 75.12 },
      { name: 'Mangaluru',    lat: 12.87, lon: 74.88 },
      { name: 'Belagavi',     lat: 15.85, lon: 74.50 },
      { name: 'Kalaburagi',   lat: 17.33, lon: 76.82 },
      { name: 'Davanagere',   lat: 14.47, lon: 75.92 },
      { name: 'Shivamogga',   lat: 13.93, lon: 75.57 },
    ],
  },
  {
    label: 'Tamil Nadu',
    cities: [
      { name: 'Chennai',      lat: 13.08, lon: 80.27 },
      { name: 'Coimbatore',   lat: 11.02, lon: 76.97 },
      { name: 'Madurai',      lat: 9.93,  lon: 78.12 },
      { name: 'Tiruchirappalli', lat: 10.79, lon: 78.70 },
      { name: 'Salem',        lat: 11.65, lon: 78.16 },
      { name: 'Tirunelveli',  lat: 8.73,  lon: 77.70 },
      { name: 'Erode',        lat: 11.34, lon: 77.72 },
      { name: 'Vellore',      lat: 12.92, lon: 79.13 },
    ],
  },
  {
    label: 'Andhra Pradesh',
    cities: [
      { name: 'Visakhapatnam',lat: 17.69, lon: 83.22 },
      { name: 'Vijayawada',   lat: 16.51, lon: 80.62 },
      { name: 'Guntur',       lat: 16.31, lon: 80.44 },
      { name: 'Tirupati',     lat: 13.63, lon: 79.42 },
      { name: 'Kakinada',     lat: 16.98, lon: 82.24 },
      { name: 'Nellore',      lat: 14.44, lon: 79.99 },
      { name: 'Kurnool',      lat: 15.83, lon: 78.04 },
    ],
  },
  {
    label: 'Telangana',
    cities: [
      { name: 'Hyderabad',    lat: 17.38, lon: 78.47 },
      { name: 'Warangal',     lat: 17.98, lon: 79.60 },
      { name: 'Nizamabad',    lat: 18.67, lon: 78.09 },
      { name: 'Karimnagar',   lat: 18.44, lon: 79.13 },
      { name: 'Khammam',      lat: 17.25, lon: 80.15 },
      { name: 'Mahbubnagar',  lat: 16.74, lon: 77.99 },
    ],
  },
  {
    label: 'Kerala',
    cities: [
      { name: 'Thiruvananthapuram', lat: 8.52, lon: 76.94 },
      { name: 'Kochi',        lat: 9.93,  lon: 76.27 },
      { name: 'Kozhikode',    lat: 11.25, lon: 75.78 },
      { name: 'Thrissur',     lat: 10.52, lon: 76.21 },
      { name: 'Kollam',       lat: 8.89,  lon: 76.59 },
      { name: 'Palakkad',     lat: 10.77, lon: 76.65 },
      { name: 'Malappuram',   lat: 11.07, lon: 76.07 },
      { name: 'Kannur',       lat: 11.87, lon: 75.37 },
    ],
  },

  // ── Union Territories ────────────────────────────────────────────────────
  {
    label: 'Chandigarh & UT',
    cities: [
      { name: 'Chandigarh',   lat: 30.73, lon: 76.78 },
      { name: 'Puducherry',   lat: 11.94, lon: 79.83 },
      { name: 'Port Blair',   lat: 11.62, lon: 92.73 },
      { name: 'Silvassa',     lat: 20.27, lon: 73.01 },
      { name: 'Daman',        lat: 20.42, lon: 72.84 },
      { name: 'Kavaratti',    lat: 10.57, lon: 72.64 },
    ],
  },
];

// ── Geocoding via Open-Meteo (free, no API key) ──────────────────────────────
async function geocodeCity(query) {
  const res = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
    params: { name: query, count: 6, language: 'en', format: 'json' },
    timeout: 8000,
  });
  return (res.data.results || []).filter(
    (r) => r.country === 'India' || r.country_code === 'IN'
  );
}

// ── Helper: WMO Weather Code to Description & Icon Type ──────────────────────
function getWeatherMeta(code, lang = 'en') {
  const isHi = lang === 'hi';
  if (code === 0) return { label: isHi ? 'साफ आसमान' : 'Clear Sky', type: 'sun' };
  if (code === 1 || code === 2) return { label: isHi ? 'आंशिक बादल' : 'Partly Cloudy', type: 'partly-cloudy' };
  if (code === 3) return { label: isHi ? 'बादल छाए हैं' : 'Cloudy', type: 'cloudy' };
  if (code === 45 || code === 48) return { label: isHi ? 'कोहरा / धुंध' : 'Foggy', type: 'fog' };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: isHi ? 'हल्की बूंदाबांदी' : 'Drizzle', type: 'drizzle' };
  if ([61, 63, 65, 80, 81, 82].includes(code)) return { label: isHi ? 'बारिश' : 'Rain', type: 'rain' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: isHi ? 'बर्फबारी' : 'Snow', type: 'snow' };
  if ([95, 96, 99].includes(code)) return { label: isHi ? 'आंधी-तूफान' : 'Thunderstorm', type: 'thunderstorm' };
  return { label: isHi ? 'बादल छाए हैं' : 'Cloudy', type: 'cloudy' };
}

// ── Google Weather Styled Icon Component ─────────────────────────────────────
function GoogleWeatherIcon({ type, className = 'w-10 h-10' }) {
  if (type === 'sun') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-lg shadow-amber-500/50" />
      </div>
    );
  }
  if (type === 'partly-cloudy') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute top-0 right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-md shadow-amber-400/40" />
        <div className="relative mt-2 w-8 h-5 bg-gradient-to-t from-slate-400 to-slate-200 rounded-full shadow-md shadow-slate-900/30">
          <div className="absolute -top-2 left-1 w-4 h-4 bg-slate-300 rounded-full" />
          <div className="absolute -top-3 left-3 w-5 h-5 bg-slate-200 rounded-full" />
        </div>
      </div>
    );
  }
  if (type === 'rain') {
    return (
      <div className={`relative flex flex-col items-center justify-center ${className}`}>
        <div className="relative w-8 h-5 bg-gradient-to-t from-slate-400 to-slate-200 rounded-full shadow-md shadow-slate-900/30">
          <div className="absolute -top-2 left-1 w-4 h-4 bg-slate-300 rounded-full" />
          <div className="absolute -top-3 left-3 w-5 h-5 bg-slate-200 rounded-full" />
        </div>
        <div className="flex gap-1 mt-1">
          <span className="w-1 h-2 bg-sky-400 rounded-full animate-bounce" />
          <span className="w-1 h-2 bg-sky-400 rounded-full animate-bounce delay-100" />
        </div>
      </div>
    );
  }
  if (type === 'thunderstorm') {
    return (
      <div className={`relative flex flex-col items-center justify-center ${className}`}>
        <div className="relative w-8 h-5 bg-gradient-to-t from-slate-600 to-slate-400 rounded-full shadow-md shadow-slate-900/40">
          <div className="absolute -top-2 left-1 w-4 h-4 bg-slate-500 rounded-full" />
          <div className="absolute -top-3 left-3 w-5 h-5 bg-slate-400 rounded-full" />
        </div>
        <CloudLightning className="w-4 h-4 text-amber-400 -mt-1 drop-shadow" />
      </div>
    );
  }
  // Default: Cloudy
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="relative w-9 h-5 bg-gradient-to-t from-slate-400 to-slate-200 rounded-full shadow-md shadow-slate-900/30">
        <div className="absolute -top-2 left-1.5 w-4 h-4 bg-slate-300 rounded-full" />
        <div className="absolute -top-3 left-3.5 w-5 h-5 bg-slate-200 rounded-full" />
      </div>
    </div>
  );
}

export default function WeatherPage() {
  const { lang, t } = useLanguage();
  const [activeCity, setActiveCity] = useState({
    name: 'Barabanki, UP',
    lat: 26.93,
    lon: 81.18,
  });
  const [activeRegion, setActiveRegion] = useState('Uttar Pradesh');

  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  // Google Weather Tabs & Unit State
  const [activeTab, setActiveTab] = useState('Precipitation'); // 'Temperature' | 'Precipitation' | 'Wind'
  const [unit, setUnit] = useState('C'); // 'C' | 'F'
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Load weather whenever activeCity changes
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchLiveWeather(activeCity.lat, activeCity.lon);
        if (isMounted) {
          setWeatherData(data);
          setSelectedDayIdx(0);
          setLastUpdated(
            new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          );
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to fetch weather.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [activeCity.lat, activeCity.lon]);

  // Debounced search-as-you-type
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchError('');
      try {
        const results = await geocodeCity(searchQuery.trim());
        setSearchResults(results);
        if (results.length === 0) setSearchError('No Indian city found. Try a different name.');
      } catch {
        setSearchError('Search failed. Check your internet connection.');
      } finally {
        setSearching(false);
      }
    }, 500);
  }, [searchQuery]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults([]);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectCity(city) {
    setActiveCity({ name: city.name, lat: city.lat, lon: city.lon });
    setSearchResults([]);
    setSearchQuery('');
  }

  function selectSearchResult(r) {
    const cityName = [r.name, r.admin1, r.country_code].filter(Boolean).join(', ');
    setActiveCity({ name: cityName, lat: r.latitude, lon: r.longitude });
    setSearchResults([]);
    setSearchQuery('');
    for (const region of INDIA_REGIONS) {
      const match = region.cities.find(
        (c) => c.name.toLowerCase() === r.name.toLowerCase()
      );
      if (match) { setActiveRegion(region.label); break; }
    }
  }

  // Convert Temperature to active unit
  function formatTemp(celsiusVal) {
    if (celsiusVal === undefined || celsiusVal === null || isNaN(celsiusVal)) return '--';
    if (unit === 'F') {
      return Math.round((celsiusVal * 9) / 5 + 32);
    }
    return Math.round(celsiusVal);
  }

  // Weather data mapping
  const currentTempC = weatherData?.temperature_c ?? 31;
  const currentHumidity = weatherData?.humidity_percent ?? 77;
  const currentWind = weatherData?.wind_speed_kmh ?? 5;
  const currentPrecipProb = weatherData?.precipitation_probability ?? 10;
  const currentCode = weatherData?.weather_code ?? 3;
  const currentMeta = getWeatherMeta(currentCode, lang);

  const dailyList = weatherData?.daily_forecast || [
    { dayName: 'Wed', weather_code: 3, temp_max: 31, temp_min: 21, precipitation_probability_max: 10 },
    { dayName: 'Thu', weather_code: 3, temp_max: 29, temp_min: 22, precipitation_probability_max: 10 },
    { dayName: 'Fri', weather_code: 61, temp_max: 24, temp_min: 21, precipitation_probability_max: 60 },
    { dayName: 'Sat', weather_code: 3, temp_max: 24, temp_min: 21, precipitation_probability_max: 15 },
    { dayName: 'Sun', weather_code: 1, temp_max: 27, temp_min: 21, precipitation_probability_max: 5 },
    { dayName: 'Mon', weather_code: 0, temp_max: 29, temp_min: 19, precipitation_probability_max: 0 },
    { dayName: 'Tue', weather_code: 0, temp_max: 29, temp_min: 18, precipitation_probability_max: 0 },
    { dayName: 'Wed', weather_code: 0, temp_max: 29, temp_min: 17, precipitation_probability_max: 0 },
  ];

  // Selected day context
  const hindiDaysFull = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const hindiDaysShort = { Sun: 'रवि', Mon: 'सोम', Tue: 'मंगल', Wed: 'बुध', Thu: 'गुरु', Fri: 'शुक्र', Sat: 'शनि', Today: 'आज' };

  const selectedDay = dailyList[selectedDayIdx] || dailyList[0];
  const dayNameFull = selectedDay?.date
    ? (lang === 'hi'
        ? hindiDaysFull[new Date(selectedDay.date + 'T00:00:00').getDay()]
        : new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }))
    : (lang === 'hi' ? 'बुधवार' : 'Wednesday');

  // Sample 8 points across next 24 hours (roughly every 3 hours like Google: 12am, 3am, 6am, 9am, 12pm, 3pm, 6pm, 9pm)
  const fullHourly = weatherData?.hourly_forecast || [];
  const sampledHourly = [];
  if (fullHourly.length >= 8) {
    for (let i = 0; i < 24; i += 3) {
      if (fullHourly[i]) sampledHourly.push(fullHourly[i]);
    }
  } else {
    // Fallback stub matching Google weather screenshot
    const defaultLabels = ['12 am', '3 am', '6 am', '9 am', '12 pm', '3 pm', '6 pm', '9 pm'];
    defaultLabels.forEach((label) => {
      sampledHourly.push({
        timeLabel: label,
        precipitation_probability: 10,
        temperature_c: 31,
        wind_speed_kmh: 5,
      });
    });
  }

  // Format time labels (e.g. "12 am", "3 pm")
  const hourlyChartData = sampledHourly.map((item, idx) => {
    let label = item.timeLabel;
    if (!label && item.time) {
      const d = new Date(item.time);
      const hours = d.getHours();
      const ampm = hours >= 12 ? 'pm' : 'am';
      const formattedHour = hours % 12 === 0 ? 12 : hours % 12;
      label = `${formattedHour} ${ampm}`;
    }
    return {
      label: label || `${idx * 3}:00`,
      temp: formatTemp(item.temperature_c ?? currentTempC),
      precip: item.precipitation_probability ?? 10,
      wind: item.wind_speed_kmh ?? currentWind,
    };
  });

  const currentRegionCities =
    INDIA_REGIONS.find((r) => r.label === activeRegion)?.cities || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* ── Top Bar: Search & Region Selector ─────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5" /> {t('weatherDashboardBadge')}
              </span>
              <span className="text-xs text-slate-500 font-medium">Google Weather Style Dashboard</span>
              {lastUpdated && (
                <span className="text-xs text-slate-400">• {lang === 'hi' ? 'अपडेट:' : 'Updated'} {lastUpdated}</span>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <span>{t('showingForecastFor')}</span>
              <span className="text-emerald-700 underline decoration-emerald-400 decoration-2 underline-offset-4">
                {activeCity.name}
              </span>
            </h1>
          </div>

          <button
            onClick={() => setActiveCity((p) => ({ ...p }))}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer self-start md:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            {t('refresh')}
          </button>
        </div>

        {/* ── Search Bar ─────────────────────────────────────────────────── */}
        <div className="relative" ref={searchRef}>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-400 transition-all">
            {searching
              ? <Loader2 className="w-4 h-4 text-emerald-500 shrink-0 animate-spin" />
              : <Search className="w-4 h-4 text-slate-400 shrink-0" />}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchCityPlaceholder')}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {(searchResults.length > 0 || searchError) && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-xl border border-slate-200 shadow-xl z-40 overflow-hidden">
              {searchError && (
                <div className="px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  {searchError}
                </div>
              )}
              {searchResults.map((r) => (
                <button
                  key={`${r.latitude}-${r.longitude}`}
                  onClick={() => selectSearchResult(r)}
                  className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">{r.name}</div>
                    <div className="text-xs text-slate-500">
                      {[r.admin2, r.admin1, r.country].filter(Boolean).join(', ')}
                    </div>
                  </div>
                  <span className="ml-auto text-[10px] font-mono text-slate-400 shrink-0 mt-0.5">
                    {r.latitude.toFixed(2)}°N {r.longitude.toFixed(2)}°E
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── State & City Quick Selector ─────────────────────────────────── */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-thin bg-slate-50/70 border-b border-slate-100 text-xs">
            {INDIA_REGIONS.map((region) => (
              <button
                key={region.label}
                onClick={() => setActiveRegion(region.label)}
                className={`shrink-0 px-3.5 py-2 font-bold whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
                  activeRegion === region.label
                    ? 'border-emerald-600 text-emerald-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white'
                }`}
              >
                {region.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 p-2.5 bg-white">
            {currentRegionCities.map((city) => {
              const isActive =
                Math.abs(activeCity.lat - city.lat) < 0.05 &&
                Math.abs(activeCity.lon - city.lon) < 0.05;
              return (
                <button
                  key={city.name}
                  onClick={() => selectCity(city)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  <Compass className="w-3 h-3 opacity-70" />
                  {city.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── GOOGLE WEATHER DASHBOARD CARD (Clean White Theme) ───────────────── */}
      <div className="bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 transition-all">

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Fetching satellite weather for {activeCity.name}…</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* 1. Header: Current Condition, Temp, Stats, Title */}
            <div className="flex items-start justify-between">
              
              {/* Left Side: Big Icon + Temp + Precipitation/Humidity/Wind */}
              <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                <GoogleWeatherIcon type={currentMeta.type} className="w-16 h-16 sm:w-20 sm:h-20" />

                <div className="flex items-baseline">
                  <span className="text-6xl sm:text-7xl font-light tracking-tight text-slate-900">
                    {formatTemp(currentTempC)}
                  </span>
                  <div className="ml-2 text-sm text-slate-500 font-medium">
                    <button
                      onClick={() => setUnit('C')}
                      className={`cursor-pointer transition-colors ${unit === 'C' ? 'text-slate-900 font-bold' : 'hover:text-slate-900'}`}
                    >
                      °C
                    </button>
                    <span className="mx-1 text-slate-300">|</span>
                    <button
                      onClick={() => setUnit('F')}
                      className={`cursor-pointer transition-colors ${unit === 'F' ? 'text-slate-900 font-bold' : 'hover:text-slate-900'}`}
                    >
                      °F
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-0.5 font-normal pl-2 sm:border-l sm:border-slate-200">
                  <div>{lang === 'hi' ? 'वर्षा की संभावना:' : 'Precipitation:'} <span className="text-slate-900 font-semibold">{currentPrecipProb}%</span></div>
                  <div>{lang === 'hi' ? 'आर्द्रता (नमी):' : 'Humidity:'} <span className="text-slate-900 font-semibold">{currentHumidity}%</span></div>
                  <div>{lang === 'hi' ? 'हवा की गति:' : 'Wind:'} <span className="text-slate-900 font-semibold">{currentWind} {lang === 'hi' ? 'किमी/घंटा' : 'km/h'}</span></div>
                </div>
              </div>

              {/* Right Side: "Weather", Day of Week, Condition */}
              <div className="text-right">
                <div className="text-base sm:text-lg font-medium text-slate-800">{t('weatherLabel')}</div>
                <div className="text-xs sm:text-sm text-slate-500">{dayNameFull}</div>
                <div className="text-xs sm:text-sm text-slate-500 capitalize">{currentMeta.label}</div>
              </div>
            </div>

            {/* 2. Interactive Metric Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-200 text-sm font-medium pt-2">
              {[
                { id: 'Temperature', label: t('tempTab') },
                { id: 'Precipitation', label: t('precipTab') },
                { id: 'Wind', label: t('windTab') },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2.5 transition-all relative cursor-pointer ${
                    activeTab === tab.id
                      ? 'text-slate-900 font-bold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* 3. Hourly Graph / Timeline Section */}
            <div className="py-2 space-y-3">
              {/* Values Row above graph */}
              <div className="grid grid-cols-8 text-center text-xs font-semibold text-sky-600">
                {hourlyChartData.map((d, i) => (
                  <div key={i} className="truncate">
                    {activeTab === 'Precipitation' && `${d.precip}%`}
                    {activeTab === 'Temperature' && `${d.temp}°`}
                    {activeTab === 'Wind' && `${d.wind} km/h`}
                  </div>
                ))}
              </div>

              {/* Graphical Step / Area Line (Google Weather style) */}
              <div className="relative h-12 w-full flex items-end">
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-200" />
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 48">
                  <defs>
                    <linearGradient id="weatherGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Draw curve connecting 8 points */}
                  {(() => {
                    const points = hourlyChartData.map((d, idx) => {
                      const x = (idx / 7) * 700;
                      let normalizedVal = 0.5;
                      if (activeTab === 'Precipitation') normalizedVal = Math.min(1, Math.max(0.1, d.precip / 100));
                      if (activeTab === 'Temperature') normalizedVal = Math.min(1, Math.max(0.15, (d.temp - 15) / 25));
                      if (activeTab === 'Wind') normalizedVal = Math.min(1, Math.max(0.1, d.wind / 35));
                      const y = 48 - (normalizedVal * 38);
                      return { x, y };
                    });

                    const pathD = points.reduce((acc, p, idx) => {
                      if (idx === 0) return `M ${p.x} ${p.y}`;
                      const prev = points[idx - 1];
                      const cx = (prev.x + p.x) / 2;
                      return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
                    }, '');

                    const areaD = `${pathD} L 700 48 L 0 48 Z`;

                    return (
                      <>
                        <path d={areaD} fill="url(#weatherGrad)" />
                        <path d={pathD} fill="none" stroke="#0284c7" strokeWidth="2.5" />
                        {points.map((p, idx) => (
                          <circle
                            key={idx}
                            cx={p.x}
                            cy={p.y}
                            r="3.5"
                            fill="#0284c7"
                            className="transition-all hover:r-4"
                          />
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Timestamps Row below graph */}
              <div className="grid grid-cols-8 text-center text-[11px] font-medium text-slate-500">
                {hourlyChartData.map((d, i) => (
                  <div key={i} className="truncate">{d.label}</div>
                ))}
              </div>
            </div>

            {/* 4. 8-Day Forecast Row (Daily Cards) */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2 border-t border-slate-100">
              {dailyList.slice(0, 8).map((day, idx) => {
                const isSelected = selectedDayIdx === idx;
                const meta = getWeatherMeta(day.weather_code, lang);
                const dayDisplay = lang === 'hi' ? (hindiDaysShort[day.dayName] || day.dayName) : day.dayName;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDayIdx(idx)}
                    className={`flex flex-col items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-slate-100 ring-2 ring-emerald-600/30 shadow-xs'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-xs font-medium ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                      {dayDisplay}
                    </span>

                    <div className="my-2">
                      <GoogleWeatherIcon type={meta.type} className="w-8 h-8" />
                    </div>

                    <div className="text-xs font-semibold flex items-center gap-1.5">
                      <span className="text-slate-900">{formatTemp(day.temp_max)}°</span>
                      <span className="text-slate-400 font-normal">{formatTemp(day.temp_min)}°</span>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        )}

      </div>

      {/* ── Agronomic Advisory Cards (Tailored for Farmers) ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Irrigation Advice */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
            <Droplets className="w-4 h-4" />
            {t('irrigationAdviceHeader')}
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm">
            {currentPrecipProb >= 50
              ? t('postponePumps')
              : currentPrecipProb > 20
              ? t('lightIrrigation')
              : t('normalIrrigation')}
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {currentPrecipProb >= 50
              ? (lang === 'hi'
                  ? `${activeCity.name} में बारिश की अधिक संभावना (${currentPrecipProb}%) है। भारी पंप चलाने से खेत में जलभराव और बिजली/ईंधन का नुकसान हो सकता है।`
                  : `High rainfall probability (${currentPrecipProb}%) in ${activeCity.name}. Running heavy tubewell pumps now risks waterlogging crop roots and wasting electricity.`)
              : currentPrecipProb > 20
              ? (lang === 'hi'
                  ? `मध्यम बारिश की संभावना (${currentPrecipProb}%) है। खेत में पानी खड़े होने से रोकने के लिए सिंचाई की मात्रा घटाएं।`
                  : `Moderate rain chances (${currentPrecipProb}%). Adjust irrigation volume to prevent standing water.`)
              : (lang === 'hi'
                  ? 'मौसम सूखा रहेगा। वाष्पीकरण रोकने के लिए सुबह (5:00-8:00 AM) या शाम को ट्यूबवेल चलाएं।'
                  : 'Dry conditions ahead. Schedule tubewell pumping early morning (5:00 - 8:00 AM) or evening to minimize evaporative water loss.')}
          </p>
        </div>

        {/* Spraying Safety */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            {t('sprayingSafetyHeader')}
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm">
            {currentWind > 15
              ? (lang === 'hi' ? 'तेज हवा — छिड़काव से बचें' : 'High Wind — Avoid Spraying')
              : currentPrecipProb > 30
              ? t('avoidSpraying')
              : t('favorableSpraying')}
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {currentWind > 15
              ? (lang === 'hi'
                  ? `हवा की गति (${currentWind} किमी/घंटा) अधिक है, जिससे दवा उड़कर दूसरे खेतों में जा सकती है। हवा थमने की प्रतीक्षा करें।`
                  : `Current wind speed (${currentWind} km/h) causes spray drift onto neighboring crops. Delay foliar application until wind subsides.`)
              : currentPrecipProb > 30
              ? (lang === 'hi'
                  ? 'आने वाले घंटों में बारिश की संभावना है जिससे महंगी दवाएं व उर्वरक धुल सकते हैं।'
                  : 'Upcoming precipitation may wash away applied pesticides and fertilizers. Wait for clear skies.')
              : (lang === 'hi'
                  ? 'हवा की गति शांत और आसमान साफ है। कीटनाशक व पर्णीय खाद (Foliar spray) के लिए उत्तम समय है।'
                  : 'Wind speed and precipitation levels are calm. Safe to apply foliar fertilizers and pest protection.')}
          </p>
        </div>

        {/* Disease Risk */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            {t('diseaseRiskHeader')}
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm">
            {currentHumidity > 75
              ? t('elevatedFungalRisk')
              : t('normalHealthEnv')}
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {currentHumidity > 75
              ? (lang === 'hi'
                  ? `हवा में अत्यधिक नमी (${currentHumidity}%) व गर्माहट से झुलसा, फफूंद व रतुआ रोग का संक्रमण बढ़ सकता है। खेत में जलभराव न होने दें।`
                  : `High atmospheric humidity (${currentHumidity}%) combined with warm temperature creates ideal conditions for blight, blast, and rust.`)
              : (lang === 'hi'
                  ? `सापेक्षिक आर्द्रता (${currentHumidity}%) सामान्य और संतुलित है। जड़ों में वायु संचार के लिए उचित निकासी बनाए रखें।`
                  : `Relative humidity (${currentHumidity}%) is well-balanced. Ensure standard drainage to maintain root oxygenation.`)}
          </p>
        </div>

      </div>

    </div>
  );
}
