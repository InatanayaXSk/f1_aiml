import type {
  Track,
  RegulationFactor,
  TeamPerformance,
  SimulationResult,
  CircuitComparison,
  TrackFeatures,
} from '../types';
import { extractTeamPerformance, getTeamNameForDriver } from '../utils/dataAdapter';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const HAS_API = Boolean(API_BASE_URL);

type JsonModule = { default: any };

const TRACK_DATA_MODULES = import.meta.glob('../../../track_data_*.json', {
  eager: true,
}) as Record<string, JsonModule>;

const MONTE_CARLO_RESULTS = import('../../../outputs/monte_carlo_results.json').then(
  (mod) => (mod as JsonModule).default || mod
);

const REGULATION_FACTORS = import(
  '../../../outputs/json/regulation_factors_breakdown.json'
).then((mod) => (mod as JsonModule).default || mod);

const SIMULATION_MAPPING: Record<string, string> = {
  australia: '2022_R01',
  china: '2022_R02',
  japan: '2022_R03',
  bahrain: '2022_R04',
  'saudi-arabia': '2022_R05',
  miami: '2022_R06',
  'emilia-romagna': '2022_R07',
  monaco: '2022_R08',
  spain: '2022_R09',
  canada: '2022_R10',
  austria: '2022_R11',
  'great-britain': '2022_R12',
  belgium: '2022_R13',
  hungary: '2022_R14',
  netherlands: '2022_R15',
  italy: '2022_R16',
  azerbaijan: '2022_R17',
  singapore: '2022_R18',
  'united-states': '2022_R19',
  mexico: '2022_R20',
  brazil: '2022_R21',
  'las-vegas': '2022_R22',
  qatar: '2022_R23',
  'abu-dhabi': '2022_R24',
};

