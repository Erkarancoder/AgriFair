# Jalrakshak - Smart Irrigation & Water Management System

**Jalrakshak** (जल रक्षक - *Water Guardian*) is an AI-driven smart irrigation advisory platform designed to help farmers optimize water usage based on real-time soil moisture measurements, satellite weather forecasts, and machine learning models.

---

## Architecture Overview

```
Jalrakshak-ML/
├── models/                     # Trained ML pipeline artifacts (.joblib)
├── src/                        # FastAPI Backend
│   ├── api.py                  # REST API (/predict, /health, CORS)
│   ├── backend_service.py      # Orchestration layer
│   ├── decision_service.py     # Agronomic advisory rules & review protocol
│   ├── predict.py              # ML inference (6-feature Random Forest Pipeline)
│   └── weather_service.py      # Open-Meteo live weather & 24h rain radar (cached)
├── tests/                      # Automated test suite (35 passing unit & integration tests)
├── frontend/                   # React 19 + Vite + Tailwind CSS 4 Web App
│   ├── src/
│   │   ├── api/client.js       # Axios client connecting to http://localhost:8000
│   │   ├── context/LandContext # Multi-land state management & local persistence
│   │   ├── components/         # Navbar, WeatherWidget, PredictionCard, LandModal
│   │   └── pages/              # AdvisorPage (Core ML), DashboardPage (Multi-Land)
└── train_final_model.py        # Reproducible model training script
```

---

## Key Features

1. **Multi-Land / Multi-Plot Management:**
   * A farmer can register and manage multiple agricultural lands with different crops, soil types, growth stages, and geographical coordinates.
   * Quick-switcher dropdown in the navigation bar to switch between fields in 1 click.
   * Auto-populates parameters into the AI Advisor.

2. **Live Weather & 24-Hour Rainfall Radar:**
   * Automatically retrieves live temperature and relative humidity for the exact field coordinates via Open-Meteo.
   * Visualizes hourly rainfall expectations over the next 24 hours.
   * 15-minute in-memory caching prevents API rate limits.

3. **Responsible ML Irrigation Prediction & Advisory:**
   * 6-feature Random Forest model predicts `Low`, `Medium`, or `High` water need.
   * Decision engine checks upcoming rainfall to recommend whether irrigation should be adjusted or postponed to save water and pumping costs.

4. **Marketplace Project Bridge:**
   * Contextual links to the teammate's Marketplace module (`VITE_MARKETPLACE_URL`).
   * When irrigation need is high, points farmers to drip irrigation kits and soil probes.
   * When crops reach harvest stage, points farmers to sell produce to buyers.

---

## Getting Started

### 1. Start the Backend API (FastAPI)
```bash
# In the repository root:
.\.venv\Scripts\uvicorn src.api:app --reload --port 8000
```
* **API URL:** `http://localhost:8000`
* **Interactive Docs:** `http://localhost:8000/docs`
* **Health Check:** `http://localhost:8000/health`

### 2. Start the Frontend (Vite)
```bash
# In another terminal:
cd frontend
npm run dev
```
* **Frontend App:** `http://localhost:5173`

---

## Running Automated Tests
```bash
.\.venv\Scripts\pytest.exe
```
All 35 tests covering API endpoints, mock failures, weather caching, input bounds, and ML pipelines pass with 100% coverage.
