"""
Quick setup script to prepare frontend data for presentation
Copies track data JSONs and outputs to frontend public folder
"""

import shutil
import json
from pathlib import Path

def main():
    project_root = Path(__file__).parent
    frontend_public = project_root / "frontend" / "public"
    
    # Create public directory if it doesn't exist
    frontend_public.mkdir(exist_ok=True)
    
    # Create outputs subdirectory
    outputs_dir = frontend_public / "outputs"
    outputs_dir.mkdir(exist_ok=True)
    
    json_dir = outputs_dir / "json"
    json_dir.mkdir(exist_ok=True)
    
    print("🚀 Setting up frontend data for presentation...")
    print("=" * 60)
    
    # Copy track data JSON files
    track_files = list(project_root.glob("track_data_*.json"))
    print(f"\n📍 Copying {len(track_files)} track data files...")
    for track_file in track_files:
        dest = frontend_public / track_file.name
        shutil.copy2(track_file, dest)
        print(f"  ✓ {track_file.name}")
    
    # Copy Monte Carlo results
    monte_carlo = project_root / "outputs" / "monte_carlo_results.json"
    if monte_carlo.exists():
        dest = outputs_dir / "monte_carlo_results.json"
        shutil.copy2(monte_carlo, dest)
        print(f"\n✓ Copied monte_carlo_results.json")
    else:
        print(f"\n⚠️  WARNING: {monte_carlo} not found!")
        print("   Run notebooks/combined_pipeline.ipynb first")
    
    # Copy JSON outputs
    source_json_dir = project_root / "outputs" / "json"
    if source_json_dir.exists():
        json_files = list(source_json_dir.glob("*.json"))
        print(f"\n📊 Copying {len(json_files)} JSON output files...")
        for json_file in json_files:
            dest = json_dir / json_file.name
            shutil.copy2(json_file, dest)
            print(f"  ✓ {json_file.name}")
    else:
        print(f"\n⚠️  WARNING: {source_json_dir} not found!")
    
    # Create a simple index.json for quick reference
    index_data = {
        "track_files": len(track_files),
        "json_outputs": len(list(json_dir.glob("*.json"))) if json_dir.exists() else 0,
        "monte_carlo_ready": monte_carlo.exists(),
        "setup_complete": True
    }
    
    index_path = outputs_dir / "index.json"
    with open(index_path, 'w') as f:
        json.dump(index_data, f, indent=2)
    
    print("\n" + "=" * 60)
    print("✅ Setup complete!")
    print(f"\n📁 Files copied to: {frontend_public}")
    print(f"   - {index_data['track_files']} track data files")
    print(f"   - {index_data['json_outputs']} JSON outputs")
    print(f"   - Monte Carlo results: {'✓' if index_data['monte_carlo_ready'] else '✗'}")
    print("\n🎯 Next steps:")
    print("   1. cd frontend")
    print("   2. npm install")
    print("   3. npm run dev")
    print("   4. Open http://localhost:5173")

if __name__ == "__main__":
    main()
