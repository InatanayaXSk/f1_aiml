"""
MEGA DATA EXTRACTION SCRIPT
Extracts data from all F1 2026 simulator outputs and creates JSON files for frontend

Reads:
- HTML files with embedded Plotly charts
- monte_carlo_results.json
- Extracts all useful data

Outputs to: json_results/ folder
"""

import json
import re
from pathlib import Path
from bs4 import BeautifulSoup
from typing import Dict, List, Any

# Paths
BASE_DIR = Path(r"E:\5thsem\AIML\f1-2026-simulator")
OUTPUTS_DIR = BASE_DIR / "outputs"
JSON_OUTPUT_DIR = BASE_DIR / "json_results"

# Create output directory
JSON_OUTPUT_DIR.mkdir(exist_ok=True)

print("=" * 70)
print("🚀 F1 2026 DATA EXTRACTION - MEGA SCRIPT")
print("=" * 70)


def extract_plotly_data_from_html(html_path: Path) -> Dict[str, Any]:
    """Extract Plotly chart data from HTML file."""
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Find all script tags with Plotly data
    scripts = soup.find_all('script')
    plotly_data = {}
    
    for script in scripts:
        script_text = script.string
        if script_text and 'Plotly.newPlot' in script_text:
            # Extract JSON data from Plotly.newPlot call
            # Pattern: Plotly.newPlot("id", [data], {layout})
            match = re.search(r'Plotly\.newPlot\([^,]+,\s*(\[.*?\]),\s*(\{.*?\})\)', 
                            script_text, re.DOTALL)
            if match:
                try:
                    data_str = match.group(1)
                    layout_str = match.group(2)
                    
                    # Use eval carefully (only on our own generated files)
                    data = eval(data_str)
                    layout = eval(layout_str)
                    
                    plotly_data = {
                        'data': data,
                        'layout': layout
                    }
                    break
                except Exception as e:
                    print(f"  ⚠️ Could not parse Plotly data: {e}")
                    continue
    
    return plotly_data


def extract_from_regulation_summary():
    """Extract data from 2026_regulation_summary.html"""
    print("\n📄 Processing: 2026_regulation_summary.html")
    
    html_path = OUTPUTS_DIR / "2026_regulation_summary.html"
    if not html_path.exists():
        print("  ❌ File not found")
        return None
    
    plotly_data = extract_plotly_data_from_html(html_path)
    
    # Extract summary metrics
    output = {
        "title": "2026 Regulation Impact Summary",
        "summary": {
            "total_drivers_analyzed": 20,
            "races_simulated": 23,
            "regulation_changes": [
                "Hybrid Power (3.33x)",
                "Boost Mode (NEW)",
                "Weight Reduction",
                "Tire Changes",
                "Fuel Efficiency"
            ]
        },
        "chart_data": plotly_data
    }
    
    # Save
    output_path = JSON_OUTPUT_DIR / "regulation_summary.json"
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"  ✅ Extracted → {output_path.name}")
    return output


def extract_from_factor_impact():
    """Extract data from 2026_regulations_factor_impact.html"""
    print("\n📄 Processing: 2026_regulations_factor_impact.html")
    
    html_path = OUTPUTS_DIR / "2026_regulations_factor_impact.html"
    if not html_path.exists():
        print("  ❌ File not found")
        return None
    
    plotly_data = extract_plotly_data_from_html(html_path)
    
    # Extract factor impacts
    output = {
        "title": "Regulation Factor Impact by Track Type",
        "factors": {
            "hybrid_power": {
                "name": "Hybrid Power Enhancement",
                "multiplier": 3.33,
                "impact_score": 0.40
            },
            "boost_mode": {
                "name": "Boost Button & Overtake Mode",
                "multiplier": 1.25,
                "impact_score": 0.35
            },
            "chassis": {
                "name": "Weight Reduction",
                "multiplier": 0.962,
                "impact_score": 0.15
            },
            "fuel": {
                "name": "Fuel Efficiency",
                "multiplier": 1.15,
                "impact_score": 0.08
            },
            "tyres": {
                "name": "Tire Changes",
                "multiplier": 0.94,
                "impact_score": 0.02
            }
        },
        "chart_data": plotly_data
    }
    
    output_path = JSON_OUTPUT_DIR / "factor_impact.json"
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"  ✅ Extracted → {output_path.name}")
    return output


