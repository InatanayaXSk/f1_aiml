# Benchmarking Monte Carlo Simulations for F1 Outcomes

Benchmarking Monte Carlo (MC) simulations is critical to ensure that the probabilistic forecasts (like "80% chance of Top 3") are accurate and robust. Since you are using **XGBoost** in your pipeline, here are several ideas to benchmark your simulations.

## 1. Backtesting (Historical Validation)
The most direct way to benchmark is to simulate races that have already happened.
- **Method**: For a past race (e.g., Monza 2024), use the actual grid positions and pre-race features. Run 1,000 simulations.
- **Metric**: Check if the **actual result** falls within the 95% confidence interval of your simulation.
- **Benchmark**: Over many races, the actual result should fall within the 95% interval exactly ~95% of the time (Empirical Coverage).

## 2. Sensitivity Analysis (Noise Impact)
Your simulator uses hyperparameters like `driver_form_sigma` (current: 0.05) and `weather_sigma` (current: 0.10).
- **Method**: Vary these sigmas (e.g., from 0.01 to 0.20) and observe how the output variance changes.
- **Goal**: Identify which inputs are "driving" the uncertainty. If doubling `weather_sigma` has no effect on the podium probability, your model might be ignoring weather features.

## 3. Convergence Testing
How many simulations are actually needed?
- **Method**: Run the simulation for $N$ iterations (where $N = 10, 100, 500, 1000, 5000, 10000$).
- **Metric**: Plot the **Mean Position** and **Standard Deviation** vs $N$.
- **Benchmark**: The point where the mean and std stabilize (e.g., $<0.1\%$ change) is your optimal $N$. This benchmarks the *efficiency* of your MC core.

## 4. Calibration Analysis (Reliability Diagram)
If your simulation says Max Verstappen has a 70% chance of winning:
- **Method**: Group all driver-race instances where your model predicted a 70% win probability ($\pm 5\%$).
- **Metric**: Calculate the **actual win frequency** for that group.
- **Benchmark**: If they actually won 70% of the time, your MC simulation is well-calibrated. If they only won 40% of the time, your model is overconfident.

## 5. Stress Testing (Edge Cases)
Test how the simulation handles extreme "what-if" scenarios.
- **Method**: Simulate a race with 100% rain probability or a 50% power reduction (Extreme Regulation change).
- **Goal**: Ensure the XGBoost model doesn't output nonsensical positions (e.g., position 25 in a 20-driver field) when pushed outside its training range.

## 6. Model Benchmarking (XGBoost vs. Baselines)
- **Method**: Replace the XGBoost model in your `MonteCarloSimulator` with a simpler model (e.g., Linear Regression or just the Grid Position as a constant).
- **Metric**: Compare the **Log-Loss** or **Brier Score** of the simulated probabilities.
- **Goal**: Prove that XGBoost's non-linearities actually improve the *probabilistic* forecast, not just the point prediction.

## 7. Computational Benchmarking (Latency)
- **Method**: Measure the time taken per 1,000 simulations.
- **Benchmark**: With XGBoost, this should be fast, but if you add more features or switching to a Deep Learning model later, you'll need to benchmark **Inference Time vs. Accuracy** tradeoffs.

---

### Suggested Tooling
- **SHAP**: Use SHAP values within the MC loop to see which features are most volatile.
- **Scipy Stats**: Use `kstest` (Kolmogorov-Smirnov) to compare the distribution of 2025 results vs 2026 results to see if the regulation change is statistically significant.
