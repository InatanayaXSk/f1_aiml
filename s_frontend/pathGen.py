import fastf1
import numpy as np
import json
import os
import argparse
from scipy.signal import find_peaks

# ------------------ OFFICIAL FIA CORNER COUNTS ------------------
OFFICIAL_CORNERS = {
    "australia": 14, "china": 16, "japan": 18, "bahrain": 15,
    "saudi-arabia": 27, "miami": 19, "emilia-romagna": 19,
    "monaco": 19, "spain": 14, "canada": 14, "austria": 10,
    "great-britain": 18, "belgium": 19, "hungary": 14,
    "netherlands": 14, "italy": 11, "azerbaijan": 20,
    "singapore": 19, "united-states": 20, "mexico": 17,
    "brazil": 15, "las-vegas": 17, "qatar": 16, "abu-dhabi": 16
}

# ------------------ OFFICIAL DRS ZONES (Hardcoded from FIA documents) ------------------
OFFICIAL_DRS_ZONES = {
    "australia": [{"start_distance": 800, "end_distance": 1200}, {"start_distance": 2800, "end_distance": 3200}],
    "bahrain": [{"start_distance": 600, "end_distance": 1100}, {"start_distance": 2400, "end_distance": 2900}],
    "saudi-arabia": [{"start_distance": 1200, "end_distance": 1800}, {"start_distance": 3500, "end_distance": 4100}],
    "china": [{"start_distance": 1000, "end_distance": 1600}, {"start_distance": 3200, "end_distance": 3800}],
    "azerbaijan": [{"start_distance": 800, "end_distance": 1400}, {"start_distance": 3800, "end_distance": 4500}],
    "spain": [{"start_distance": 900, "end_distance": 1400}],
    "monaco": [{"start_distance": 800, "end_distance": 950}],
    "canada": [{"start_distance": 1100, "end_distance": 1650}, {"start_distance": 2600, "end_distance": 3100}],
    "austria": [{"start_distance": 600, "end_distance": 1100}, {"start_distance": 2200, "end_distance": 2700}],
    "great-britain": [{"start_distance": 1000, "end_distance": 1600}, {"start_distance": 3400, "end_distance": 4000}],
    "hungary": [{"start_distance": 800, "end_distance": 1200}],
    "belgium": [{"start_distance": 1400, "end_distance": 2200}, {"start_distance": 4200, "end_distance": 5000}],
    "netherlands": [{"start_distance": 700, "end_distance": 1300}, {"start_distance": 2400, "end_distance": 3000}],
    "italy": [{"start_distance": 400, "end_distance": 1000}, {"start_distance": 3200, "end_distance": 3900}],
    "singapore": [{"start_distance": 900, "end_distance": 1350}, {"start_distance": 2800, "end_distance": 3300}],
    "japan": [{"start_distance": 1100, "end_distance": 1700}],
    "qatar": [{"start_distance": 800, "end_distance": 1400}, {"start_distance": 3000, "end_distance": 3600}],
    "united-states": [{"start_distance": 1300, "end_distance": 1950}],
    "mexico": [{"start_distance": 700, "end_distance": 1300}, {"start_distance": 2900, "end_distance": 3500}],
    "brazil": [{"start_distance": 600, "end_distance": 1100}, {"start_distance": 2200, "end_distance": 2800}],
    "las-vegas": [{"start_distance": 1400, "end_distance": 2100}, {"start_distance": 3600, "end_distance": 4200}],
    "abu-dhabi": [{"start_distance": 900, "end_distance": 1500}, {"start_distance": 3100, "end_distance": 3700}],
    "miami": [{"start_distance": 850, "end_distance": 1400}, {"start_distance": 2700, "end_distance": 3300}],
    "emilia-romagna": [{"start_distance": 700, "end_distance": 1200}],
}

