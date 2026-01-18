"""2026 F1 Calendar track metadata with boost effectiveness ratings."""

from __future__ import annotations

from typing import Dict

# 2026 F1 Calendar - 24 races
# Boost effectiveness rating (0.0 - 1.0) based on track characteristics
# Higher ratings = longer straights = more benefit from Boost Button & Overtake Mode

TRACK_BOOST_EFFECTIVENESS: Dict[str, float] = {
    # High-Speed Tracks (0.85 - 0.95)
    "monza": 0.95,           # Temple of Speed - maximum boost benefit
    "baku": 0.92,            # Long main straight
    "jeddah": 0.90,          # Fast street circuit
    "spa": 0.88,             # Kemmel Straight
    "spielberg": 0.85,       # Short but fast
    
    # Mixed Tracks (0.65 - 0.80)
    "silverstone": 0.78,     # Hangar/Wellington straights
    "suzuka": 0.75,          # Balance of straights and technical
    "melbourne": 0.72,       # Semi-street with straights
    "montreal": 0.70,        # Good straight-line sections
    "bahrain": 0.68,         # Decent straights
    "cota": 0.67,            # Circuit of the Americas
    "barcelona": 0.65,       # Balanced circuit
    
    # Technical/Street Circuits (0.40 - 0.60)
    "shanghai": 0.60,        # Long back straight
    "imola": 0.55,           # Some straight sections
    "las_vegas": 0.52,       # Street with straights
    "mexico": 0.50,          # High altitude affects boost
    "sao_paulo": 0.48,       # Short lap, some straights
    "miami": 0.45,           # Street circuit
    "zandvoort": 0.42,       # Tight, technical
    
    # High-Downforce/Street Circuits (0.20 - 0.35)
    "hungary": 0.35,         # Minimal straights
    "singapore": 0.30,       # Street, tight corners
    "monaco": 0.25,          # Minimal overtaking, no straights
    
    # Additional tracks
    "qatar": 0.62,           # Lusail - good straights
    "abu_dhabi": 0.58,       # Yas Marina - mixed
}

TRACK_NAMES: Dict[str, str] = {
    "monza": "Italian Grand Prix",
    "baku": "Azerbaijan Grand Prix",
    "jeddah": "Saudi Arabian Grand Prix",
    "spa": "Belgian Grand Prix",
    "spielberg": "Austrian Grand Prix",
    "silverstone": "British Grand Prix",
    "suzuka": "Japanese Grand Prix",
    "melbourne": "Australian Grand Prix",
    "montreal": "Canadian Grand Prix",
    "bahrain": "Bahrain Grand Prix",
    "cota": "United States Grand Prix",
    "barcelona": "Spanish Grand Prix",
    "shanghai": "Chinese Grand Prix",
    "imola": "Emilia Romagna Grand Prix",
    "las_vegas": "Las Vegas Grand Prix",
    "mexico": "Mexico City Grand Prix",
    "sao_paulo": "São Paulo Grand Prix",
    "miami": "Miami Grand Prix",
    "zandvoort": "Dutch Grand Prix",
    "hungary": "Hungarian Grand Prix",
    "singapore": "Singapore Grand Prix",
    "monaco": "Monaco Grand Prix",
    "qatar": "Qatar Grand Prix",
    "abu_dhabi": "Abu Dhabi Grand Prix",
}

TRACK_TYPES: Dict[str, str] = {
    "monza": "high-speed",
    "baku": "street",
    "jeddah": "street",
    "spa": "high-speed",
    "spielberg": "high-speed",
    "silverstone": "mixed",
    "suzuka": "mixed",
    "melbourne": "street",
    "montreal": "semi-street",
    "bahrain": "mixed",
    "cota": "mixed",
    "barcelona": "balanced",
    "shanghai": "mixed",
    "imola": "high-downforce",
    "las_vegas": "street",
    "mexico": "high-altitude",
    "sao_paulo": "mixed",
    "miami": "street",
    "zandvoort": "high-downforce",
    "hungary": "high-downforce",
    "singapore": "street",
    "monaco": "street",
    "qatar": "mixed",
    "abu_dhabi": "mixed",
}


def get_boost_effectiveness(track_key: str) -> float:
    """Get boost effectiveness rating for a track (0.0 - 1.0)."""
    return TRACK_BOOST_EFFECTIVENESS.get(track_key.lower(), 0.5)


def get_track_name(track_key: str) -> str:
    """Get official track name."""
    return TRACK_NAMES.get(track_key.lower(), track_key.title())


def get_track_type(track_key: str) -> str:
    """Get track type classification."""
    return TRACK_TYPES.get(track_key.lower(), "mixed")


__all__ = [
    "TRACK_BOOST_EFFECTIVENESS",
    "TRACK_NAMES",
    "TRACK_TYPES",
    "get_boost_effectiveness",
    "get_track_name",
    "get_track_type",
]
