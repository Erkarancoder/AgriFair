import math
from typing import Optional


VALID_NEEDS = {"Low", "Medium", "High"}

# Rainfall thresholds (mm over the next 24 hours)
RAINFALL_HEAVY_MM = 10.0     # Overrides all need levels — skip irrigation
RAINFALL_MODERATE_MM = 4.0   # Sufficient for Low/Medium needs

# Agronomic parameters (FAO-56 standards)
FIELD_CAPACITY = {
    "Sandy": 0.18,
    "Silt": 0.28,
    "Loamy": 0.32,
    "Clay": 0.38,
}

ROOT_DEPTH_MM = {
    "Rice": {"Sowing": 150, "Vegetative": 250, "Flowering": 350, "Harvest": 300},
    "Wheat": {"Sowing": 150, "Vegetative": 400, "Flowering": 800, "Harvest": 750},
    "Maize": {"Sowing": 150, "Vegetative": 500, "Flowering": 900, "Harvest": 800},
    "Sugarcane": {"Sowing": 250, "Vegetative": 600, "Flowering": 1200, "Harvest": 1000},
    "Potato": {"Sowing": 150, "Vegetative": 300, "Flowering": 500, "Harvest": 400},
    "Cotton": {"Sowing": 200, "Vegetative": 500, "Flowering": 1000, "Harvest": 900},
}

IRRIGATION_EFFICIENCY = {
    "Drip": 0.90,
    "Sprinkler": 0.75,
    "Flood": 0.60,
}

# Discharge (L/hr) based on (Motor HP, Pipe Diameter in Inches)
PUMP_DISCHARGE_LPH = {
    (3.0, 2.0): 16000,
    (3.0, 2.5): 22000,
    (3.0, 3.0): 28000,
    (3.0, 4.0): 32000,
    (5.0, 2.0): 22000,
    (5.0, 2.5): 33000,
    (5.0, 3.0): 45000,
    (5.0, 4.0): 52000,
    (7.5, 2.0): 26000,
    (7.5, 2.5): 42000,
    (7.5, 3.0): 60000,
    (7.5, 4.0): 75000,
    (10.0, 2.0): 30000,
    (10.0, 2.5): 50000,
    (10.0, 3.0): 75000,
    (10.0, 4.0): 95000,
}


def calculate_water_schedule(
    action: str,
    irrigation_need: str,
    rainfall_next_24h_mm: float,
    soil_moisture: Optional[float] = None,
    crop_type: Optional[str] = None,
    crop_growth_stage: Optional[str] = None,
    soil_type: Optional[str] = None,
    area_acres: float = 2.5,
    pipe_diameter_inches: float = 2.5,
    motor_hp: float = 5.0,
    irrigation_method: str = "Flood",
) -> dict:
    """Calculate water volume required (liters) and estimated pump duration."""
    area = max(0.1, float(area_acres) if area_acres is not None else 2.5)
    pipe_dia = float(pipe_diameter_inches) if pipe_diameter_inches is not None else 2.5
    hp = float(motor_hp) if motor_hp is not None else 5.0
    method = irrigation_method if irrigation_method in IRRIGATION_EFFICIENCY else "Flood"

    discharge_lph = PUMP_DISCHARGE_LPH.get((hp, pipe_dia))
    if discharge_lph is None:
        ratio = (pipe_dia / 2.5) ** 1.5
        discharge_lph = int(hp * 6600 * ratio)

    # When skipping irrigation, no water or pump runtime is needed
    if action == "SKIP_IRRIGATION":
        return {
            "water_volume_liters": 0,
            "water_volume_m3": 0.0,
            "gross_water_depth_mm": 0.0,
            "pump_runtime_hours": 0.0,
            "pump_runtime_formatted": "0 hrs (Irrigation Skipped)",
            "pump_discharge_lph": discharge_lph,
            "pipe_diameter_inches": pipe_dia,
            "motor_hp": hp,
            "irrigation_method": method,
            "area_acres": area,
        }

    fc = FIELD_CAPACITY.get(soil_type, 0.30)
    current_moisture_frac = (float(soil_moisture) / 100.0) if soil_moisture is not None else (fc * 0.6)

    # Moisture deficit
    deficit = max(0.05, fc - current_moisture_frac)
    if irrigation_need == "High":
        deficit = max(deficit, 0.12)
    elif irrigation_need == "Low":
        deficit = min(deficit, 0.06)

    stage_depths = ROOT_DEPTH_MM.get(crop_type, {"Vegetative": 400})
    root_depth_mm = stage_depths.get(crop_growth_stage, 400)

    # Net irrigation depth (mm)
    net_water_mm = deficit * root_depth_mm

    # Offset by upcoming forecast rainfall
    effective_rain = min(rainfall_next_24h_mm, net_water_mm * 0.8)
    net_water_mm = max(10.0, net_water_mm - effective_rain)

    # Account for application efficiency
    efficiency = IRRIGATION_EFFICIENCY.get(method, 0.60)
    gross_water_mm = net_water_mm / efficiency

    # 1 mm over 1 acre = 4,047 Liters
    total_liters = int(gross_water_mm * area * 4047)
    total_m3 = round(total_liters / 1000.0, 1)

    # Pumping duration
    runtime_hours = round(total_liters / discharge_lph, 2)
    full_hours = int(runtime_hours)
    minutes = int(round((runtime_hours - full_hours) * 60))

    if full_hours == 0:
        runtime_str = f"{minutes} mins"
    elif minutes == 0:
        runtime_str = f"{full_hours} hrs"
    else:
        runtime_str = f"{full_hours} hrs {minutes} mins"

    return {
        "water_volume_liters": total_liters,
        "water_volume_m3": total_m3,
        "gross_water_depth_mm": round(gross_water_mm, 1),
        "pump_runtime_hours": runtime_hours,
        "pump_runtime_formatted": runtime_str,
        "pump_discharge_lph": discharge_lph,
        "pipe_diameter_inches": pipe_dia,
        "motor_hp": hp,
        "irrigation_method": method,
        "area_acres": area,
    }


