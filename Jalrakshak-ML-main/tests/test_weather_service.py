import sys
from pathlib import Path
from datetime import datetime, timedelta

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.weather_service import (
    get_rainfall_forecast,
    clear_weather_cache,
    get_weather_cache_size,
)


@pytest.fixture(autouse=True)
def reset_weather_cache():
    clear_weather_cache()
    yield
    clear_weather_cache()


def make_hourly_times():
    start = datetime.now().replace(
        minute=0,
        second=0,
        microsecond=0,
    )
    return [
        (start + timedelta(hours=i)).isoformat(timespec="minutes")
        for i in range(24)
    ]


def make_mock_response(precipitation):
    class MockResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {
                "latitude": 26.85,
                "longitude": 80.95,
                "timezone": "Asia/Kolkata",
                "current": {
                    "temperature_2m": 30.5,
                    "relative_humidity_2m": 65,
                },
                "hourly": {
                    "time": make_hourly_times(),
                    "precipitation": precipitation,
                },
            }

    return MockResponse()


class MockResponseWithTimeout:
    def __init__(self, response, kwargs):
        assert kwargs["timeout"] == 10
        self.response = response

    def raise_for_status(self):
        self.response.raise_for_status()

    def json(self):
        return self.response.json()


def test_rainfall_forecast_success(monkeypatch):
    rainfall = [1.2, 0.8] + [0.0] * 22

    monkeypatch.setattr(
        "src.weather_service.requests.get",
        lambda *args, **kwargs: MockResponseWithTimeout(
            make_mock_response(rainfall),
            kwargs,
        ),
    )

    result = get_rainfall_forecast(26.85, 80.95)

    assert result["rainfall_next_24h_mm"] == 2.0
    assert result["forecast_hours"] == 24
    assert result["timezone"] == "Asia/Kolkata"
    assert result["temperature_c"] == 30.5
    assert result["humidity_percent"] == 65
    assert len(result["hourly_forecast"]) == 24


def test_rainfall_forecast_uses_cache(monkeypatch):
    calls = []
    rainfall = [1.0] + [0.0] * 23

    def mock_get(*args, **kwargs):
        calls.append(args)
        return MockResponseWithTimeout(
            make_mock_response(rainfall),
            kwargs,
        )

    monkeypatch.setattr("src.weather_service.requests.get", mock_get)

    assert get_weather_cache_size() == 0

    first = get_rainfall_forecast(26.851, 80.951)
    assert len(calls) == 1
    assert get_weather_cache_size() == 1

    # Second call with nearby coordinates (rounds to 26.85, 80.95) hits cache
    second = get_rainfall_forecast(26.854, 80.949)
    assert len(calls) == 1
    assert second["rainfall_next_24h_mm"] == first["rainfall_next_24h_mm"]

    # Explicit clear resets cache
    clear_weather_cache()
    assert get_weather_cache_size() == 0

    # Call after clear fetches again
    third = get_rainfall_forecast(26.85, 80.95)
    assert len(calls) == 2


def test_invalid_latitude_raises_error():
    with pytest.raises(ValueError, match="Latitude"):
        get_rainfall_forecast(95, 80.95)


def test_invalid_longitude_raises_error():
    with pytest.raises(ValueError, match="Longitude"):
        get_rainfall_forecast(26.85, 190)


@pytest.mark.parametrize(
    "invalid_value",
    [float("nan"), float("inf")],
)
def test_invalid_rainfall_raises_error(monkeypatch, invalid_value):
    rainfall = [0.0] * 24
    rainfall[0] = invalid_value

    monkeypatch.setattr(
        "src.weather_service.requests.get",
        lambda *args, **kwargs: make_mock_response(rainfall),
    )

    with pytest.raises(RuntimeError, match="invalid rainfall values"):
        get_rainfall_forecast(26.85, 80.95)
