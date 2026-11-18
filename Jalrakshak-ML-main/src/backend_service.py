import math
from typing import Any

from src.predict import predict_irrigation_need
from src.weather_service import get_rainfall_forecast
from src.decision_service import recommend_action


def validate_coordinates(
    latitude: float,
    longitude: float,
) -> tuple[float, float]:
    """Validate coordinates and return normalized float values."""

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except (TypeError, ValueError, OverflowError) as exc:
        raise ValueError("Coordinates must be numeric") from exc

    if not math.isfinite(latitude) or not -90 <= latitude <= 90:
        raise ValueError(
            "Latitude must be finite and between -90 and 90"
        )

    if not math.isfinite(longitude) or not -180 <= longitude <= 180:
        raise ValueError(
            "Longitude must be finite and between -180 and 180"
        )

    return latitude, longitude


def run_backend(
    property_data: dict,
    latitude: float,
    longitude: float,
) -> dict[str, Any]:
    """Fetch live weather, predict irrigation need, and recommend review."""

    if not isinstance(property_data, dict):
        raise ValueError("Property data must be a dictionary")

    latitude, longitude = validate_coordinates(latitude, longitude)

    # Step 1: Fetch live weather and the next 24 hours' rainfall.
    weather = get_rainfall_forecast(latitude, longitude)

    # Step 2: Prepare the six features required by the original model.
    model_input = {
        "Soil_Moisture": property_data.get("Soil_Moisture"),
        "Crop_Type": property_data.get("Crop_Type"),
        "Crop_Growth_Stage": property_data.get("Crop_Growth_Stage"),
        "Soil_Type": property_data.get("Soil_Type"),
        "Temperature_C": weather["temperature_c"],
        "Humidity": weather["humidity_percent"],
    }

    # Step 3: Predict using the original six-feature model.
    prediction = predict_irrigation_need(model_input)

    # Step 4: Calculate actionable recommendation and water schedule
    decision = recommend_action(
        irrigation_need=prediction,
        rainfall_next_24h_mm=weather["rainfall_next_24h_mm"],
        soil_moisture=property_data.get("Soil_Moisture"),
        crop_type=property_data.get("Crop_Type"),
        crop_growth_stage=property_data.get("Crop_Growth_Stage"),
        soil_type=property_data.get("Soil_Type"),
        area_acres=property_data.get("area_acres", 2.5),
        pipe_diameter_inches=property_data.get("pipe_diameter_inches", 2.5),
        motor_hp=property_data.get("motor_hp", 5.0),
        irrigation_method=property_data.get("irrigation_method", "Flood"),
    )

    return {
        "status": "success",
        "prediction": {
            "irrigation_need": prediction,
        },
        "weather": weather,
        "decision": decision,
    }
