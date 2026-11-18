import os
import logging
from contextlib import asynccontextmanager
from typing import Any, Literal, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.backend_service import run_backend
from src.predict import load_model
from src.weather_service import get_rainfall_forecast


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CropType = Literal["Rice", "Maize", "Sugarcane", "Potato", "Wheat", "Cotton"]
CropGrowthStage = Literal["Sowing", "Vegetative", "Flowering", "Harvest"]
SoilType = Literal["Sandy", "Silt", "Loamy", "Clay"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler to pre-load the ML model on startup."""
    try:
        logger.info("Pre-warming ML model...")
        load_model()
        logger.info("ML model loaded successfully.")
    except Exception as exc:
        logger.error("Failed to pre-load ML model during startup: %s", exc)
    yield


app = FastAPI(
    title="Jalrakshak-ML API",
    description="Irrigation prediction and live weather forecast API",
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
allowed_origins = [
    origin.strip()
    for origin in cors_origins_env.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


class IrrigationRequest(BaseModel):
    soil_moisture: float = Field(
        alias="Soil_Moisture",
        ge=0,
        le=100,
        description="Soil moisture percentage (0-100)",
    )
    crop_type: CropType = Field(
        alias="Crop_Type",
        description="Type of crop being cultivated",
    )
    crop_growth_stage: CropGrowthStage = Field(
        alias="Crop_Growth_Stage",
        description="Current crop growth stage",
    )
    soil_type: SoilType = Field(
        alias="Soil_Type",
        description="Type of soil",
    )
    latitude: float = Field(
        ge=-90,
        le=90,
        description="Latitude coordinate (-90 to 90)",
    )
    longitude: float = Field(
        ge=-180,
        le=180,
        description="Longitude coordinate (-180 to 180)",
    )
    area_acres: Optional[float] = Field(
        default=2.5,
        ge=0.01,
        le=10000,
        alias="area_acres",
        description="Field size in acres",
    )
    pipe_diameter_inches: Optional[float] = Field(
        default=2.5,
        ge=0.5,
        le=12.0,
        alias="pipe_diameter_inches",
        description="Delivery pipe diameter in inches",
    )
    motor_hp: Optional[float] = Field(
        default=5.0,
        ge=0.5,
        le=100.0,
        alias="motor_hp",
        description="Pump motor horsepower rating",
    )
    irrigation_method: Optional[str] = Field(
        default="Flood",
        alias="irrigation_method",
        description="Irrigation method: Flood, Drip, or Sprinkler",
    )

    model_config = {"populate_by_name": True}


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": "Jalrakshak-ML API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.get("/weather")
def weather(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude coordinate (-90 to 90)"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude coordinate (-180 to 180)"),
) -> dict[str, Any]:
    """Retrieve live weather and 24-hour rainfall forecast for field coordinates."""
    try:
        return get_rainfall_forecast(latitude, longitude)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        logger.warning("Weather forecast service unavailable: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Weather forecast service is unavailable.",
        ) from exc


@app.post("/predict")
def predict(request: IrrigationRequest) -> dict[str, Any]:
    try:
        property_data = {
            "Soil_Moisture": request.soil_moisture,
            "Crop_Type": request.crop_type,
            "Crop_Growth_Stage": request.crop_growth_stage,
            "Soil_Type": request.soil_type,
            "area_acres": request.area_acres,
            "pipe_diameter_inches": request.pipe_diameter_inches,
            "motor_hp": request.motor_hp,
            "irrigation_method": request.irrigation_method,
        }

        return run_backend(
            property_data=property_data,
            latitude=request.latitude,
            longitude=request.longitude,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except RuntimeError as exc:
        logger.warning(
            "Prediction or weather service unavailable: %s",
            exc,
        )
        raise HTTPException(
            status_code=503,
            detail=(
                "Prediction service or weather forecast is unavailable."
            ),
        ) from exc

    except Exception as exc:
        logger.exception("Unexpected error while processing prediction")
        raise HTTPException(
            status_code=500,
            detail="An unexpected internal error occurred.",
        ) from exc


# ── IoT Sensor Stub Endpoint ──────────────────────────────────────────────────
# This endpoint is the integration point for real ESP32 hardware in production.
# Currently it accepts and acknowledges sensor payloads but does not persist them.
# Future: store readings in MongoDB / TimescaleDB and serve via GET /api/sensor/latest


class SensorReading(BaseModel):
    """Schema matching the ESP32 capacitive soil moisture sensor payload."""
    sensor_id: str = Field(..., description="Physical sensor node ID (e.g. JS-NODE-01)")
    land_id: str = Field(..., description="Land plot ID this sensor is attached to")
    soil_moisture: float = Field(..., ge=0, le=100, description="Soil moisture percentage")
    probe_depth_cm: int = Field(..., description="Sensor probe depth in cm")
    battery_pct: float = Field(..., ge=0, le=100, description="Sensor battery level %")
    signal_rssi: int = Field(..., description="LoRa/GSM RSSI signal strength in dBm")
    signal_type: str = Field(default="LoRa/GSM", description="Communication protocol")
    status: str = Field(default="active")
    simulated: bool = Field(default=False, description="True if this is a simulated reading")
    timestamp: str = Field(..., description="ISO 8601 timestamp from sensor RTC")


@app.post("/api/sensor/reading", status_code=202)
def receive_sensor_reading(reading: SensorReading) -> dict[str, Any]:
    """
    Accept a soil moisture reading from an ESP32 field sensor node.

    Returns HTTP 202 Accepted. Currently logs and acknowledges only.
    Future: persist to time-series database and trigger irrigation alerts.
    """
    logger.info(
        "Sensor reading received | node=%s land=%s moisture=%.1f%% battery=%.0f%% rssi=%d dBm simulated=%s",
        reading.sensor_id,
        reading.land_id,
        reading.soil_moisture,
        reading.battery_pct,
        reading.signal_rssi,
        reading.simulated,
    )
    return {
        "status": "accepted",
        "sensor_id": reading.sensor_id,
        "land_id": reading.land_id,
        "soil_moisture": reading.soil_moisture,
        "message": (
            "Reading acknowledged. Persistence layer not yet connected — "
            "replace this stub with MongoDB/TimescaleDB integration."
        ),
    }