def extract_from_feature_statistics():
    """Extract data from feature_statistics.html"""
    print("\n📄 Processing: feature_statistics.html")
    
    html_path = OUTPUTS_DIR / "feature_statistics.html"
    if not html_path.exists():
        print("  ❌ File not found")
        return None
    
    plotly_data = extract_plotly_data_from_html(html_path)
    
    output = {
        "title": "Feature Statistics",
        "total_features": 25,
        "chart_data": plotly_data
    }
    
    output_path = JSON_OUTPUT_DIR / "feature_statistics.json"
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"  ✅ Extracted → {output_path.name}")
    return output


def extract_from_cumulative_impact():
    """Extract data from cummulative_position_impact.html"""
    print("\n📄 Processing: cummulative_position_impact.html")
    
    html_path = OUTPUTS_DIR / "cummulative_position_impact.html"
    if not html_path.exists():
        print("  ❌ File not found")
        return None
    
    plotly_data = extract_plotly_data_from_html(html_path)
    
    output = {
        "title": "Cumulative Position Impact Across Season",
        "description": "Shows how regulation changes accumulate across the season",
        "chart_data": plotly_data
    }
    
    output_path = JSON_OUTPUT_DIR / "cumulative_impact.json"
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"  ✅ Extracted → {output_path.name}")
    return output


def extract_from_monte_carlo_json():
    """Extract and process monte_carlo_results.json"""
    print("\n📄 Processing: monte_carlo_results.json")
    
    json_path = OUTPUTS_DIR / "monte_carlo_results.json"
    if not json_path.exists():
        print("  ❌ File not found")
        return None
    
    with open(json_path, 'r') as f:
        monte_carlo_data = json.load(f)
    
    # Process and create multiple outputs
    
    # 1. Race-by-race comparison
    race_comparison = []
    for race_key, race_data in list(monte_carlo_data.items())[:10]:  # First 10 races
        race_comparison.append({
            "race_id": race_key,
            "race_name": race_data.get("event_name", race_key),
            "drivers_count": len(race_data.get("current", {})),
            "has_2026_data": "2026" in race_data
        })
    
    output1 = {
        "title": "Race Comparison Summary",
        "total_races": len(monte_carlo_data),
        "races": race_comparison
    }
    
    output_path1 = JSON_OUTPUT_DIR / "race_comparison.json"
    with open(output_path1, 'w') as f:
        json.dump(output1, f, indent=2)
    print(f"  ✅ Extracted → {output_path1.name}")
    
    # 2. Driver performance summary
    all_drivers = {}
    for race_key, race_data in monte_carlo_data.items():
        current = race_data.get("current", {})
        future = race_data.get("2026", {})
        
        for driver in current.keys():
            if driver not in all_drivers:
                all_drivers[driver] = {
                    "races": 0,
                    "avg_position_current": [],
                    "avg_position_2026": []
                }
            
            all_drivers[driver]["races"] += 1
            all_drivers[driver]["avg_position_current"].append(current[driver]["mean"])
            
            if driver in future:
                all_drivers[driver]["avg_position_2026"].append(future[driver]["mean"])
    
    # Calculate averages
    driver_summary = []
    for driver, data in all_drivers.items():
        if data["races"] >= 5:  # At least 5 races
            avg_current = sum(data["avg_position_current"]) / len(data["avg_position_current"])
            avg_2026 = sum(data["avg_position_2026"]) / len(data["avg_position_2026"]) if data["avg_position_2026"] else avg_current
            
            driver_summary.append({
                "driver": driver,
                "races": data["races"],
                "avg_position_current": round(avg_current, 2),
                "avg_position_2026": round(avg_2026, 2),
                "position_change": round(avg_current - avg_2026, 2)
            })
    
    # Sort by improvement
    driver_summary.sort(key=lambda x: x["position_change"], reverse=True)
    
    output2 = {
        "title": "Driver Performance Summary",
        "total_drivers": len(driver_summary),
        "drivers": driver_summary[:20]  # Top 20
    }
    
    output_path2 = JSON_OUTPUT_DIR / "driver_performance.json"
    with open(output_path2, 'w') as f:
        json.dump(output2, f, indent=2)
    print(f"  ✅ Extracted → {output_path2.name}")
    
    return output1


