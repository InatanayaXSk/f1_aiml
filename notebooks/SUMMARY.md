# Notebooks Directory Summary

The `notebooks` directory contains the sequential analytical workflow for the F1 2026 Regulation Impact Simulator. These notebooks serve as the experimental playground and the primary execution engine for data preparation and simulation.

## Contents

1.  **01_data_prep.ipynb**
    *   **Goal**: Initial data retrieval and validation.
    *   **Logic**: Uses `src.data_loader.load_f1_data` to fetch historical race data for seasons 2022-2025.
    *   **Output**: Verified raw dataset ready for feature engineering.

2.  **02_feature_engineering.ipynb**
    *   **Goal**: Transformation of raw timing/telemetry into a prediction-ready matrix.
    *   **Logic**: Invokes `src.features.engineer_features` to generate 25 domain-specific metrics.
    *   **Output**: `feature_table` with metrics like `avg_pos_last5`, `power_ratio`, and `track_type_index`.

3.  **03_monte_carlo_sim.ipynb**
    *   **Goal**: Model training and probabilistic forecasting.
    *   **Logic**: 
        *   Trains an **XGBoost Regressor** on historical features.
        *   Applies 2026 regulation transformations via `src.regulation_transform.apply_2026_regulations`.
        *   Executes `MonteCarloSimulator.run` to generate 2,000 iterations per scenario.
    *   **Output**: Comparison of "Current" vs. "Future" (2026) finishing probability distributions.

4.  **04_visualizations.ipynb**
    *   **Goal**: Visual verification of simulation results.
    *   **Logic**: Consumes JSON outputs from simulations to generate heatmaps, violin plots, and circuit overlays using `src.visualization`.
    *   **Output**: Interactive Plotly charts for quality assurance.

## Workflow Integration
The notebooks are designed to be run in order. The output of the third notebook (`monte_carlo_results.json`) is the critical bridge that connects the Python backend logic to the React frontend dashboard via the `outputs/` directory.
