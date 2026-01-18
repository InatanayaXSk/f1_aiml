# 5. Tools and Techniques Used

The project leverages a modern, high-performance tech stack designed to handle the intensive computational requirements of a multi-iteration racing simulator, as summarized in our `src` and `frontend` directories.

### 5.1 Analysis and Machine Learning Stack (src & notebooks)
The engineering core is built on **Python 3.11+**, utilizing a suite of specialized libraries for the heavy lifting:
*   **FastF1**: The primary interface for Formula 1 session data. As detailed in `src/SUMMARY.md`, it provides the raw timing and car telemetry that serves as our historical baseline.
*   **XGBoost (Extreme Gradient Boosting)**: Our primary machine learning algorithm, utilized in `03_monte_carlo_sim.ipynb`. It was chosen for its superior handling of non-linear racing features like the relationship between track temperature and mechanical grip.
*   **Pandas & NumPy**: Used extensively in `src/features.py` for matrix manipulation, rolling window calculations for driver form, and feature imputation.
*   **Scikit-learn**: Utilized for model evaluation metrics and for the training-test split logic found in the third notebook.

### 5.2 Frontend and Visualisation Stack (frontend & s_frontend)
The user interface is designed to provide a premium, reactive experience:
*   **React with Vite**: A modern frontend framework (documented in `frontend/SUMMARY.md`) that allows for a highly responsive dashboard.
*   **Plotly & SVG**: Used in the `frontend/src/components` and `src/visualization.py` files to generate complex charts and interactive track maps.
*   **TailwindCSS**: Used for developing a sleek, "Glassmorphism" UI that maintains visual excellence.
*   **PathGen (Python)**: A specialized script in `s_frontend/` that uses FastF1 telemetry and **SciPy**'s `find_peaks` to generate static SVG paths and sector metadata for the frontend.

### 5.3 Advanced Techniques
*   **Monte Carlo Simulation**: As implemented in `src/monte_carlo.py`, we simulate 2,000 "what-if" scenarios, providing a probability distribution of finishing positions rather than a single value.
*   **Stochastic Perturbation**: The application of Gaussian noise (5% for driver form, 10% for weather) via the `_perturb_features` function to model real-world racing volatility.
*   **Deterministic Regulation Scaling**: A transformation layer in `regulation_transform.py` that applies FIA-aligned multipliers (3.33x Power, 0.70x Aero) to bridge the gap between 2024 and 2026 performance.
