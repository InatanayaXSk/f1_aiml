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

// === 2026 REGULATION FACTORS (FROM RESEARCH PAPER) ===
export const KEY_REGULATION_FEATURES = [
  {
    id: 'power_ratio',
    name: 'Hybrid Power Enhancement',
    category: 'power' as const,
    description: 'Electric power contribution increases from 15% to 50% of total power output, fundamentally altering power unit architecture',
    baseline: 0.15,
    target2026: 0.50,
    multiplier: 3.33
  },
  {
    id: 'boost_mode',
    name: 'Active Aerodynamics & Boost',
    category: 'aero' as const,
    description: 'Driver-activated boost systems provide additional power for overtaking, replacing fixed DRS zones',
    baseline: 1.00,
    target2026: 1.25,
    multiplier: 1.25
  },
  {
    id: 'weight_ratio',
    name: 'Chassis Weight Reduction',
    category: 'weight' as const,
    description: 'Minimum chassis weight decreases from 798 kg to 768 kg, improving power-to-weight ratio',
    baseline: 798,
    target2026: 768,
    multiplier: 0.962
  },
  {
    id: 'tire_grip_ratio',
    name: 'Tire Grip Reduction',
    category: 'tire' as const,
    description: 'New tire compounds with reduced contact patch area decrease mechanical grip',
    baseline: 1.00,
    target2026: 0.94,
    multiplier: 0.94
  },
  {
    id: 'fuel_flow_ratio',
    name: 'Sustainable Fuel Limitation',
    category: 'fuel' as const,
    description: 'Sustainable fuel mandates with reduced flow rates emphasize energy efficiency over peak power',
    baseline: 1.00,
    target2026: 0.75,
    multiplier: 0.75
  }
];

// === TEAM HEATMAP MULTIPLIERS ===
const REGULATION_MULTIPLIERS: Record<string, Record<string, number>> = {
  hybrid_power: {
    power_ratio: 3.33
  },
  boost_mode: {
    power_ratio: 1.25,
    fuel_efficiency_rating: 1.05,
    overtake_power_boost: 1.15,
    ers_deployment_flexibility: 1.4
  },
  chassis: {
    weight_ratio: 0.962
  },
  tyres: {
    tire_grip_ratio: 0.94
  },
  fuel: {
    fuel_flow_ratio: 0.75,
    fuel_efficiency_rating: 1.15
  }
};

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

  const driverPoints: Record<string, { baseline: number; predicted: number }> = {};

  // F1 Points system (2024 onwards)
  const pointsForPosition = (pos: number): number => {
    const points: Record<number, number> = {
      1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1
    };
    return points[pos] || 0;
  };

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

      if (!driverPoints[normalizedName]) {
        driverPoints[normalizedName] = {
          baseline: 0,
          predicted: 0
        };
      }

      teamStats[teamName].baseline.push(current[driverName].mean);
      teamStats[teamName].predicted.push(future[driverName]?.mean || current[driverName].mean);
      teamStats[teamName].drivers.add(normalizedName);

      driverStats[normalizedName].baseline.push(current[driverName].mean);
      driverStats[normalizedName].predicted.push(future[driverName]?.mean || current[driverName].mean);
    });

    // Award points based on per-race ranking (lower mean = better finish)
    const baselineOrder = Object.keys(current)
      .map(name => ({
        name: normalizeDriverName(name),
        value: current[name].mean
      }))
      .sort((a, b) => a.value - b.value);

    baselineOrder.forEach((entry, idx) => {
      const pos = idx + 1;
      if (!driverPoints[entry.name]) {
        driverPoints[entry.name] = { baseline: 0, predicted: 0 };
      }
      driverPoints[entry.name].baseline += pointsForPosition(pos);
    });

    const predictedOrder = Object.keys(current)
      .map(name => ({
        name: normalizeDriverName(name),
        value: (future[name]?.mean ?? current[name].mean)
      }))
      .sort((a, b) => a.value - b.value);

    predictedOrder.forEach((entry, idx) => {
      const pos = idx + 1;
      if (!driverPoints[entry.name]) {
        driverPoints[entry.name] = { baseline: 0, predicted: 0 };
      }
      driverPoints[entry.name].predicted += pointsForPosition(pos);
    });
  });

  // Sort drivers by total points to assign championship positions
  const baselineSorted = Object.entries(driverPoints)
    .sort((a, b) => b[1].baseline - a[1].baseline)
    .map(([name], idx) => ({ name, position: idx + 1 }));

  const predictedSorted = Object.entries(driverPoints)
    .sort((a, b) => b[1].predicted - a[1].predicted)
    .map(([name], idx) => ({ name, position: idx + 1 }));

  const baselinePositions: Record<string, number> = {};
  const predictedPositions: Record<string, number> = {};

  baselineSorted.forEach(({ name, position }) => {
    baselinePositions[name] = position;
  });

  predictedSorted.forEach(({ name, position }) => {
    predictedPositions[name] = position;
  });

  // Calculate factor impacts for each team
  const calculateFactorImpacts = (teamName: string, baseline: number[], predicted: number[]): Record<string, number> => {
    const avgBaseline = average(baseline);
    const avgPredicted = average(predicted);
    const overallChange = avgPredicted - avgBaseline; // Negative is better (lower position)
    
    // Calculate impact scores for each regulation factor
    // Use absolute value - we show magnitude of impact regardless of direction
    const absChange = Math.abs(overallChange);
    
    // Scale factor: amplify small changes for visibility (0.01 position change -> 0.2 scale factor)
    // This makes the heatmap show relative impacts even when absolute changes are minimal
    const scaleFactor = Math.min(1, absChange*10);
    
    const impacts: Record<string, number> = {};

    // Map to KEY_REGULATION_FEATURES IDs
    KEY_REGULATION_FEATURES.forEach((feature) => {
      // Normalize the multiplier to a 0-1 scale for heatmap visualization
      const normalizedImpact = Math.abs(feature.multiplier - 1) / 2.5; // Divide by 2.5 to normalize 3.33 to ~0.93
      impacts[feature.id] = scaleFactor * normalizedImpact;
    });

    return impacts;
  };

  // Convert to TeamPerformance array
  return Object.entries(teamStats).map(([teamName, stats]) => {
    const factorImpacts = calculateFactorImpacts(teamName, stats.baseline, stats.predicted);
    
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
