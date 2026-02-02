# Frontend Dashboard API - Benchmarking Outputs

## Overview

This document identifies all benchmarking outputs suitable for frontend dashboard consumption, organized by Step 1 (Base Model Benchmarking) and Step 2 (Monte Carlo Coverage Validation).

---

## Available Output Files

### Current File Structure

```
outputs/benchmarking/
├── base_predictions.csv         # Step 1: Individual predictions (1740 rows)
├── race_mae.csv                 # Step 1: Per-race MAE (89 races)
├── mc_coverage.csv              # Step 2: Individual coverage results (1840 rows)
├── mc_coverage_calibrated.csv   # Step 2: Calibrated variant coverage
├── mc_per_race_coverage.csv     # Step 2: Per-race coverage rates (94 races)
└── mc_per_race_coverage_calibrated.csv  # Step 2: Calibrated variant per-race
```

---

## Step 1: Base Model Performance

### Source Files
- **Primary**: `outputs/benchmarking/base_predictions.csv`
- **Summary**: `outputs/benchmarking/race_mae.csv`
- **Generator**: `src/benchmarking/base_model_benchmark.py`

### Available Metrics

#### 1.1 Overall Performance Summary

```json
{
  "overall_metrics": {
    "mae": 0.673,
    "rmse": 1.082,
    "spearman_correlation": 0.892,
    "total_predictions": 1740,
    "total_races": 87
  }
}
```

**Data Source**: Computed from `base_predictions.csv`

**Calculation**:
```python
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from scipy.stats import spearmanr

df = pd.read_csv('outputs/benchmarking/base_predictions.csv')

mae = mean_absolute_error(df['y_true'], df['y_pred'])
rmse = np.sqrt(mean_squared_error(df['y_true'], df['y_pred']))

# Per-race Spearman correlation
correlations = []
for race_id in df['race_id'].unique():
    race_data = df[df['race_id'] == race_id]
    if len(race_data) >= 3:
        corr, _ = spearmanr(race_data['y_true'], race_data['y_pred'])
        if not np.isnan(corr):
            correlations.append(corr)

mean_spearman = np.mean(correlations)
```

#### 1.2 Per-Race MAE Breakdown

```json
{
  "per_race_mae": [
    {"race_id": "2024_R08", "race_mae": 0.394},
    {"race_id": "2024_R07", "race_mae": 0.937},
    ...
  ]
}
```

**Data Source**: Direct from `race_mae.csv`

**Use Cases**:
- Line chart: MAE over time (x=race_id, y=race_mae)
- Identify races with worst/best predictions
- Temporal trends (2022 → 2025)

#### 1.3 Per-Driver Performance (Computed)

```json
{
  "per_driver_performance": [
    {
      "driver_id": "Max Verstappen",
      "mean_mae": 0.45,
      "total_races": 87,
      "mae_std": 0.32
    },
    ...
  ]
}
```

**Data Source**: Aggregated from `base_predictions.csv`

**Calculation**:
```python
driver_stats = df.groupby('driver_id').agg(
    mean_mae=('y_pred', lambda x: mean_absolute_error(df.loc[x.index, 'y_true'], x)),
    total_races=('race_id', 'nunique'),
    mae_std=('y_pred', lambda x: np.abs(x - df.loc[x.index, 'y_true']).std())
).reset_index()
```

**Use Cases**:
- Bar chart: Driver prediction accuracy
- Identify which drivers are hardest to predict
- Driver-specific error analysis

#### 1.4 Temporal Trends (Computed)

```json
{
  "temporal_trends": {
    "by_season": [
      {"season": 2022, "mae": 0.95, "num_races": 22},
      {"season": 2023, "mae": 0.71, "num_races": 22},
      {"season": 2024, "mae": 0.39, "num_races": 24},
      {"season": 2025, "mae": 0.42, "num_races": 19}
    ]
  }
}
```

**Data Source**: Extracted from race_id patterns in `base_predictions.csv`

**Calculation**:
```python
df['season'] = df['race_id'].str[:4].astype(int)
season_stats = df.groupby('season').apply(
    lambda x: {
        'mae': mean_absolute_error(x['y_true'], x['y_pred']),
        'num_races': x['race_id'].nunique()
    }
).reset_index()
```

**Use Cases**:
- Line chart: Model improvement over seasons
- Regression stability analysis

---

## Step 2: Monte Carlo Coverage Validation

### Source Files
- **Primary**: `outputs/benchmarking/mc_coverage.csv`
- **Summary**: `outputs/benchmarking/mc_per_race_coverage.csv`
- **Variants**: `*_calibrated.csv` files
- **Generator**: `src/benchmarking/monte_carlo_benchmark.py`

