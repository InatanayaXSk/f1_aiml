# Monte Carlo Methodology

## Objective

Quantify uncertainty in race outcomes by simulating thousands of plausible race scenarios for each Grand Prix under both current regulations and the projected 2026 framework.

## Inputs

- Baseline model: one XGBoost regressor trained on 2022–2025 historical data.
- Feature matrix: 25 engineered features per driver-race combination.
- Simulation settings (configurable in `config.yaml`):
  - `n_simulations` (default 1000)
  - `driver_form_sigma` (default 0.05)
  - `weather_sigma` (default 0.10)
  - `strategy_delta` (default 0.10)
  - `random_seed` (default 42)

## Pipeline

1. Shuffle: For each simulation draw, perturb selected feature groups:
   - Driver form columns (contains `pos` or `grid`) receive Gaussian noise with `driver_form_sigma`.
   - Weather columns (`rain`, `temp`, `wind`) receive Gaussian noise with `weather_sigma`.
   - Strategy columns (`pit`, `fuel`, `compound`) receive discrete adjustments of ±`strategy_delta`.
2. Predict: Feed the perturbed matrix into the trained regressor to obtain positions.
3. Clip: Limit predictions to the 1–20 finishing position range.
4. Aggregate: After all draws, compute summary statistics per driver:
   - Mean, standard deviation, median, min, max.
   - 5th and 95th percentiles.
   - Probability of finishing in the top three and top five.
5. Repeat: Apply the 2026 regulation multipliers and rerun steps 1–4 to capture the future scenario.

## Outputs

For each race we store two distributions (`current`, `2026`) and their summary metrics in `outputs/monte_carlo_results.json`. These distributions feed the Plotly visualisations and the overview report.

## Interpretation Tips

- **Mean vs Median:** Large gaps suggest skewed distributions due to rare events (safety cars, penalties).
- **Standard Deviation:** Values above 2.5 highlight volatile drivers or teams likely to swing in performance.
- **Top-3 Probability:** Useful when framing podium likelihood; compare current vs 2026 to gauge regulation impact.
- **Delta (2026 − Current):** Negative deltas imply improvements under the new rules, positives indicate regression.
