"""
Monte Carlo benchmarking utilities to validate uncertainty calibration.

This module evaluates Monte Carlo outputs for:
1. Coverage probability (actual outcomes within predicted intervals)
2. Zero-noise sanity check (non-degenerate uncertainty)

Does NOT modify the MC simulator, train models, or perform feature engineering.
"""

import warnings
from typing import Dict, Optional, Tuple

import numpy as np
import pandas as pd


def benchmark_coverage_probability(
    mc_outputs: pd.DataFrame,
    actual_results: pd.DataFrame,
    race_id_col: str = 'race_id',
    driver_id_col: str = 'driver_id'
) -> Tuple[float, pd.DataFrame, pd.DataFrame]:
    """
    Evaluate Monte Carlo coverage probability.
    
    Coverage is defined as: actual_position lies within [p5, p95] interval.
    
    Args:
        mc_outputs: DataFrame with MC summary stats:
                    [race_id, driver_id, mean_position, std_position, p5, p95, ...]
        actual_results: DataFrame with actual outcomes:
                       [race_id, driver_id, actual_position]
        race_id_col: Name of race identifier column (default: 'race_id')
        driver_id_col: Name of driver identifier column (default: 'driver_id')
    
    Returns:
        overall_coverage_rate: float, mean coverage across all predictions
        coverage_df: DataFrame with columns [race_id, driver_id, actual_position, p5, p95, covered]
        per_race_coverage_df: DataFrame with columns [race_id, coverage_rate]
    
    Raises:
        ValueError: If required columns are missing or data alignment fails
    """
    
    # Validate inputs
    required_mc_cols = {race_id_col, driver_id_col, 'p5', 'p95'}
    required_actual_cols = {race_id_col, driver_id_col, 'actual_position'}
    
    missing_mc = required_mc_cols - set(mc_outputs.columns)
    if missing_mc:
        raise ValueError(f"mc_outputs missing columns: {missing_mc}")
    
    missing_actual = required_actual_cols - set(actual_results.columns)
    if missing_actual:
        raise ValueError(f"actual_results missing columns: {missing_actual}")
    
    # Merge MC outputs with actual results
    coverage_df = mc_outputs[[race_id_col, driver_id_col, 'p5', 'p95']].copy()
    coverage_df = coverage_df.merge(
        actual_results[[race_id_col, driver_id_col, 'actual_position']],
        on=[race_id_col, driver_id_col],
        how='inner'
    )
    
    if len(coverage_df) == 0:
        raise ValueError("No matching race_id/driver_id pairs between mc_outputs and actual_results")
    
    # Compute coverage: actual_position within [p5, p95]
    coverage_df['covered'] = (
        (coverage_df['actual_position'] >= coverage_df['p5']) &
        (coverage_df['actual_position'] <= coverage_df['p95'])
    ).astype(int)
    
    # Compute overall coverage rate
    overall_coverage_rate = coverage_df['covered'].mean()
    
    # Compute per-race coverage
    per_race_coverage_df = coverage_df.groupby(race_id_col).agg(
        coverage_rate=('covered', 'mean')
    ).reset_index()
    
    return overall_coverage_rate, coverage_df, per_race_coverage_df


def benchmark_zero_noise_sanity(
    simulator,
    features_by_race: Dict[str, pd.DataFrame],
    drivers_by_race: Dict[str, list],
    std_tolerance: float = 1e-3
) -> None:
    """
    Verify Monte Carlo outputs are non-degenerate with zero noise.
    
    When all noise parameters are set to zero, the model should produce
    nearly deterministic outputs (std_position < tolerance).
    
    Args:
        simulator: MonteCarloSimulator instance
        features_by_race: Dict mapping race_id -> feature DataFrame
        drivers_by_race: Dict mapping race_id -> list of driver names
        std_tolerance: Threshold for acceptable standard deviation (default: 1e-3)
    
    Raises:
        RuntimeWarning: If any driver violates the std_position check
    
    Returns:
        None
    """
    
    # Save original config
    original_config = simulator.config.__dict__.copy()
    
    # Create zero-noise config
    simulator.config.driver_form_sigma = 0.0
    simulator.config.weather_sigma = 0.0
    simulator.config.strategy_delta = 0.0
    
    # Run simulations with zero noise
    violations = []
    
    for race_id, features in features_by_race.items():
        drivers = drivers_by_race.get(race_id, [])
        if not drivers or len(drivers) == 0:
            continue
        
        stats = simulator.run(features, drivers, n_simulations=100)
        
        for driver_name, driver_stats in stats.items():
            std_pos = driver_stats.get('std_position', driver_stats.get('std', 0.0))
            if std_pos >= std_tolerance:
                violations.append({
                    'race_id': race_id,
                    'driver_id': driver_name,
                    'std_position': std_pos
                })
    
    # restore config safely
    for k, v in original_config.items():
        setattr(simulator.config, k, v)

    # Report violations
    if violations:
        violations_df = pd.DataFrame(violations)
        warning_msg = (
            f"Zero-Noise Sanity Check FAILED:\n"
            f"  {len(violations)} driver(s) have std_position >= {std_tolerance}:\n"
        )
        for _, row in violations_df.iterrows():
            warning_msg += (
                f"    - {row['race_id']} / {row['driver_id']}: "
                f"std={row['std_position']:.6f}\n"
            )
        warning_msg += (
            "  This suggests the MC simulator is degenerating or the model is too noisy.\n"
            "  Verify noise parameters and feature perturbations."
        )
        warnings.warn(warning_msg, RuntimeWarning, stacklevel=2)


