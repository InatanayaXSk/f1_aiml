# Top-K Probability Implementation Analysis

## Executive Summary

**Root Cause Identified**: Top-3 and top-5 probabilities collapse to **0.0 or 1.0** (or near-extremes like 0.996) because:

1. **XGBoost predicts continuous finish positions** (e.g., 1.5, 2.8, 4.3)
2. **No ranking step exists** - predictions are treated as absolute positions
3. **Threshold counting** directly on continuous predictions without discretization
4. **Position clipping to [1.0, 20.0]** maintains continuous values
5. **No within-race ranking** - each driver predicted independently

This leads to:
- **Deterministic driver ordering** within each simulation
- **Binary top-K outcomes** per simulation (either in or out)
- **Frequency-based probabilities** that reflect inter-simulation variance only
- **Collapse when variance is low** - strong drivers always ≤3.0, weak drivers always >3.0

---

## Implementation Details

### 1. Location of Top-K Computation

**File**: `src/monte_carlo.py`  
**Function**: `_summarise_predictions()`  
**Lines**: 87-88

```python
def _summarise_predictions(predictions: np.ndarray, drivers: Iterable[str]) -> Dict[str, Dict[str, float]]:
    stats: Dict[str, Dict[str, float]] = {}
    driver_list = list(drivers)

    for idx, driver in enumerate(driver_list):
        distribution = predictions[:, idx]  # Shape: (n_simulations,)
        stats[driver] = {
            "mean": float(distribution.mean()),
            "std": float(distribution.std(ddof=0)),
            "median": float(np.median(distribution)),
            "min": float(distribution.min()),
            "max": float(distribution.max()),
            "percentile_5": float(np.percentile(distribution, 5)),
            "percentile_95": float(np.percentile(distribution, 95)),
            "top3_probability": float((distribution <= 3).mean()),  # LINE 87
            "top5_probability": float((distribution <= 5).mean())   # LINE 88
        }

    return stats
```

---

### 2. Prediction Generation Process

#### Step 2.1: Model Training
**File**: `main.py`  
**Function**: `train_model()`  
**Lines**: 77-95

```python
def train_model(features: pd.DataFrame, target: pd.Series, feature_columns: Iterable[str]):
    X = features[feature_columns].fillna(features[feature_columns].mean())
    y = target  # target = features["position"] - CONTINUOUS finish positions (1.0-20.0)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = XGBRegressor(  # REGRESSION model - predicts continuous values
        n_estimators=200,
        max_depth=6,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.8,
        random_state=42
    )
    model.fit(X_train, y_train)
```

**Key**: XGBoost is trained as a **regression** model to predict finish **position** (1.0, 2.0, ..., 20.0 as continuous target).

#### Step 2.2: Monte Carlo Simulation Loop
**File**: `src/monte_carlo.py`  
**Function**: `MonteCarloSimulator.run()`  
**Lines**: 39-51

```python
def run(self, features: pd.DataFrame, driver_names: Iterable[str], *, n_simulations: Optional[int] = None):
    n_sims = n_simulations or self.config.n_simulations
    feature_matrix = features[self.feature_columns].copy()
    driver_array = list(driver_names)

    predictions = np.zeros((n_sims, len(feature_matrix)), dtype=float)

    for sim_index in range(n_sims):
        perturbed = self._perturb_features(feature_matrix.copy())
        predictions[sim_index] = np.clip(self.model.predict(perturbed), 1.0, 20.0)  # LINE 49

    return _summarise_predictions(predictions, driver_array)
```

**Critical Line 49**: 
```python
predictions[sim_index] = np.clip(self.model.predict(perturbed), 1.0, 20.0)
```

**What this does**:
1. Predict finish position for each driver (continuous values like [1.83, 4.52, 2.91, ...])
2. Clip to [1.0, 20.0] range (maintains continuous values)
3. Store as-is - **NO RANKING STEP**

#### Step 2.3: Feature Perturbation
**File**: `src/monte_carlo.py`  
**Function**: `_perturb_features()`  
**Lines**: 53-68

```python
def _perturb_features(self, frame: pd.DataFrame) -> pd.DataFrame:
    form_cols = [col for col in self.feature_columns if "pos" in col or "grid" in col]
    weather_cols = [col for col in self.feature_columns if any(token in col for token in ["rain", "temp", "wind"])]
    strategy_cols = [col for col in self.feature_columns if any(token in col for token in ["pit", "fuel", "compound"])]

    if form_cols:
        noise = self._rng.normal(0.0, self.config.driver_form_sigma, size=len(frame))
        frame.loc[:, form_cols] = frame.loc[:, form_cols].mul(1 + noise[:, None])

    for column in weather_cols:
        noise = self._rng.normal(0.0, self.config.weather_sigma, size=len(frame))
        frame[column] = frame[column] * (1 + noise)

    for column in strategy_cols:
        delta = self._rng.integers(-1, 2, size=len(frame)) * self.config.strategy_delta
        frame[column] = frame[column] + delta

    return frame
```

**Key**: Adds stochastic noise to input features, but predictions remain continuous position estimates.

---

### 3. Data Flow Diagram

