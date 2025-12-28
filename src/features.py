"""Feature engineering for the F1 2026 regulation simulator."""

from __future__ import annotations

import json
from typing import Iterable, List

import numpy as np
import pandas as pd

DRIVER_FORM_WINDOW = 5
TEAM_FORM_WINDOW = 5


def engineer_features(dataset: pd.DataFrame) -> pd.DataFrame:
    """Create the 25 curated features used across the project."""

    df = dataset.copy()
    df = df.sort_values(["season", "round", "driver_number"]).reset_index(drop=True)

    required_columns = [
        "season",
        "round",
        "driver_name",
        "team_name",
        "position",
        "grid",
        "points",
        "dnf_flag"
    ]
    missing = [col for col in required_columns if col not in df.columns]
    if missing:
        raise ValueError(f"engineer_features requires columns {missing} in the input DataFrame")

    df["grid"] = pd.to_numeric(df["grid"], errors="coerce").fillna(20).astype(float)
    df["position"] = pd.to_numeric(df["position"], errors="coerce").fillna(20).astype(float)
    df["points"] = pd.to_numeric(df["points"], errors="coerce").fillna(0.0)
    df["dnf_flag"] = pd.to_numeric(df["dnf_flag"], errors="coerce").fillna(0.0)

    df = _add_driver_form_features(df)
    df = _add_qualifying_features(df)
    df = _add_track_features(df)
    df = _add_condition_features(df)
    df = _add_strategy_features(df)
    df = _add_regulation_features(df)
    df = _add_derived_features(df)
    df = _add_baseline_features(df)

    feature_columns = _ordered_feature_columns()
    existing_features = [col for col in feature_columns if col in df.columns]

    supplement = ["season", "round", "driver_name", "team_name", "position"]
    if "event_name" in df.columns:
        supplement.append("event_name")
    return df[existing_features + supplement]


def _ordered_feature_columns() -> List[str]:
    return [
        "avg_pos_last5",
        "points_last5",
        "dnf_count_last5",
        "grid_position",
        "grid_vs_race_delta",
        "track_type_index",
        "corners",
        "straight_fraction",
        "overtaking_difficulty",
        "rain_probability",
        "track_temperature",
        "wind_speed",
        "pit_stops_count",
        "tire_compound_change_count",
        "fuel_efficiency_rating",
        "power_ratio",
        "aero_coeff",
        "weight_ratio",
        "tire_grip_ratio",
        "fuel_flow_ratio",
        "team_consistency_score",
        "driver_aggressiveness_index",
        "season_year",
        "round_number",
        "season_phase"
    ]


def _add_driver_form_features(df: pd.DataFrame) -> pd.DataFrame:
    grouped = df.groupby("driver_name", group_keys=False)
    df["avg_pos_last5"] = grouped["position"].apply(lambda s: s.shift().rolling(DRIVER_FORM_WINDOW, min_periods=1).mean())
    df["points_last5"] = grouped["points"].apply(lambda s: s.shift().rolling(DRIVER_FORM_WINDOW, min_periods=1).sum())
    df["dnf_count_last5"] = grouped["dnf_flag"].apply(lambda s: s.shift().rolling(DRIVER_FORM_WINDOW, min_periods=1).sum())

    df["avg_pos_last5"] = df["avg_pos_last5"].fillna(df["position"].expanding().mean())
    df["points_last5"] = df["points_last5"].fillna(df["points"].expanding().mean())
    df["dnf_count_last5"] = df["dnf_count_last5"].fillna(0.0)
    return df


def _add_qualifying_features(df: pd.DataFrame) -> pd.DataFrame:
    df["grid_position"] = df["grid"].fillna(20.0)
    df["grid_vs_race_delta"] = df["position"] - df["grid_position"]
    return df


_TRACK_TYPE_ORDER = {
    "high-speed": 4,
    "high downforce": 3,
    "high-downforce": 3,
    "street": 2,
    "semi-street": 2,
    "night-street": 2,
    "mixed": 1,
    "balanced": 1,
    "low-grip": 0,
    "": 0
}


