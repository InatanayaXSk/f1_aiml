"""Monte Carlo simulation utilities for race outcome forecasting."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, Optional

import numpy as np
import pandas as pd


@dataclass
class SimulationConfig:
    """Configuration parameters for Monte Carlo simulations."""

    n_simulations: int = 1000
    driver_form_sigma: float = 0.05
    weather_sigma: float = 0.10
    strategy_delta: float = 0.10
    random_seed: int = 42


class MonteCarloSimulator:
    """Run Monte Carlo simulations for race result distributions."""

    def __init__(self, model, feature_columns: Iterable[str], config: Optional[SimulationConfig] = None):
        self.model = model
        self.feature_columns = list(feature_columns)
        self.config = config or SimulationConfig()
        self._rng = np.random.default_rng(self.config.random_seed)

    def run(
        self,
        features: pd.DataFrame,
        driver_names: Iterable[str],
        *,
        n_simulations: Optional[int] = None
    ) -> Dict[str, Dict[str, float]]:
        """Execute Monte Carlo sampling returning per-driver statistics."""

        n_sims = n_simulations or self.config.n_simulations
        feature_matrix = features[self.feature_columns].copy()
        driver_array = list(driver_names)

        predictions = np.zeros((n_sims, len(feature_matrix)), dtype=float)

        for sim_index in range(n_sims):
            perturbed = self._perturb_features(feature_matrix.copy())
            predictions[sim_index] = np.clip(self.model.predict(perturbed), 1.0, 20.0)

        return _summarise_predictions(predictions, driver_array)

    def _perturb_features(self, frame: pd.DataFrame) -> pd.DataFrame:
        form_cols = [col for col in self.feature_columns if "pos" in col or "grid" in col]
        weather_cols = [col for col in self.feature_columns if any(token in col for token in ["rain", "temp", "wind"])]
        strategy_cols = [col for col in self.feature_columns if any(token in col for token in ["pit", "fuel", "compound"])]

        if form_cols:
            noise = self._rng.normal(0.0, self.config.driver_form_sigma, size=len(frame))
            frame.loc[:, form_cols] = frame.loc[:, form_cols].mul(1 + noise[:, None])

        for column in weather_cols:
            noise = self._rng.normal(0.0, self.config.weather_sigma, size=len(frame))
            frame[column] = frame[column] * (1 + noise)

        for column in strategy_cols:
            delta = self._rng.integers(-1, 2, size=len(frame)) * self.config.strategy_delta
            frame[column] = frame[column] + delta

        return frame


def _summarise_predictions(predictions: np.ndarray, drivers: Iterable[str]) -> Dict[str, Dict[str, float]]:
    stats: Dict[str, Dict[str, float]] = {}
    driver_list = list(drivers)

    for idx, driver in enumerate(driver_list):
        distribution = predictions[:, idx]
        stats[driver] = {
            "mean": float(distribution.mean()),
            "std": float(distribution.std(ddof=0)),
            "median": float(np.median(distribution)),
            "min": float(distribution.min()),
            "max": float(distribution.max()),
            "percentile_5": float(np.percentile(distribution, 5)),
            "percentile_95": float(np.percentile(distribution, 95)),
            "top3_probability": float((distribution <= 3).mean()),
            "top5_probability": float((distribution <= 5).mean())
        }

    return stats


__all__ = ["MonteCarloSimulator", "SimulationConfig"]
