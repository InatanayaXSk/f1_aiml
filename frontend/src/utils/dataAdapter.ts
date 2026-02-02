/**
 * Data Adapter for Monte Carlo Simulation Results
 * Converts Python-generated JSON outputs to frontend-compatible format
 */

import type { 
  RegulationFactor, 
  TeamPerformance, 
  Driver, 
  SimulationResult,
  Track,
  TrackFeatures,
  CircuitComparison 
} from '../types';

// === TOP 6 FEATURES TO DISPLAY ===
export const KEY_REGULATION_FEATURES = [
  {
    id: 'power_ratio',
    name: 'ERS Power Split',
    category: 'power' as const,
    description: '50% electric power (up from 15%)',
    baseline: 0.15,
    target2026: 0.50,
    multiplier: 3.33
  },
  {
    id: 'aero_coeff',
    name: 'Active Aerodynamics',
    category: 'aero' as const,
    description: 'Movable aero elements for efficiency',
    baseline: 1.00,
    target2026: 1.05,
    multiplier: 1.05
  },
  {
    id: 'weight_ratio',
    name: 'Chassis Weight',
    category: 'weight' as const,
    description: '768kg minimum (down from 798kg)',
    baseline: 1.00,
    target2026: 0.962,
    multiplier: 0.962
  },
  {
    id: 'fuel_flow_ratio',
    name: 'Fuel Flow Limit',
    category: 'fuel' as const,
    description: 'Reduced flow rate with efficiency focus',
    baseline: 1.00,
    target2026: 0.75,
    multiplier: 0.75
  },
  {
    id: 'tire_grip_ratio',
    name: 'Tire Specification',
    category: 'tire' as const,
    description: 'New 18-inch low-profile tires',
    baseline: 1.00,
    target2026: 0.94,
    multiplier: 0.94
  },
  {
    id: 'avg_pos_last5',
    name: 'Driver Form',
    category: 'power' as const,
    description: 'Average position over last 5 races',
    baseline: 10.0,
    target2026: 10.0,
    multiplier: 1.0
  }
];

/**
 * Load Monte Carlo results from outputs/monte_carlo_results_calibrated_0.12.json
 */
export async function loadMonteCarloResults(): Promise<Record<string, any>> {
  const response = await fetch('/outputs/monte_carlo_results_calibrated_0.12.json');
  return response.json();
}

/**
 * Load regulation factors breakdown
 */
export async function loadRegulationFactors(): Promise<RegulationFactor[]> {
  try {
    const response = await fetch('/outputs/json/regulation_factors_breakdown.json');
    const data = await response.json();
    
    return data.factors.map((factor: any) => ({
      id: factor.factor_id,
      name: factor.factor_name,
      impact: factor.impact_score,
      category: getCategoryFromFactorId(factor.factor_id),
      description: factor.description
    }));
  } catch (error) {
    console.error('Failed to load regulation factors:', error);
    return KEY_REGULATION_FEATURES.map(f => ({
      id: f.id,
      name: f.name,
      impact: f.multiplier - 1,
      category: f.category,
      description: f.description
    }));
  }
}

/**
 * Convert track_data_*.json to Track interface
 */
export async function loadTrackData(trackId: string): Promise<Track | null> {
  try {
    const response = await fetch(`/track_data_${trackId}.json`);
    const data = await response.json();
    
    return {
      id: trackId,
      name: data.name,
      country: data.name, // Assuming country = name for now
      length: 5000, // Placeholder - not in track data
      laps: 50, // Placeholder - not in track data
      svg: data.svg_path,
      features: {
        sector1Difficulty: data.sectors?.[0] || 5,
        sector2Difficulty: data.sectors?.[1] || 5,
        sector3Difficulty: data.sectors?.[2] || 5,
        degradation: 3, // Placeholder
        riskFactor: data.characteristics.overtaking_difficulty || 3,
        overtakingOpportunities: 5 - (data.characteristics.overtaking_difficulty || 3),
        downforceLevel: getDownforceLevel(data.characteristics.track_type_name),
        powerSensitivity: data.characteristics.straight_fraction * 10
      }
    };
  } catch (error) {
    console.error(`Failed to load track data for ${trackId}:`, error);
    return null;
  }
}

/**
 * Extract team performance from Monte Carlo results
 */