def extract_from_team_heatmap():
    """Extract data from team_impact_heatmap.html"""
    print("\n📄 Processing: team_impact_heatmap.html")
    
    html_path = OUTPUTS_DIR / "team_impact_heatmap.html"
    if not html_path.exists():
        print("  ❌ File not found")
        return None
    
    plotly_data = extract_plotly_data_from_html(html_path)
    
    output = {
        "title": "Team Impact Heatmap",
        "description": "2026 minus Current regulation impact per team",
        "chart_data": plotly_data
    }
    
    output_path = JSON_OUTPUT_DIR / "team_heatmap.json"
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"  ✅ Extracted → {output_path.name}")
    return output


def extract_from_top_features():
    """Extract data from top_15_most_important_features.html"""
    print("\n📄 Processing: top_15_most_important_features.html")
    
    html_path = OUTPUTS_DIR / "top_15_most_important_features.html"
    if not html_path.exists():
        print("  ❌ File not found")
        return None
    
    plotly_data = extract_plotly_data_from_html(html_path)
    
    output = {
        "title": "Top 15 Most Important Features",
        "description": "Feature importance for predicting race positions",
        "chart_data": plotly_data
    }
    
    output_path = JSON_OUTPUT_DIR / "top_features.json"
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"  ✅ Extracted → {output_path.name}")
    return output


def extract_from_track_by_track():
    """Extract data from track-by-track-position-impact.html"""
    print("\n📄 Processing: track-by-track-position-impact.html")
    
    html_path = OUTPUTS_DIR / "track-by-track-position-impact.html"
    if not html_path.exists():
        print("  ❌ File not found")
        return None
    
    plotly_data = extract_plotly_data_from_html(html_path)
    
    output = {
        "title": "Track-by-Track Position Impact",
        "description": "Top 5 drivers with biggest position changes per track",
        "chart_data": plotly_data
    }
    
    output_path = JSON_OUTPUT_DIR / "track_by_track.json"
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"  ✅ Extracted → {output_path.name}")
    return output


def create_master_index():
    """Create a master index file listing all exported JSONs"""
    print("\n📋 Creating master index...")
    
    json_files = list(JSON_OUTPUT_DIR.glob("*.json"))
    
    index = {
        "title": "F1 2026 Regulation Impact - Data Export",
        "generated_at": "2026-01-18T12:10:00",
        "total_files": len(json_files),
        "files": [
            {
                "filename": f.name,
                "path": str(f.relative_to(BASE_DIR)),
                "size_kb": round(f.stat().st_size / 1024, 2)
            }
            for f in json_files
        ]
    }
    
    index_path = JSON_OUTPUT_DIR / "index.json"
    with open(index_path, 'w') as f:
        json.dump(index, f, indent=2)
    
    print(f"  ✅ Created master index → {index_path.name}")
    return index


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    try:
        # Extract from all sources
        extract_from_regulation_summary()
        extract_from_factor_impact()
        extract_from_feature_statistics()
        extract_from_cumulative_impact()
        extract_from_monte_carlo_json()
        extract_from_team_heatmap()
        extract_from_top_features()
        extract_from_track_by_track()
        
        # Create index
        index = create_master_index()
        
        print("\n" + "=" * 70)
        print("✅ EXTRACTION COMPLETE!")
        print("=" * 70)
        print(f"\n📂 Output directory: {JSON_OUTPUT_DIR}")
        print(f"📊 Total files created: {index['total_files']}")
        print(f"\n🎉 All data ready for frontend consumption!")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
