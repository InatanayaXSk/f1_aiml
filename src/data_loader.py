"""Data loading utilities for the F1 2026 regulation simulator."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Iterable, Optional

import pandas as pd

try:  # FastF1 is optional until runtime
    import fastf1
    from fastf1.core import Session
except ImportError:  # pragma: no cover - handled at runtime
    fastf1 = None
    Session = None  # type: ignore

LOGGER = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
DEFAULT_CACHE_PATH = PROCESSED_DIR / "f1_2022_2025.csv"
DEFAULT_CIRCUIT_PATH = RAW_DIR / "circuits.csv"

DEFAULT_CIRCUIT_METADATA = pd.DataFrame(
    [
        {"circuit_name": "Bahrain", "country": "Bahrain", "track_type": "night-street", "corners": 15,
         "straight_fraction": 0.58, "overtaking_difficulty": 3},
        {"circuit_name": "Jeddah", "country": "Saudi Arabia", "track_type": "street", "corners": 27,
         "straight_fraction": 0.63, "overtaking_difficulty": 4},
        {"circuit_name": "Melbourne", "country": "Australia", "track_type": "street", "corners": 14,
         "straight_fraction": 0.42, "overtaking_difficulty": 3},
        {"circuit_name": "Imola", "country": "Italy", "track_type": "high-downforce", "corners": 19,
         "straight_fraction": 0.41, "overtaking_difficulty": 4},
        {"circuit_name": "Monaco", "country": "Monaco", "track_type": "street", "corners": 19,
         "straight_fraction": 0.25, "overtaking_difficulty": 5},
        {"circuit_name": "Barcelona", "country": "Spain", "track_type": "balanced", "corners": 16,
         "straight_fraction": 0.47, "overtaking_difficulty": 3},
        {"circuit_name": "Montreal", "country": "Canada", "track_type": "semi-street", "corners": 14,
         "straight_fraction": 0.54, "overtaking_difficulty": 2},
        {"circuit_name": "Silverstone", "country": "United Kingdom", "track_type": "high-speed", "corners": 18,
         "straight_fraction": 0.52, "overtaking_difficulty": 2},
        {"circuit_name": "Spielberg", "country": "Austria", "track_type": "high-speed", "corners": 10,
         "straight_fraction": 0.64, "overtaking_difficulty": 2},
        {"circuit_name": "Budapest", "country": "Hungary", "track_type": "high-downforce", "corners": 14,
         "straight_fraction": 0.34, "overtaking_difficulty": 4},
        {"circuit_name": "Spa-Francorchamps", "country": "Belgium", "track_type": "high-speed", "corners": 19,
         "straight_fraction": 0.57, "overtaking_difficulty": 2},
        {"circuit_name": "Zandvoort", "country": "Netherlands", "track_type": "high-downforce", "corners": 14,
         "straight_fraction": 0.36, "overtaking_difficulty": 4},
        {"circuit_name": "Monza", "country": "Italy", "track_type": "high-speed", "corners": 11,
         "straight_fraction": 0.74, "overtaking_difficulty": 1},
        {"circuit_name": "Singapore", "country": "Singapore", "track_type": "street", "corners": 19,
         "straight_fraction": 0.33, "overtaking_difficulty": 4},
        {"circuit_name": "Suzuka", "country": "Japan", "track_type": "mixed", "corners": 18,
         "straight_fraction": 0.44, "overtaking_difficulty": 3},
        {"circuit_name": "Austin", "country": "USA", "track_type": "mixed", "corners": 20,
         "straight_fraction": 0.45, "overtaking_difficulty": 2},
        {"circuit_name": "Mexico City", "country": "Mexico", "track_type": "high-downforce", "corners": 17,
         "straight_fraction": 0.42, "overtaking_difficulty": 2},
        {"circuit_name": "Interlagos", "country": "Brazil", "track_type": "mixed", "corners": 15,
         "straight_fraction": 0.43, "overtaking_difficulty": 2},
        {"circuit_name": "Las Vegas", "country": "USA", "track_type": "street", "corners": 17,
         "straight_fraction": 0.61, "overtaking_difficulty": 3}
    ]
)

DEFAULT_CIRCUIT_METADATA["circuit_key"] = DEFAULT_CIRCUIT_METADATA["circuit_name"].apply(
    lambda name: name.lower().replace(" grand prix", "").replace(" ", "-")
)


def load_circuits_metadata(path: Optional[Path] = None) -> pd.DataFrame:
    """Return circuit metadata used for feature enrichment."""

    csv_path = path or DEFAULT_CIRCUIT_PATH
    if csv_path.exists():
        df = pd.read_csv(csv_path)
        if "circuit_key" not in df.columns:
            df["circuit_key"] = df["circuit_name"].apply(
                lambda name: str(name).lower().replace(" grand prix", "").replace(" ", "-")
            )
        return df
    LOGGER.warning("Circuit metadata CSV not found at %s. Using bundled defaults.", csv_path)
    return DEFAULT_CIRCUIT_METADATA.copy()


def init_fastf1_cache(cache_dir: Optional[Path] = None) -> None:
    """Enable FastF1 cache in the project data directory."""

    if fastf1 is None:
        raise ImportError("FastF1 is required. Install with 'pip install fastf1'.")

    cache_directory = cache_dir or (RAW_DIR / "fastf1_cache")
    cache_directory.mkdir(parents=True, exist_ok=True)
    fastf1.Cache.enable_cache(cache_directory)
    LOGGER.info("FastF1 cache enabled at %s", cache_directory)


def load_f1_data(
    seasons: Iterable[int],
    *,
    force_refresh: bool = False,
    cache_path: Optional[Path] = None,
    circuits_path: Optional[Path] = None
) -> pd.DataFrame:
    """Load race results for given seasons from FastF1 and enrich with metadata."""

    if fastf1 is None:
        raise ImportError("FastF1 is required. Install with 'pip install fastf1'.")

    init_fastf1_cache()

    cache_file = cache_path or DEFAULT_CACHE_PATH
    cache_file.parent.mkdir(parents=True, exist_ok=True)
    seasons = sorted({int(year) for year in seasons})

    if cache_file.exists() and not force_refresh:
        LOGGER.info("Loading cached race dataset from %s", cache_file)
        return pd.read_csv(cache_file)

    circuits_meta = load_circuits_metadata(circuits_path)
    circuits_meta = circuits_meta.drop_duplicates(subset=["circuit_key"])

    all_results = []
    for season in seasons:
        LOGGER.info("Fetching season %s", season)
        event_schedule = fastf1.get_event_schedule(season, include_testing=False)
        for _, event in event_schedule.iterrows():
            if str(event.get("EventFormat", "")).lower() == "testing":
                continue
            round_number = int(event.get("RoundNumber", 0))
            event_name = str(event.get("EventName", "")).strip()
            try:
                session: Session = fastf1.get_session(season, event_name, "R")
                session.load()
            except Exception as exc:  # pragma: no cover - depends on network/API
                LOGGER.warning("Failed to load %s %s round %s: %s", season, event_name, round_number, exc)
                continue

            weather_summary = _summarise_weather(session)
            laps = session.load_laps(with_telemetry=False) if session is not None else pd.DataFrame()
            results = session.results.copy().reset_index(drop=True)
            results = _prepare_results(results)
            results["season"] = season
            results["round"] = round_number
            results["event_name"] = event_name
            results["official_name"] = session.event.get("OfficialName", event_name)
            results["country"] = session.event.get("Country", "")
            results["circuit_name"] = session.event.get("Location", event_name)
            results["session_date"] = pd.to_datetime(session.event.get("EventDate"))
            results["circuit_key"] = results["circuit_name"].apply(_normalize_circuit_name)

            if not laps.empty:
                stint_metrics = _summarise_driver_stints(laps)
                results = results.merge(stint_metrics, on="driver_number", how="left")

            for key, value in weather_summary.items():
                results[key] = value

            results = results.merge(circuits_meta, on="circuit_key", how="left", suffixes=("", "_meta"))
            all_results.append(results)

    if not all_results:
        raise RuntimeError("No race data retrieved from FastF1.")

    dataset = pd.concat(all_results, ignore_index=True)
    dataset.to_csv(cache_file, index=False)
    LOGGER.info("Saved race dataset to %s", cache_file)
    return dataset


def _prepare_results(results: pd.DataFrame) -> pd.DataFrame:
    results = results.rename(columns={
        "DriverNumber": "driver_number",
        "Abbreviation": "driver_code",
        "FullName": "driver_name",
        "TeamName": "team_name",
        "Position": "position",
        "GridPosition": "grid",
        "Status": "status",
        "Points": "points"
    })

    numeric_cols = ["position", "grid", "points", "Laps", "FastestLapSpeed"]
    for column in numeric_cols:
        if column in results.columns:
            results[column] = pd.to_numeric(results[column], errors="coerce")

    if "position" in results.columns:
        results["position"] = results["position"].fillna(21).astype(int)
    if "grid" in results.columns:
        results["grid"] = results["grid"].fillna(20).astype(int)

    results["dnf_flag"] = results["status"].apply(
        lambda value: 0 if _status_is_classified(str(value)) else 1
    )

    if "FastestLapTime" in results.columns:
        results["fastest_lap_seconds"] = results["FastestLapTime"].apply(_timedelta_to_seconds)
    if "Time" in results.columns:
        results["race_time_seconds"] = results["Time"].apply(_timedelta_to_seconds)

    return results[[
        "driver_number",
        "driver_code",
        "driver_name",
        "team_name",
        "position",
        "grid",
        "status",
        "points",
        "dnf_flag",
        "fastest_lap_seconds",
        "race_time_seconds"
    ] + [col for col in results.columns if col not in {
        "DriverNumber",
        "Abbreviation",
        "FullName",
        "TeamName",
        "Position",
        "GridPosition",
        "Status",
        "Points",
        "FastestLapTime",
        "Time"
    }]]


def _summarise_weather(session: Session) -> dict:
    summary = {
        "air_temp_c": None,
        "track_temp_c": None,
        "humidity_pct": None,
        "pressure_hpa": None,
        "rainfall_mm": None,
        "wind_speed_kph": None,
        "wind_direction_deg": None
    }

    weather = getattr(session, "weather_data", None)
    if weather is None or weather.empty:
        return summary

    weather = weather.copy()
    rename_map = {
        "AirTemp": "air_temp_c",
        "TrackTemp": "track_temp_c",
        "Humidity": "humidity_pct",
        "Pressure": "pressure_hpa",
        "Rainfall": "rainfall_mm",
        "WindSpeed": "wind_speed_kph",
        "WindDirection": "wind_direction_deg"
    }
    weather = weather.rename(columns=rename_map)

    for column in rename_map.values():
        if column in weather.columns:
            summary[column] = float(weather[column].astype(float).mean())
    return summary


def _summarise_driver_stints(laps: pd.DataFrame) -> pd.DataFrame:
    metrics = []
    if "DriverNumber" not in laps.columns:
        laps = laps.rename(columns={"Driver": "DriverNumber"})
    grouped = laps.groupby("DriverNumber")

    for driver_number, driver_laps in grouped:
        driver_laps = driver_laps.copy()
        driver_laps = driver_laps.sort_values("LapNumber")
        pit_stop_count = int(driver_laps["PitOutTime"].notna().sum())
        compounds = [compound for compound in driver_laps["Compound"].dropna().unique()]
        compound_changes = max(len(compounds) - 1, 0)
        stint_lengths = driver_laps.groupby("Stint")["LapNumber"].count().tolist()
        avg_lap_time = driver_laps["LapTime"].dropna()
        avg_lap_seconds = float(avg_lap_time.dt.total_seconds().mean()) if not avg_lap_time.empty else None

        metrics.append({
            "driver_number": int(driver_number),
            "pit_stop_count": pit_stop_count,
            "compound_changes": compound_changes,
            "compound_sequence": json.dumps(compounds),
            "stint_lengths": json.dumps(stint_lengths),
            "avg_lap_time_seconds": avg_lap_seconds
        })

    return pd.DataFrame(metrics)


def _normalize_circuit_name(name: str) -> str:
    return str(name).lower().replace(" grand prix", "").replace(" ", "-")


def _status_is_classified(status: str) -> bool:
    status_lower = status.lower()
    return "finished" in status_lower or status_lower.startswith("+") or "classified" in status_lower


def _timedelta_to_seconds(value) -> Optional[float]:
    if pd.isna(value):
        return None
    if hasattr(value, "total_seconds"):
        return float(value.total_seconds())
    try:
        return float(pd.to_timedelta(value).total_seconds())
    except Exception:  # pragma: no cover - defensive
        return None


__all__ = [
    "load_f1_data",
    "load_circuits_metadata",
    "init_fastf1_cache"
]
