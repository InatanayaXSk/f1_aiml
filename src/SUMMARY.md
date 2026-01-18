# Source (src) Directory Summary

The `src` directory contains the core Python engineering logic for the F1 2026 Regulation Impact Simulator. It is organized into modular components that handle the entire simulation lifecycle from raw data ingestion to complex visual outputs.

## Core Modules

1.  **data_loader.py**
    *   **Functions**: `load_f1_data`, `_summarise_weather`, `_summarise_stints`.
    *   **Logic**: Handles high-fidelity data retrieval from FastF1 with a robust local CSV caching layer. It processes multi-session race results and environmental metadata.

2.  **features.py**
    *   **Functions**: `engineer_features`, `_add_driver_form_features`, `_add_track_features`.
    *   **Logic**: The feature engine of the project. It derives 25 specific metrics across five categories:
        *   **Driver Form**: Rolling 5-race averages.
        *   **Track Characteristics**: Type indexing (0-4) and mechanical grip factors.
        *   **Weather Conditions**: Normalized rain and temperature indices.
        *   **Strategy**: Pit stop counts and stint lengths.
        *   **Regulation-Specific**: Base power ratios and aero coefficients.

3.  **monte_carlo.py**
    *   **Functions**: `MonteCarloSimulator.run`, `_perturb_features`.
    *   **Logic**: Implements a stochastic simulation engine. It injects Gaussian noise into features (5% Driver Form, 10% Weather) to model racing uncertainty. It aggregates 2,000 iterations into statistical summaries (mean, std dev, probabilities).

4.  **regulation_transform.py**
    *   **Constant**: `REGULATION_MULTIPLIERS`.
    *   **Logic**: Defines the mathematical delta between 2024 and 2026. Key scales:
        *   Electric Power: 3.33x increase.
        *   Aerodynamic Drag: 30% reduction (0.70x).
        *   Weight: 3.8% reduction (0.962x).

5.  **visualization.py**
    *   **Functions**: `create_track_regulation_dashboard`, `create_team_impact_heatmap`.
    *   **Logic**: Generates high-fidelity Plotly charts. It handles complex data mapping for radar charts, violin plots, and multi-panel dashboards.

## Architectural Significance
This directory implements the technical "brain" of the project. By decoupling data loading from feature engineering and simulation, the system allows for independent tuning of regulation parameters or machine learning models without restructuring the entire pipeline.
