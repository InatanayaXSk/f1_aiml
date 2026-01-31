"""
Compare baseline and calibrated Monte Carlo variants.

This script runs benchmarking on both variants and displays
comparative coverage statistics.

Usage:
    python compare_monte_carlo_variants.py
"""

import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent


def run_benchmark(mc_file: Path, variant_name: str) -> None:
    """Run benchmarking on a specific MC output file."""
    print("\n" + "=" * 80)
    print(f"Benchmarking {variant_name}")
    print("=" * 80 + "\n")
    
    benchmark_script = PROJECT_ROOT / "src" / "benchmarking" / "run_monte_carlo_benchmark.py"
    
    result = subprocess.run(
        [sys.executable, str(benchmark_script), str(mc_file)],
        capture_output=False,
        text=True
    )
    
    if result.returncode != 0:
        print(f"\n⚠️  Benchmarking failed for {variant_name}")
        return
    
    print(f"\n✓ Completed benchmarking for {variant_name}")


def main():
    """Run comparative benchmarking."""
    outputs_dir = PROJECT_ROOT / "outputs"
    
    baseline_file = outputs_dir / "monte_carlo_results.json"
    calibrated_file = outputs_dir / "monte_carlo_results_calibrated.json"
    
    # Check files exist
    if not baseline_file.exists():
        print(f"❌ Baseline file not found: {baseline_file}")
        print("\nRun the pipeline first: python main.py")
        sys.exit(1)
    
    if not calibrated_file.exists():
        print(f"❌ Calibrated file not found: {calibrated_file}")
        print("\nRun the pipeline first: python main.py")
        sys.exit(1)
    
    print("=" * 80)
    print("Monte Carlo Variant Comparison")
    print("=" * 80)
    print()
    print("This will benchmark both baseline and calibrated Monte Carlo variants.")
    print()
    print(f"Baseline:   {baseline_file}")
    print(f"Calibrated: {calibrated_file}")
    print()
    
    # Run benchmarks
    run_benchmark(baseline_file, "BASELINE (driver_form_sigma=0.05)")
    run_benchmark(calibrated_file, "CALIBRATED (driver_form_sigma=0.08)")
    
    print("\n" + "=" * 80)
    print("Comparison Complete")
    print("=" * 80)
    print()
    print("Coverage results saved to:")
    print("  - outputs/benchmarking/mc_coverage.csv (baseline)")
    print("  - outputs/benchmarking/mc_coverage_calibrated.csv (calibrated)")
    print()
    print("Compare the 'Overall Coverage' percentages to assess calibration improvement.")
    print()


if __name__ == "__main__":
    main()
