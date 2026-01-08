export interface Track {
  id: string;
  name: string;
  country: string;
  length: number;
  laps: number;
  svg?: string;
  features: TrackFeatures;
}

export interface TrackFeatures {
  sector1Difficulty: number;
  sector2Difficulty: number;
  sector3Difficulty: number;
  degradation: number;
  riskFactor: number;
  overtakingOpportunities: number;
  downforceLevel: 'low' | 'medium' | 'high';
  powerSensitivity: number;
}

export interface RegulationFactor {
  id: string;
  name: string;
  impact: number;
  category: 'power' | 'aero' | 'weight' | 'tire' | 'fuel';
  description: string;
}

export interface TeamPerformance {
  teamId: string;
  teamName: string;
  constructor: string;
  baseline2025: number;
  predicted2026: number;
  drivers: Driver[];
  factorImpacts: Record<string, number>;
}

export interface Driver {
  id: string;
  name: string;
  number: number;
  teamId: string;
  baseline2025Position: number;
  predicted2026Position: number;
  confidence: number;
}

export interface SimulationResult {
  id: string;
  trackId: string;
  season: number;
  date: string;
  results: RaceResult[];
  confidence: number;
  regulationFactors: string[];
}

export interface RaceResult {
  position: number;
  driverId: string;
  teamId: string;
  points: number;
  gap?: number;
}

export interface MonteCarloOutput {
  mean: number;
  median: number;
  stdDev: number;
  confidence95Lower: number;
  confidence95Upper: number;
  iterations: number;
}

export interface CircuitComparison {
  trackId: string;
  trackName: string;
  baseline2025: MonteCarloOutput;
  predicted2026: MonteCarloOutput;
  impactDelta: number;
}
