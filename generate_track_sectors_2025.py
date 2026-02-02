"""Generate track sector analysis JSON files for all 2025 races with parallelization."""

from __future__ import annotations

import json
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.json_exporter import export_track_sector_analysis


def load_monte_carlo_results(results_path: Path) -> dict:
    """Load Monte Carlo results from JSON file."""
    print(f"📂 Loading results from: {results_path}")
    with results_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    return data


def get_2025_tracks(results: dict) -> list[str]:
    """Extract all 2025 race keys from results."""
    tracks_2025 = [key for key in results.keys() if key.startswith("2025_")]
    tracks_2025.sort()
    return tracks_2025


def export_single_track(track_key: str, results: dict, output_dir: Path) -> tuple[str, bool, str]:
    """Export a single track analysis. Returns (track_key, success, message)."""
    try:
        output_path = export_track_sector_analysis(results, track_key, output_dir)
        return (track_key, True, str(output_path))
    except Exception as e:
        return (track_key, False, str(e))


def main():
    # Configuration
    results_path = PROJECT_ROOT / "outputs" / "monte_carlo_results_calibrated_0.12.json"
    output_dir = PROJECT_ROOT / "outputs" / "json"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load results
    results = load_monte_carlo_results(results_path)
    
    # Get 2025 tracks
    tracks_2025 = get_2025_tracks(results)
    print(f"\n🏁 Found {len(tracks_2025)} races in 2025 season")
    print(f"📍 Tracks: {', '.join([t.replace('2025_', '') for t in tracks_2025])}")
    
    if not tracks_2025:
        print("❌ No 2025 tracks found in results")
        return
    
    # Export with parallelization
    print(f"\n⚡ Starting parallel export (using all CPU cores)...")
    successful = []
    failed = []
    
    with ProcessPoolExecutor() as executor:
        # Submit all tasks
        future_to_track = {
            executor.submit(export_single_track, track_key, results, output_dir): track_key
            for track_key in tracks_2025
        }
        
        # Process completed tasks
        for future in as_completed(future_to_track):
            track_key, success, message = future.result()
            if success:
                successful.append(track_key)
                print(f"  ✅ {track_key}: {Path(message).name}")
            else:
                failed.append((track_key, message))
                print(f"  ❌ {track_key}: {message}")
    
    # Summary
    print(f"\n{'='*60}")
    print(f"✅ Successfully exported: {len(successful)}/{len(tracks_2025)} tracks")
    if failed:
        print(f"❌ Failed: {len(failed)} tracks")
        for track_key, error in failed:
            print(f"   - {track_key}: {error}")
    print(f"📁 Output directory: {output_dir}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
