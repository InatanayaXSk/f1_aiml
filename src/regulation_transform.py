"""Helpers to apply 2026 regulation multipliers to feature matrices."""

from __future__ import annotations

from typing import Dict

import pandas as pd

REGULATION_MULTIPLIERS: Dict[str, Dict[str, float]] = {
    "hybrid_power": {
        "power_ratio": 3.33
    },
    "ers_recovery": {
        "power_ratio": 3.33,
        "fuel_efficiency_rating": 1.05
    },
    "active_aero": {
        "aero_coeff": 0.70,
        "straight_fraction": 1.05
    },
    "chassis": {
        "weight_ratio": 0.962
    },
    "tyres": {
        "tire_grip_ratio": 0.94
    },
    "fuel": {
        "fuel_flow_ratio": 0.75,
        "fuel_efficiency_rating": 1.15
    }
}


def apply_2026_regulations(features: pd.DataFrame) -> pd.DataFrame:
    """Return a copy of the features with 2026 multipliers applied."""

    updated = features.copy()

    for multipliers in REGULATION_MULTIPLIERS.values():
        for column, multiplier in multipliers.items():
            if column in updated.columns:
                updated[column] = updated[column] * multiplier

    return updated


__all__ = ["apply_2026_regulations", "REGULATION_MULTIPLIERS"]
