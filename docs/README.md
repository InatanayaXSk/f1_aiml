# F1 2026 Regulation Impact Simulator

This document summarises the repository layout and provides a fast onboarding path for reviewers.

## Project Layout

- `data/` – Raw and processed datasets plus FastF1 cache.
- `notebooks/` – Four guided notebooks that mirror the project lifecycle.
- `src/` – Reusable Python modules for data loading, feature engineering, simulations, and visualisations.
- `outputs/` – Generated artefacts (HTML charts, JSON results, summary report).
- `main.py` – Single entry point that runs the complete pipeline end-to-end.
- `config.yaml` – Toggles for seasons, Monte Carlo configuration, and featured circuits.

## Setup

1. Create and activate a Python 3.10+ environment.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. (Optional) Populate `data/raw/` with cached CSV extracts if you want to avoid API calls.

## Execution

Run the entire simulator with:
```bash
python main.py
```
The script fetches data via FastF1, engineers features, trains the XGBoost baseline, performs Monte Carlo simulations, renders Plotly dashboards, and writes a summary report inside `outputs/`.

## Notebooks

Each notebook is self-contained and can be executed independently:

1. `01_data_prep.ipynb` – Data retrieval and validation.
2. `02_feature_engineering.ipynb` – Derivation of the 25 curated features.
3. `03_monte_carlo_sim.ipynb` – Baseline model training and simulation sanity checks.
4. `04_visualizations.ipynb` – Interactive dashboards using previously saved outputs.