### Available Metrics

#### 2.1 Overall Coverage Summary

```json
{
  "overall_coverage": {
    "coverage_rate": 0.783,
    "target_coverage": 0.90,
    "calibration_status": "under_coverage",
    "total_predictions": 1840,
    "covered_count": 1441,
    "uncovered_count": 399
  }
}
```

**Data Source**: Computed from `mc_coverage.csv`

**Calculation**:
```python
df = pd.read_csv('outputs/benchmarking/mc_coverage.csv')

coverage_rate = df['covered'].mean()
covered_count = df['covered'].sum()
uncovered_count = len(df) - covered_count

if coverage_rate < 0.85:
    calibration_status = "under_coverage"
elif coverage_rate > 0.95:
    calibration_status = "over_coverage"
else:
    calibration_status = "well_calibrated"
```

**Use Cases**:
- Primary KPI: Coverage rate vs target (90%)
- Gauge/progress bar visualization
- Alert if under/over-covered

#### 2.2 Per-Race Coverage Breakdown

```json
{
  "per_race_coverage": [
    {"race_id": "2024_R02", "coverage_rate": 0.95, "num_drivers": 20},
    {"race_id": "2023_R09", "coverage_rate": 0.55, "num_drivers": 20},
    ...
  ]
}
```

**Data Source**: Direct from `mc_per_race_coverage.csv`

**Use Cases**:
- Heatmap: Coverage rate by race
- Identify problematic races
- Variance in coverage quality

#### 2.3 Coverage Statistics

```json
{
  "coverage_statistics": {
    "mean": 0.783,
    "std": 0.104,
    "min": 0.45,
    "max": 0.95,
    "worst_race": {"race_id": "2022_R01", "coverage_rate": 0.45},
    "best_race": {"race_id": "2024_R02", "coverage_rate": 0.95}
  }
}
```

**Data Source**: Aggregated from `mc_per_race_coverage.csv`

**Calculation**:
```python
per_race = pd.read_csv('outputs/benchmarking/mc_per_race_coverage.csv')

stats = {
    'mean': per_race['coverage_rate'].mean(),
    'std': per_race['coverage_rate'].std(),
    'min': per_race['coverage_rate'].min(),
    'max': per_race['coverage_rate'].max(),
    'worst_race': per_race.loc[per_race['coverage_rate'].idxmin()].to_dict(),
    'best_race': per_race.loc[per_race['coverage_rate'].idxmax()].to_dict()
}
```

#### 2.4 Per-Driver Coverage (Computed)

```json
{
  "per_driver_coverage": [
    {
      "driver_id": "Max Verstappen",
      "coverage_rate": 0.72,
      "total_races": 92
    },
    ...
  ]
}
```

**Data Source**: Aggregated from `mc_coverage.csv`

**Calculation**:
```python
driver_coverage = df.groupby('driver_id').agg(
    coverage_rate=('covered', 'mean'),
    total_races=('race_id', 'nunique')
).reset_index()
```

**Use Cases**:
- Identify drivers with systematically poor coverage
- Driver-specific uncertainty calibration
- Correlation with driver consistency

#### 2.5 Interval Width Analysis (Computed)

```json
{
  "interval_width_analysis": {
    "mean_width": 2.45,
    "median_width": 2.18,
    "by_position": [
      {"position_range": "P1-P3", "mean_width": 1.82, "coverage_rate": 0.68},
      {"position_range": "P4-P10", "mean_width": 2.35, "coverage_rate": 0.81},
      {"position_range": "P11-P20", "mean_width": 3.12, "coverage_rate": 0.79}
    ]
  }
}
```

**Data Source**: Computed from `mc_coverage.csv`

**Calculation**:
```python
df['interval_width'] = df['p95'] - df['p5']

mean_width = df['interval_width'].mean()
median_width = df['interval_width'].median()

# Position binning
df['position_bin'] = pd.cut(
    df['actual_position'], 
    bins=[0, 3, 10, 20], 
    labels=['P1-P3', 'P4-P10', 'P11-P20']
)

by_position = df.groupby('position_bin').agg(
    mean_width=('interval_width', 'mean'),
    coverage_rate=('covered', 'mean')
).reset_index()
```

**Use Cases**:
- Trade-off visualization: Interval width vs coverage
- Position-specific uncertainty patterns
- Front-runners vs midfield uncertainty

#### 2.6 Calibration Variants Comparison