def recommend_action(
    irrigation_need: str,
    rainfall_next_24h_mm: Optional[float],
    soil_moisture: Optional[float] = None,
    crop_type: Optional[str] = None,
    crop_growth_stage: Optional[str] = None,
    soil_type: Optional[str] = None,
    area_acres: float = 2.5,
    pipe_diameter_inches: float = 2.5,
    motor_hp: float = 5.0,
    irrigation_method: str = "Flood",
) -> dict:
    """
    Return an actionable irrigation recommendation based on the ML prediction,
    the 24-hour rainfall forecast, and calculate the exact water volume & pump duration.
    """

    if irrigation_need not in VALID_NEEDS:
        return {
            "action": "INSUFFICIENT_DATA",
            "reason": "Invalid or unavailable irrigation-need prediction.",
        }

    if rainfall_next_24h_mm is None:
        return {
            "action": "INSUFFICIENT_DATA",
            "reason": "Rainfall forecast is unavailable.",
        }

    try:
        rainfall = float(rainfall_next_24h_mm)
    except (TypeError, ValueError, OverflowError):
        return {
            "action": "INSUFFICIENT_DATA",
            "reason": "Rainfall forecast must be numeric.",
        }

    if not math.isfinite(rainfall) or rainfall < 0:
        return {
            "action": "INSUFFICIENT_DATA",
            "reason": "Rainfall forecast must be finite and non-negative.",
        }

    # Determine action and agronomic rationale
    if rainfall >= RAINFALL_HEAVY_MM:
        action = "SKIP_IRRIGATION"
        reason = (
            f"Heavy rainfall expected ({rainfall:.1f} mm over next 24 h). "
            "Natural rainfall will meet crop water demand — no irrigation needed."
        )
    elif irrigation_need == "Low":
        if rainfall >= RAINFALL_MODERATE_MM:
            action = "SKIP_IRRIGATION"
            reason = (
                f"Soil moisture need is Low and moderate rainfall is forecast "
                f"({rainfall:.1f} mm). No irrigation required at this time."
            )
        else:
            action = "MONITOR"
            reason = (
                f"Soil moisture need is Low and minimal rainfall is expected "
                f"({rainfall:.1f} mm). Monitor field conditions; irrigate only if "
                "moisture drops further."
            )
    elif irrigation_need == "Medium":
        if rainfall >= RAINFALL_MODERATE_MM:
            action = "SKIP_IRRIGATION"
            reason = (
                f"Moderate rainfall forecast ({rainfall:.1f} mm) should offset "
                "the medium water need. Re-check soil moisture after rainfall."
            )
        else:
            action = "IRRIGATE_SOON"
            reason = (
                f"Medium water need detected with little rain expected "
                f"({rainfall:.1f} mm). Plan irrigation within the next 12–24 hours "
                "to avoid crop stress."
            )
    else:  # High need
        if rainfall >= RAINFALL_MODERATE_MM:
            action = "MONITOR"
            reason = (
                f"High water need detected but moderate rain is forecast "
                f"({rainfall:.1f} mm). Monitor after rainfall — irrigate immediately "
                "if soil moisture remains critically low."
            )
        else:
            action = "IRRIGATE_NOW"
            reason = (
                f"High water need with negligible rainfall forecast ({rainfall:.1f} mm). "
                "Irrigate as soon as possible to prevent crop stress and yield loss."
            )

    water_schedule = calculate_water_schedule(
        action=action,
        irrigation_need=irrigation_need,
        rainfall_next_24h_mm=rainfall,
        soil_moisture=soil_moisture,
        crop_type=crop_type,
        crop_growth_stage=crop_growth_stage,
        soil_type=soil_type,
        area_acres=area_acres,
        pipe_diameter_inches=pipe_diameter_inches,
        motor_hp=motor_hp,
        irrigation_method=irrigation_method,
    )

    return {
        "action": action,
        "reason": reason,
        "irrigation_need": irrigation_need,
        "rainfall_next_24h_mm": round(rainfall, 2),
        "water_schedule": water_schedule,
    }
