import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from src.api import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_weather_endpoint_success(monkeypatch):
    def mock_get_rainfall(lat, lon):
        return {
            "latitude": lat,
            "longitude": lon,
            "timezone": "Asia/Kolkata",
            "temperature_c": 28.5,
            "humidity_percent": 55.0,
            "forecast_hours": 24,
            "rainfall_next_24h_mm": 0.0,
            "hourly_forecast": [],
        }

    monkeypatch.setattr("src.api.get_rainfall_forecast", mock_get_rainfall)

    response = client.get("/weather?latitude=26.93&longitude=81.18")
    assert response.status_code == 200
    data = response.json()
    assert data["latitude"] == 26.93
    assert data["longitude"] == 81.18
    assert data["temperature_c"] == 28.5


def test_weather_endpoint_rejects_invalid_coords():
    response = client.get("/weather?latitude=95&longitude=81.18")
    assert response.status_code == 422


def test_predict_endpoint_success(monkeypatch):
    def mock_run_backend(property_data, latitude, longitude):
        return {
            "status": "success",
            "prediction": {"irrigation_need": "High"},
            "weather": {
                "latitude": latitude,
                "longitude": longitude,
                "timezone": "Asia/Kolkata",
                "forecast_hours": 24,
                "rainfall_next_24h_mm": 0.0,
                "hourly_forecast": [],
            },
            "decision": {
                "action": "INSUFFICIENT_DATA",
                "reason": "Agronomic thresholds are not validated.",
                "irrigation_need": "High",
                "rainfall_next_24h_mm": 0.0,
            },
        }

    monkeypatch.setattr("src.api.run_backend", mock_run_backend)

    response = client.post(
        "/predict",
        json={
            "Soil_Moisture": 18.0,
            "Crop_Type": "Rice",
            "Crop_Growth_Stage": "Vegetative",
            "Soil_Type": "Clay",
            "Temperature_C": 34.0,
            "Humidity": 55.0,
            "Rainfall_mm": 100.0,
            "latitude": 26.85,
            "longitude": 80.95,
        },
    )

    assert response.status_code == 200
    assert response.json()["prediction"]["irrigation_need"] == "High"
    assert response.json()["decision"]["action"] == "INSUFFICIENT_DATA"


def test_predict_rejects_invalid_latitude():
    response = client.post(
        "/predict",
        json={
            "Soil_Moisture": 18.0,
            "Crop_Type": "Rice",
            "Crop_Growth_Stage": "Vegetative",
            "Soil_Type": "Clay",
            "Temperature_C": 34.0,
            "Humidity": 55.0,
            "Rainfall_mm": 100.0,
            "latitude": 95,
            "longitude": 80.95,
        },
    )

    assert response.status_code == 422


def test_predict_rejects_invalid_crop_type():
    response = client.post(
        "/predict",
        json={
            "Soil_Moisture": 18.0,
            "Crop_Type": "InvalidCrop",
            "Crop_Growth_Stage": "Vegetative",
            "Soil_Type": "Clay",
            "latitude": 26.85,
            "longitude": 80.95,
        },
    )

    assert response.status_code == 422


def test_predict_returns_503_when_weather_fails(monkeypatch):
    def mock_weather_failure(property_data, latitude, longitude):
        raise RuntimeError("Weather forecast unavailable")

    monkeypatch.setattr("src.api.run_backend", mock_weather_failure)

    response = client.post(
        "/predict",
        json={
            "Soil_Moisture": 18.0,
            "Crop_Type": "Rice",
            "Crop_Growth_Stage": "Vegetative",
            "Soil_Type": "Clay",
            "Temperature_C": 34.0,
            "Humidity": 55.0,
            "Rainfall_mm": 100.0,
            "latitude": 26.85,
            "longitude": 80.95,
        },
    )

    assert response.status_code == 503
    assert response.json()["detail"] == (
        "Prediction service or weather forecast is unavailable."
    )
