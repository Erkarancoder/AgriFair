from pathlib import Path
import math
from typing import Any

import joblib
import pandas as pd

from src.features import AgronomicFeatureEngineer


PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = PROJECT_ROOT / "models" / "irrigation_need_model.joblib"

FEATURES = [
    "Soil_Moisture",
    "Crop_Type",
    "Crop_Growth_Stage",
    "Soil_Type",
    "Temperature_C",
    "Humidity",
]

VALID_CROP_TYPES = {
    "Rice", "Maize", "Sugarcane", "Potato", "Wheat", "Cotton"
}

VALID_GROWTH_STAGES = {
    "Sowing", "Vegetative", "Flowering", "Harvest"
}

VALID_SOIL_TYPES = {
    "Sandy", "Silt", "Loamy", "Clay"
}

NUMERIC_FEATURES = [
    "Soil_Moisture",
    "Temperature_C",
    "Humidity",
]

_model: Any = None


def get_model() -> Any:
    """Load model lazily on first access and cache in memory."""
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")
        loaded = joblib.load(MODEL_PATH)
        if list(loaded.feature_names_in_) != FEATURES:
            raise RuntimeError(
                "Model feature mismatch. "
                f"Expected {FEATURES}, got {list(loaded.feature_names_in_)}"
            )
        _model = loaded
    return _model


def load_model() -> Any:
    """Explicitly pre-load the model artifact into memory."""
    return get_model()


def __getattr__(name: str) -> Any:
    """Module-level attribute fallback for backward-compatible `predict.model` access."""
    if name == "model":
        return get_model()
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")


def predict_irrigation_need(property_data: dict) -> str:
    """Predict irrigation need using the agronomic ensemble pipeline with safety guardrails."""

    if not isinstance(property_data, dict):
        raise TypeError("property_data must be a dictionary")

    missing_features = [
        feature for feature in FEATURES
        if feature not in property_data
    ]

    if missing_features:
        raise ValueError(
            f"Missing required features: {missing_features}"
        )

    input_df = pd.DataFrame([
        {feature: property_data[feature] for feature in FEATURES}
    ])

    categorical_checks = {
        "Crop_Type": VALID_CROP_TYPES,
        "Crop_Growth_Stage": VALID_GROWTH_STAGES,
        "Soil_Type": VALID_SOIL_TYPES,
    }

    for feature, allowed_values in categorical_checks.items():
        value = input_df.at[0, feature]

        if not isinstance(value, str) or value not in allowed_values:
            raise ValueError(
                f"Invalid {feature}: {value!r}. "
                f"Allowed values: {sorted(allowed_values)}"
            )

    for feature in NUMERIC_FEATURES:
        value = input_df.at[0, feature]

        if pd.isna(value):
            raise ValueError(f"{feature} cannot be missing")

        try:
            numeric_value = float(value)
        except (TypeError, ValueError, OverflowError):
            raise ValueError(f"{feature} must be numeric") from None

        if not math.isfinite(numeric_value):
            raise ValueError(f"{feature} must be finite")

        if feature in {"Soil_Moisture", "Humidity"}:
            if not 0 <= numeric_value <= 100:
                raise ValueError(
                    f"{feature} must be between 0 and 100"
                )

        input_df.at[0, feature] = numeric_value

    current_model = get_model()
    raw_prediction = current_model.predict(input_df)[0]
    prediction = str(raw_prediction)

    # Agronomic physics guardrails
    soil_type = str(input_df.at[0, "Soil_Type"])
    moisture = float(input_df.at[0, "Soil_Moisture"])
    stage = str(input_df.at[0, "Crop_Growth_Stage"])

    pwp = AgronomicFeatureEngineer.PWP_MAP.get(soil_type, 15.0)
    fc = AgronomicFeatureEngineer.FC_MAP.get(soil_type, 30.0)

    # Critical wilting threshold: if below wilting point in active growth, enforce High
    if moisture <= pwp and stage in {"Vegetative", "Flowering"}:
        prediction = "High"
    # Saturated soil well above field capacity cannot have High water need
    elif moisture >= fc + 6.0 and prediction == "High":
        prediction = "Medium"

    return prediction
