# Quick Start Guide

## 1. Prerequisites

- Python 3.10 or newer.
- Git clone or download of this repository.
- Internet access for FastF1 API calls (unless cached CSVs are provided in `data/raw/`).

## 2. Environment Setup

```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS / Linux
pip install -r requirements.txt
```

## 3. Configure (Optional)

Edit `config.yaml` to tweak:
- Seasons to ingest.
- Monte Carlo hyperparameters (`n_simulations`, noise levels, seed).
- Featured circuits for visual comparisons.

## 4. Run the Pipeline

```bash
python main.py
```

This command will:
1. Download and cache 2022–2025 race sessions via FastF1.
2. Engineer the 25-feature matrix.
3. Train the baseline XGBoost model.
4. Execute Monte Carlo simulations for every race and the 2026 scenario.
5. Generate Plotly dashboards and a summary report (PDF or Markdown fallback).
6. Persist full simulation outputs to `outputs/monte_carlo_results.json`.

## 5. Review Outputs

- Interactive charts: `outputs/circuit_visualizations/` and `outputs/comparison_charts/`.
- Summary report: `outputs/summary_report.pdf` (or `.md` fallback).
- Raw simulation data: `outputs/monte_carlo_results.json`.

Re-run the command whenever new data, configuration tweaks, or code changes are introduced. The FastF1 cache avoids repeated downloads.
