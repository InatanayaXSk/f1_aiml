# Static Frontend (s_frontend) Directory Summary

The `s_frontend` directory contains specialized Python utilities used to generate static assets and metadata for the frontend visualization layer, specifically focused on circuit geometry and track-specific characteristics.

## Key Scripts

1.  **pathGen.py**
    *   **Role**: The core geometry engine for track visualization.
    *   **Logic**: 
        *   Extracts X/Y telemetry coordinates from FastF1's fastest lap data.
        *   Calculates sector boundaries using session timing.
        *   Normalizes coordinates to a 0-500 range for SVG `viewBox` compatibility.
        *   Derives track metrics: `track_type_index` (0-4), `straight_fraction`, and `corners` count via peak detection on speed profiles.
    *   **Output**: Individual `track_data_{circuit}.json` files containing SVG paths and sectors.

2.  **generate_all_tracks.py**
    *   **Role**: Automation wrapper for the track generation pipeline.
    *   **Logic**: Iterates through a mapping of circuit IDs (Bahrain, Monaco, Monza, Silverstone, Spa) and invokes `pathGen.py` for each.
    *   **Output**: A complete set of JSON assets required for the "Circuit Analyzer" tab in the frontend.

## Significance to Project
This directory bridges the gap between raw telemetry and the "Premium UI" requirement. It ensures that the frontend can render accurate, interactive track maps with sector-specific performance overlays without requiring heavy real-time telemetry processing.
