# Reading the Outputs

## 1. `outputs/monte_carlo_results.json`

- **Structure:** Nested dictionary keyed by `<season>_R<round>` with per-driver metrics under `current` and `2026`.
- **Key Fields:** `mean`, `std`, `percentile_5`, `percentile_95`, `top3_probability`, `top5_probability`.
- **How to Use:** Compare `mean` values to measure expected finishing shifts; check probability deltas for strategic insight.

## 2. Plotly HTML Dashboards

- **Circuit Visualisations:** Found in `outputs/circuit_visualizations`. The `before` files display current-era layouts, while the `after` files layer regulation impact zones (green = gains, red = losses).
- **Team Impact Heatmap:** `outputs/comparison_charts/team_impact_heatmap.html` provides a grid of mean delta positions per race and team.
- **Monte Carlo Violins:** `outputs/comparison_charts/monte_carlo_distributions.html` overlays current vs 2026 distributions to visualise variance.

## 3. Summary Report (`summary_report.pdf` or `.md`)

- Captures the number of simulated races, model accuracy (MAE), and lists generated artefacts.
- A Markdown fallback is produced if ReportLab is unavailable; content is identical apart from the format.

## 4. Notebook Artefacts

- Each notebook maintains a checkpointed view of intermediate data. Re-running them in order mirrors the CLI pipeline and generates the same outputs.

## 5. Recommended Review Flow

1. Inspect the heatmap to identify teams most affected by regulation changes.
2. Dive into circuit HTML files for qualitative explanations (active aero zones, straight-line benefits, etc.).
3. Use the JSON file or notebooks to extract driver-specific statistics for presentations or reports.
