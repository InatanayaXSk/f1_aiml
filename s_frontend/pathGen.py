import fastf1
import numpy as np
import json
import os
import argparse
from scipy.signal import find_peaks

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
        telemetry = fastest_lap.get_telemetry()
    except Exception as e:
        print(f"Error getting telemetry: {e}")
        raise
    
    # Extract coordinates
    x_coords = telemetry['X'].values
    y_coords = telemetry['Y'].values
    
    # Get sector information - sectors are 1, 2, 3 in the data
    # We need to find where each sector starts/ends
    sectors = []
    if 'SessionTime' in telemetry.columns:
        try:
            # Get sector times from the lap
            sector1_time = fastest_lap['Sector1Time']
            sector2_time = fastest_lap['Sector2Time']
            sector3_time = fastest_lap['Sector3Time']
            
            # Calculate cumulative times
            sector1_end = sector1_time
            sector2_end = sector1_time + sector2_time
            lap_time = fastest_lap['LapTime']
            
            # Find indices where sectors change
            session_time = telemetry['SessionTime']
            lap_start_time = session_time.iloc[0]
            
            # Calculate sector boundaries
            sector1_end_time = lap_start_time + sector1_end
            sector2_end_time = lap_start_time + sector2_end
            
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
            # Fallback: divide track into 3 equal parts
            total_points = len(telemetry)
            sectors = [
                {"sector": 1, "start": 0, "end": total_points // 3},
                {"sector": 2, "start": total_points // 3, "end": 2 * total_points // 3},
                {"sector": 3, "start": 2 * total_points // 3, "end": total_points - 1}
            ]
    else:
        # Fallback: divide track into 3 equal parts
        total_points = len(telemetry)
        sectors = [
            {"sector": 1, "start": 0, "end": total_points // 3},
            {"sector": 2, "start": total_points // 3, "end": 2 * total_points // 3},
            {"sector": 3, "start": 2 * total_points // 3, "end": total_points - 1}
        ]
    
    # Normalize to 0-500 range for SVG viewBox
    x_min, x_max = x_coords.min(), x_coords.max()
    y_min, y_max = y_coords.min(), y_coords.max()
    
    # Add padding (25px margin)
    x_normalized = ((x_coords - x_min) / (x_max - x_min) * 450 + 25).tolist()
    y_normalized = ((y_coords - y_min) / (y_max - y_min) * 350 + 25).tolist()
    
    # Sample points to reduce complexity
    step = max(1, len(x_normalized) // 200)
    
    # Create sector-specific paths
    sector_paths = []
    for sector_info in sectors:
        start_idx = sector_info["start"]
        end_idx = sector_info["end"]
        
        # Sample the sector
        sector_x = x_normalized[start_idx:end_idx:step]
        sector_y = y_normalized[start_idx:end_idx:step]
        
        if len(sector_x) == 0:
            continue
            
        path_data = f"M {sector_x[0]:.2f} {sector_y[0]:.2f}"
        for i in range(1, len(sector_x)):
            path_data += f" L {sector_x[i]:.2f} {sector_y[i]:.2f}"
        
        sector_paths.append({
            "sector": sector_info["sector"],
            "path": path_data,
            "start_idx": start_idx,
            "end_idx": end_idx
        })
    
    # Create full path for reference
    path_data = f"M {x_normalized[0]:.2f} {y_normalized[0]:.2f}"
    for i in range(step, len(x_normalized), step):
        path_data += f" L {x_normalized[i]:.2f} {y_normalized[i]:.2f}"
    path_data += " Z"
    
    # Calculate track characteristics
    track_data = {
        "name": gp_name,
        "fullName": session.event['EventName'],
        "characteristics": {
            "track_type_index": calculate_track_type(telemetry),
            "track_type_name": get_track_type_name(calculate_track_type(telemetry)),
            "corners": count_corners(telemetry),
            "straight_fraction": float(calculate_straight_fraction(telemetry)),
            "overtaking_difficulty": 2  # Manual or ML-based rating
        },
        "svg_path": path_data,
        "sector_paths": sector_paths,
        "sectors": sectors,
        "coordinates": {
            "x": x_normalized,
            "y": y_normalized
        }
    }
    
    return track_data

def get_track_type_name(index):
    """Map track type index to name"""
    names = ["Street/Tight", "Technical", "Balanced", "Fast", "High-Speed"]
    return names[index] if 0 <= index < len(names) else "Balanced"

def calculate_straight_fraction(telemetry):
    """Calculate percentage of track that is straight (speed > threshold)"""
    high_speed_threshold = telemetry['Speed'].quantile(0.8)
    straight_points = (telemetry['Speed'] > high_speed_threshold).sum()
    return straight_points / len(telemetry)

def count_corners(telemetry):
    """Count significant direction changes using speed reduction"""
    try:
        speed = telemetry['Speed'].values
        speed_smoothed = np.convolve(speed, np.ones(5)/5, mode='same')
        peaks, _ = find_peaks(-speed_smoothed, prominence=10, distance=50)
        return len(peaks)
    except Exception as e:
        print(f"Warning: Could not count corners accurately: {e}")
        return 15

def calculate_track_type(telemetry):
    """
    Calculate track type index (0-4)
    0: Street/Tight, 4: High-Speed
    Based on avg speed and corner frequency
    """
    try:
        avg_speed = telemetry['Speed'].mean()
        normalized = (avg_speed - 160) / (240 - 160) * 4
        return int(np.clip(normalized, 0, 4))
    except Exception as e:
        print(f"Warning: Could not calculate track type: {e}")
        return 2

# Usage example
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Extract F1 track coordinates from FastF1 telemetry data')
    parser.add_argument('--year', type=int, default=2024, help='Season year (e.g., 2024)')
    parser.add_argument('--gp', '--gp_name', dest='gp_name', type=str, default='Monza', help='Grand Prix name (e.g., Monza, Monaco, Silverstone)')
    parser.add_argument('--session', '--session_type', dest='session_type', type=str, default='Q', 
                        help='Session type: R (Race), Q (Qualifying), FP1, FP2, FP3, S (Sprint)')
    parser.add_argument('--output', type=str, default=None, help='Output JSON filename (default: track_data_{gp_name}.json)')
    
    args = parser.parse_args()
    
    # Determine output filename
    output_file = args.output if args.output else f'track_data_{args.gp_name.lower()}.json'
    
    print(f"Fetching track data for {args.year} {args.gp_name} ({args.session_type})...")
    
    try:
        track_data = extract_track_coordinates(args.year, args.gp_name, args.session_type)
        
        # Save to JSON
        with open(output_file, 'w') as f:
            json.dump(track_data, f, indent=2)
        
        print(f"\nSuccessfully generated track data!")
        print(f"Track: {track_data['name']}")
        print(f"Full Name: {track_data['fullName']}")
        print(f"Full SVG Path length: {len(track_data['svg_path'])} chars")
        print(f"Sectors: {len(track_data['sector_paths'])}")
        print(f"Characteristics: {track_data['characteristics']}")
        print(f"Saved to: {output_file}")
    except Exception as e:
        print(f"\nError: {e}")
        print("\nMake sure the session data is available. Try different session types (R, Q, FP1, etc.)")