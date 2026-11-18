/**
 * Jalrakshak IoT Sensor Simulation Service
 * ==========================================
 * Simulates ESP32/Arduino capacitive soil moisture sensor telemetry.
 *
 * HOW TO REPLACE WITH REAL SENSOR (Future):
 * ------------------------------------------
 * 1. Flash your ESP32 with capacitive soil moisture probe.
 * 2. Configure the ESP32 to POST to:
 *      POST /api/sensor/reading
 *      Body: { sensor_id, land_id, soil_moisture, probe_depth_cm, battery_pct, signal_rssi, timestamp }
 * 3. Create a FastAPI endpoint that stores the reading.
 * 4. Replace `simulateSensorReading()` below with `fetchRealSensorReading(landId)` that
 *    calls GET /api/sensor/latest?land_id={landId}
 * 5. No frontend component changes needed — only this file changes.
 */

// Physical Sensor Node Registry (maps each land plot to a virtual sensor node)
// In production: these node IDs will match the physically deployed hardware tags.
export const SENSOR_NODES = {
  'land-1': { nodeId: 'JS-NODE-01', probeDepthCm: 15, location: 'Barabanki Central Farm' },
  'land-2': { nodeId: 'JS-NODE-02', probeDepthCm: 12, location: 'Dewa Sharif Block Field' },
  'land-3': { nodeId: 'JS-NODE-03', probeDepthCm: 18, location: 'Fatehpur Tehsil Farm' },
  'land-4': { nodeId: 'JS-NODE-04', probeDepthCm: 10, location: 'Ram Sanehi Ghat Plot' },
};

// Moisture baseline ranges for each soil type (derived from agronomic field data)
const SOIL_MOISTURE_RANGES = {
  Clay:  { min: 20, max: 65, drainRate: 0.5 },   // Clay retains water long
  Silt:  { min: 18, max: 55, drainRate: 0.8 },
  Loamy: { min: 15, max: 50, drainRate: 1.2 },
  Sandy: { min: 8,  max: 35, drainRate: 2.5 },   // Sandy drains fastest
};

// Moisture demand per crop growth stage (Water Use Coefficient)
const STAGE_DEMAND = {
  Sowing:     0.6,  // Low demand — seeds germinating
  Vegetative: 1.0,  // Peak vegetative growth, full water demand
  Flowering:  0.9,  // Flowering is slightly less demanding
  Harvest:    0.4,  // Harvest stage: significantly reduced water need
};

/**
 * Simulate a realistic soil moisture sensor reading.
 *
 * Accounts for:
 * - Soil type drainage characteristics
 * - Current crop growth stage water demand
 * - Sensor analog noise (±1.5% jitter replicating ADC imprecision)
 * - Diurnal variation (higher at night, lower at peak afternoon)
 *
 * @param {object} land - The land plot object from LandContext
 * @param {number} lastReading - Previous moisture % (for continuity simulation)
 * @returns {object} SensorReading schema ready to be replaced with actual ESP32 payload
 */
export function simulateSensorReading(land, lastReading = null) {
  const soilConfig = SOIL_MOISTURE_RANGES[land.soilType] || SOIL_MOISTURE_RANGES.Loamy;
  const stageDemand = STAGE_DEMAND[land.growthStage] || 1.0;

  // Base moisture: gravitates toward realistic midpoint for soil type
  const midpoint = (soilConfig.min + soilConfig.max) / 2;
  const base = lastReading !== null ? lastReading : midpoint;

  // Simulate slow drain between readings (crops + evaporation)
  const drainAmount = soilConfig.drainRate * stageDemand * (0.8 + Math.random() * 0.4);

  // Diurnal effect: soil surface drier during 11AM-4PM window
  const hour = new Date().getHours();
  const diurnalDip = (hour >= 11 && hour <= 16) ? 2.5 : 0;

  // Analog sensor noise (±1.5% typical ADC jitter for capacitive probe)
  const sensorNoise = (Math.random() - 0.5) * 3.0;

  let reading = base - drainAmount - diurnalDip + sensorNoise;

  // Clamp to physically valid range for this soil type
  reading = Math.min(soilConfig.max, Math.max(soilConfig.min, reading));
  reading = Math.round(reading * 10) / 10; // 1 decimal place like a real sensor

  // Simulated battery draining slowly (90-99% range for demo)
  const battery = Math.round(90 + Math.random() * 9);

  // Simulated LoRa RSSI signal strength (typical rural Indian field: -65 to -85 dBm)
  const signalRssi = Math.round(-65 - Math.random() * 20);

  const node = SENSOR_NODES[land.id] || {
    nodeId: `JS-NODE-${land.id.slice(-2).toUpperCase()}`,
    probeDepthCm: 15,
    location: land.name,
  };

  // === SENSOR PAYLOAD SCHEMA ===
  // This matches the exact JSON an ESP32 will POST to /api/sensor/reading in production.
  return {
    sensor_id: node.nodeId,
    land_id: land.id,
    soil_moisture: reading,
    probe_depth_cm: node.probeDepthCm,
    battery_pct: battery,
    signal_rssi: signalRssi,
    signal_type: 'LoRa/GSM',
    status: 'active',
    simulated: true,   // Set to false when real hardware replaces this function
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format signal quality label from RSSI dBm value.
 */
export function getSignalQuality(rssi) {
  if (rssi >= -65) return { label: 'Excellent', color: 'text-emerald-600' };
  if (rssi >= -75) return { label: 'Good', color: 'text-green-600' };
  if (rssi >= -85) return { label: 'Fair', color: 'text-amber-600' };
  return { label: 'Weak', color: 'text-rose-600' };
}

/**
 * Format battery level label.
 */
export function getBatteryStatus(pct) {
  if (pct >= 70) return { label: `${pct}%`, color: 'text-emerald-600', icon: '🔋' };
  if (pct >= 30) return { label: `${pct}%`, color: 'text-amber-600', icon: '🪫' };
  return { label: `${pct}% LOW`, color: 'text-rose-600', icon: '🪫' };
}

/**
 * FUTURE INTEGRATION STUB:
 * Replace simulateSensorReading() with this when real sensors are deployed.
 *
 * export async function fetchRealSensorReading(landId) {
 *   const response = await apiClient.get(`/api/sensor/latest?land_id=${landId}`);
 *   return response.data;
 * }
 */
