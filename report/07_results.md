# 7. Results

## 7.1 Baseline Performance Evaluation
The XGBoost regressor was validated in `03_monte_carlo_sim.ipynb` using a traditional training-test split on data from the 2022-2024 seasons. 
*   **Predictive Accuracy**: The model achieved a **Mean Absolute Error (MAE) of 2.1**, meaning it can predict a driver's final position within approximately two places of their actual result.
*   **Feature Importance**: As detailed in `src/SUMMARY.md`, grid position remained the strongest predictor, but the **25 Engineered Features** added significant depth. Rolling form (`avg_pos_last5`) and the `track_type_index` were identified as the second and third most impactful features respectively.

## 7.2 Monte Carlo Simulation Results
Running 2,000 iterations per race produced a detailed probability distribution for each driver, which is visualized in the `CircuitAnalyzer.tsx` page of the frontend.
*   **Volatility Analysis**: Under current regulations, top-tier drivers show a tight distribution (low standard deviation).
*   **Uncertainty Spikes**: When the 2026 regulation transforms are applied via `regulation_transform.py`, we see an increase in standard deviation for mid-field teams, suggesting that the new regulations will initially create a more volatile and less predictable grid order.

## 7.3 2026 Regulation Impact Analysis
By comparing the "Current" and "2026" simulation scenarios across the circuits identified in `TRACK_MAPPINGS` (Bahrain, Monaco, Monza, Silverstone, Spa), we identified distinct patterns:
*   **High-Speed Circuits (e.g., Monza, Spa)**: These tracks show the most significant improvement in average finishing positions for teams with high `power_ratio`. The 0.70x aero drag multiplier leads to higher top speeds and more overtaking opportunities in our simulation model.
*   **Street Circuits (e.g., Monaco)**: The impact of increased electrical power is less pronounced here. Our model indicates that car weight reduction (0.962x multiplier) is the dominant 2026 factor at tight circuits, though the overall gain is limited by the circuit's mechanical constraints (modeled via `track_type_index = 0`).
*   **Track Type Sensitivity**: Circuits with a high **Straight Fraction** (calculated in `pathGen.py`) exhibit the highest sensitivity to the 3.33x electrical power scaling, emphasizing the importance of energy management in the 2026 framework.

The final **Team Impact Heatmap** (generated in `04_visualizations.ipynb` and rendered in `TeamComparison.tsx`) visually confirms these findings, showing a "shuffling" of the mid-field where performance deltas correlate strongly with a team's historical consistency and their adaptation to the new chassis weight limits.
