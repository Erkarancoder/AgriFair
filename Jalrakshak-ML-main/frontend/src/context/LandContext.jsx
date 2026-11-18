import React, { createContext, useContext, useState, useEffect } from 'react';

const LandContext = createContext(null);

// Bumped storage version key to reset cached mock lands to single-field model
const STORAGE_KEY_LANDS = 'jalrakshak_single_land_v5';
const STORAGE_KEY_SELECTED = 'jalrakshak_selected_land_id_v5';
const STORAGE_KEY_HISTORY = 'jalrakshak_prediction_history_v5';

// Barabanki, Uttar Pradesh, India coordinates
const BARABANKI_DEFAULT_LAT = 26.93;
const BARABANKI_DEFAULT_LON = 81.18;

// Single Primary Registered Field
const DEFAULT_LANDS = [
  {
    id: 'primary-field',
    name: 'Primary Agricultural Field',
    locationName: 'Barabanki, Uttar Pradesh, India',
    areaAcres: 2.5,
    cropType: 'Wheat',
    growthStage: 'Vegetative',
    soilType: 'Loamy',
    latitude: 26.93,
    longitude: 81.18,
    soilMoisture: 24.0,
    pipeDiameterInches: 2.5,
    motorHp: 5.0,
    irrigationMethod: 'Flood',
    latestPrediction: null,
  },
];

export function LandProvider({ children }) {
  const [lands, setLands] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed reading lands from storage', e);
    }
    return DEFAULT_LANDS;
  });

  const [selectedLandId, setSelectedLandId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SELECTED);
      if (saved && lands.some((l) => l.id === saved)) return saved;
    } catch {}
    return lands[0]?.id || 'primary-field';
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LANDS, JSON.stringify(lands));
    } catch (e) {
      console.warn('Failed saving lands', e);
    }
  }, [lands]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED, selectedLandId);
    } catch {}
  }, [selectedLandId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {}
  }, [history]);

  const selectedLand = lands.find((l) => l.id === selectedLandId) || lands[0] || null;

  function addLand(newLandData) {
    const newId = 'field-' + Date.now();
    const newLand = {
      ...newLandData,
      id: newId,
      locationName: newLandData.locationName || 'Barabanki, Uttar Pradesh, India',
      soilMoisture: Number(newLandData.soilMoisture) || 25,
      areaAcres: Number(newLandData.areaAcres) || 2.5,
      pipeDiameterInches: Number(newLandData.pipeDiameterInches) || 2.5,
      motorHp: Number(newLandData.motorHp) || 5.0,
      irrigationMethod: newLandData.irrigationMethod || 'Flood',
      latitude: Number(newLandData.latitude) || BARABANKI_DEFAULT_LAT,
      longitude: Number(newLandData.longitude) || BARABANKI_DEFAULT_LON,
      latestPrediction: null,
    };
    // Maintain single primary field
    setLands([newLand]);
    setSelectedLandId(newId);
    return newLand;
  }

  function updateLand(id, fields) {
    setLands((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...fields } : l))
    );
  }

  function deleteLand(id) {
    setLands((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      if (selectedLandId === id) {
        setSelectedLandId(updated[0]?.id || '');
      }
      return updated;
    });
  }

  function recordPrediction(landId, moisture, result) {
    const predictionSummary = {
      need: result.prediction?.irrigation_need || 'Unknown',
      action: result.decision?.action || 'REVIEW_RECOMMENDED',
      rainfall24h: result.weather?.rainfall_next_24h_mm ?? 0,
      temperature: result.weather?.temperature_c,
      humidity: result.weather?.humidity_percent,
      reason: result.decision?.reason || '',
      water_schedule: result.decision?.water_schedule || null,
      timestamp: new Date().toISOString(),
    };

    updateLand(landId, {
      soilMoisture: moisture,
      latestPrediction: predictionSummary,
    });

    const targetLand = lands.find((l) => l.id === landId);
    const historyItem = {
      id: 'hist-' + Date.now(),
      landId,
      landName: targetLand?.name || 'Primary Field',
      locationName: targetLand?.locationName || 'Barabanki, UP, India',
      cropType: targetLand?.cropType || 'N/A',
      soilType: targetLand?.soilType || 'N/A',
      growthStage: targetLand?.growthStage || 'N/A',
      areaAcres: targetLand?.areaAcres || 2.5,
      pipeDiameterInches: targetLand?.pipeDiameterInches || 2.5,
      motorHp: targetLand?.motorHp || 5.0,
      irrigationMethod: targetLand?.irrigationMethod || 'Flood',
      moisture,
      prediction: predictionSummary,
      timestamp: new Date().toISOString(),
    };

    setHistory((prev) => [historyItem, ...prev.slice(0, 49)]);
  }

  return (
    <LandContext.Provider
      value={{
        lands,
        selectedLand,
        selectedLandId,
        setSelectedLandId,
        addLand,
        updateLand,
        deleteLand,
        recordPrediction,
        history,
      }}
    >
      {children}
    </LandContext.Provider>
  );
}

export function useLand() {
  const context = useContext(LandContext);
  if (!context) {
    throw new Error('useLand must be used within a LandProvider');
  }
  return context;
}