async function fetchJson<T>(endpoint: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured');
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

function getCategoryFromFactorId(
  factorId: string
): 'power' | 'aero' | 'weight' | 'tire' | 'fuel' {
  if (factorId.includes('power') || factorId.includes('hybrid') || factorId.includes('boost')) {
    return 'power';
  }
  if (factorId.includes('aero')) return 'aero';
  if (factorId.includes('chassis') || factorId.includes('weight')) return 'weight';
  if (factorId.includes('tyre') || factorId.includes('tire')) return 'tire';
  if (factorId.includes('fuel')) return 'fuel';
  return 'power';
}

function getDownforceLevel(trackTypeName: string): 'low' | 'medium' | 'high' {
  const lower = (trackTypeName || '').toLowerCase();
  if (lower.includes('high-speed')) return 'low';
  if (lower.includes('street') || lower.includes('tight')) return 'high';
  return 'medium';
}

// Track metadata (length in km, number of laps)
const TRACK_METADATA: Record<string, { length: number; laps: number }> = {
  'bahrain': { length: 5.412, laps: 57 },
  'saudi-arabia': { length: 6.174, laps: 50 },
  'australia': { length: 5.278, laps: 58 },
  'japan': { length: 5.807, laps: 53 },
  'china': { length: 5.451, laps: 56 },
  'miami': { length: 5.412, laps: 57 },
  'emilia-romagna': { length: 4.909, laps: 63 },
  'monaco': { length: 3.337, laps: 78 },
  'spain': { length: 4.675, laps: 66 },
  'canada': { length: 4.361, laps: 70 },
  'austria': { length: 4.318, laps: 71 },
  'great-britain': { length: 5.891, laps: 52 },
  'hungary': { length: 4.381, laps: 70 },
  'belgium': { length: 7.004, laps: 44 },
  'netherlands': { length: 4.259, laps: 72 },
  'italy': { length: 5.793, laps: 53 },
  'azerbaijan': { length: 6.003, laps: 51 },
  'singapore': { length: 5.063, laps: 61 },
  'united-states': { length: 5.513, laps: 56 },
  'mexico': { length: 4.304, laps: 71 },
  'brazil': { length: 4.309, laps: 71 },
  'las-vegas': { length: 6.201, laps: 50 },
  'qatar': { length: 5.380, laps: 57 },
  'abu-dhabi': { length: 5.281, laps: 58 },
};

function mapTrackDataToTrack(trackId: string, data: any): Track {
    const metadata = TRACK_METADATA[trackId] || { length: 0, laps: 0 };

  // Calculate features based on track characteristics
  const corners = data.characteristics?.corners ?? 10;
  const straightFraction = data.characteristics?.straight_fraction ?? 0.5;
  const overtakingDifficulty = data.characteristics?.overtaking_difficulty ?? 3;
  const trackType = data.characteristics?.track_type_name?.toLowerCase() || '';
  
  // Calculate sector difficulties based on track type and characteristics
  // Street circuits: higher difficulty, High-speed: lower difficulty
  const baseDifficulty = trackType.includes('street') || trackType.includes('tight') ? 7.5 :
                         trackType.includes('high-speed') ? 3.5 : 5;
  
  // Add variation to sector difficulties (not all sectors are equal)
  const sector1Difficulty = Math.min(10, Math.max(1, baseDifficulty + (corners > 15 ? 1 : -0.5)));
  const sector2Difficulty = Math.min(10, Math.max(1, baseDifficulty));
  const sector3Difficulty = Math.min(10, Math.max(1, baseDifficulty + (straightFraction > 0.4 ? -1 : 0.5)));
  
  // Calculate degradation: more corners + street circuits = higher degradation
  const degradation = Math.min(10, Math.max(1, 
    (trackType.includes('street') ? 7 : 4) + (corners > 16 ? 2 : corners > 12 ? 1 : 0)
  ));

  const features: TrackFeatures = {
    sector1Difficulty: Number(sector1Difficulty.toFixed(1)),
    sector2Difficulty: Number(sector2Difficulty.toFixed(1)),
    sector3Difficulty: Number(sector3Difficulty.toFixed(1)),
    degradation: Number(degradation.toFixed(1)),
    riskFactor: overtakingDifficulty,
    overtakingOpportunities: 5 - overtakingDifficulty,
    downforceLevel: getDownforceLevel(data.characteristics?.track_type_name || ''),
    powerSensitivity: (straightFraction * 10),
  };

  return {
    id: trackId,
    name: data.fullName || data.name || trackId,
    country: data.name || 'Unknown',
    length: data.length ?? metadata.length,
    laps: data.laps ?? metadata.laps,
    svg: data.svg_path,
    features,
  };
}

function teamIdFromName(teamName: string): string {
  return teamName.toLowerCase().replace(/\s+/g, '-');
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function stdDev(values: number[]): number {
  if (!values.length) return 0;
  const avg = average(values);
  const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
  return Math.sqrt(average(squareDiffs));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const LOCAL_TRACKS: Track[] = Object.entries(TRACK_DATA_MODULES)
  .map(([path, module]) => {
    const match = path.match(/track_data_(.+)\.json$/);
    const trackId = match?.[1] || path;
    const data = module.default || module;
    return mapTrackDataToTrack(trackId, data);
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const LOCAL_TRACKS_BY_ID = new Map(LOCAL_TRACKS.map((track) => [track.id, track]));

export const api = {
  getTracks: async (): Promise<Track[]> => {
    if (HAS_API) {
      return fetchJson('/api/tracks');
    }
    return LOCAL_TRACKS;
  },

  getTrack: async (trackId: string): Promise<Track | undefined> => {
    if (HAS_API) {
      const tracks = await fetchJson<Track[]>('/api/tracks');
      return tracks.find((t) => t.id === trackId);
    }
    return LOCAL_TRACKS_BY_ID.get(trackId);
  },

  getTrackSVG: async (trackId: string): Promise<string | null> => {
    if (HAS_API) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/tracks/${trackId}/svg`);
        if (!response.ok) return null;
        return await response.text();
      } catch (error) {
        console.warn(`Failed to fetch SVG for ${trackId}:`, error);
        return null;
      }
    }

    const localTrack = LOCAL_TRACKS_BY_ID.get(trackId);
    return localTrack?.svg ?? null;
  },

  getRegulationFactors: async (): Promise<RegulationFactor[]> => {
    if (HAS_API) {
      return fetchJson('/api/regulations');
    }

    const data = await REGULATION_FACTORS;
    return (data.factors || []).map((factor: any) => ({
      id: factor.factor_id,
      name: factor.factor_name,
      impact: factor.impact_score,
      category: getCategoryFromFactorId(factor.factor_id),
      description: factor.description,
    }));
  },

  getTeamPerformance: async (): Promise<TeamPerformance[]> => {
    if (HAS_API) {
      return fetchJson('/api/teams/performance');
    }

    const monteCarlo = await MONTE_CARLO_RESULTS;
    return extractTeamPerformance(monteCarlo);
  },

  getSimulations: async (params?: {
    season?: number;
    trackId?: string;
  }): Promise<SimulationResult[]> => {
    if (HAS_API) {
      let endpoint = '/api/simulations';
      const queryParams = new URLSearchParams();
      if (params?.season) queryParams.append('season', params.season.toString());
      if (params?.trackId) queryParams.append('trackId', params.trackId);
      if (queryParams.toString()) endpoint += `?${queryParams.toString()}`;
      return fetchJson(endpoint);
    }

    const monteCarlo = await MONTE_CARLO_RESULTS;
    const pointsByPosition = [25, 18, 15, 12, 10];

    const simulations = Object.entries(SIMULATION_MAPPING)
      .map(([trackId, simKey], index) => {
        const raceData = monteCarlo[simKey];
        if (!raceData?.current) return null;

        const drivers = Object.entries(raceData.current)
          .map(([driverName, stats]: [string, any]) => ({
            driverName,
            mean: stats.mean,
          }))
          .sort((a, b) => a.mean - b.mean)
          .slice(0, 5);

        const winnerMean = drivers[0]?.mean ?? 0;
        const confidence = clamp(1 - stdDev(drivers.map((d) => d.mean)) / 20, 0.5, 0.95);

        return {
          id: simKey,
          trackId,
          season: params?.season ?? 2026,
          date: new Date(2026, 0, index + 1).toISOString(),
          confidence,
          regulationFactors: [],
          results: drivers.map((driver, position) => {
            const teamName = getTeamNameForDriver(driver.driverName);
            return {
              position: position + 1,
              driverId: driver.driverName,
              teamId: teamIdFromName(teamName),
              points: pointsByPosition[position] ?? 0,
              gap: position === 0 ? 0 : driver.mean - winnerMean,
            };
          }),
        } as SimulationResult;
      })
      .filter(Boolean) as SimulationResult[];

    if (params?.season) {
      return simulations.filter((s) => s.season === params.season);
    }
    if (params?.trackId) {
      return simulations.filter((s) => s.trackId === params.trackId);
    }
    return simulations;
  },

  getCircuitComparisons: async (season: number): Promise<CircuitComparison[]> => {
    if (HAS_API) {
      return fetchJson(`/api/circuits/comparison?season=${season}`);
    }

    const monteCarlo = await MONTE_CARLO_RESULTS;

    return Object.entries(SIMULATION_MAPPING)
      .map(([trackId, simKey]) => {
        const raceData = monteCarlo[simKey];
        if (!raceData?.current || !raceData?.['2026']) return null;

        const drivers = Object.keys(raceData.current);
        const currentPositions = drivers.map((d) => raceData.current[d].mean);
        const futurePositions = drivers.map((d) => raceData['2026'][d]?.mean ?? raceData.current[d].mean);

        const avgCurrent = average(currentPositions);
        const avgFuture = average(futurePositions);

        return {
          trackId,
          trackName: raceData.event_name || trackId,
          baseline2025: {
            mean: avgCurrent,
            median: median(currentPositions),
            stdDev: stdDev(currentPositions),
            confidence95Lower: avgCurrent - 1.96 * stdDev(currentPositions),
            confidence95Upper: avgCurrent + 1.96 * stdDev(currentPositions),
            iterations: 2000,
          },
          predicted2026: {
            mean: avgFuture,
            median: median(futurePositions),
            stdDev: stdDev(futurePositions),
            confidence95Lower: avgFuture - 1.96 * stdDev(futurePositions),
            confidence95Upper: avgFuture + 1.96 * stdDev(futurePositions),
            iterations: 2000,
          },
          impactDelta: avgFuture - avgCurrent,
        } as CircuitComparison;
      })
      .filter(Boolean) as CircuitComparison[];
  },
};
