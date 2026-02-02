# Calibrated Monte Carlo Experiment - Implementation Summary

## Overview

A **calibrated Monte Carlo variant** has been added to the F1 2026 Regulation Impact Simulator to address under-coverage observed in the baseline Monte Carlo uncertainty quantification.

## Problem

Baseline Monte Carlo benchmarking showed:
- **Nominal coverage target**: 90% (percentile_5 to percentile_95 interval)
- **Actual coverage**: ~78%
- **Diagnosis**: Insufficient uncertainty dispersion

## Solution

Added a **second Monte Carlo run** with increased stochastic variability:

### Calibrated Configuration

```python
calibrated_config = SimulationConfig(
    driver_form_sigma=0.08,    # ✓ Increased from baseline 0.05
    weather_sigma=0.10,        # Unchanged
    strategy_delta=0.10,       # Unchanged
    random_seed=42,            # Unchanged
    n_simulations=1000         # Unchanged
)
```

**Key change**: `driver_form_sigma` increased from **0.05 → 0.08** (+60% increase)

## Implementation Details

### 1. Baseline Behavior Preserved

✓ **No modifications** to existing `SimulationConfig` defaults in `monte_carlo.py`
✓ Baseline Monte Carlo still runs first with original parameters
✓ Existing outputs saved to `outputs/monte_carlo_results.json` (unchanged)

### 2. Calibrated Variant Added

Modified [main.py](main.py):

```python
# --- BASELINE Monte Carlo ---
LOGGER.info("Running BASELINE Monte Carlo simulation")
simulator = MonteCarloSimulator(model, feature_columns, SimulationConfig(**config.get("monte_carlo", {})))
results = simulate_races(simulator, features, feature_columns)
save_results(results)

# --- CALIBRATED Monte Carlo ---
LOGGER.info("Running CALIBRATED Monte Carlo simulation (driver_form_sigma=0.08)")
calibrated_config = SimulationConfig(
    n_simulations=config.get("monte_carlo", {}).get("n_simulations", 1000),
    driver_form_sigma=0.08,  # Increased from baseline 0.05
    weather_sigma=config.get("monte_carlo", {}).get("weather_sigma", 0.10),
    strategy_delta=config.get("monte_carlo", {}).get("strategy_delta", 0.10),
    random_seed=config.get("monte_carlo", {}).get("random_seed", 42)
)
calibrated_simulator = MonteCarloSimulator(model, feature_columns, calibrated_config)
calibrated_results = simulate_races(calibrated_simulator, features, feature_columns)
save_results(calibrated_results, suffix="_calibrated")
```

### 3. Output Files

| Variant | Output File | Purpose |
|---------|------------|---------|
| Baseline | `outputs/monte_carlo_results.json` | Original uncertainty quantification |
| Calibrated | `outputs/monte_carlo_results_calibrated.json` | Increased uncertainty for better coverage |

### 4. Benchmarking Support

Enhanced [run_monte_carlo_benchmark.py](src/benchmarking/run_monte_carlo_benchmark.py):

```bash
# Benchmark baseline
python src/benchmarking/run_monte_carlo_benchmark.py outputs/monte_carlo_results.json

# Benchmark calibrated
python src/benchmarking/run_monte_carlo_benchmark.py outputs/monte_carlo_results_calibrated.json
```

Coverage results saved to:
- `outputs/benchmarking/mc_coverage.csv` (baseline)
- `outputs/benchmarking/mc_coverage_calibrated.csv` (calibrated)

### 5. Comparison Helper Script

Created [compare_monte_carlo_variants.py](compare_monte_carlo_variants.py):

```bash
python compare_monte_carlo_variants.py
```

Runs benchmarking on **both variants** and displays comparative coverage statistics.

## Expected Outcome

**Hypothesis**: Increasing `driver_form_sigma` from 0.05 → 0.08 will:
1. Widen prediction intervals (percentile_5 to percentile_95 range)
2. Increase coverage probability closer to nominal 90% target
3. Better calibrate uncertainty quantification

**Trade-off**: Wider intervals may reduce precision but improve reliability.

## Usage

### Run Full Pipeline (Both Variants)

```bash
python main.py
```

This generates:
- `outputs/monte_carlo_results.json` (baseline)
- `outputs/monte_carlo_results_calibrated.json` (calibrated)

### Compare Coverage

```bash
python compare_monte_carlo_variants.py
```

### Benchmark Individual Variants

```bash
# Baseline
python src/benchmarking/run_monte_carlo_benchmark.py outputs/monte_carlo_results.json

# Calibrated
python src/benchmarking/run_monte_carlo_benchmark.py outputs/monte_carlo_results_calibrated.json
```

## Files Modified

| File | Changes |
|------|---------|
| [main.py](main.py) | Added calibrated Monte Carlo run after baseline |
| [src/benchmarking/run_monte_carlo_benchmark.py](src/benchmarking/run_monte_carlo_benchmark.py) | Added CLI argument support, auto-detection of calibrated file |
| [compare_monte_carlo_variants.py](compare_monte_carlo_variants.py) | **NEW** - Comparison helper script |

## Files NOT Modified

✓ [src/monte_carlo.py](src/monte_carlo.py) - Baseline defaults unchanged
✓ [src/benchmarking/monte_carlo_benchmark.py](src/benchmarking/monte_carlo_benchmark.py) - Core logic unchanged
✓ All XGBoost, feature engineering, data loading code - Unchanged

## Verification

Confirm baseline behavior preserved:

```bash
# Check baseline defaults
grep "driver_form_sigma: float = " src/monte_carlo.py
# Should show: driver_form_sigma: float = 0.05
```

## Next Steps

1. **Run pipeline**: `python main.py`
2. **Compare variants**: `python compare_monte_carlo_variants.py`
3. **Analyze coverage**: Check if calibrated variant achieves ~90% coverage
4. **Decision**: If calibrated coverage ≈90%, adopt as default; otherwise iterate

## Design Rationale

### Why Only Increase driver_form_sigma?

- **Root cause**: Driver performance prediction variance was the primary under-estimated uncertainty
- **Conservative approach**: Change one parameter at a time for clear attribution
- **Domain justification**: Driver form is inherently more variable than weather/strategy

### Why 0.08?

- **60% increase** over baseline (0.05 → 0.08)
- **Expected coverage boost**: ~78% → ~88-92% (based on coverage gap)
- **Not excessive**: Maintains reasonable interval widths

### Why Preserve Baseline?

- **Backward compatibility**: Existing analyses reference baseline results
- **Scientific comparison**: Need control group to validate calibration
- **Flexibility**: Users can choose based on use case (precision vs coverage)

---

**Status**: ✅ Implementation complete, ready for execution and benchmarking