```
Input Features (20 drivers × N features)
         ↓
    _perturb_features()  [Add noise: driver_form_sigma=0.09, etc.]
         ↓
   XGBoost.predict()  [Outputs: continuous positions]
         ↓
      np.clip(1.0, 20.0)  [Keep continuous]
         ↓
predictions[sim_index] = [1.83, 4.52, 2.91, 11.2, ...]  ← NO RANKING!
         ↓
Repeat 1000 times
         ↓
predictions.shape = (1000, 20)  # 1000 sims × 20 drivers
         ↓
_summarise_predictions()
         ↓
distribution = predictions[:, driver_idx]  # 1000 continuous values per driver
         ↓
top3_probability = (distribution <= 3).mean()  ← THRESHOLD ON CONTINUOUS VALUES
```

---

### 4. Why Probabilities Collapse to 0.0 / 1.0

#### Example: Monaco 2022 (from output JSON)

**Max Verstappen**:
```json
{
  "mean": 2.123,
  "std": 0.237,
  "min": 1.204,
  "max": 3.488,
  "percentile_5": 1.852,
  "percentile_95": 2.501,
  "top3_probability": 0.996  ← Almost always ≤3.0
}
```

**Analysis**:
- All 1000 predictions are continuous values between ~1.2 and ~3.5
- 996 out of 1000 predictions are ≤ 3.0 → probability = 0.996
- Only 4 simulations had predictions > 3.0 (e.g., 3.488, 3.3, ...)

**Sergio Perez**:
```json
{
  "mean": 1.001,
  "std": 0.004,
  "min": 1.0,
  "max": 1.038,
  "percentile_5": 1.0,
  "percentile_95": 1.0,
  "top3_probability": 1.0  ← Always ≤3.0
}
```

**Analysis**:
- Extremely low variance (std=0.004)
- All 1000 predictions between 1.0 and 1.038
- 100% of simulations ≤ 3.0 → probability = 1.0

**Daniel Ricciardo**:
```json
{
  "mean": 12.627,
  "std": 1.050,
  "min": 8.367,
  "max": 16.642,
  "percentile_5": 10.958,
  "percentile_95": 15.018,
  "top3_probability": 0.0  ← Never ≤3.0
}
```

**Analysis**:
- All 1000 predictions are > 3.0 (min=8.367)
- 0 out of 1000 simulations ≤ 3.0 → probability = 0.0

---

### 5. The Missing Step: Within-Race Ranking

