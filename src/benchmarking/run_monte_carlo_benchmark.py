"""
Standalone runner script for Monte Carlo benchmarking.

This script validates Monte Carlo output uncertainty calibration by:
1. Loading previously saved MC summary statistics
2. Loading actual race results
3. Validating MC output structure
4. Computing coverage probability
5. Printing calibration assessment

Does NOT regenerate simulations or retrain models.

Usage:
    python src/benchmarking/run_monte_carlo_benchmark.py
    python src/benchmarking/run_monte_carlo_benchmark.py outputs/monte_carlo_results.json
    python src/benchmarking/run_monte_carlo_benchmark.py outputs/monte_carlo_results_calibrated.json
"""

import sys
import logging
import json
from pathlib import Path

import pandas as pd
import numpy as np

# Add project root to path for imports
PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

from src.data_loader import load_f1_data
from src.features import engineer_features
from src.benchmarking.monte_carlo_benchmark import (
    benchmark_coverage_probability,
    print_coverage_benchmark_results,
    validate_mc_outputs
)

LOGGER = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


def load_actual_race_results() -> pd.DataFrame:
    """
    Load actual race results from the F1 dataset.
    
    Returns:
        DataFrame with columns: [race_id, driver_id, actual_position]
    """
    LOGGER.info("Loading actual race results...")
    
    # Load F1 data for seasons 2022-2025
    seasons = [2022, 2023, 2024, 2025]
    raw_data = load_f1_data(seasons)
    
    # Engineer features (needed for position column)
    features_df = engineer_features(raw_data)
    
    # Sort by race order
    features_df = features_df.sort_values(["season", "round"]).reset_index(drop=True)
    
    # Create race_id
    features_df["race_id"] = (
        features_df["season"].astype(int).astype(str)
        + "_R"
        + features_df["round"].astype(int).astype(str).str.zfill(2)
    )
    
    # Extract actual results
    actual_results = features_df[["race_id", "driver_name", "position"]].copy()
    actual_results["driver_id"] = actual_results["driver_name"].astype(str).str.strip()
    actual_results.rename(columns={"position": "actual_position"}, inplace=True)
    actual_results = actual_results.drop(columns=["driver_name"])
    
    LOGGER.info("Loaded %d actual race results across %d races", 
                len(actual_results), actual_results["race_id"].nunique())
    
    return actual_results


def load_mc_outputs_from_json(json_path: Path) -> pd.DataFrame:
    """
    Load Monte Carlo summary outputs from a JSON file.
    
    Expected JSON structure (nested dict):
    {
        "race_key": {
            "event_name": "...",
            "current": {
                "driver_name": {
                    "mean": float,
                    "std": float,
                    "percentile_5": float,
                    "percentile_95": float,
                    "top3_probability": float,
                    "top5_probability": float
                },
                ...
            },
            "2026": {...}
        },
        ...
    }
    
    Args:
        json_path: Path to JSON file containing MC results
    
    Returns:
        DataFrame with columns: [race_id, driver_id, mean_position, std_position, 
                                 p5, p95, top3_probability, top5_probability]
    """
    LOGGER.info("Loading MC outputs from %s", json_path)
    
    with open(json_path, 'r') as f:
        mc_results = json.load(f)
    
    # Flatten nested structure
    records = []
    
    for race_key, race_data in mc_results.items():
        # Use "current" scenario (actual conditions, not 2026)
        if isinstance(race_data, dict) and "current" in race_data:
            current_stats = race_data["current"]
        else:
            current_stats = race_data
        
        for driver_name, driver_stats in current_stats.items():
            if isinstance(driver_stats, dict):
                # Extract values with fallback key names
                mean_val = driver_stats.get("mean", np.nan)
                std_val = driver_stats.get("std_position", driver_stats.get("std", np.nan))
                p5_val = driver_stats.get("percentile_5", driver_stats.get("p5", np.nan))
                p95_val = driver_stats.get("percentile_95", driver_stats.get("p95", np.nan))
                
                # Validate that we have valid percentiles before adding
                if pd.notna(mean_val) and pd.notna(p5_val) and pd.notna(p95_val):
                    records.append({
                        "race_id": race_key,
                        "driver_id": str(driver_name).strip(),
                        "mean_position": mean_val,
                        "std_position": std_val,
                        "p5": p5_val,
                        "p95": p95_val,
                        "top3_probability": driver_stats.get("top3_probability", np.nan),
                        "top5_probability": driver_stats.get("top5_probability", np.nan)
                    })
    
    mc_outputs_df = pd.DataFrame(records)
    
    # Check for ordering issues and log warnings
    if len(mc_outputs_df) > 0:
        invalid = (mc_outputs_df['p5'] > mc_outputs_df['mean_position']) | \
                  (mc_outputs_df['mean_position'] > mc_outputs_df['p95'])
        if invalid.any():
            bad_rows = mc_outputs_df[invalid]
            LOGGER.warning(
                "Found %d rows with invalid p5/mean/p95 ordering. Examples:\n%s",
                invalid.sum(),
                bad_rows.head(3).to_string()
            )
    
    LOGGER.info("Loaded %d MC predictions across %d races", 
                len(mc_outputs_df), mc_outputs_df["race_id"].nunique())
    
    return mc_outputs_df


