"""Command-line helper to export simulator JSON outputs without running the notebook."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, Optional

PROJECT_ROOT = Path(__file__).resolve().parent


def _resolve_path(path_str: str) -> Path:
    path = Path(path_str)
    if not path.is_absolute():
        path = PROJECT_ROOT / path
    return path.resolve()


def _load_results(results_path: Path) -> Dict[str, Dict[str, Any]]:
    if not results_path.exists():
        raise FileNotFoundError(f"Results file not found: {results_path}")
    with results_path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError("Monte Carlo results JSON must be a dictionary")
    return data


def _try_load_mae(metrics_path: Path) -> Optional[float]:
    if not metrics_path.exists():
        return None
    with metrics_path.open("r", encoding="utf-8") as handle:
        metrics = json.load(handle)
    if isinstance(metrics, dict):
        for key in ("mae", "mean_absolute_error", "model_mae"):
            value = metrics.get(key)
            if isinstance(value, (int, float)):
                return float(value)
    return None


def _resolve_mae(explicit_mae: Optional[float], metrics_hint: Optional[str]) -> float:
    if explicit_mae is not None:
        return float(explicit_mae)
    if metrics_hint:
        candidate = _try_load_mae(_resolve_path(metrics_hint))
        if candidate is not None:
            return candidate
    default_metrics_path = PROJECT_ROOT / "outputs" / "model_metrics.json"
    candidate = _try_load_mae(default_metrics_path)
    if candidate is not None:
        return candidate
    print("[warn] Model MAE not found. Defaulting to 0.0 for export metadata.")
    return 0.0


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export all frontend JSON files from Monte Carlo results.")
    parser.add_argument(
        "--results",
        default="outputs/monte_carlo_results.json",
        help="Path to monte_carlo_results.json (default: outputs/monte_carlo_results.json)",
    )
    parser.add_argument(
        "--output-dir",
        default="outputs",
        help="Directory where JSON exports will be written (default: outputs)",
    )
    parser.add_argument(
        "--mae",
        type=float,
        default=None,
        help="Model mean absolute error. Overrides any metrics file lookup.",
    )
    parser.add_argument(
        "--metrics",
        default=None,
        help="Optional path to a metrics JSON file with an 'mae' or 'model_mae' field.",
    )
    return parser.parse_args(argv)


def main(argv: Optional[list[str]] = None) -> None:
    args = parse_args(argv)

    results_path = _resolve_path(args.results)
    output_dir = _resolve_path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    mae = _resolve_mae(args.mae, args.metrics)
    results = _load_results(results_path)

    if str(PROJECT_ROOT) not in sys.path:
        sys.path.insert(0, str(PROJECT_ROOT))

    from src.json_exporter import export_all_jsons

    print("Preparing JSON exports...")
    exported = export_all_jsons(results=results, model_mae=mae, output_dir=output_dir)

    print("\nCompleted export run:")
    print(f"  Source results: {results_path}")
    print(f"  Output folder: {output_dir / 'json'}")
    print(f"  Files generated: {len(exported)}")


if __name__ == "__main__":
    main()