```json
{
  "calibration_variants": [
    {
      "variant_name": "baseline",
      "driver_form_sigma": 0.05,
      "coverage_rate": 0.783,
      "mean_interval_width": 2.31
    },
    {
      "variant_name": "calibrated_0.09",
      "driver_form_sigma": 0.09,
      "coverage_rate": 0.867,
      "mean_interval_width": 2.58
    },
    {
      "variant_name": "calibrated_0.12",
      "driver_form_sigma": 0.12,
      "coverage_rate": 0.912,
      "mean_interval_width": 2.89
    }
  ]
}
```

**Data Source**: Load multiple `mc_coverage*.csv` files

**Calculation**:
```python
variants = []
for filename in ['mc_coverage.csv', 'mc_coverage_calibrated.csv', ...]:
    df = pd.read_csv(f'outputs/benchmarking/{filename}')
    df['interval_width'] = df['p95'] - df['p5']
    
    # Extract sigma from filename or config
    sigma = extract_sigma_from_filename(filename)
    
    variants.append({
        'variant_name': filename.replace('.csv', '').replace('mc_coverage_', ''),
        'driver_form_sigma': sigma,
        'coverage_rate': df['covered'].mean(),
        'mean_interval_width': df['interval_width'].mean()
    })
```

**Use Cases**:
- Comparison table/chart: Sigma vs coverage
- Pareto frontier: Coverage vs precision
- Calibration tuning guidance

---

## Proposed JSON API Structure

### Endpoint: `/api/benchmarking/summary`

```json
{
  "metadata": {
    "generated_at": "2026-01-31T12:00:00Z",
    "model_version": "xgboost-v1.0",
    "data_range": {
      "start_season": 2022,
      "end_season": 2025,
      "total_races": 92
    },
    "monte_carlo_config": {
      "n_simulations": 1000,
      "driver_form_sigma": 0.09,
      "weather_sigma": 0.10,
      "strategy_delta": 0.10,
      "random_seed": 42
    }
  },
  
  "step1_base_model": {
    "overall_metrics": { /* ... */ },
    "per_race_mae": [ /* ... */ ],
    "per_driver_performance": [ /* ... */ ],
    "temporal_trends": { /* ... */ }
  },
  
  "step2_monte_carlo": {
    "overall_coverage": { /* ... */ },
    "per_race_coverage": [ /* ... */ ],
    "coverage_statistics": { /* ... */ },
    "per_driver_coverage": [ /* ... */ ],
    "interval_width_analysis": { /* ... */ },
    "calibration_variants": [ /* ... */ ]
  }
}
```

### Full JSON Schema

See: [FRONTEND_API_SCHEMA.json](FRONTEND_API_SCHEMA.json)

---

## Safety Considerations

### ✅ Safe to Expose

**Step 1**:
- Overall metrics (MAE, RMSE, Spearman)
- Per-race MAE aggregates
- Per-driver MAE aggregates
- Temporal trends (by season)

**Step 2**:
- Overall coverage rate
- Per-race coverage rates
- Coverage statistics (mean, std, min, max)
- Per-driver coverage aggregates
- Interval width statistics
- Calibration variant comparisons

### ⚠️ Consider Privacy/Size

**Large datasets** (>1000 rows):
- `base_predictions.csv` (1740 rows) - Use pagination or aggregates
- `mc_coverage.csv` (1840 rows) - Serve aggregates, not raw data

**Sensitive data**: None identified (all performance metrics)

### ❌ Do NOT Expose

- Individual prediction errors (could reveal model weaknesses)
- Raw feature values (not in these files, but keep private if present)
- Internal hyperparameters beyond summary (overfitting risk)
- Detailed error traces or debugging info

---

## Dashboard Visualization Recommendations

### Step 1: Base Model Performance

1. **KPI Cards**:
   - MAE: 0.67 positions
   - RMSE: 1.08 positions
   - Spearman: 0.89

2. **Line Chart**: MAE over time (race_id or season)
   - X-axis: Race ID or Season
   - Y-axis: MAE
   - Highlight best/worst races

3. **Bar Chart**: Per-driver MAE
   - X-axis: Driver name
   - Y-axis: Mean MAE
   - Sort by performance

4. **Trend Chart**: Season-over-season improvement
   - X-axis: Season (2022-2025)
   - Y-axis: MAE
   - Show model learning curve

### Step 2: Monte Carlo Coverage

1. **Gauge**: Overall coverage vs target
   - Current: 78.3%
   - Target: 90%
   - Color: Red (<85%), Yellow (85-88%), Green (88-92%), Blue (>92%)