export function extractTeamPerformance(
  monteCarloResults: Record<string, any>
): TeamPerformance[] {
  const teamStats: Record<string, {
    baseline: number[];
    predicted: number[];
    drivers: Set<string>;
  }> = {};

  const driverStats: Record<string, {
    baseline: number[];
    predicted: number[];
  }> = {};

  // Aggregate across all races
  Object.values(monteCarloResults).forEach((race: any) => {
    const current = race.current || {};
    const future = race['2026'] || {};

    Object.keys(current).forEach(driverName => {
      const normalizedName = normalizeDriverName(driverName);
      const teamName = extractTeamName(normalizedName);
      
      if (!teamStats[teamName]) {
        teamStats[teamName] = {
          baseline: [],
          predicted: [],
          drivers: new Set()
        };
      }

      if (!driverStats[normalizedName]) {
        driverStats[normalizedName] = {
          baseline: [],
          predicted: []
        };
      }

      teamStats[teamName].baseline.push(current[driverName].mean);
      teamStats[teamName].predicted.push(future[driverName]?.mean || current[driverName].mean);
      teamStats[teamName].drivers.add(normalizedName);

      driverStats[normalizedName].baseline.push(current[driverName].mean);
      driverStats[normalizedName].predicted.push(future[driverName]?.mean || current[driverName].mean);
    });
  });

  // F1 Points system (2024 onwards)
  const pointsForPosition = (pos: number): number => {
    const points: Record<number, number> = {
      1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1
    };
    return points[Math.round(pos)] || 0;
  };

  // Calculate total championship points for each driver
  const driverPoints: Record<string, { baseline: number; predicted: number }> = {};
  Object.entries(driverStats).forEach(([name, stats]) => {
    driverPoints[name] = {
      baseline: stats.baseline.reduce((sum, pos) => sum + pointsForPosition(pos), 0),
      predicted: stats.predicted.reduce((sum, pos) => sum + pointsForPosition(pos), 0)
    };
  });

  // Sort drivers by total points to assign championship positions
  const baselineSorted = Object.entries(driverPoints)
    .sort((a, b) => b[1].baseline - a[1].baseline) // Higher points = better position
    .map(([name], idx) => ({ name, position: idx + 1 }));
  
  const predictedSorted = Object.entries(driverPoints)
    .sort((a, b) => b[1].predicted - a[1].predicted) // Higher points = better position
    .map(([name], idx) => ({ name, position: idx + 1 }));

  const baselinePositions: Record<string, number> = {};
  const predictedPositions: Record<string, number> = {};
  
  baselineSorted.forEach(({ name, position }) => {
    baselinePositions[name] = position;
  });
  
  predictedSorted.forEach(({ name, position }) => {
    predictedPositions[name] = position;
  });

  // Convert to TeamPerformance array
  return Object.entries(teamStats).map(([teamName, stats]) => {
    // Calculate average regulation factor impacts
    // Since we don't have per-team factor data, use uniform impact across teams
    const factorImpacts: Record<string, number> = {
      'hybrid_power': 0.35,
      'boost_mode': 0.28,
      'chassis': 0.18,
      'tyres': 0.12,
      'fuel': 0.15,
      'aero': 0.22
    };
    
    return {
      teamId: teamName.toLowerCase().replace(/\s+/g, '-'),
      teamName,
      constructor: teamName,
      baseline2025: average(stats.baseline),
      predicted2026: average(stats.predicted),
      drivers: Array.from(stats.drivers).map((name, idx) => ({
        id: `${teamName}-${idx}`,
        name: name as string,
        number: idx + 1,
        teamId: teamName.toLowerCase().replace(/\s+/g, '-'),
        baseline2025Position: baselinePositions[name as string] || 20,
        predicted2026Position: predictedPositions[name as string] || 20,
        confidence: 0.85
      })),
      factorImpacts
    };
  });
}

/**
 * Extract circuit comparisons from Monte Carlo results
 */
