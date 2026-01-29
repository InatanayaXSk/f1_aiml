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

def get_official_corners(gp_name):
    key = gp_name.lower().replace(" ", "-")
    return OFFICIAL_CORNERS.get(key, None)

# ------------------ MAIN FUNCTION ------------------
def extract_track_coordinates(year, gp_name, session_type='R'):
    cache_dir = 'cache'
    os.makedirs(cache_dir, exist_ok=True)
    fastf1.Cache.enable_cache(cache_dir)

    session = fastf1.get_session(year, gp_name, session_type)
    session.load()

    fastest_lap = session.laps.pick_fastest()
    telemetry = fastest_lap.get_telemetry().add_distance()

    x_coords = telemetry['X'].values
    y_coords = telemetry['Y'].values
    z_coords = telemetry['Z'].values if 'Z' in telemetry.columns else None

    # ------------------ SECTORS ------------------
    sectors = []
    try:
        s1 = fastest_lap['Sector1Time']
        s2 = fastest_lap['Sector2Time']
        session_time = telemetry['SessionTime']
        lap_start = session_time.iloc[0]

        s1_end = lap_start + s1
        s2_end = lap_start + s1 + s2

        i1 = (session_time - s1_end).abs().idxmin()
        i2 = (session_time - s2_end).abs().idxmin()

        p1 = telemetry.index.get_loc(i1)
        p2 = telemetry.index.get_loc(i2)

        sectors = [
            {"sector": 1, "start": 0, "end": p1},
            {"sector": 2, "start": p1, "end": p2},
            {"sector": 3, "start": p2, "end": len(telemetry)-1}
        ]
    except:
        n = len(telemetry)
        sectors = [
            {"sector": 1, "start": 0, "end": n//3},
            {"sector": 2, "start": n//3, "end": 2*n//3},
            {"sector": 3, "start": 2*n//3, "end": n-1}
        ]

    # ------------------ NORMALIZE COORDS ------------------
    x_min, x_max = x_coords.min(), x_coords.max()
    y_min, y_max = y_coords.min(), y_coords.max()

    x_norm = ((x_coords - x_min)/(x_max-x_min)*450+25).tolist()
    y_norm = ((y_coords - y_min)/(y_max-y_min)*350+25).tolist()

    step = max(1, len(x_norm)//200)

    # ------------------ SVG PATHS ------------------
    sector_paths = []
    for s in sectors:
        xs = x_norm[s["start"]:s["end"]:step]
        ys = y_norm[s["start"]:s["end"]:step]
        if not xs:
            continue
        path = f"M {xs[0]:.2f} {ys[0]:.2f}"
        for i in range(1, len(xs)):
            path += f" L {xs[i]:.2f} {ys[i]:.2f}"
        sector_paths.append({"sector": s["sector"], "path": path})

    full_path = f"M {x_norm[0]:.2f} {y_norm[0]:.2f}"
    for i in range(step, len(x_norm), step):
        full_path += f" L {x_norm[i]:.2f} {y_norm[i]:.2f}"
    full_path += " Z"

    # ------------------ ELEVATION ------------------
    elevation_change = None
    if z_coords is not None:
        elevation_change = float(np.max(z_coords) - np.min(z_coords))

    # ------------------ BANKING (approx curvature proxy) ------------------
    dx = np.gradient(x_coords)
    dy = np.gradient(y_coords)
    curvature = np.abs(np.gradient(np.arctan2(dy, dx)))
    banking_estimate = float(np.mean(curvature))

    # ------------------ DRS ZONES (Use hardcoded data) ------------------
    drs_zones = []
    track_key = gp_name.lower().replace(" ", "-")
    if track_key in OFFICIAL_DRS_ZONES:
        drs_zones = OFFICIAL_DRS_ZONES[track_key]
    else:
        # Fallback: try FastF1 API
        try:
            circuit_info = session.get_circuit_info()
            for zone in circuit_info.drs_zones:
                drs_zones.append({
                    "start_distance": float(zone.start),
                    "end_distance": float(zone.end)
                })
        except:
            pass

    # ------------------ OVERTAKING DIFFICULTY (CALCULATED) ------------------
    straight_frac = calculate_straight_fraction(telemetry)
    corners_count = get_official_corners(gp_name) or 14
    track_type_idx = calculate_track_type(telemetry)
    num_drs = len(drs_zones)
    
    # Calculate overtaking difficulty (1=easy, 5=very difficult)
    # Based on: low straight fraction + high corners + street circuits = harder overtaking
    overtaking_score = (
        (1 - straight_frac) * 2.0 +  # Less straights = harder
        (corners_count / 20.0) * 1.5 +  # More corners = harder
        (1 if track_type_idx == 0 else 0) * 1.5 +  # Street circuit penalty
        (max(0, 2 - num_drs) * 0.5)  # Fewer DRS zones = harder
    )
    overtaking_difficulty = int(np.clip(overtaking_score, 1, 5))

    # ------------------ CHARACTERISTICS ------------------
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