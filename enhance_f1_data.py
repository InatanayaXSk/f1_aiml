import json
import os
from pathlib import Path

# Paths
BASE_DIR = Path(r"e:\FIRST YEAR\Third Year\AIML\f1_aiml")
TRACK_DATA_FILES = list(BASE_DIR.glob("track_data_*.json"))
MONTE_CARLO_FILE = BASE_DIR / "outputs" / "monte_carlo_results.json"

# Mock/Extracted Boost Ratings (from src/track_metadata.py)
BOOST_RATINGS = {
    "monza": 0.95,
    "monaco": 0.25,
    "silverstone": 0.78,
    "bahrain": 0.68,
    "spa": 0.88
}

# Sector Characteristics (Feature 2)
SECTOR_TEMPLATES = {
    "high-speed": {
        "type": "High-Speed",
        "impact_factor": "Power",
        "description": "Critical for 2026 ERS deployment where battery recovery is challenged by high top speeds."
    },
    "technical": {
        "type": "Technical",
        "impact_factor": "Aero",
        "description": "Requires high downforce. Active aero (Z-mode) will provide maximum grip in these corners."
    },
    "balanced": {
        "type": "Balanced",
        "impact_factor": "Mixed",
        "description": "A mix of medium-speed corners and short straights. Strategic boost management is key."
    }
}

def load_monte_carlo_deltas():
    if not MONTE_CARLO_FILE.exists():
        return {}
    
    try:
        with open(MONTE_CARLO_FILE, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading Monte Carlo: {e}")
        return {}
    
    deltas = {}
    for race_id, race_data in data.items():
        event_name = race_data.get("event_name", "").lower()
        current_data = race_data.get("current", {})
        future_data = race_data.get("2026", {})
        
        if not current_data or not future_data:
            continue
            
        driver_deltas = []
        for driver, stats in current_data.items():
            if driver in future_data:
                # Delta = 2026 - Current (negative means improvement)
                delta = future_data[driver]["mean"] - stats["mean"]
                driver_deltas.append(delta)
        
        if driver_deltas:
            avg_delta = sum(driver_deltas) / len(driver_deltas)
            # Find which track this is
            found = False
            for track_key in BOOST_RATINGS.keys():
                if track_key in event_name:
                    deltas[track_key] = avg_delta
                    found = True
                    break
            if not found:
                # Try to map based on race_id or common names
                if "bahrain" in event_name or "sakhir" in event_name: deltas["bahrain"] = avg_delta
                elif "monaco" in event_name: deltas["monaco"] = avg_delta
                elif "monza" in event_name: deltas["monza"] = avg_delta
                elif "silverstone" in event_name: deltas["silverstone"] = avg_delta
                elif "spa" in event_name: deltas["spa"] = avg_delta
                    
    return deltas

def get_zones(track_name, total_coords):
    # Simplified DRS/Aero zone detection
    if track_name == "monza":
        return [
            {"type": "DRS", "start_idx": int(total_coords * 0.05), "end_idx": int(total_coords * 0.20)},
            {"type": "Aero", "start_idx": int(total_coords * 0.05), "end_idx": int(total_coords * 0.20)},
            {"type": "DRS", "start_idx": int(total_coords * 0.45), "end_idx": int(total_coords * 0.60)},
            {"type": "Aero", "start_idx": int(total_coords * 0.45), "end_idx": int(total_coords * 0.60)}
        ]
    elif track_name == "monaco":
        return [
            {"type": "DRS", "start_idx": int(total_coords * 0.85), "end_idx": int(total_coords * 0.98)}
        ]
    else:
        # Generic zones for others
        return [
            {"type": "DRS", "start_idx": int(total_coords * 0.1), "end_idx": int(total_coords * 0.25)},
            {"type": "Aero", "start_idx": int(total_coords * 0.1), "end_idx": int(total_coords * 0.25)}
        ]

def main():
    print("🚀 Enhancing F1 Track Data...")
    deltas = load_monte_carlo_deltas()
    print(f"  Extracted deltas: {deltas}")
    
    for file_path in TRACK_DATA_FILES:
        track_key = file_path.stem.replace("track_data_", "")
        print(f"  Processing {track_key}...")
        
        try:
            with open(file_path, 'r') as f:
                track_data = json.load(f)
                
            # Feature 1: Boost & Delta
            track_data["characteristics"]["boost_rating"] = BOOST_RATINGS.get(track_key, 0.5)
            track_data["characteristics"]["regulation_delta"] = deltas.get(track_key, -0.05)
            
            # Feature 2: Sector Details
            track_type = track_data["characteristics"]["track_type_name"].lower()
            
            track_data["characteristics"]["sector_details"] = {
                "1": SECTOR_TEMPLATES["high-speed"] if track_key != "monaco" else SECTOR_TEMPLATES["technical"],
                "2": SECTOR_TEMPLATES["technical"],
                "3": SECTOR_TEMPLATES["balanced"]
            }
            
            # Feature 4: Zones
            if "coordinates" in track_data:
                total_coords = len(track_data["coordinates"]["x"])
                track_data["zones"] = get_zones(track_key, total_coords)
            
            # Save back
            with open(file_path, 'w') as f:
                json.dump(track_data, f, indent=2)
        except Exception as e:
            print(f"  ❌ Error processing {track_key}: {e}")
            
    print("✅ All track JSONs enhanced!")

if __name__ == "__main__":
    main()
