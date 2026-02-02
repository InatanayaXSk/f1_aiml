"""
Time-aware benchmarking for XGBoost regressor used for race position prediction.

This module implements rolling-origin evaluation without random train-test splits,
ensuring temporal integrity of the predictions.
"""

import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from scipy.stats import spearmanr
from typing import Dict, Tuple, List


def benchmark_base_model(
    df: pd.DataFrame,
    feature_cols: List[str],
    target_col: str = 'position',
    race_id_col: str = 'race_id',
    driver_id_col: str = 'driver_id',
    min_history_size: int = 5,
    xgb_params: Dict = None
) -> Tuple[Dict[str, float], pd.DataFrame, pd.DataFrame]:
    """
    Perform time-aware benchmarking using rolling-origin evaluation.
    
    Args:
        df: DataFrame sorted by race order, containing features and target
        feature_cols: List of feature column names
        target_col: Name of the target column (default: 'position')
        race_id_col: Name of the race identifier column (default: 'race_id')
        driver_id_col: Name of the driver identifier column (default: 'driver_id')
        min_history_size: Minimum number of races to train on before making predictions (default: 5)
        xgb_params: Optional XGBoost parameters (default: None uses default parameters)
    
    Returns:
        metrics_dict: Dictionary containing MAE, RMSE, mean Spearman correlation, and xgb_params
        predictions_df: DataFrame with columns [race_id, driver_id, y_true, y_pred]
        race_mae_df: DataFrame with columns [race_id, race_mae]
    """
    
    # Ensure DataFrame is sorted by race order
    if race_id_col not in df.columns:
        raise ValueError(f"race_id_col '{race_id_col}' not found in DataFrame")
    
    # Get unique races in order
    unique_races = df[race_id_col].unique()
    
    if len(unique_races) < min_history_size + 1:
        raise ValueError(
            f"Not enough races for benchmarking. Need at least {min_history_size + 1} races, "
            f"but only have {len(unique_races)}"
        )
    
    # Initialize XGBoost model with default or provided parameters
    if xgb_params is None:
        xgb_params = {
            'objective': 'reg:squarederror',
            'n_estimators': 100,
            'max_depth': 6,
            'learning_rate': 0.1,
            'random_state': 42
        }
    
    # Storage for predictions
    all_predictions = []
    
    # Rolling-origin evaluation
    for i in range(min_history_size, len(unique_races)):
        # Training set: all races before race i
        train_races = unique_races[:i]
        test_race = unique_races[i]
        
        # Split data
        train_mask = df[race_id_col].isin(train_races)
        test_mask = df[race_id_col] == test_race
        
        X_train = df.loc[train_mask, feature_cols]
        y_train = df.loc[train_mask, target_col]
        
        X_test = df.loc[test_mask, feature_cols]
        y_test = df.loc[test_mask, target_col]
        
        # Handle missing values using training set means only
        if X_train.isnull().any().any() or X_test.isnull().any().any():
            train_means = X_train.mean()
            X_train = X_train.fillna(train_means)
            X_test = X_test.fillna(train_means)
        
        # Train model on all races < i
        model = XGBRegressor(**xgb_params)
        model.fit(X_train, y_train, verbose=False)
        
        # Predict for race i only
        y_pred = model.predict(X_test)
        
        # Clip predictions to valid race position range [1, 20]
        y_pred = np.clip(y_pred, 1, 20)
        
        # Collect predictions with race and driver identifiers
        test_df = df.loc[test_mask, [race_id_col, driver_id_col]].copy()
        test_df['y_true'] = y_test.values
        test_df['y_pred'] = y_pred
        
        all_predictions.append(test_df)
    
    # Combine all predictions
    predictions_df = pd.concat(all_predictions, ignore_index=True)
    
    # Compute global metrics
    y_true_all = predictions_df['y_true'].values
    y_pred_all = predictions_df['y_pred'].values
    
    mae = mean_absolute_error(y_true_all, y_pred_all)
    rmse = np.sqrt(mean_squared_error(y_true_all, y_pred_all))
    
    # Compute per-race Spearman correlation (skip races with < 3 drivers)
    spearman_correlations = []
    for race_id in predictions_df[race_id_col].unique():
        race_data = predictions_df[predictions_df[race_id_col] == race_id]
        if len(race_data) >= 3:
            corr, _ = spearmanr(race_data['y_true'], race_data['y_pred'])
            if not np.isnan(corr):
                spearman_correlations.append(corr)
    
    mean_spearman = np.mean(spearman_correlations) if spearman_correlations else 0.0
    
    # Compute MAE per race
    race_mae_list = []
    for race_id in predictions_df[race_id_col].unique():
        race_data = predictions_df[predictions_df[race_id_col] == race_id]
        race_mae = mean_absolute_error(race_data['y_true'], race_data['y_pred'])
        race_mae_list.append({race_id_col: race_id, 'race_mae': race_mae})
    
    race_mae_df = pd.DataFrame(race_mae_list)
    
    metrics_dict = {
        'MAE': mae,
        'RMSE': rmse,
        'Spearman': mean_spearman,
        'xgb_params': xgb_params
    }
    
    return metrics_dict, predictions_df, race_mae_df


def print_benchmark_results(metrics: Dict[str, float], predictions_df: pd.DataFrame, race_mae_df: pd.DataFrame = None):
    """
    Print formatted benchmark results.
    
    Args:
        metrics: Dictionary containing MAE, RMSE, and mean Spearman correlation
        predictions_df: DataFrame with predictions
        race_mae_df: Optional DataFrame with per-race MAE values
    """
    print("=" * 60)
    print("Time-Aware Benchmark Results (Rolling-Origin Evaluation)")
    print("=" * 60)
    print(f"\nTotal predictions made: {len(predictions_df)}")
    print(f"Number of test races: {predictions_df['race_id'].nunique()}")
    print("\nMetrics:")
    print(f"  Mean Absolute Error (MAE):       {metrics['MAE']:.4f}")
    print(f"  Root Mean Squared Error (RMSE):  {metrics['RMSE']:.4f}")
    print(f"  Mean Spearman Correlation:       {metrics['Spearman']:.4f}")
    
    if race_mae_df is not None:
        print(f"\nPer-Race MAE Statistics:")
        print(f"  Min:  {race_mae_df['race_mae'].min():.4f}")
        print(f"  Max:  {race_mae_df['race_mae'].max():.4f}")
        print(f"  Mean: {race_mae_df['race_mae'].mean():.4f}")
        print(f"  Std:  {race_mae_df['race_mae'].std():.4f}")
    
    print("=" * 60)


if __name__ == "__main__":
    # Example usage (requires actual data)
    print("Base model benchmark module loaded.")
    print("Use benchmark_base_model() function to evaluate your model.")