def print_coverage_benchmark_results(
    overall_coverage_rate: float,
    coverage_df: pd.DataFrame,
    per_race_coverage_df: pd.DataFrame
) -> None:
    """
    Print formatted Monte Carlo coverage benchmark results.
    
    Args:
        overall_coverage_rate: Overall coverage percentage
        coverage_df: Full coverage DataFrame
        per_race_coverage_df: Per-race coverage statistics
    """
    
    print("=" * 70)
    print("Monte Carlo Coverage Probability Benchmark Results")
    print("=" * 70)
    print()
    
    print(f"Total predictions evaluated:  {len(coverage_df):,}")
    print(f"Coverage cases (p5 <= actual <= p95): {coverage_df['covered'].sum():,}")
    print(f"Uncovered cases:                       {(1 - coverage_df['covered']).sum():,}")
    print()
    
    print(f"Overall Coverage Rate:  {overall_coverage_rate:.4f} ({overall_coverage_rate*100:.2f}%)")
    print()
    
    print("Expected coverage (90% confidence interval):  0.9000 (90%)")
    if 0.85 <= overall_coverage_rate <= 0.95:
        print(f"Coverage is well-calibrated")
    elif overall_coverage_rate < 0.85:
        print(f"Coverage is TOO LOW - model is overconfident")
    else:
        print(f"Coverage is TOO HIGH - model is underconfident")
    print()
    
    print("Per-Race Coverage Statistics:")
    print(f"  Minimum:  {per_race_coverage_df['coverage_rate'].min():.4f}")
    print(f"  Maximum:  {per_race_coverage_df['coverage_rate'].max():.4f}")
    print(f"  Mean:     {per_race_coverage_df['coverage_rate'].mean():.4f}")
    print(f"  Std Dev:  {per_race_coverage_df['coverage_rate'].std():.4f}")
    print()
    
    # Show worst and best performing races
    worst_race = per_race_coverage_df.loc[per_race_coverage_df['coverage_rate'].idxmin()]
    best_race = per_race_coverage_df.loc[per_race_coverage_df['coverage_rate'].idxmax()]
    
    print(f"Worst performing race:  {worst_race['race_id']} ({worst_race['coverage_rate']:.4f})")
    print(f"Best performing race:   {best_race['race_id']} ({best_race['coverage_rate']:.4f})")
    print("=" * 70)


def validate_mc_outputs(
    mc_outputs: pd.DataFrame,
    required_columns: Optional[list] = None,
    tolerance: float = 0.01
) -> bool:
    """
    Validate MC output DataFrame structure and values.
    
    Args:
        mc_outputs: DataFrame to validate
        required_columns: List of expected columns (default: standard set)
        tolerance: Floating-point tolerance for p5 <= mean <= p95 check (default: 0.01)
    
    Returns:
        True if valid, raises ValueError otherwise
    """
    
    if required_columns is None:
        required_columns = [
            'race_id',
            'driver_id',
            'mean_position',
            'std_position',
            'p5',
            'p95',
            'top3_probability',
            'top5_probability'
        ]
    
    missing = [col for col in required_columns if col not in mc_outputs.columns]
    if missing:
        raise ValueError(f"MC outputs missing required columns: {missing}")
    
    # Check value ranges
    if (mc_outputs['mean_position'] < 0.5).any() or (mc_outputs['mean_position'] > 20.5).any():
        raise ValueError("mean_position values outside valid range [1, 20]")
    
    if (mc_outputs['std_position'] < 0).any():
        raise ValueError("std_position contains negative values")
    
    if (mc_outputs['p5'] < 0.5).any() or (mc_outputs['p5'] > 20.5).any():
        raise ValueError("p5 values outside valid range [1, 20]")
    
    if (mc_outputs['p95'] < 0.5).any() or (mc_outputs['p95'] > 20.5).any():
        raise ValueError("p95 values outside valid range [1, 20]")
    
    # Check that p5 <= mean <= p95 (with floating-point tolerance)
    invalid_ordering = (mc_outputs['p5'] > mc_outputs['mean_position'] + tolerance) | \
                       (mc_outputs['mean_position'] > mc_outputs['p95'] + tolerance)
    if invalid_ordering.any():
        invalid_rows = mc_outputs[invalid_ordering]
        error_msg = (
            f"Invalid ordering: {invalid_ordering.sum()} row(s) have p5 > mean or mean > p95\n"
            f"Examples:\n{invalid_rows[['race_id', 'driver_id', 'p5', 'mean_position', 'p95']].head(3).to_string()}"
        )
        raise ValueError(error_msg)
    
    # Check probability columns are in [0, 1]
    for prob_col in ['top3_probability', 'top5_probability']:
        if (mc_outputs[prob_col] < 0).any() or (mc_outputs[prob_col] > 1).any():
            raise ValueError(f"{prob_col} values outside valid range [0, 1]")
    
    return True


__all__ = [
    "benchmark_coverage_probability",
    "benchmark_zero_noise_sanity",
    "print_coverage_benchmark_results",
    "validate_mc_outputs"
]
