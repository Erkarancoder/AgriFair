
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.backend_service import run_backend


def make_sample():
    return {
        "Soil_Moisture": 18.0,
        "Crop_Type": "Rice",
        "Crop_Growth_Stage": "Vegetative",
        "Soil_Type": "Clay",
    }


def make_mock_weather(latitude, longitude):
    return {
        "latitude": latitude,
        "longitude": longitude,
        "timezone": "Asia/Kolkata",
        "temperature_c": 30.5,
        "humidity_percent": 65,
        "forecast_hours": 24,
        "rainfall_next_24h_mm": 2.5,
        "hourly_forecast": [],
    }


def test_run_backend_success(monkeypatch):
    captured = {}

    def mock_prediction(data):
        captured.update(data)
        return "Medium"

    monkeypatch.setattr(
        "src.backend_service.predict_irrigation_need",
        mock_prediction,
    )
    monkeypatch.setattr(
        "src.backend_service.get_rainfall_forecast",
        make_mock_weather,
    )

    result = run_backend(make_sample(), 26.85, 80.95)

    assert result["status"] == "success"
    assert result["prediction"]["irrigation_need"] == "Medium"
    assert result["weather"]["rainfall_next_24h_mm"] == 2.5
    assert result["decision"]["action"] == "IRRIGATE_SOON"  # Medium need + 2.5 mm rain

    # The model receives exactly the six expected features.
    assert set(captured) == {
        "Soil_Moisture",
        "Crop_Type",
        "Crop_Growth_Stage",
        "Soil_Type",
        "Temperature_C",
        "Humidity",
    }

    # Live weather values are used for inference.
    assert captured["Temperature_C"] == 30.5
    assert captured["Humidity"] == 65

    # User-provided crop and soil features are preserved.
    assert captured["Soil_Moisture"] == 18.0
    assert captured["Crop_Type"] == "Rice"
    assert captured["Crop_Growth_Stage"] == "Vegetative"
    assert captured["Soil_Type"] == "Clay"

    # Rainfall is used by the decision layer, not the ML model.
    assert "Rainfall_mm" not in captured
    assert result["decision"]["rainfall_next_24h_mm"] == 2.5


def test_run_backend_weather_failure(monkeypatch):
    def mock_weather_failure(latitude, longitude):
        raise RuntimeError("Unable to retrieve a valid weather forecast")

    monkeypatch.setattr(
        "src.backend_service.get_rainfall_forecast",
        mock_weather_failure,
    )

    with pytest.raises(RuntimeError, match="weather forecast"):
        run_backend(make_sample(), 26.85, 80.95)


def test_run_backend_rejects_invalid_latitude():
    with pytest.raises(ValueError, match="Latitude"):
        run_backend({}, 95, 80.95)


def test_run_backend_rejects_invalid_longitude():
    with pytest.raises(ValueError, match="Longitude"):
        run_backend({}, 26.85, 190)


def test_run_backend_rejects_non_dict_property_data():
    with pytest.raises(ValueError, match="dictionary"):
        run_backend([], 26.85, 80.95)
