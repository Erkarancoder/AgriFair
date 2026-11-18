import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const TRANSLATIONS = {
  en: {
    // Brand
    brandName: 'Jalrakshak',
    brandTagline: 'Smart Irrigation & Water Advisor',
    footerTagline: 'Smart Irrigation & Water Management for Farmers',
    footerReview: 'Agronomic Review Layer • Powered by Open-Meteo & Scikit-learn',

    // Navigation
    navHome: 'Home',
    navAdvisor: 'Irrigation Advisor',
    navWeather: 'Weather & Rainfall',
    navLands: 'Farmer Lands',
    newPlot: 'New Plot',
    registerNewLand: 'Register New Land',
    registerNewLandTitle: 'Register New Agricultural Land',
    editLandTitle: 'Edit Agricultural Land',
    mlLive: 'ML Live',
    mlOffline: 'ML Offline',
    connecting: 'Connecting',

    // Common
    refresh: 'Refresh',
    search: 'Search',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    acres: 'Acres',
    activeFieldPlot: 'Active Field Plot',
    fieldGps: 'Field GPS',
    editPlot: 'Edit Plot',
    deletePlot: 'Delete Plot',
    checkPlot: 'Check Irrigation with Live Weather',

    // Crops
    cropRice: 'Rice (Paddy)',
    cropWheat: 'Wheat',
    cropMaize: 'Maize',
    cropSugarcane: 'Sugarcane',
    cropPotato: 'Potato',
    cropCotton: 'Cotton',

    // Stages
    stageSowing: 'Sowing',
    stageVegetative: 'Vegetative',
    stageFlowering: 'Flowering',
    stageHarvest: 'Harvest',

    // Soils
    soilSandy: 'Sandy',
    soilSilt: 'Silt',
    soilLoamy: 'Loamy',
    soilClay: 'Clay',
    soilSandyDesc: 'Fast draining, low moisture retention',
    soilSiltDesc: 'Medium texture, moderate retention',
    soilLoamyDesc: 'Ideal balance of drainage & moisture',
    soilClayDesc: 'Heavy, holds high water volume',

    // Moisture & Gauges
    soilMoistureInput: 'Soil Moisture Input',
    sensorReadingFor: 'Sensor reading for',
    moistureLevel: 'Moisture Level',
    criticallyDry: 'Critically Dry',
    lowMoisture: 'Low Moisture',
    optimalMoisture: 'Optimal Moisture',
    saturatedWet: 'Saturated / Wet',
    dryLegend: '0-19% Dry',
    lowLegend: '20-34% Low',
    optimalLegend: '35-70% Optimal',
    wetLegend: '71-100% Wet',
    runAdvisorBtn: 'Run AI Irrigation Advisor',
    fetchingWeatherCalc: 'Fetching Weather & Calculating...',
    pullsSatelliteWeather: 'Pulls live Open-Meteo satellite weather for field coordinates automatically.',

    // IoT Sensor Widget
    simulatedIot: 'Simulated IoT',
    hackathonSimMode: '⚡ Hackathon Simulation Mode',
    soilMoistureReading: 'Soil Moisture Reading',
    rootDepth: 'Root Depth',
    noReadingYet: 'No reading yet. Click "Poll Sensor".',
    pollSensor: 'Poll Sensor',
    polling: 'Reading...',
    liveOn: 'Live ON',
    live: 'Live',
    rawTelemetry: 'Raw Telemetry Payload (ESP32 Schema)',
    futureHardwareNote: 'Future: When ESP32 sensor hardware is deployed, it will POST to /api/sensor/reading. Zero UI code changes needed.',

    // Prediction Card
    highNeedLabel: 'High Irrigation Needed',
    highNeedDesc: 'Critical water deficit. Crops are under moisture stress.',
    mediumNeedLabel: 'Moderate Irrigation Needed',
    mediumNeedDesc: 'Soil moisture is dipping. Plan irrigation soon unless rain arrives.',
    lowNeedLabel: 'Low / No Immediate Need',
    lowNeedDesc: 'Sufficient moisture retained in soil. Conserve water for now.',
    agronomicProtocol: 'Agronomic Protocol',
    aiAdvisoryHeader: 'AI Agronomic Advisory & Weather Evaluation',
    bestWindow: 'Best Irrigation Window',
    bestWindowDesc: 'Early morning (5:00 - 8:00 AM) or evening to minimize evaporation losses.',
    waterRetention: 'Soil Water Retention',

    // Weather Page
    weatherDashboardBadge: 'India Weather Dashboard',
    weatherHeadline: 'Live Weather & 24-Hour Rainfall Radar',
    showingForecastFor: 'Showing forecast for',
    searchCityPlaceholder: 'Search any Indian city or district… (e.g. Barabanki, Pune, Amritsar, Gorakhpur)',
    tempTab: 'Temperature',
    precipTab: 'Precipitation',
    windTab: 'Wind',
    weatherLabel: 'Weather',
    today: 'Today',

    // Weather Advisories
    irrigationAdviceHeader: 'Irrigation Pumping Advice',
    postponePumps: 'Postpone Irrigation Pumps',
    lightIrrigation: 'Light Irrigation Recommended',
    normalIrrigation: 'Irrigate Normally According to Soil Need',
    sprayingSafetyHeader: 'Fertilizer & Spraying Safety',
    avoidSpraying: 'Avoid Foliar Spraying Today',
    favorableSpraying: 'Favorable Window for Spraying',
    diseaseRiskHeader: 'Disease & Moisture Risk',
    elevatedFungalRisk: 'Elevated Fungal Infection Risk',
    normalHealthEnv: 'Normal Crop Health Environment',

    // Dashboard Page
    dashboardTitle: 'Farmer Agricultural Lands',
    dashboardSubtitle: 'Manage all your fields, track IoT sensors, and run irrigation advisories.',
    totalPlots: 'Total Plots',
    registeredFields: 'Registered fields',
    totalArea: 'Total Area',
    underManagement: 'Under management',
    highWaterDeficit: 'High Water Deficit',
    urgentIrrigationNeeded: 'Urgent irrigation needed',
    iotNodesPolled: 'IoT Nodes Polled',
    ofNodes: 'of sensor nodes',
    iotNodeStatus: 'IoT Sensor Node Status',
    recentActivityLog: 'Recent Prediction Activity Log',
    lastRecords: 'Last records',
  },

  hi: {
    // Brand
    brandName: 'जल रक्षक',
    brandTagline: 'स्मार्ट सिंचाई और जल सलाहकार',
    footerTagline: 'किसानों के लिए स्मार्ट सिंचाई और जल प्रबंधन प्रणाली',
    footerReview: 'कृषि विज्ञान समीक्षा परत • ओपन-मेटियो और मशीन लर्निंग आधारित',

    // Navigation
    navHome: 'होम',
    navAdvisor: 'सिंचाई सलाहकार',
    navWeather: 'मौसम और बारिश',
    navLands: 'खेत व ज़मीन',
    newPlot: 'नया खेत',
    registerNewLand: 'नया खेत जोड़ें',
    registerNewLandTitle: 'नया कृषि खेत पंजीकृत करें',
    editLandTitle: 'खेत का विवरण बदलें',
    mlLive: 'एआई सक्रिय',
    mlOffline: 'एआई ऑफलाइन',
    connecting: 'कनेक्ट हो रहा है',

    // Common
    refresh: 'ताज़ा करें',
    search: 'खोजें',
    cancel: 'रद्द करें',
    saveChanges: 'सुरक्षित करें',
    acres: 'एकड़',
    activeFieldPlot: 'सक्रिय खेत',
    fieldGps: 'खेत जीपीएस',
    editPlot: 'खेत बदलें',
    deletePlot: 'हटाएं',
    checkPlot: 'मौसम के साथ सिंचाई जांचें',

    // Crops
    cropRice: 'धान (चावल)',
    cropWheat: 'गेहूं',
    cropMaize: 'मक्का',
    cropSugarcane: 'गन्ना',
    cropPotato: 'आलू',
    cropCotton: 'कपास',

    // Stages
    stageSowing: 'बुवाई (Sowing)',
    stageVegetative: 'बढ़वार / वानस्पतिक',
    stageFlowering: 'फूल आना (Flowering)',
    stageHarvest: 'कटाई (Harvest)',

    // Soils
    soilSandy: 'बलुई मिट्टी',
    soilSilt: 'गाद मिट्टी (Silt)',
    soilLoamy: 'दोमट मिट्टी',
    soilClay: 'चिकनी मिट्टी',
    soilSandyDesc: 'तेजी से पानी सूखता है, बार-बार हल्की सिंचाई चाहिए',
    soilSiltDesc: 'मध्यम बनावट, सामान्य जल धारण',
    soilLoamyDesc: 'उपजाऊ और संतुलित जल धारण क्षमता',
    soilClayDesc: 'भारी मिट्टी, लंबे समय तक नमी रोकती है',

    // Moisture & Gauges
    soilMoistureInput: 'मिट्टी की नमी इनपुट',
    sensorReadingFor: 'सेंसर रीडिंग खेत:',
    moistureLevel: 'नमी का स्तर',
    criticallyDry: 'अत्यधिक सूखा (खतरा)',
    lowMoisture: 'कम नमी',
    optimalMoisture: 'अनुकूल नमी (पर्याप्त)',
    saturatedWet: 'अत्यधिक गीला / संतृप्त',
    dryLegend: '0-19% सूखा',
    lowLegend: '20-34% कम',
    optimalLegend: '35-70% अनुकूल',
    wetLegend: '71-100% गीला',
    runAdvisorBtn: 'एआई सिंचाई सलाहकार चलाएं',
    fetchingWeatherCalc: 'मौसम देखकर सलाह बनाई जा रही है...',
    pullsSatelliteWeather: 'बाराबंकी, उप्र के लिए लाइव सैटेलाइट मौसम अपने आप लोड होता है।',

    // IoT Sensor Widget
    simulatedIot: 'सिम्युलेटेड आईओटी सेंसर',
    hackathonSimMode: '⚡ हैकाथॉन सिमुलेशन मोड',
    soilMoistureReading: 'मिट्टी की नमी सेंसर रीडिंग',
    rootDepth: 'जड़ की गहराई',
    noReadingYet: 'रीडिंग नहीं मिली। "सेंसर से जांचें" दबाएं।',
    pollSensor: 'सेंसर से जांचें',
    polling: 'जांच जारी है...',
    liveOn: 'लाइव चालू',
    live: 'लाइव',
    rawTelemetry: 'कच्चा टेलीमेट्री पेलोड (ESP32 स्कीमा)',
    futureHardwareNote: 'भविष्य: जब खेत में असली ESP32 सेंसर लगेगा तो वह सीधे /api/sensor/reading पर डाटा भेजेगा। UI में बदलाव की ज़रूरत नहीं।',

    // Prediction Card
    highNeedLabel: 'तुरंत सिंचाई की आवश्यकता है',
    highNeedDesc: 'मिट्टी में पानी की भारी कमी है। फसल नमी तनाव में है।',
    mediumNeedLabel: 'मध्यम सिंचाई की आवश्यकता',
    mediumNeedDesc: 'मिट्टी की नमी कम हो रही है। बारिश न होने पर जल्द सिंचाई करें।',
    lowNeedLabel: 'सिंचाई की आवश्यकता नहीं है',
    lowNeedDesc: 'खेत में पर्याप्त नमी मौजूद है। अभी पानी और बिजली बचाएं।',
    agronomicProtocol: 'कृषि प्रोटोकॉल',
    aiAdvisoryHeader: 'एआई कृषि सलाह और मौसम विश्लेषण',
    bestWindow: 'सिंचाई का सबसे सही समय',
    bestWindowDesc: 'सुबह 5:00 से 8:00 बजे या शाम को, ताकि पानी वाष्पीकृत होकर न उड़े।',
    waterRetention: 'मिट्टी की जल धारण क्षमता',

    // Weather Page
    weatherDashboardBadge: 'भारत मौसम डैशबोर्ड',
    weatherHeadline: 'लाइव मौसम और 24-घंटे बारिश राडार',
    showingForecastFor: 'मौसम पूर्वानुमान स्थान:',
    searchCityPlaceholder: 'भारत का कोई भी शहर या ज़िला खोजें… (उदा. बाराबंकी, लखनऊ, पुणे)',
    tempTab: 'तापमान',
    precipTab: 'वर्षा / बारिश',
    windTab: 'हवा की गति',
    weatherLabel: 'मौसम',
    today: 'आज',

    // Weather Advisories
    irrigationAdviceHeader: 'ट्यूबवेल सिंचाई सलाह',
    postponePumps: 'ट्यूबवेल पंप अभी रोकें',
    lightIrrigation: 'हल्की सिंचाई की सिफारिश',
    normalIrrigation: 'मिट्टी की जरूरत अनुसार सामान्य सिंचाई करें',
    sprayingSafetyHeader: 'खाद व कीटनाशक छिड़काव सुरक्षा',
    avoidSpraying: 'आज पत्तों पर छिड़काव से बचें',
    favorableSpraying: 'छिड़काव के लिए अनुकूल मौसम',
    diseaseRiskHeader: 'रोग व फफूंद जोखिम',
    elevatedFungalRisk: 'फफूंद / झुलसा रोग का बढ़ा हुआ खतरा',
    normalHealthEnv: 'फसल स्वास्थ्य के लिए सामान्य वातावरण',

    // Dashboard Page
    dashboardTitle: 'किसान के पंजीकृत खेत',
    dashboardSubtitle: 'अपने सभी खेतों का प्रबंधन करें, आईओटी सेंसर देखें और सिंचाई सलाह लें।',
    totalPlots: 'कुल खेत (प्लॉट)',
    registeredFields: 'पंजीकृत खेत',
    totalArea: 'कुल रकबा / क्षेत्रफल',
    underManagement: 'प्रबंधन के तहत',
    highWaterDeficit: 'भारी पानी की कमी',
    urgentIrrigationNeeded: 'तुरंत सिंचाई जरूरी',
    iotNodesPolled: 'सेंसर नोड जांचे गए',
    ofNodes: 'कुल सेंसर नोड्स में से',
    iotNodeStatus: 'आईओटी सेंसर नोड स्थिति',
    recentActivityLog: 'हालिया सिंचाई सलाह रिकॉर्ड',
    lastRecords: 'पिछले रिकॉर्ड',
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('jalrakshak_language') || 'hi'; // Default to Hindi for farmers!
    } catch {
      return 'hi';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('jalrakshak_language', lang);
    } catch {
      // ignore
    }
  }, [lang]);

  const t = (key) => {
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['en']?.[key] ?? key;
  };

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'hi' ? 'en' : 'hi'));
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