# ------------------ TRACK MAPPINGS FOR BATCH GENERATION ------------------
TRACK_MAPPINGS = {
    'australia': 'Australia',
    'china': 'China',
    'japan': 'Japan',
    'bahrain': 'Bahrain',
    'saudi-arabia': 'Saudi Arabia',
    'miami': 'Miami',
    'emilia-romagna': 'Emilia Romagna',
    'monaco': 'Monaco',
    'spain': 'Spain',
    'canada': 'Canada',
    'austria': 'Austria',
    'great-britain': 'Great Britain',
    'belgium': 'Belgium',
    'hungary': 'Hungary',
    'netherlands': 'Netherlands',
    'italy': 'Italy',
    'azerbaijan': 'Azerbaijan',
    'singapore': 'Singapore',
    'united-states': 'United States',
    'mexico': 'Mexico',
    'brazil': 'Brazil',
    'las-vegas': 'Las Vegas',
    'qatar': 'Qatar',
    'abu-dhabi': 'Abu Dhabi',
}

# Map of GP names to their official corner counts
CORNER_MAPPINGS = {
    'Australia': 14,
    'China': 16,
    'Japan': 18,
    'Bahrain': 15,
    'Saudi Arabia': 27,
    'Miami': 19,
    'Emilia Romagna': 19,
    'Monaco': 19,
    'Spain': 14,
    'Canada': 14,
    'Austria': 10,
    'Great Britain': 18,
    'Belgium': 19,
    'Hungary': 14,
    'Netherlands': 14,
    'Italy': 11,
    'Azerbaijan': 20,
    'Singapore': 19,
    'United States': 20,
    'Mexico': 17,
    'Brazil': 15,
    'Las Vegas': 17,
    'Qatar': 16,
    'Abu Dhabi': 16,
}

