"""
Helper script to generate track data for all circuits in the dropdown
"""
import subprocess
import sys

# Map of track IDs to their FastF1 names
TRACK_MAPPINGS = {
    'bahrain': 'Bahrain',
    'monaco': 'Monaco',
    'monza': 'Monza',
    'silverstone': 'Silverstone',
    'spa': 'Spa',
}

def generate_track_data(track_id, gp_name, year=2024, session='Q'):
    """Generate track data for a specific circuit"""
    print(f"\n{'='*60}")
    print(f"Generating data for {gp_name} ({track_id})...")
    print(f"{'='*60}")
    
    output_file = f'track_data_{track_id}.json'
    
    try:
        result = subprocess.run(
            [sys.executable, 'pathGen.py', 
             '--year', str(year), 
             '--gp', gp_name, 
             '--session', session,
             '--output', output_file],
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        if result.returncode == 0:
            print(f"Success: {output_file}")
            return True
        else:
            print(f"Failed: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"Timeout: Generation took too long")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    print("F1 Track Data Generator")
    print("Generating track data for all circuits in the dropdown...\n")
    
    successful = []
    failed = []
    
    for track_id, gp_name in TRACK_MAPPINGS.items():
        success = generate_track_data(track_id, gp_name)
        
        if success:
            successful.append(track_id)
        else:
            failed.append(track_id)
    
    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Successful: {len(successful)}/{len(TRACK_MAPPINGS)}")
    for track_id in successful:
        print(f"  - {track_id}")
    
    if failed:
        print(f"\nFailed: {len(failed)}")
        for track_id in failed:
            print(f"  - {track_id}")
        print("\nYou can retry failed tracks with:")
        for track_id in failed:
            gp_name = TRACK_MAPPINGS[track_id]
            print(f"  python pathGen.py --gp {gp_name} --session Q --output track_data_{track_id}.json")
    
    print(f"\n{'='*60}")

if __name__ == "__main__":
    main()
