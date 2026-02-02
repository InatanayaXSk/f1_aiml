"""Driver status service to fetch current F1 driver lineup and filter retired drivers."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Dict, Optional, Set
from datetime import datetime

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

LOGGER = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DRIVER_STATUS_CACHE = PROJECT_ROOT / "data" / "driver_status.json"

# 2025 F1 Driver Lineup (as of start of season)
# This will be updated via web scraping or manual updates
CURRENT_2025_DRIVERS = {
    "Max Verstappen": {"team": "Red Bull Racing", "status": "active"},
    "Sergio Perez": {"team": "Red Bull Racing", "status": "active"},
    "Charles Leclerc": {"team": "Ferrari", "status": "active"},
    "Carlos Sainz": {"team": "Ferrari", "status": "active"},
    "Lewis Hamilton": {"team": "Mercedes", "status": "active"},
    "George Russell": {"team": "Mercedes", "status": "active"},
    "Lando Norris": {"team": "McLaren", "status": "active"},
    "Oscar Piastri": {"team": "McLaren", "status": "active"},
    "Fernando Alonso": {"team": "Aston Martin", "status": "active"},
    "Lance Stroll": {"team": "Aston Martin", "status": "active"},
    "Esteban Ocon": {"team": "Alpine", "status": "active"},
    "Pierre Gasly": {"team": "Alpine", "status": "active"},
    "Yuki Tsunoda": {"team": "RB", "status": "active"},
    "Daniel Ricciardo": {"team": "RB", "status": "active"},
    "Valtteri Bottas": {"team": "Sauber", "status": "active"},
    "Guanyu Zhou": {"team": "Sauber", "status": "active"},
    "Kevin Magnussen": {"team": "Haas", "status": "active"},
    "Nico Hulkenberg": {"team": "Haas", "status": "active"},
    "Alexander Albon": {"team": "Williams", "status": "active"},
    "Logan Sargeant": {"team": "Williams", "status": "active"},
}

# Retired/Inactive drivers (not on 2025 grid)
RETIRED_DRIVERS = {
    "Sebastian Vettel": {"team": "Aston Martin", "status": "retired", "retired_year": 2022},
    "Mick Schumacher": {"team": "Haas", "status": "retired", "retired_year": 2022},
    "Nicholas Latifi": {"team": "Williams", "status": "retired", "retired_year": 2022},
    "Nyck de Vries": {"team": "AlphaTauri", "status": "retired", "retired_year": 2023},
    "Liam Lawson": {"team": "RB", "status": "reserve", "retired_year": None},
}

# Team transfers (driver moved teams)
TEAM_TRANSFERS = {
    # Example: "Daniel Ricciardo": {"old_team": "McLaren", "new_team": "RB", "transfer_year": 2024},
}


def fetch_driver_status_from_web() -> Optional[Dict]:
    """Attempt to fetch current F1 driver lineup from web."""
    if not REQUESTS_AVAILABLE:
        LOGGER.warning("requests library not available. Using cached/default driver status.")
        return None
    
    try:
        # Try Ergast API first (more reliable)
        url = "http://ergast.com/api/f1/current/drivers.json"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            drivers = {}
            for driver in data.get("MRData", {}).get("DriverTable", {}).get("Drivers", []):
                driver_name = f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip()
                drivers[driver_name] = {
                    "team": "Unknown",  # Ergast doesn't provide team info easily
                    "status": "active"
                }
            LOGGER.info("Fetched driver status from Ergast API")
            return drivers
    except Exception as e:
        LOGGER.warning(f"Failed to fetch driver status from web: {e}")
    
    return None


def load_driver_status(force_refresh: bool = False) -> Dict[str, Dict[str, str]]:
    """Load driver status from cache or fetch from web."""
    
    # Try to load from cache first
    if DRIVER_STATUS_CACHE.exists() and not force_refresh:
        try:
            with DRIVER_STATUS_CACHE.open("r", encoding="utf-8") as f:
                cached = json.load(f)
                # Check if cache is recent (less than 30 days old)
                cache_date = cached.get("last_updated")
                if cache_date:
                    try:
                        cache_time = datetime.fromisoformat(cache_date)
                        days_old = (datetime.now() - cache_time).days
                        if days_old < 30:
                            LOGGER.info(f"Using cached driver status (updated {days_old} days ago)")
                            return cached.get("drivers", CURRENT_2025_DRIVERS)
                    except Exception:
                        pass
        except Exception as e:
            LOGGER.warning(f"Failed to load cached driver status: {e}")
    
    # Try to fetch from web
    web_data = fetch_driver_status_from_web()
    if web_data:
        status_data = {
            "drivers": web_data,
            "last_updated": datetime.now().isoformat()
        }
        # Save to cache
        DRIVER_STATUS_CACHE.parent.mkdir(parents=True, exist_ok=True)
        with DRIVER_STATUS_CACHE.open("w", encoding="utf-8") as f:
            json.dump(status_data, f, indent=2)
        return web_data
    
    # Fallback to hardcoded current drivers
    LOGGER.info("Using hardcoded 2025 driver lineup")
    return CURRENT_2025_DRIVERS


def get_active_drivers() -> Set[str]:
    """Get set of active driver names."""
    status = load_driver_status()
    return {name for name, info in status.items() if info.get("status") == "active"}


def get_driver_team(driver_name: str) -> Optional[str]:
    """Get current team for a driver."""
    status = load_driver_status()
    driver_info = status.get(driver_name)
    if driver_info:
        return driver_info.get("team")
    
    # Check retired drivers
    retired_info = RETIRED_DRIVERS.get(driver_name)
    if retired_info:
        return retired_info.get("team")
    
    return None


def is_driver_active(driver_name: str) -> bool:
    """Check if a driver is currently active (on 2025 grid)."""
    status = load_driver_status()
    driver_info = status.get(driver_name)
    if driver_info:
        return driver_info.get("status") == "active"
    
    # If not in current drivers, check if explicitly retired
    if driver_name in RETIRED_DRIVERS:
        return False
    
    # Default: assume active if not explicitly marked as retired
    # This handles historical data where driver was active
    return True


def filter_active_drivers(driver_list: list[str]) -> list[str]:
    """Filter a list of drivers to only include active ones."""
    active_set = get_active_drivers()
    return [driver for driver in driver_list if driver in active_set or is_driver_active(driver)]


__all__ = [
    "load_driver_status",
    "get_active_drivers",
    "get_driver_team",
    "is_driver_active",
    "filter_active_drivers",
]
