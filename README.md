# F1 2026 Regulation Impact Simulator

A machine learning-powered simulation tool that predicts how the upcoming 2026 Formula 1 regulation changes will impact team and driver performance. The project uses historical race data from 2022-2025 seasons, applies Monte Carlo simulations, and generates interactive visualizations to analyze the potential effects of new technical regulations.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Usage](#usage)
8. [The 25 Engineered Features](#the-25-engineered-features)
9. [Monte Carlo Methodology](#monte-carlo-methodology)
10. [Outputs and Visualizations](#outputs-and-visualizations)
11. [Interpreting Results](#interpreting-results)
12. [Documentation](#documentation)
13. [License](#license)

---

## Project Overview

The 2026 Formula 1 season will introduce significant regulation changes including:

- Increased electric power share from hybrid systems
- Revised aerodynamic coefficients and active aero components
- Modified weight requirements
- New tire compounds and grip characteristics
- Adjusted fuel flow limits

This simulator models these changes by:

1. Training an XGBoost regression model on historical F1 data (2022-2025)
2. Engineering 25 curated features covering driver form, track characteristics, weather, strategy, and regulations
3. Running Monte Carlo simulations to quantify uncertainty in race outcomes
4. Comparing current regulation scenarios against projected 2026 framework
5. Generating interactive Plotly dashboards and summary reports

---

## Key Features

- **Data Pipeline**: Automated data retrieval via FastF1 API with local caching
- **Feature Engineering**: 25 carefully designed features across 8 categories
- **Machine Learning Model**: XGBoost regressor trained on 4 seasons of race data
- **Monte Carlo Simulation**: Configurable simulations (default 2000 iterations) with driver form, weather, and strategy perturbations
- **2026 Regulation Modeling**: Applies projected regulation multipliers to simulate future scenarios
- **Interactive Visualizations**: Plotly-based dashboards including heatmaps, violin plots, and circuit comparisons
- **Modular Architecture**: Reusable Python modules for easy extension and customization

---

## Technology Stack

| Category | Technologies |
|----------|-------------|
| Language | Python 3.10+ |
| Data Retrieval | FastF1 |
| Data Processing | pandas, NumPy |
| Machine Learning | XGBoost, LightGBM, scikit-learn |
| Model Interpretation | SHAP |
| Visualization | Plotly, Matplotlib, Seaborn |
| Configuration | PyYAML |
| Web Dashboard | Streamlit (optional) |

---

## Project Structure

```
f1-2026-simulator/
|
|-- main.py                    # Pipeline entry point - runs complete simulation
|-- config.yaml                # Configuration for seasons, Monte Carlo params, circuits
|-- requirements.txt           # Python dependencies
|-- README.md                  # This file
|-- QUICK_START_GUIDE.md       # Condensed setup instructions
|
|-- src/                       # Source code modules
|   |-- __init__.py
|   |-- data_loader.py         # FastF1 data retrieval and caching
|   |-- features.py            # Feature engineering (25 features)
|   |-- monte_carlo.py         # Monte Carlo simulation engine
|   |-- regulation_transform.py # 2026 regulation multipliers
|   |-- visualization.py       # Plotly chart generation
|
|-- data/
|   |-- raw/                   # Cached FastF1 session data (not tracked in git)
|   |-- processed/             # Processed CSV datasets
|       |-- f1_2022_2025.csv   # Combined historical data
|
|-- notebooks/                 # Jupyter notebooks for step-by-step analysis
|   |-- 01_data_prep.ipynb           # Data retrieval and validation
|   |-- 02_feature_engineering.ipynb # Feature derivation
|   |-- 03_monte_carlo_sim.ipynb     # Model training and simulation
|   |-- 04_visualizations.ipynb      # Dashboard generation
|   |-- combined_pipeline.ipynb      # Complete end-to-end notebook
|
|-- outputs/                   # Generated artifacts (not tracked in git)
|   |-- monte_carlo_results.json     # Full simulation data
|   |-- summary_report.md            # Pipeline summary
|   |-- comparison_charts/           # Team/driver comparison visualizations
|   |-- circuit_visualizations/      # Before/after circuit impact charts
|
|-- docs/                      # Documentation
    |-- README.md                    # Project layout overview
    |-- FEATURES_25.md               # Detailed feature catalogue
    |-- MONTE_CARLO_METHODOLOGY.md   # Simulation methodology
    |-- RESULTS_INTERPRETATION.md    # Guide to reading outputs
```

---

## Installation

### Prerequisites

- Python 3.10 or newer
- Git
- Internet access for FastF1 API calls (or pre-cached data in `data/raw/`)

### Setup Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/f1-2026-simulator.git
   cd f1-2026-simulator
   ```

2. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv .venv
   .venv\Scripts\activate

   # macOS / Linux
   python -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

## Configuration

Edit `config.yaml` to customize the simulation:

```yaml
seasons:
  - 2022
  - 2023
  - 2024
  - 2025

monte_carlo:
  n_simulations: 2000        # Number of Monte Carlo iterations
  driver_form_sigma: 0.05    # Gaussian noise for driver form features
  weather_sigma: 0.1         # Gaussian noise for weather features
  strategy_delta: 0.1        # Discrete adjustment for strategy features
  random_seed: 42            # Reproducibility seed

key_circuits:
  - Monza
  - Monaco
  - Silverstone
```

### Configuration Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `seasons` | List of seasons to include in training data | 2022-2025 |
| `n_simulations` | Number of Monte Carlo draws per race | 2000 |
| `driver_form_sigma` | Standard deviation for driver form perturbation | 0.05 |
| `weather_sigma` | Standard deviation for weather feature perturbation | 0.10 |
| `strategy_delta` | Magnitude of strategy adjustments | 0.10 |
| `random_seed` | Seed for reproducibility | 42 |
| `key_circuits` | Circuits for detailed before/after visualizations | Monza, Monaco, Silverstone |

---

## Usage

### Running the Complete Pipeline

Execute the entire simulation pipeline with a single command:

```bash
python main.py
```

This will:

1. Load race data from FastF1 (or cache) for seasons 2022-2025
2. Engineer the 25-feature matrix for each driver-race combination
3. Train an XGBoost regression model on historical finishing positions
4. Run Monte Carlo simulations for every race under current and 2026 regulations
5. Generate Plotly interactive dashboards
6. Save results to `outputs/` directory

### Using Individual Notebooks

For step-by-step exploration, run notebooks in order:

1. `notebooks/01_data_prep.ipynb` - Data retrieval and validation
2. `notebooks/02_feature_engineering.ipynb` - Feature derivation and exploration
3. `notebooks/03_monte_carlo_sim.ipynb` - Model training and simulation
4. `notebooks/04_visualizations.ipynb` - Generate visualizations from saved outputs

Alternatively, use `notebooks/combined_pipeline.ipynb` for a complete end-to-end walkthrough.

---

## The 25 Engineered Features

Features are organized into 8 categories:

### Driver Form (3 features)
| Feature | Description |
|---------|-------------|
| `avg_pos_last5` | Mean finishing position over the previous five races |
| `points_last5` | Cumulative championship points in the last five races |
| `dnf_count_last5` | Retirement count across the last five appearances |

### Qualifying (2 features)
| Feature | Description |
|---------|-------------|
| `grid_position` | Starting grid slot after penalties |
| `grid_vs_race_delta` | Finishing position minus grid (negative = positions gained) |

### Track Characteristics (4 features)
| Feature | Description |
|---------|-------------|
| `track_type_index` | Circuit archetype encoding (0 low grip to 4 high speed) |
| `corners` | Number of corners as circuit complexity proxy |
| `straight_fraction` | Fraction of lap distance on straights |
| `overtaking_difficulty` | Historical overtaking difficulty (1 easy to 5 hard) |

### Weather Conditions (3 features)
| Feature | Description |
|---------|-------------|
| `rain_probability` | Normalized rainfall share during the race |
| `track_temperature` | Average track temperature in Celsius |
| `wind_speed` | Mean wind speed in km/h |

### Strategy (3 features)
| Feature | Description |
|---------|-------------|
| `pit_stops_count` | Number of pit stops during the race |
| `tire_compound_change_count` | Count of tyre compound changes |
| `fuel_efficiency_rating` | Composite metric of stops and lap time balance |

### Regulation Factors (5 features)
| Feature | Description |
|---------|-------------|
| `power_ratio` | Electric power share (baseline 0.15) |
| `aero_coeff` | Downforce multiplier (baseline 1.0) |
| `weight_ratio` | Relative car weight (baseline 1.0) |
| `tire_grip_ratio` | Tyre grip factor (baseline 1.0) |
| `fuel_flow_ratio` | Fuel flow allowance (baseline 1.0) |

### Derived Metrics (2 features)
| Feature | Description |
|---------|-------------|
| `team_consistency_score` | Stability metric inversely proportional to variance |
| `driver_aggressiveness_index` | Positions gained per pit stop proxy |

### Baseline Context (3 features)
| Feature | Description |
|---------|-------------|
| `season_year` | Season identifier (2022-2025) |
| `round_number` | Championship round number |
| `season_phase` | Early (1), mid (2), or late (3) season context |

---

## Monte Carlo Methodology

### Objective

Quantify uncertainty in race outcomes by simulating thousands of plausible scenarios under both current regulations and the projected 2026 framework.

### Simulation Pipeline

1. **Perturb Features**: For each simulation draw:
   - Driver form columns receive Gaussian noise with `driver_form_sigma`
   - Weather columns receive Gaussian noise with `weather_sigma`
   - Strategy columns receive discrete adjustments of `strategy_delta`

2. **Predict Positions**: Feed perturbed feature matrix into trained XGBoost model

3. **Clip Results**: Limit predictions to valid 1-20 finishing position range

4. **Aggregate Statistics**: After all draws, compute per-driver metrics:
   - Mean, standard deviation, median, min, max
   - 5th and 95th percentiles
   - Top-3 and top-5 probability

5. **2026 Scenario**: Apply regulation multipliers and repeat steps 1-4

### Output Structure

Results stored in `outputs/monte_carlo_results.json`:

```json
{
  "2024_R01": {
    "event_name": "Bahrain Grand Prix",
    "current": {
      "Max Verstappen": {
        "mean": 1.23,
        "std": 0.45,
        "percentile_5": 1.0,
        "percentile_95": 2.0,
        "top3_probability": 0.98,
        "top5_probability": 1.0
      }
    },
    "2026": { ... }
  }
}
```

---

## Outputs and Visualizations

After running the pipeline, find generated artifacts in the `outputs/` directory:

### JSON Data
- `monte_carlo_results.json` - Complete simulation data with per-driver statistics for every race

### HTML Dashboards
- `comparison_charts/team_impact_heatmap.html` - Grid showing mean position delta per race and team
- `comparison_charts/monte_carlo_distributions.html` - Violin plots comparing current vs 2026 distributions
- `circuit_visualizations/{circuit}_before.html` - Current-era circuit layout
- `circuit_visualizations/{circuit}_after.html` - 2026 regulation impact zones overlaid

### Summary Report
- `summary_report.md` - Pipeline summary including model accuracy (MAE), race count, and artifact list

---

## Interpreting Results

### Key Metrics

| Metric | Interpretation |
|--------|----------------|
| **Mean** | Expected average finishing position |
| **Standard Deviation** | Performance volatility (values > 2.5 indicate high variance) |
| **Top-3 Probability** | Likelihood of finishing on the podium |
| **Delta (2026 - Current)** | Negative = improvement under new rules; Positive = regression |

### Analysis Tips

1. **Mean vs Median Gap**: Large differences suggest skewed distributions from rare events (safety cars, penalties)

2. **Team Heatmap Analysis**: Identify teams most affected by regulation changes by examining delta patterns

3. **Circuit Comparison**: Use before/after visualizations to understand where active aero zones and straight-line benefits apply

4. **Volatility Assessment**: High standard deviation drivers may swing dramatically in 2026, presenting both risk and opportunity

### Recommended Review Flow

1. Start with the team impact heatmap for high-level regulation effects
2. Dive into circuit HTML files for track-specific insights
3. Use JSON data or notebooks for detailed driver-level statistics

---

## Documentation

Additional documentation is available in the `docs/` directory:

| File | Description |
|------|-------------|
| `README.md` | Project layout and quick onboarding |
| `FEATURES_25.md` | Complete feature catalogue with descriptions |
| `MONTE_CARLO_METHODOLOGY.md` | Detailed simulation methodology |
| `RESULTS_INTERPRETATION.md` | Guide to understanding outputs |

---

## Dependencies

Core dependencies (see `requirements.txt` for versions):

```
fastf1>=3.6.1
pandas>=1.5
numpy>=1.24
scikit-learn>=1.2
lightgbm>=3.3
xgboost>=1.7
matplotlib>=3.6
seaborn>=0.12
plotly>=5.0
shap>=0.42
streamlit>=1.29
pyyaml>=6.0
```

---

## License

This project is intended for educational and research purposes. Formula 1, F1, and related trademarks are property of Formula One World Championship Limited.

---

## Acknowledgments

- FastF1 library for providing access to Formula 1 timing data
- The F1 community for historical race data and insights
- XGBoost and scikit-learn teams for machine learning infrastructure
