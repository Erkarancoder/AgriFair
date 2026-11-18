
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.predict import predict_irrigation_need


def make_valid_sample():
    return {
        "Soil_Moisture": 18.0,
        "Crop_Type": "Rice",
        "Crop_Growth_Stage": "Vegetative",
        "Soil_Type": "Clay",
        "Temperature_C": 34.0,
        "Humidity": 55.0,
    }


def test_prediction_returns_valid_class():
    result = predict_irrigation_need(make_valid_sample())

    assert result in {"Low", "Medium", "High"}


def test_prediction_does_not_require_rainfall():
    sample = make_valid_sample()

    assert "Rainfall_mm" not in sample
    result = predict_irrigation_need(sample)

    assert result in {"Low", "Medium", "High"}


def test_missing_feature_raises_error():
    sample = {
        "Soil_Moisture": 18.0,
        "Crop_Type": "Rice",
    }

    with pytest.raises(ValueError, match="Missing required features"):
        predict_irrigation_need(sample)


def test_invalid_humidity_raises_error():
    sample = make_valid_sample()
    sample["Humidity"] = 150.0

    with pytest.raises(
        ValueError, match="Humidity must be between 0 and 100"
    ):
        predict_irrigation_need(sample)


def test_non_numeric_temperature_raises_error():
    sample = make_valid_sample()
    sample["Temperature_C"] = "hot"

    with pytest.raises(ValueError, match="Temperature_C must be numeric"):
        predict_irrigation_need(sample)


def test_nan_temperature_raises_error():
    sample = make_valid_sample()
    sample["Temperature_C"] = float("nan")

    with pytest.raises(
        ValueError, match="Temperature_C cannot be missing"
    ):
        predict_irrigation_need(sample)


def test_infinite_temperature_raises_error():
    sample = make_valid_sample()
    sample["Temperature_C"] = float("inf")

    with pytest.raises(ValueError, match="Temperature_C must be finite"):
        predict_irrigation_need(sample)


def test_invalid_crop_type_raises_error():
    sample = make_valid_sample()
    sample["Crop_Type"] = "UnknownCrop"

    with pytest.raises(ValueError, match="Invalid Crop_Type"):
        predict_irrigation_need(sample)


def test_invalid_soil_type_raises_error():
    sample = make_valid_sample()
    sample["Soil_Type"] = "UnknownSoil"

    with pytest.raises(ValueError, match="Invalid Soil_Type"):
        predict_irrigation_need(sample)


def test_non_numeric_soil_moisture_raises_error():
    sample = make_valid_sample()
    sample["Soil_Moisture"] = "wet"

    with pytest.raises(ValueError, match="Soil_Moisture must be numeric"):
        predict_irrigation_need(sample)


def test_soil_moisture_above_range_raises_error():
    sample = make_valid_sample()
    sample["Soil_Moisture"] = 101

    with pytest.raises(
        ValueError, match="Soil_Moisture must be between 0 and 100"
    ):
        predict_irrigation_need(sample)


def test_negative_soil_moisture_raises_error():
    sample = make_valid_sample()
    sample["Soil_Moisture"] = -1

    with pytest.raises(
        ValueError, match="Soil_Moisture must be between 0 and 100"
    ):
        predict_irrigation_need(sample)


def test_negative_humidity_raises_error():
    sample = make_valid_sample()
    sample["Humidity"] = -1

    with pytest.raises(
        ValueError, match="Humidity must be between 0 and 100"
    ):
        predict_irrigation_need(sample)


def test_invalid_growth_stage_raises_error():
    sample = make_valid_sample()
    sample["Crop_Growth_Stage"] = "UnknownStage"

    with pytest.raises(ValueError, match="Invalid Crop_Growth_Stage"):
        predict_irrigation_need(sample)
