"""
Standalone runner script to test base XGBoost benchmarking logic.

This script validates Step 1 outputs before Monte Carlo benchmarking.
It loads the dataset, runs time-aware benchmarking, and displays metrics.

Usage:
    python src/benchmarking/run_base_benchmark.py
"""

import sys
import logging
from pathlib import Path

import pandas as pd

# Add project root to path for imports
PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

from src.data_loader import load_f1_data
from src.features import engineer_features
from src.benchmarking.base_model_benchmark import benchmark_base_model, print_benchmark_results

LOGGER = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


def load_and_prepare_data():
    """
    Load the F1 dataset and prepare it for benchmarking.
    
    Returns:
        DataFrame sorted by race order with engineered features
    """
    LOGGER.info("Loading F1 race data...")
    
    # Load data for seasons 2022-2025 (same as main pipeline)
    seasons = [2022, 2023, 2024, 2025]
    raw_data = load_f1_data(seasons)
    
    LOGGER.info("Engineering features...")
    features_df = engineer_features(raw_data)
    
    # Ensure data is sorted by race order
    features_df = features_df.sort_values(["season", "round"]).reset_index(drop=True)
    
    # Create a unique race_id for each race
    features_df["race_id"] = (
        features_df["season"].astype(str) + "_R" + 
        features_df["round"].astype(str).str.zfill(2)
    )
    
    LOGGER.info("Loaded %d rows across %d races", len(features_df), features_df["race_id"].nunique())
    
    return features_df


def get_feature_columns(df: pd.DataFrame):
    """
    Extract feature columns matching the model pipeline.
    
    Excludes target variable and metadata columns.
    """
    # Define columns to exclude
    exclude_cols = {
        "position",           # Target variable
        "driver_name",        # Metadata
        "team_name",          # Metadata
        "season",             # Metadata
        "round",              # Metadata
        "event_name",         # Metadata
        "race_id",            # Created identifier
        "driver_number"       # Metadata if present
    }
    
    # Get all feature columns
    feature_cols = [col for col in df.columns if col not in exclude_cols]
    
    LOGGER.info("Using %d feature columns for benchmarking", len(feature_cols))
    
    return feature_cols


def main():
    """
    Main runner function for base model benchmarking.
    """
    print("=" * 80)
    print("F1 XGBoost Base Model Benchmark - Step 1 Validation")
    print("=" * 80)
    print()
    
    # Load and prepare data
    df = load_and_prepare_data()
    
    # Get feature columns
    feature_cols = get_feature_columns(df)
    
    # Add driver_id if not present (use driver_name as proxy)
    if "driver_id" not in df.columns:
        df["driver_id"] = df["driver_name"]
    
    # Configure XGBoost parameters (matching main.py)
    xgb_params = {
        'objective': 'reg:squarederror',
        'n_estimators': 200,
        'max_depth': 6,
        'learning_rate': 0.08,
        'subsample': 0.9,
        'colsample_bytree': 0.8,
        'random_state': 42
    }
    
    LOGGER.info("Starting time-aware benchmarking with rolling-origin evaluation...")
    print("\nRunning benchmark (this may take a few minutes)...\n")
    
    # Run benchmark
    metrics, predictions_df, race_mae_df = benchmark_base_model(
        df=df,
        feature_cols=feature_cols,
        target_col='position',
        race_id_col='race_id',
        driver_id_col='driver_id',
        min_history_size=5,
        xgb_params=xgb_params
    )
    
    # Print formatted results
    print_benchmark_results(metrics, predictions_df, race_mae_df)
    
    # Print additional sanity summary
    print("\n" + "=" * 80)
    print("SANITY CHECK SUMMARY")
    print("=" * 80)
    print(f"\n✓ Total predictions:         {len(predictions_df):,}")
    print(f"✓ Total races evaluated:     {predictions_df['race_id'].nunique()}")
    print(f"✓ Avg drivers per race:      {len(predictions_df) / predictions_df['race_id'].nunique():.1f}")
    print()
    print("Global Metrics:")
    print(f"  • MAE:                     {metrics['MAE']:.4f} positions")
    print(f"  • RMSE:                    {metrics['RMSE']:.4f} positions")
    print(f"  • Mean Spearman:           {metrics['Spearman']:.4f}")
    print()
    print("Per-Race MAE Statistics:")
    print(f"  • Minimum:                 {race_mae_df['race_mae'].min():.4f} positions")
    print(f"  • Maximum:                 {race_mae_df['race_mae'].max():.4f} positions")
    print(f"  • Mean:                    {race_mae_df['race_mae'].mean():.4f} positions")
    print(f"  • Std Dev:                 {race_mae_df['race_mae'].std():.4f} positions")
    print()
    print("Model Configuration:")
    print(f"  • n_estimators:            {xgb_params['n_estimators']}")
    print(f"  • max_depth:               {xgb_params['max_depth']}")
    print(f"  • learning_rate:           {xgb_params['learning_rate']}")
    print(f"  • subsample:               {xgb_params['subsample']}")
    print(f"  • colsample_bytree:        {xgb_params['colsample_bytree']}")
    print()
    
    # Sanity checks
    print("Validation Checks:")
    if metrics['MAE'] < 10.0:
        print(f"  ✓ MAE is reasonable (<10): {metrics['MAE']:.4f}")
    else:
        print(f"  ⚠ MAE seems high (>10): {metrics['MAE']:.4f}")
    
    if 0.0 <= metrics['Spearman'] <= 1.0:
        print(f"  ✓ Spearman correlation is valid: {metrics['Spearman']:.4f}")
    else:
        print(f"  ⚠ Spearman correlation seems unusual: {metrics['Spearman']:.4f}")
    
    if predictions_df['y_pred'].min() >= 1.0 and predictions_df['y_pred'].max() <= 20.0:
        print(f"  ✓ Predictions are clipped to [1, 20]")
    else:
        print(f"  ⚠ Predictions outside expected range: [{predictions_df['y_pred'].min():.2f}, {predictions_df['y_pred'].max():.2f}]")
    
    print("=" * 80)
    print("\n✓ Base model benchmark complete! Ready for Monte Carlo benchmarking.\n")
    
    # Optionally save results for inspection
    output_dir = PROJECT_ROOT / "outputs" / "benchmarking"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    predictions_df.to_csv(output_dir / "base_predictions.csv", index=False)
    race_mae_df.to_csv(output_dir / "race_mae.csv", index=False)
    
    LOGGER.info("Saved predictions to %s", output_dir / "base_predictions.csv")
    LOGGER.info("Saved per-race MAE to %s", output_dir / "race_mae.csv")


if __name__ == "__main__":
    main()
