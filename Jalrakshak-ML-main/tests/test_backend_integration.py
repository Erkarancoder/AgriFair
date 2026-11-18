import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.decision_service import recommend_action
from src.predict import predict_irrigation_need
from src import weather_service


def test_prediction_flows_into_decision_service(monkeypatch):
    # Sample input for the ML model
    sample = {
        "Soil_Moisture": 18.0,
        "Crop_Type": "Rice",
        "Crop_Growth_Stage": "Vegetative",
        "Soil_Type": "Clay",
        "Temperature_C": 34.0,
        "Rainfall_mm": 100.0,
        "Humidity": 55.0,
    }

    # Step 1: Generate ML prediction
    prediction = predict_irrigation_need(sample)

    assert prediction in {"Low", "Medium", "High"}

    # Step 2: Mock the weather service
    def mock_weather_forecast(latitude, longitude):
        return {
            "latitude": latitude,
            "longitude": longitude,
            "timezone": "Asia/Kolkata",
            "forecast_hours": 24,
            "rainfall_next_24h_mm": 2.5,
            "hourly_forecast": [],
        }

    monkeypatch.setattr(
        weather_service,
        "get_rainfall_forecast",
        mock_weather_forecast,
    )

    # Step 3: Get mocked rainfall forecast
    rainfall = weather_service.get_rainfall_forecast(26.85, 80.95)

    assert rainfall["forecast_hours"] == 24
    assert rainfall["rainfall_next_24h_mm"] == 2.5

    # Step 4: Pass prediction and rainfall to decision service
    result = recommend_action(
        irrigation_need=prediction,
        rainfall_next_24h_mm=rainfall["rainfall_next_24h_mm"],
    )

    # Step 5: Validate the complete workflow (High need + 2.5mm rain -> IRRIGATE_NOW)
    assert result["action"] == "IRRIGATE_NOW"
    assert result["irrigation_need"] == prediction
    assert result["rainfall_next_24h_mm"] == 2.5
