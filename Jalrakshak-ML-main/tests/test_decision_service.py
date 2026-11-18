import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.decision_service import recommend_action


# ── Guard / error-path tests ────────────────────────────────────────────────

def test_missing_rainfall_returns_insufficient_data():
    result = recommend_action("High", None)
    assert result["action"] == "INSUFFICIENT_DATA"


def test_negative_rainfall_returns_insufficient_data():
    result = recommend_action("Medium", -5)
    assert result["action"] == "INSUFFICIENT_DATA"


def test_invalid_prediction_returns_insufficient_data():
    result = recommend_action("Unknown", 5)
    assert result["action"] == "INSUFFICIENT_DATA"


def test_non_numeric_rainfall_returns_insufficient_data():
    result = recommend_action("High", "lots")
    assert result["action"] == "INSUFFICIENT_DATA"


def test_inf_rainfall_returns_insufficient_data():
    result = recommend_action("High", float("inf"))
    assert result["action"] == "INSUFFICIENT_DATA"


# ── Heavy rain (>= 10 mm) always skips regardless of need ───────────────────

def test_heavy_rain_skips_irrigation_for_high_need():
    result = recommend_action("High", 12.0)
    assert result["action"] == "SKIP_IRRIGATION"
    assert result["irrigation_need"] == "High"
    assert result["rainfall_next_24h_mm"] == 12.0


def test_heavy_rain_skips_irrigation_for_medium_need():
    result = recommend_action("Medium", 10.0)
    assert result["action"] == "SKIP_IRRIGATION"


def test_heavy_rain_skips_irrigation_for_low_need():
    result = recommend_action("Low", 15.5)
    assert result["action"] == "SKIP_IRRIGATION"


# ── Low need ────────────────────────────────────────────────────────────────

def test_low_need_moderate_rain_skips():
    result = recommend_action("Low", 5.0)
    assert result["action"] == "SKIP_IRRIGATION"
    assert result["irrigation_need"] == "Low"


def test_low_need_no_rain_monitors():
    result = recommend_action("Low", 0.0)
    assert result["action"] == "MONITOR"
    assert result["rainfall_next_24h_mm"] == 0.0


def test_low_need_exactly_moderate_threshold_skips():
    result = recommend_action("Low", 4.0)
    assert result["action"] == "SKIP_IRRIGATION"


def test_low_need_just_below_threshold_monitors():
    result = recommend_action("Low", 3.9)
    assert result["action"] == "MONITOR"


# ── Medium need ─────────────────────────────────────────────────────────────

def test_medium_need_moderate_rain_skips():
    result = recommend_action("Medium", 4.0)
    assert result["action"] == "SKIP_IRRIGATION"
    assert result["irrigation_need"] == "Medium"


def test_medium_need_low_rain_irrigate_soon():
    result = recommend_action("Medium", 2.5)
    assert result["action"] == "IRRIGATE_SOON"
    assert result["irrigation_need"] == "Medium"
    assert result["rainfall_next_24h_mm"] == 2.5
    assert "reason" in result


def test_medium_need_no_rain_irrigate_soon():
    result = recommend_action("Medium", 0.0)
    assert result["action"] == "IRRIGATE_SOON"


# ── High need ───────────────────────────────────────────────────────────────

def test_high_need_moderate_rain_monitors():
    result = recommend_action("High", 6.0)
    assert result["action"] == "MONITOR"
    assert result["irrigation_need"] == "High"


def test_high_need_low_rain_irrigate_now():
    result = recommend_action("High", 2.5)
    assert result["action"] == "IRRIGATE_NOW"
    assert result["irrigation_need"] == "High"
    assert result["rainfall_next_24h_mm"] == 2.5
    assert "reason" in result


def test_high_need_no_rain_irrigate_now():
    result = recommend_action("High", 0.0)
    assert result["action"] == "IRRIGATE_NOW"


# ── Result structure completeness ───────────────────────────────────────────

def test_result_always_contains_irrigation_need_and_rainfall():
    for need in ("Low", "Medium", "High"):
        for rainfall in (0.0, 3.0, 5.0, 12.0):
            result = recommend_action(need, rainfall)
            assert "irrigation_need" in result
            assert "rainfall_next_24h_mm" in result
            assert "reason" in result
            assert "action" in result
