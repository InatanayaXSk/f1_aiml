"""Pipeline entry point for the F1 2026 Regulation Impact Simulator."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Dict, Iterable

import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

from src.data_loader import load_f1_data
from src.features import engineer_features
from src.monte_carlo import MonteCarloSimulator, SimulationConfig
from src.regulation_transform import apply_2026_regulations
from src.visualization import (
    create_monte_carlo_violins,
    create_summary_report,
    create_team_impact_heatmap,
    draw_circuit_before_after,
)

LOGGER = logging.getLogger("f1-2026-simulator")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

PROJECT_ROOT = Path(__file__).resolve().parent
OUTPUT_DIR = PROJECT_ROOT / "outputs"
CHART_DIR = OUTPUT_DIR / "comparison_charts"
CIRCUIT_DIR = OUTPUT_DIR / "circuit_visualizations"
CONFIG_PATH = PROJECT_ROOT / "config.yaml"


def load_config(path: Path) -> Dict:
    """Load YAML configuration with sensible defaults."""

    defaults = {
        "seasons": [2022, 2023, 2024, 2025],
        "monte_carlo": {
            "n_simulations": 1000,
            "driver_form_sigma": 0.05,
            "weather_sigma": 0.10,
            "strategy_delta": 0.10,
            "random_seed": 42
        },
        "key_circuits": ["Monza", "Monaco", "Silverstone"]
    }

    if not path.exists():
        LOGGER.warning("Configuration file %s not found. Using defaults.", path)
        return defaults

    try:
        import yaml
    except ImportError as exc:  # pragma: no cover - optional dependency
        LOGGER.warning("PyYAML missing (%s). Using defaults.", exc)
        return defaults

    with path.open("r", encoding="utf-8") as handle:
        loaded = yaml.safe_load(handle) or {}

    merged = defaults.copy()
    merged.update({k: v for k, v in loaded.items() if v is not None})
    return merged


def ensure_output_dirs() -> None:
    CHART_DIR.mkdir(parents=True, exist_ok=True)
    CIRCUIT_DIR.mkdir(parents=True, exist_ok=True)


def train_model(features: pd.DataFrame, target: pd.Series, feature_columns: Iterable[str]):
    X = features[feature_columns].fillna(features[feature_columns].mean())
    y = target

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.8,
        random_state=42
    )
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    mae = float(np.abs(predictions - y_test).mean())
    LOGGER.info("XGBoost trained. Validation MAE: %.2f positions", mae)
    return model, mae


def simulate_races(
    simulator: MonteCarloSimulator,
    race_frame: pd.DataFrame,
    feature_columns: Iterable[str]
) -> Dict[str, Dict[str, Dict]]:
    grouped = race_frame.groupby(["season", "round"], sort=True)

    results: Dict[str, Dict[str, Dict]] = {}

    for (season, round_number), race_data in grouped:
        race_features = race_data[feature_columns].fillna(race_data[feature_columns].mean())
        drivers = race_data["driver_name"].tolist()

        current_stats = simulator.run(race_features, drivers)
        future_frame = apply_2026_regulations(race_features)
        future_stats = simulator.run(future_frame, drivers)

        race_key = f"{season}_R{round_number:02d}"
        event_name = race_data.get("event_name", pd.Series([race_key])).iloc[0]
        results[race_key] = {
            "event_name": event_name,
            "current": current_stats,
            "2026": future_stats
        }
        LOGGER.info("Simulated race %s - %s", race_key, event_name)

    return results


def generate_visualisations(results: Dict[str, Dict], sample_key: str, circuits: Iterable[str]) -> None:
    ensure_output_dirs()

    for circuit in circuits:
        try:
            before, after = draw_circuit_before_after(circuit)
        except ValueError:
            continue
        before.write_html(CIRCUIT_DIR / f"{circuit.lower()}_before.html")
        after.write_html(CIRCUIT_DIR / f"{circuit.lower()}_after.html")

    heatmap = create_team_impact_heatmap(results)
    heatmap.write_html(CHART_DIR / "team_impact_heatmap.html")

    if sample_key in results:
        violins = create_monte_carlo_violins(results[sample_key])
        violins.write_html(CHART_DIR / "monte_carlo_distributions.html")


def save_results(results: Dict[str, Dict]) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    results_path = OUTPUT_DIR / "monte_carlo_results.json"
    with results_path.open("w", encoding="utf-8") as handle:
        json.dump(results, handle, indent=2)
    LOGGER.info("Saved Monte Carlo outputs to %s", results_path)
    return results_path


def main() -> None:
    config = load_config(CONFIG_PATH)
    seasons = config.get("seasons", [])

    LOGGER.info("Loading race data for seasons: %s", seasons)
    raw_data = load_f1_data(seasons)

    LOGGER.info("Engineering features")
    features = engineer_features(raw_data)

    feature_columns = [col for col in features.columns if col not in {"position", "driver_name", "team_name", "season", "round", "event_name"}]
    model, mae = train_model(features, features["position"], feature_columns)

    simulator = MonteCarloSimulator(model, feature_columns, SimulationConfig(**config.get("monte_carlo", {})))
    results = simulate_races(simulator, features, feature_columns)

    save_results(results)
    sample_key = next(iter(results)) if results else ""
    generate_visualisations(results, sample_key, config.get("key_circuits", []))
    create_summary_report(OUTPUT_DIR, mae, len(results))

    LOGGER.info("Pipeline complete. Outputs available under %s", OUTPUT_DIR)


if __name__ == "__main__":
    main()