**What SHOULD happen** (but doesn't):

```python
# For each simulation:
for sim_index in range(n_sims):
    perturbed = self._perturb_features(feature_matrix.copy())
    predicted_positions = self.model.predict(perturbed)  # [1.83, 4.52, 2.91, ...]
    
    # ❌ MISSING: Convert continuous predictions to discrete ranks
    ranks = np.argsort(predicted_positions) + 1  # [1, 3, 2, ...]
    predictions[sim_index] = ranks  # Store RANKS, not continuous positions
```

**Current behavior**:
- Driver A predicts 2.8 → considered "position 2.8"
- Driver B predicts 3.1 → considered "position 3.1"
- No relative ranking within the simulation

**Correct behavior**:
- Driver A predicts 2.8 → **rank = 2nd place** (among all drivers in this sim)
- Driver B predicts 3.1 → **rank = 3rd place**
- Driver C predicts 2.5 → **rank = 1st place**

---

### 6. Probability Type Classification

✅ **Frequency-based** (count / n_simulations)

Formula:
```python
top3_probability = (distribution <= 3).mean()
                 = sum(distribution <= 3) / n_simulations
```

Example:
- 996 sims with prediction ≤ 3.0
- 1000 total sims
- Probability = 996/1000 = 0.996

❌ **NOT binary** (0 or 1) per-driver, but appears binary due to low variance  
❌ **NOT thresholded or clipped** - raw frequency calculation  
✅ **Appears deterministic** because XGBoost predictions have low variance relative to threshold

---

### 7. Root Cause Summary

| Component | Implementation | Issue |
|-----------|----------------|-------|
| **Model** | XGBoost Regression | Predicts continuous positions, not ranks |
| **Predictions** | `model.predict()` → [1.83, 4.52, ...] | No discretization or ranking |
| **Clipping** | `np.clip(1.0, 20.0)` | Maintains continuous values |
| **Top-K Logic** | `(distribution <= 3).mean()` | Threshold on continuous values |
| **Within-race ranking** | ❌ **MISSING** | No `argsort()` or `rankdata()` |
| **Inter-driver comparison** | ❌ **NONE** | Each driver evaluated independently |

**Consequence**:
- Strong drivers (mean ~2.0, std ~0.3) → almost always predict <3.0 → top3_prob ≈ 1.0
- Weak drivers (mean ~12.0, std ~1.0) → never predict <3.0 → top3_prob = 0.0
- Midfield drivers (mean ~4.5, std ~0.6) → sometimes predict <3.0 → top3_prob ≈ 0.0-0.5

---

### 8. Verification from Output Data

From `monte_carlo_results_calibrated_0.09.json` (Monaco 2022):

| Driver | Mean | Std | Min | Max | top3_prob | Reason |
|--------|------|-----|-----|-----|-----------|--------|
| Perez | 1.001 | 0.004 | 1.0 | 1.038 | **1.0** | All sims ≤3.0 |
| Verstappen | 2.123 | 0.237 | 1.204 | 3.488 | **0.996** | 996/1000 ≤3.0 |
| Sainz | 1.661 | 0.467 | 1.0 | 2.643 | **1.0** | All sims ≤3.0 |
| Russell | 4.039 | 0.315 | 2.849 | 7.887 | **0.035** | 35/1000 ≤3.0 (min=2.849) |
| Leclerc | 4.141 | 0.349 | 3.544 | 4.721 | **0.0** | All sims >3.0 (min=3.544) |
| Norris | 5.348 | 0.620 | 3.610 | 7.070 | **0.0** | All sims >3.0 |
| Ricciardo | 12.627 | 1.050 | 8.367 | 16.642 | **0.0** | All sims >3.0 |

**Pattern**:
- **Mean position determines probability** more than variance
- **Variance only matters near threshold (3.0 or 5.0)**
- Russell (mean=4.039, min=2.849) has 3.5% probability because tail barely crosses 3.0

---

### 9. Why This Matters for Benchmarking

**Impact on Step 3 Benchmarking**:

Current benchmarking compares:
- **MC output**: `top3_probability = 0.996` (996/1000 sims predicted position ≤3.0)
- **Actual race**: Driver finishes P2 → actual_top3 = 1 (true)

**Problem**: These are **fundamentally different quantities**:
- MC probability ≈ "What % of sims had **predicted position** ≤3.0?"
- Actual outcome = "Did driver **rank** in top 3 within their race?"

**No within-race ranking** means MC probabilities don't reflect:
1. Other drivers' performance in same simulation
2. Relative competitiveness within race field
3. Zero-sum constraint (only 3 drivers can finish top-3)

---

### 10. Proposed Fix (DO NOT IMPLEMENT YET)

**Option A: Add within-race ranking** (Recommended)

```python
# In MonteCarloSimulator.run()
for sim_index in range(n_sims):
    perturbed = self._perturb_features(feature_matrix.copy())
    raw_predictions = self.model.predict(perturbed)
    
    # Convert continuous predictions to discrete ranks
    ranks = np.empty_like(raw_predictions)
    ranks[np.argsort(raw_predictions)] = np.arange(1, len(raw_predictions) + 1)
    
    predictions[sim_index] = ranks  # Store ranks [1, 2, 3, ..., 20]
```

**Option B: Compute probabilities from simulated rankings**

```python
def _summarise_predictions(predictions: np.ndarray, drivers: Iterable[str]):
    # predictions now contains ranks [1-20] per simulation
    for idx, driver in enumerate(driver_list):
        distribution = predictions[:, idx]  # Ranks: [2, 1, 3, 1, 2, ...]
        stats[driver] = {
            ...
            "top3_probability": float((distribution <= 3).mean()),  # Now meaningful!
            "top5_probability": float((distribution <= 5).mean())
        }
```

---

### 11. Files Involved

| File | Role | Lines |
|------|------|-------|
| `src/monte_carlo.py` | Core MC logic | 23-95 |
| `src/monte_carlo.py::MonteCarloSimulator.run()` | Simulation loop | 39-51 |
| `src/monte_carlo.py::_perturb_features()` | Add stochasticity | 53-68 |
| `src/monte_carlo.py::_summarise_predictions()` | **Top-K computation** | **70-92** |
| `main.py::train_model()` | Model training | 77-95 |
| `main.py::simulate_races()` | Race simulation orchestration | 130-193 |
| `src/benchmarking/run_monte_carlo_benchmark.py` | Loads MC outputs | 113-161 |
| `src/benchmarking/monte_carlo_benchmark.py` | Coverage validation | (not shown) |

---

### 12. Conclusion

**Current State**:
- Top-K probabilities are **frequency-based** counts of how often continuous predictions fall below threshold
- **No within-race ranking** - predictions are absolute position estimates, not relative ranks
- Probabilities **collapse to extremes** (0.0, 1.0) when driver variance is small relative to threshold

**Why it happens**:
1. XGBoost predicts continuous finish positions (2.8, 4.3, etc.)
2. Predictions are clipped but remain continuous
3. Each driver evaluated independently (no inter-driver ranking)
4. Threshold comparison directly on continuous values
5. Low variance + far from threshold → deterministic outcomes

**Impact**:
- Strong drivers → top3_prob ≈ 1.0
- Weak drivers → top3_prob = 0.0
- Borderline drivers → top3_prob ≈ 0.0-0.5 depending on tail reaching threshold
- **Not reflective of true podium probability** (which requires within-race ranking)

**Next Steps**:
1. Decide on ranking strategy (Option A or B above)
2. Update `MonteCarloSimulator.run()` to compute ranks
3. Re-run simulations with new logic
4. Validate that probabilities now span [0, 1] range more naturally
5. Re-benchmark coverage against actual race outcomes

---

**Status**: ✅ Analysis complete, awaiting decision on implementation approach.