export function extractCircuitComparisons(
  monteCarloResults: Record<string, any>
): CircuitComparison[] {
  return Object.entries(monteCarloResults).map(([raceKey, raceData]: [string, any]) => {
    const drivers = Object.keys(raceData.current);
    const currentPositions = drivers.map(d => raceData.current[d].mean);
    const futurePositions = drivers.map(d => raceData['2026'][d]?.mean || raceData.current[d].mean);

    const avgCurrent = average(currentPositions);
    const avgFuture = average(futurePositions);

    return {
      trackId: raceKey,
      trackName: raceData.event_name || raceKey,
      baseline2025: {
        mean: avgCurrent,
        median: median(currentPositions),
        stdDev: stdDev(currentPositions),
        confidence95Lower: avgCurrent - 1.96 * stdDev(currentPositions),
        confidence95Upper: avgCurrent + 1.96 * stdDev(currentPositions),
        iterations: 2000
      },
      predicted2026: {
        mean: avgFuture,
        median: median(futurePositions),
        stdDev: stdDev(futurePositions),
        confidence95Lower: avgFuture - 1.96 * stdDev(futurePositions),
        confidence95Upper: avgFuture + 1.96 * stdDev(futurePositions),
        iterations: 2000
      },
      impactDelta: avgFuture - avgCurrent
    };
  });
}

// === HELPER FUNCTIONS ===

function getCategoryFromFactorId(factorId: string): 'power' | 'aero' | 'weight' | 'tire' | 'fuel' {
  if (factorId.includes('power') || factorId.includes('hybrid') || factorId.includes('boost')) return 'power';
  if (factorId.includes('aero')) return 'aero';
  if (factorId.includes('chassis') || factorId.includes('weight')) return 'weight';
  if (factorId.includes('tyre') || factorId.includes('tire')) return 'tire';
  if (factorId.includes('fuel')) return 'fuel';
  return 'power';
}

function getDownforceLevel(trackTypeName: string): 'low' | 'medium' | 'high' {
  const lower = trackTypeName.toLowerCase();
  if (lower.includes('high-speed')) return 'low';
  if (lower.includes('street') || lower.includes('tight')) return 'high';
  return 'medium';
}

const DRIVER_TEAM_MAP: Record<string, string> = {
  // Red Bull Racing
  'Max Verstappen': 'Red Bull Racing',
  'Sergio Perez': 'Red Bull Racing',
  // Ferrari
  'Charles Leclerc': 'Ferrari',
  'Carlos Sainz': 'Ferrari',
  // Mercedes
  'Lewis Hamilton': 'Mercedes',
  'George Russell': 'Mercedes',
  // McLaren
  'Lando Norris': 'McLaren',
  'Daniel Ricciardo': 'McLaren',
  'Oscar Piastri': 'McLaren',
  // Aston Martin
  'Fernando Alonso': 'Aston Martin',
  'Lance Stroll': 'Aston Martin',
  'Sebastian Vettel': 'Aston Martin',
  // Alpine
  'Esteban Ocon': 'Alpine',
  'Pierre Gasly': 'Alpine',
  // AlphaTauri / RB
  'Yuki Tsunoda': 'RB',
  'Nyck de Vries': 'RB',
  'Nyck De Vries': 'RB',
  'Liam Lawson': 'RB',
  'Isack Hadjar': 'RB',
  // Alfa Romeo / Sauber
  'Valtteri Bottas': 'Sauber',
  'Guanyu Zhou': 'Sauber',
  'Nico Hulkenberg': 'Sauber',
  'Gabriel Bortoleto': 'Sauber',
  // Haas
  'Kevin Magnussen': 'Haas',
  'Mick Schumacher': 'Haas',
  'Oliver Bearman': 'Haas',
  'Esteban Ocon': 'Haas',
  // Williams
  'Alexander Albon': 'Williams',
  'Nicholas Latifi': 'Williams',
  'Logan Sargeant': 'Williams',
  'Franco Colapinto': 'Williams',
  'Carlos Sainz': 'Williams',
  // Mercedes (2025-2026)
  'Kimi Antonelli': 'Mercedes',
  'Andrea Kimi Antonelli': 'Mercedes',
  // Alpine
  'Jack Doohan': 'Alpine',
};

export function getTeamNameForDriver(driverName: string): string {
  const normalizedName = normalizeDriverName(driverName);
  return DRIVER_TEAM_MAP[normalizedName] || 'Unknown Team';
}

function normalizeDriverName(driverName: string): string {
  // Handle known name variations/duplicates
  const nameMap: Record<string, string> = {
    'Andrea Kimi Antonelli': 'Kimi Antonelli',
    'Nyck De Vries': 'Nyck de Vries',
  };
  return nameMap[driverName] || driverName;
}

function extractTeamName(driverName: string): string {
  return getTeamNameForDriver(driverName);
}

function average(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function stdDev(arr: number[]): number {
  const avg = average(arr);
  const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(average(squareDiffs));
}
