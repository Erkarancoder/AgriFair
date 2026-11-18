import copy
import math
import time
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Any

import requests


FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
DEFAULT_CACHE_TTL_SECONDS = 900  # 15 minutes

# In-memory weather cache: (rounded_lat, rounded_lon) -> (timestamp, data_dict)
_weather_cache: dict[tuple[float, float], tuple[float, dict[str, Any]]] = {}


def clear_weather_cache() -> None:
    """Clear all entries in the weather cache."""
    _weather_cache.clear()


def get_weather_cache_size() -> int:
    """Return the number of entries currently in the weather cache."""
    return len(_weather_cache)


def get_rainfall_forecast(
    latitude: float,
    longitude: float,
    use_cache: bool = True,
    cache_ttl_seconds: int = DEFAULT_CACHE_TTL_SECONDS,
) -> dict:
    """Fetch current weather and the next 24 hours of rainfall with optional caching."""

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except (TypeError, ValueError, OverflowError) as exc:
        raise ValueError("Coordinates must be numeric") from exc

    if not math.isfinite(latitude) or not -90 <= latitude <= 90:
        raise ValueError("Latitude must be finite and between -90 and 90")

    if not math.isfinite(longitude) or not -180 <= longitude <= 180:
        raise ValueError("Longitude must be finite and between -180 and 180")

    cache_key = (round(latitude, 2), round(longitude, 2))

    if use_cache and cache_key in _weather_cache:
        cached_time, cached_data = _weather_cache[cache_key]
        if time.time() - cached_time < cache_ttl_seconds:
            return copy.deepcopy(cached_data)

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m",
        "hourly": "precipitation",
        "forecast_days": 2,
        "timezone": "auto",
    }

    try:
        response = requests.get(FORECAST_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise RuntimeError(
            "Unable to retrieve a valid weather forecast"
        ) from exc

    if not isinstance(data, dict):
        raise RuntimeError("Weather API returned an invalid response")

    timezone_name = data.get("timezone")
    current = data.get("current")
    hourly = data.get("hourly")

    if not isinstance(timezone_name, str) or not timezone_name:
        raise RuntimeError("Weather API did not return a valid timezone")

    if not isinstance(current, dict) or not isinstance(hourly, dict):
        raise RuntimeError("Weather API returned incomplete weather data")

    try:
        temperature = float(current["temperature_2m"])
        humidity = float(current["relative_humidity_2m"])
    except (KeyError, TypeError, ValueError, OverflowError) as exc:
        raise RuntimeError("Weather API returned invalid current weather") from exc

    if (
        not math.isfinite(temperature)
        or not math.isfinite(humidity)
        or not 0 <= humidity <= 100
    ):
        raise RuntimeError("Weather API returned invalid current weather values")

    times = hourly.get("time")
    precipitation = hourly.get("precipitation")

    if (
        not isinstance(times, list)
        or not isinstance(precipitation, list)
        or len(times) != len(precipitation)
        or not times
    ):
        raise RuntimeError("Weather API returned incomplete rainfall data")

    try:
        forecast_times = [
            datetime.fromisoformat(timestamp) for timestamp in times
        ]
        rainfall_values = [float(value) for value in precipitation]
        forecast_timezone = ZoneInfo(timezone_name)
        now_local = datetime.now(forecast_timezone).replace(
            minute=0, second=0, microsecond=0, tzinfo=None
        )
    except (TypeError, ValueError, OverflowError, KeyError) as exc:
        raise RuntimeError("Weather API returned invalid forecast data") from exc
    except Exception as exc:
        raise RuntimeError("Unable to determine the forecast timezone") from exc

    if any(not math.isfinite(value) or value < 0 for value in rainfall_values):
        raise RuntimeError("Weather API returned invalid rainfall values")

    start_index = next(
        (
            index
            for index, forecast_time in enumerate(forecast_times)
            if forecast_time >= now_local
        ),
        None,
    )

    if start_index is None or start_index + 24 > len(rainfall_values):
        raise RuntimeError(
            "Insufficient hourly forecast data for the next 24 hours"
        )

    selected_times = times[start_index:start_index + 24]
    selected_rainfall = rainfall_values[start_index:start_index + 24]

    result = {
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "timezone": timezone_name,
        "temperature_c": temperature,
        "humidity_percent": humidity,
        "forecast_hours": len(selected_rainfall),
        "rainfall_next_24h_mm": round(sum(selected_rainfall), 2),
        "hourly_forecast": [
            {"time": ts, "precipitation_mm": rainfall}
            for ts, rainfall in zip(selected_times, selected_rainfall)
        ],
    }

    if use_cache:
        _weather_cache[cache_key] = (time.time(), copy.deepcopy(result))

    return result