def _add_track_features(df: pd.DataFrame) -> pd.DataFrame:
    if "track_type" in df.columns:
        df["track_type"] = df["track_type"].fillna("")
    else:
        df["track_type"] = ""
    df["track_type_index"] = df["track_type"].map(lambda value: _TRACK_TYPE_ORDER.get(str(value).lower(), 0))

    corners_data = df["corners"] if "corners" in df.columns else pd.Series(14.0, index=df.index)
    df["corners"] = pd.to_numeric(corners_data, errors="coerce").fillna(14.0)
    
    straight_data = df["straight_fraction"] if "straight_fraction" in df.columns else pd.Series(0.45, index=df.index)
    df["straight_fraction"] = pd.to_numeric(straight_data, errors="coerce").fillna(0.45)
    
    overtaking_data = df["overtaking_difficulty"] if "overtaking_difficulty" in df.columns else pd.Series(3.0, index=df.index)
    df["overtaking_difficulty"] = pd.to_numeric(overtaking_data, errors="coerce").fillna(3.0)
    df["overtaking_difficulty"] = df["overtaking_difficulty"].clip(1.0, 5.0)
    return df


def _add_condition_features(df: pd.DataFrame) -> pd.DataFrame:
    rainfall_data = df["rainfall_mm"] if "rainfall_mm" in df.columns else pd.Series(0.0, index=df.index)
    rainfall = pd.to_numeric(rainfall_data, errors="coerce").fillna(0.0)
    df["rain_probability"] = rainfall.apply(lambda value: float(np.clip(value / 5.0, 0.0, 1.0)))

    track_temp_data = df["track_temp_c"] if "track_temp_c" in df.columns else pd.Series(30.0, index=df.index)
    df["track_temperature"] = pd.to_numeric(track_temp_data, errors="coerce").fillna(30.0)
    
    wind_data = df["wind_speed_kph"] if "wind_speed_kph" in df.columns else pd.Series(10.0, index=df.index)
    df["wind_speed"] = pd.to_numeric(wind_data, errors="coerce").fillna(10.0)
    return df


def _add_strategy_features(df: pd.DataFrame) -> pd.DataFrame:
    pit_data = df["pit_stop_count"] if "pit_stop_count" in df.columns else pd.Series(1.0, index=df.index)
    df["pit_stops_count"] = pd.to_numeric(pit_data, errors="coerce").fillna(1.0)
    
    compound_data = df["compound_changes"] if "compound_changes" in df.columns else pd.Series(1.0, index=df.index)
    df["tire_compound_change_count"] = pd.to_numeric(compound_data, errors="coerce").fillna(1.0)

    lap_data = df["avg_lap_time_seconds"] if "avg_lap_time_seconds" in df.columns else pd.Series(100.0, index=df.index)
    avg_lap = pd.to_numeric(lap_data, errors="coerce")
    avg_lap = avg_lap.fillna(avg_lap.median() if pd.notna(avg_lap.median()) else 100.0)
    df["fuel_efficiency_rating"] = (
        1.0 / (1.0 + df["pit_stops_count"]) * np.clip(100.0 / avg_lap, 0.5, 1.5)
    )
    df["fuel_efficiency_rating"] = df["fuel_efficiency_rating"].fillna(0.75)
    return df


def _add_regulation_features(df: pd.DataFrame) -> pd.DataFrame:
    df["power_ratio"] = 0.15
    df["aero_coeff"] = 1.00
    df["weight_ratio"] = 1.00
    df["tire_grip_ratio"] = 1.00
    df["fuel_flow_ratio"] = 1.00
    return df


def _add_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    grouped_team = df.groupby("team_name", group_keys=False)
    team_std = grouped_team["position"].apply(lambda s: s.shift().rolling(TEAM_FORM_WINDOW, min_periods=1).std())
    df["team_consistency_score"] = (1.0 / (1.0 + team_std.fillna(team_std.median() or 1.0))).clip(0.1, 1.0)

    pit_stops = df["pit_stops_count"].replace(0, 1.0)
    df["driver_aggressiveness_index"] = (
        (df["grid_position"] - df["position"]) / pit_stops
    ).fillna(0.0)
    return df


def _add_baseline_features(df: pd.DataFrame) -> pd.DataFrame:
    df["season_year"] = df["season"].astype(int)
    df["round_number"] = df["round"].astype(int)
    df["season_phase"] = df["round_number"].apply(_season_phase)
    return df


def _season_phase(round_number: int) -> int:
    if round_number <= 7:
        return 1
    if round_number <= 15:
        return 2
    return 3


__all__ = ["engineer_features"]
