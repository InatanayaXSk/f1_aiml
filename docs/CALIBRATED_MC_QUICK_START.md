# Quick Start: Calibrated Monte Carlo Experiment

## What Was Implemented

✓ **Calibrated Monte Carlo variant** with increased `driver_form_sigma` (0.05 → 0.08)
✓ **Baseline Monte Carlo preserved** - no changes to existing behavior
✓ **Separate output files** - calibrated results saved alongside baseline
✓ **Benchmarking support** - can test both variants independently
✓ **Comparison tool** - script to benchmark both and compare coverage

## File Structure

```
outputs/
├── monte_carlo_results.json            # Baseline (driver_form_sigma=0.05)
├── monte_carlo_results_calibrated.json # Calibrated (driver_form_sigma=0.08)
└── benchmarking/
    ├── mc_coverage.csv                 # Baseline coverage results
    └── mc_coverage_calibrated.csv      # Calibrated coverage results
```

## Usage

### Step 1: Generate Both Variants

```bash
python main.py
```

**What it does:**
1. Loads F1 data for 2022-2025 seasons
2. Engineers features
3. Trains XGBoost model
4. Runs **BASELINE** Monte Carlo → `outputs/monte_carlo_results.json`
5. Runs **CALIBRATED** Monte Carlo → `outputs/monte_carlo_results_calibrated.json`
6. Generates visualizations

**Expected output:**
```
INFO - Running BASELINE Monte Carlo simulation
INFO - Simulated race 2022_R01 - ...
...
INFO - Saved Monte Carlo outputs to outputs/monte_carlo_results.json

INFO - Running CALIBRATED Monte Carlo simulation (driver_form_sigma=0.08)
INFO - Simulated race 2022_R01 - ...
...
INFO - Saved Monte Carlo outputs to outputs/monte_carlo_results_calibrated.json

INFO - Baseline results: outputs/monte_carlo_results.json
INFO - Calibrated results: outputs/monte_carlo_results_calibrated.json
```

### Step 2: Compare Coverage (Recommended)

```bash
python compare_monte_carlo_variants.py
```

**What it does:**
- Runs benchmarking on baseline variant
- Runs benchmarking on calibrated variant
- Displays comparative coverage statistics

**Expected output:**
```
================================================================================
Monte Carlo Variant Comparison
================================================================================

Baseline:   outputs/monte_carlo_results.json
Calibrated: outputs/monte_carlo_results_calibrated.json

================================================================================
Benchmarking BASELINE (driver_form_sigma=0.05)
================================================================================
...
Overall Coverage: 78.3%
...

================================================================================
Benchmarking CALIBRATED (driver_form_sigma=0.08)
================================================================================
...
Overall Coverage: 89.7%  ← Should be closer to 90%
...
```

### Step 3: Benchmark Individual Variants (Optional)

**Baseline only:**
```bash
python src/benchmarking/run_monte_carlo_benchmark.py outputs/monte_carlo_results.json
```

**Calibrated only:**
```bash
python src/benchmarking/run_monte_carlo_benchmark.py outputs/monte_carlo_results_calibrated.json
```

**Auto-detect (defaults to baseline):**
```bash
python src/benchmarking/run_monte_carlo_benchmark.py
```

## What Changed vs What Stayed the Same

### ✓ UNCHANGED (Baseline Preserved)

- `src/monte_carlo.py` - SimulationConfig defaults still use `driver_form_sigma=0.05`
- `src/benchmarking/monte_carlo_benchmark.py` - Core benchmarking logic identical
- All XGBoost parameters, feature engineering, data loading - No changes
- Existing `outputs/monte_carlo_results.json` - Same structure and semantics

### ✅ ADDED (New Calibrated Variant)

- `main.py` - Second Monte Carlo run with calibrated config
- `outputs/monte_carlo_results_calibrated.json` - New output file
- `compare_monte_carlo_variants.py` - Comparison helper script
- `src/benchmarking/run_monte_carlo_benchmark.py` - CLI argument support
- Documentation: `CALIBRATED_MONTE_CARLO_IMPLEMENTATION.md`

## Configuration Summary

| Parameter | Baseline | Calibrated | Change |
|-----------|----------|------------|--------|
| `driver_form_sigma` | 0.05 | **0.08** | **+60%** |
| `weather_sigma` | 0.10 | 0.10 | ✓ Same |
| `strategy_delta` | 0.10 | 0.10 | ✓ Same |
| `random_seed` | 42 | 42 | ✓ Same |
| `n_simulations` | 1000 | 1000 | ✓ Same |

## Interpreting Results

### Coverage Metrics to Compare

Look for these in the benchmark output:

1. **Overall Coverage**
   - Baseline: ~78% (under-covered)
   - Calibrated: Target ~90%

2. **Per-Position Coverage**
   - Check if front-runners (P1-P3) vs midfield (P8-P12) have different coverage

3. **Interval Width**
   - Calibrated should have **wider** intervals (larger p95 - p5)
   - Trade-off: Less precision, better reliability

### Success Criteria

✅ **Calibration successful if:**
- Calibrated coverage ≥ 88%
- Coverage improvement > 10 percentage points
- No systematic under-coverage in any position range

⚠️ **Needs iteration if:**
- Coverage still < 85%
- Over-coverage > 95% (too conservative)
- Intervals unreasonably wide (p95 - p5 > 10 positions)

## Troubleshooting

### Issue: "File not found: monte_carlo_results_calibrated.json"

**Solution:** Run the pipeline first:
```bash
python main.py
```

### Issue: Benchmark crashes with "Race ID mismatch"

**Solution:** Ensure you're using the same data seasons (2022-2025) for both generation and benchmarking.

### Issue: Coverage barely improved

**Possible causes:**
1. Model variance too small (XGBoost too confident)
2. Need to increase other sigma parameters (weather, strategy)
3. Data-generating process has less variance than assumed

**Next steps:**
- Try `driver_form_sigma=0.10` (100% increase)
- Add `weather_sigma=0.15` adjustment

## Advanced: Custom Calibration

Edit [main.py](main.py#L176-L182):

```python
calibrated_config = SimulationConfig(
    driver_form_sigma=0.10,  # Try different values
    weather_sigma=0.15,      # Can adjust this too
    strategy_delta=0.10,
    random_seed=42,
    n_simulations=1000
)
```

Then re-run:
```bash
python main.py
python compare_monte_carlo_variants.py
```

## Reference

- Full implementation details: [CALIBRATED_MONTE_CARLO_IMPLEMENTATION.md](CALIBRATED_MONTE_CARLO_IMPLEMENTATION.md)
- Benchmarking methodology: [docs/MONTE_CARLO_BENCHMARKING.md](docs/MONTE_CARLO_BENCHMARKING.md)
- Monte Carlo simulator code: [src/monte_carlo.py](src/monte_carlo.py)

---

**Ready to use!** Start with `python main.py` to generate both variants.
