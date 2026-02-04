"""Generate circuits.csv from default circuit metadata."""

from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.data_loader import DEFAULT_CIRCUIT_METADATA

def main():
    # Create data/raw directory if it doesn't exist
    raw_dir = PROJECT_ROOT / "data" / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    
    # Define output path
    csv_path = raw_dir / "circuits.csv"
    
    # Export to CSV
    DEFAULT_CIRCUIT_METADATA.to_csv(csv_path, index=False)
    
    print("=" * 60)
    print("✅ SUCCESS!")
    print("=" * 60)
    print(f"\n📁 File created: {csv_path}")
    print(f"📊 Records: {len(DEFAULT_CIRCUIT_METADATA)}")
    print(f"\n📋 Circuits included:")
    for _, row in DEFAULT_CIRCUIT_METADATA.iterrows():
        print(f"   - {row['circuit_name']} ({row['country']}) - {row['track_type']}")
    print(f"\n✨ Your notebook will now load this CSV automatically!")
    print("=" * 60)

if __name__ == "__main__":
    main()