2. **Heatmap**: Per-race coverage
   - X-axis: Race round
   - Y-axis: Season
   - Color: Coverage rate (0-100%)

3. **Scatter Plot**: Interval width vs coverage
   - X-axis: Mean interval width
   - Y-axis: Coverage rate
   - Points: Different calibrations
   - Ideal zone: High coverage, narrow intervals

4. **Table**: Calibration variants comparison
   - Columns: Variant, Sigma, Coverage, Interval Width
   - Sort by coverage descending
   - Highlight "best" calibration

5. **Box Plot**: Coverage distribution by position
   - X-axis: Position bins (P1-P3, P4-P10, P11-P20)
   - Y-axis: Coverage rate
   - Show quartiles and outliers

---

## Implementation Guide

### Python Script to Generate Dashboard JSON

```python
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error
from scipy.stats import spearmanr
import json
from datetime import datetime

def generate_dashboard_json():
    # Load data
    base_preds = pd.read_csv('outputs/benchmarking/base_predictions.csv')
    race_mae = pd.read_csv('outputs/benchmarking/race_mae.csv')
    mc_coverage = pd.read_csv('outputs/benchmarking/mc_coverage.csv')
    mc_per_race = pd.read_csv('outputs/benchmarking/mc_per_race_coverage.csv')
    
    # Step 1: Base Model
    mae = mean_absolute_error(base_preds['y_true'], base_preds['y_pred'])
    rmse = np.sqrt(mean_squared_error(base_preds['y_true'], base_preds['y_pred']))
    
    spearman_correlations = []
    for race_id in base_preds['race_id'].unique():
        race_data = base_preds[base_preds['race_id'] == race_id]
        if len(race_data) >= 3:
            corr, _ = spearmanr(race_data['y_true'], race_data['y_pred'])
            if not np.isnan(corr):
                spearman_correlations.append(corr)
    
    mean_spearman = np.mean(spearman_correlations)
    
    step1 = {
        'overall_metrics': {
            'mae': round(mae, 3),
            'rmse': round(rmse, 3),
            'spearman_correlation': round(mean_spearman, 3),
            'total_predictions': len(base_preds),
            'total_races': base_preds['race_id'].nunique()
        },
        'per_race_mae': race_mae.to_dict('records')
    }
    
    # Step 2: Monte Carlo
    coverage_rate = mc_coverage['covered'].mean()
    
    if coverage_rate < 0.85:
        calibration_status = "under_coverage"
    elif coverage_rate > 0.95:
        calibration_status = "over_coverage"
    else:
        calibration_status = "well_calibrated"
    
    step2 = {
        'overall_coverage': {
            'coverage_rate': round(coverage_rate, 3),
            'target_coverage': 0.90,
            'calibration_status': calibration_status,
            'total_predictions': len(mc_coverage),
            'covered_count': int(mc_coverage['covered'].sum()),
            'uncovered_count': int((mc_coverage['covered'] == 0).sum())
        },
        'per_race_coverage': mc_per_race.to_dict('records')
    }
    
    # Combine
    output = {
        'metadata': {
            'generated_at': datetime.utcnow().isoformat() + 'Z',
            'model_version': 'xgboost-v1.0',
            'data_range': {
                'start_season': 2022,
                'end_season': 2025,
                'total_races': base_preds['race_id'].nunique()
            }
        },
        'step1_base_model': step1,
        'step2_monte_carlo': step2
    }
    
    # Save
    with open('outputs/dashboard_api.json', 'w') as f:
        json.dump(output, f, indent=2)
    
    return output

if __name__ == '__main__':
    generate_dashboard_json()
```

---

## Summary

### Available Outputs

**Step 1 (Base Model)**:
- Overall metrics: MAE, RMSE, Spearman correlation
- Per-race MAE (87 races)
- Per-driver performance (aggregated)
- Temporal trends (by season)

**Step 2 (Monte Carlo)**:
- Overall coverage rate vs 90% target
- Per-race coverage (94 races)
- Coverage statistics (mean, std, min, max, worst/best)
- Per-driver coverage (aggregated)
- Interval width analysis
- Calibration variant comparisons

### Key Files
- `base_predictions.csv` → Step 1 metrics
- `race_mae.csv` → Step 1 per-race breakdown
- `mc_coverage.csv` → Step 2 individual coverage
- `mc_per_race_coverage.csv` → Step 2 per-race summary

### Next Steps
1. Implement JSON generation script
2. Create API endpoint or static JSON file
3. Build frontend visualizations using schema
4. Monitor dashboard for calibration quality