# ------------------ MAIN FUNCTION ------------------
def extract_track_coordinates(year, gp_name, session_type='R'):
    """
    Extract track coordinates from FastF1 telemetry data with sector information
    
    Args:
        year: Season year (e.g., 2024)
        gp_name: Grand Prix name (e.g., 'Monza', 'Monaco')
        session_type: 'R' for Race, 'Q' for Quali, 'FP1', etc.
    """
    try:
        # Enable cache for faster loading
        cache_dir = 'cache'
        if not os.path.exists(cache_dir):
            os.makedirs(cache_dir)
        fastf1.Cache.enable_cache(cache_dir)
        
        # Load session
        session = fastf1.get_session(year, gp_name, session_type)
        session.load()
    except Exception as e:
        print(f"Error loading session: {e}")
        raise
    
    # Get fastest lap telemetry (cleanest racing line)
    try:
        fastest_lap = session.laps.pick_fastest()
        if fastest_lap is None:
            raise ValueError("No valid laps found in session")
        telemetry = fastest_lap.get_telemetry().add_distance()
    except Exception as e:
        print(f"Error getting telemetry: {e}")
        raise
    
    # Extract coordinates
    x_coords = telemetry['X'].values
    y_coords = telemetry['Y'].values
    z_coords = telemetry['Z'].values if 'Z' in telemetry.columns else None
    
    # Get sector information - sectors are 1, 2, 3 in the data
    sectors = []
    if 'SessionTime' in telemetry.columns:
        try:
            # Get sector times from the lap
            sector1_time = fastest_lap['Sector1Time']
            sector2_time = fastest_lap['Sector2Time']
            
            # Find indices where sectors change
            session_time = telemetry['SessionTime']
            lap_start_time = session_time.iloc[0]
            
            # Calculate sector boundaries
            sector1_end_time = lap_start_time + sector1_time
            sector2_end_time = lap_start_time + sector1_time + sector2_time
            
            # Find closest indices
            sector1_end_idx = (session_time - sector1_end_time).abs().idxmin()
            sector2_end_idx = (session_time - sector2_end_time).abs().idxmin()
            
            # Get positions in the telemetry array
            sector1_end_pos = telemetry.index.get_loc(sector1_end_idx)
            sector2_end_pos = telemetry.index.get_loc(sector2_end_idx)
            
            sectors = [
                {"sector": 1, "start": 0, "end": sector1_end_pos},
                {"sector": 2, "start": sector1_end_pos, "end": sector2_end_pos},
                {"sector": 3, "start": sector2_end_pos, "end": len(telemetry) - 1}
            ]
            
            print(f"Sector 1: 0 to {sector1_end_pos}")
            print(f"Sector 2: {sector1_end_pos} to {sector2_end_pos}")
            print(f"Sector 3: {sector2_end_pos} to {len(telemetry) - 1}")
            
        except Exception as e:
            print(f"Warning: Could not extract sector times: {e}")
            total_points = len(telemetry)
            sectors = [{"sector": 1, "start": 0, "end": total_points // 3},
                       {"sector": 2, "start": total_points // 3, "end": 2 * total_points // 3},
                       {"sector": 3, "start": 2 * total_points // 3, "end": total_points - 1}]
    else:
        total_points = len(telemetry)
        sectors = [{"sector": 1, "start": 0, "end": total_points // 3},
                   {"sector": 2, "start": total_points // 3, "end": 2 * total_points // 3},
                   {"sector": 3, "start": 2 * total_points // 3, "end": total_points - 1}]
    
    # Normalize to 0-500 range for SVG viewBox
    x_min, x_max = x_coords.min(), x_coords.max()
    y_min, y_max = y_coords.min(), y_coords.max()
    
    x_norm = ((x_coords - x_min) / (x_max - x_min) * 450 + 25).tolist()
    y_norm = ((y_coords - y_min) / (y_max - y_min) * 350 + 25).tolist()
    
    # Sample points to reduce complexity
    step = max(1, len(x_norm) // 200)
    
    # Create sector-specific paths
    sector_paths = []
    for sector_info in sectors:
        start_idx = sector_info["start"]
        end_idx = sector_info["end"]
        sector_x = x_norm[start_idx:end_idx:step]
        sector_y = y_norm[start_idx:end_idx:step]
        
        if len(sector_x) == 0: continue
            
        path_data = f"M {sector_x[0]:.2f} {sector_y[0]:.2f}"
        for i in range(1, len(sector_x)):
            path_data += f" L {sector_x[i]:.2f} {sector_y[i]:.2f}"
        
        sector_paths.append({"sector": sector_info["sector"], "path": path_data})
    
    # Create full path for reference
    full_path = f"M {x_norm[0]:.2f} {y_norm[0]:.2f}"
    for i in range(step, len(x_norm), step):
        full_path += f" L {x_norm[i]:.2f} {y_norm[i]:.2f}"
    full_path += " Z"
    
    # Calculate elevation change
    elevation_change = float(np.max(z_coords) - np.min(z_coords)) if z_coords is not None else 0.0

    # Banking/Curvature proxy
    dx = np.gradient(x_coords)
    dy = np.gradient(y_coords)
    curvature = np.abs(np.gradient(np.arctan2(dy, dx)))
    banking_estimate = float(np.mean(curvature))

    # DRS Zones
    track_key = gp_name.lower().replace(" ", "-")
    drs_zones = OFFICIAL_DRS_ZONES.get(track_key, [])

    # Official corner count
    official_corners = CORNER_MAPPINGS.get(gp_name)
    corners_count = official_corners if official_corners is not None else count_corners(telemetry)

    # Track classification
    straight_frac = calculate_straight_fraction(telemetry)
    track_type_idx = calculate_track_type(telemetry)
    
    num_drs = len(drs_zones)
    overtaking_score = (
        (1 - straight_frac) * 2.0 + 
        (corners_count / 20.0) * 1.5 + 
        (1 if track_type_idx == 0 else 0) * 1.5 + 
        (max(0, 2 - num_drs) * 0.5)
    )
    overtaking_difficulty = int(np.clip(overtaking_score, 1, 5))

    # Calculate track characteristics
    track_data = {
        "name": gp_name,
        "fullName": session.event['EventName'],
        "characteristics": {
            "track_type_index": track_type_idx,
            "track_type_name": get_track_type_name(track_type_idx),
            "corners": corners_count,
            "straight_fraction": float(straight_frac),
            "overtaking_difficulty": overtaking_difficulty,
            "elevation_change_m": elevation_change,
            "banking_index": banking_estimate,
            "drs_zones": drs_zones
        },
        "svg_path": full_path,
        "sector_paths": sector_paths,
        "sectors": sectors,
        "coordinates": {"x": x_norm, "y": y_norm}
    }
    
    return track_data

# ------------------ HELPERS ------------------
def get_track_type_name(index):
    names = ["Street/Tight", "Technical", "Balanced", "Fast", "High-Speed"]
    return names[index] if 0 <= index < len(names) else "Balanced"

def calculate_straight_fraction(telemetry):
    threshold = telemetry['Speed'].quantile(0.8)
    return (telemetry['Speed'] > threshold).sum() / len(telemetry)

def calculate_track_type(telemetry):
    avg_speed = telemetry['Speed'].mean()
    norm = (avg_speed - 160)/(240-160)*4
    return int(np.clip(norm, 0, 4))

# ------------------ BATCH GENERATION ------------------
def generate_all_tracks(year, session_type):
    """Generate track data for all circuits in TRACK_MAPPINGS"""
    print("F1 Track Data Generator")
    print(f"Generating track data for all {len(TRACK_MAPPINGS)} circuits...\n")
    
    successful = []
    failed = []
    
    for track_id, gp_name in TRACK_MAPPINGS.items():
        print(f"\n{'='*60}")
        print(f"Generating data for {gp_name} ({track_id})...")
        print(f"{'='*60}")
        
        output_file = f'../track_data_{track_id}.json'
        
        try:
            track_data = extract_track_coordinates(year, gp_name, session_type)
            
            with open(output_file, "w") as f:
                json.dump(track_data, f, indent=2)
            
            print(f"[SUCCESS] {output_file}")
            successful.append(track_id)
            
        except Exception as e:
            print(f"[FAILED] {e}")
            failed.append(track_id)
    
    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Successful: {len(successful)}/{len(TRACK_MAPPINGS)}")
    for track_id in successful:
        print(f"  [OK] {track_id}")
    
    if failed:
        print(f"\nFailed: {len(failed)}")
        for track_id in failed:
            print(f"  [X] {track_id}")
        print("\nYou can retry failed tracks with:")
        for track_id in failed:
            gp_name = TRACK_MAPPINGS[track_id]
            print(f"  python pathGen.py --gp '{gp_name}' --session {session_type} --output track_data_{track_id}.json")
    
    print(f"\n{'='*60}")
    return len(successful), len(failed)

# ------------------ CLI ------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Extract F1 track coordinates from FastF1 telemetry data',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate a single track
  python pathGen.py --gp Monza --session Q
  
  # Generate all tracks
  python pathGen.py --all
  
  # Generate all tracks for 2024 season
  python pathGen.py --all --year 2024 --session R
        """
    )
    
    parser.add_argument('--all', action='store_true', 
                        help='Generate data for all tracks in the 2025 calendar')
    parser.add_argument('--year', type=int, default=2025, 
                        help='Season year (default: 2025)')
    parser.add_argument('--gp', dest='gp_name', type=str, default='Monza',
                        help='Grand Prix name (e.g., Monza, Monaco, Silverstone)')
    parser.add_argument('--session', dest='session_type', type=str, default='Q',
                        help='Session type: R (Race), Q (Qualifying), FP1, FP2, FP3, S (Sprint)')
    parser.add_argument('--output', type=str, default=None,
                        help='Output JSON filename (only for single track generation)')
    
    args = parser.parse_args()
    
    if args.all:
        # Generate all tracks
        successful, failed = generate_all_tracks(args.year, args.session_type)
        exit(0 if failed == 0 else 1)
    else:
        # Generate single track
        out = args.output or f"track_data_{args.gp_name.lower().replace(' ', '-')}.json"
        
        try:
            track_data = extract_track_coordinates(args.year, args.gp_name, args.session_type)
            
            with open(out, "w") as f:
                json.dump(track_data, f, indent=2)
            
            print(f"\n[SUCCESS] Track data generated!")
            print(f"  Track: {track_data['name']}")
            print(f"  Full Name: {track_data['fullName']}")
            print(f"  Saved to: {out}")
            
        except Exception as e:
            print(f"\n[ERROR] {e}")
            print("\nMake sure the session data is available. Try different session types (R, Q, FP1, etc.)")
            exit(1)