def load_mc_outputs_from_csv(csv_path: Path) -> pd.DataFrame:
    """
    Load Monte Carlo outputs from a CSV file.
    
    Expected CSV columns: [race_id, driver_id, mean_position, std_position, 
                          p5, p95, top3_probability, top5_probability]
    
    Args:
        csv_path: Path to CSV file containing MC results
    
    Returns:
        DataFrame with MC outputs
    """
    LOGGER.info("Loading MC outputs from %s", csv_path)
    
    mc_outputs_df = pd.read_csv(csv_path)
    
    LOGGER.info("Loaded %d MC predictions across %d races", 
                len(mc_outputs_df), mc_outputs_df["race_id"].nunique())
    
    return mc_outputs_df


def find_mc_outputs() -> pd.DataFrame:
    """
    Auto-detect and load MC outputs from standard locations.
    
    Looks for:
    1. outputs/monte_carlo_results.json (standard pipeline output)
    2. outputs/monte_carlo_results_calibrated.json (calibrated variant)
    3. json_results/index.json
    4. outputs/benchmarking/mc_outputs.csv
    
    Returns:
        DataFrame with MC outputs
    
    Raises:
        FileNotFoundError: If no MC output file found
    """
    candidates = [
        PROJECT_ROOT / "outputs" / "monte_carlo_results.json",
        PROJECT_ROOT / "outputs" / "monte_carlo_results_calibrated.json",
        PROJECT_ROOT / "json_results" / "index.json",
        PROJECT_ROOT / "outputs" / "benchmarking" / "mc_outputs.csv"
    ]
    
    for path in candidates:
        if path.exists():
            if path.suffix == ".json":
                return load_mc_outputs_from_json(path)
            elif path.suffix == ".csv":
                return load_mc_outputs_from_csv(path)
    
    raise FileNotFoundError(
        f"Could not find Monte Carlo outputs. Checked:\n" +
        "\n".join(str(p) for p in candidates)
    )


def main():
    """
    Main runner for Monte Carlo benchmarking.
    
    Accepts optional command-line argument specifying MC output file path.
    """
    print("=" * 80)
    print("Monte Carlo Benchmarking - Uncertainty Calibration Validation")
    print("=" * 80)
    print()
    
    try:
        # Load actual race results
        actual_results = load_actual_race_results()
        print()
        
        # Load MC outputs (from command line arg or auto-detect)
        if len(sys.argv) > 1:
            mc_file = Path(sys.argv[1])
            LOGGER.info("Loading MC outputs from command line: %s", mc_file)
            
            if not mc_file.exists():
                print(f"\nERROR: File not found: {mc_file}")
                sys.exit(1)
            
            if mc_file.suffix == ".json":
                mc_outputs = load_mc_outputs_from_json(mc_file)
            elif mc_file.suffix == ".csv":
                mc_outputs = load_mc_outputs_from_csv(mc_file)
            else:
                print(f"\nERROR: Unsupported file type: {mc_file.suffix}")
                print("Expected .json or .csv")
                sys.exit(1)
        else:
            LOGGER.info("Attempting to auto-detect MC outputs...")
            try:
                mc_outputs = find_mc_outputs()
            except FileNotFoundError as e:
                print(f"\nERROR: {e}")
                print("\nTo run this benchmark, you need MC output files.")
                print("Options:")
                print("  1. Run the main pipeline: python main.py")
                print("  2. Generate MC outputs separately using MonteCarloSimulator")
                print("  3. Specify file path: python src/benchmarking/run_monte_carlo_benchmark.py <path>")
                sys.exit(1)
        
        print()
        
        # Validate MC outputs
        LOGGER.info("Validating MC outputs...")
        try:
            validate_mc_outputs(mc_outputs)
            print("MC outputs validation: PASSED\n")
        except ValueError as e:
            print(f"MC outputs validation: FAILED")
            print(f"Error: {e}\n")
            sys.exit(1)
        
        # Check race_id alignment
        missing = set(mc_outputs["race_id"].unique()) - set(actual_results["race_id"].unique())
        if missing:
            raise ValueError(f"Race ID mismatch detected. Missing races in actual data: {sorted(list(missing))[:5]}")
        
        # Compute coverage probability
        LOGGER.info("Computing coverage probability...")
        try:
            overall_coverage, coverage_df, per_race_coverage = benchmark_coverage_probability(
                mc_outputs,
                actual_results,
                race_id_col="race_id",
                driver_id_col="driver_id"
            )
        except ValueError as e:
            print(f"Coverage benchmark failed: {e}")
            print("\nEnsure MC outputs and actual results have aligned race_id/driver_id columns.")
            sys.exit(1)
        
        print()
        
        # Print results
        print_coverage_benchmark_results(overall_coverage, coverage_df, per_race_coverage)
        
        print()
        print("=" * 80)
        print("Monte Carlo Benchmarking Complete")
        print("=" * 80)
        print()
        
        # Save results for inspection (with suffix if calibrated)
        output_dir = PROJECT_ROOT / "outputs" / "benchmarking"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        suffix = ""
        if len(sys.argv) > 1 and "calibrated" in str(sys.argv[1]).lower():
            suffix = "_calibrated"
        
        coverage_df.to_csv(output_dir / f"mc_coverage{suffix}.csv", index=False)
        per_race_coverage.to_csv(output_dir / f"mc_per_race_coverage{suffix}.csv", index=False)
        
        LOGGER.info("Saved coverage results to %s", output_dir)
        
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        LOGGER.exception("Benchmark failed with exception")
        sys.exit(1)


if __name__ == "__main__":
    main()
