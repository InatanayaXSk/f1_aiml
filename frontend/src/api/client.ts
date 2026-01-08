import type {
  Track,
  RegulationFactor,
  TeamPerformance,
  SimulationResult,
  CircuitComparison,
} from '../types';
import {
  mockTracks,
  mockRegulationFactors,
  mockTeamPerformance,
  mockSimulations,
} from '../data/mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_MOCK_DATA = !import.meta.env.VITE_API_BASE_URL;

async function fetchWithFallback<T>(endpoint: string, mockData: T): Promise<T> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockData;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`Failed to fetch ${endpoint}, using mock data:`, error);
    return mockData;
  }
}

export const api = {
  getTracks: async (): Promise<Track[]> => {
    return fetchWithFallback('/api/tracks', mockTracks);
  },

  getTrack: async (trackId: string): Promise<Track | undefined> => {
    const tracks = await fetchWithFallback('/api/tracks', mockTracks);
    return tracks.find((t) => t.id === trackId);
  },

  getTrackSVG: async (trackId: string): Promise<string | null> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/tracks/${trackId}/svg`);
      if (!response.ok) return null;
      return await response.text();
    } catch (error) {
      console.warn(`Failed to fetch SVG for ${trackId}:`, error);
      return null;
    }
  },

  getRegulationFactors: async (): Promise<RegulationFactor[]> => {
    return fetchWithFallback('/api/regulations', mockRegulationFactors);
  },

  getTeamPerformance: async (): Promise<TeamPerformance[]> => {
    return fetchWithFallback('/api/teams/performance', mockTeamPerformance);
  },

  getSimulations: async (params?: {
    season?: number;
    trackId?: string;
  }): Promise<SimulationResult[]> => {
    let endpoint = '/api/simulations';
    const queryParams = new URLSearchParams();
    if (params?.season) queryParams.append('season', params.season.toString());
    if (params?.trackId) queryParams.append('trackId', params.trackId);
    if (queryParams.toString()) endpoint += `?${queryParams.toString()}`;

    const allSimulations = await fetchWithFallback(endpoint, mockSimulations);

    if (params?.season) {
      return allSimulations.filter((s) => s.season === params.season);
    }
    if (params?.trackId) {
      return allSimulations.filter((s) => s.trackId === params.trackId);
    }
    return allSimulations;
  },

  getCircuitComparisons: async (season: number): Promise<CircuitComparison[]> => {
    const mockComparisons: CircuitComparison[] = mockTracks.map((track) => ({
      trackId: track.id,
      trackName: track.name,
      baseline2025: {
        mean: 85 + Math.random() * 10,
        median: 84 + Math.random() * 10,
        stdDev: 3 + Math.random() * 2,
        confidence95Lower: 78 + Math.random() * 5,
        confidence95Upper: 92 + Math.random() * 5,
        iterations: 10000,
      },
      predicted2026: {
        mean: 82 + Math.random() * 15,
        median: 81 + Math.random() * 15,
        stdDev: 3.5 + Math.random() * 2,
        confidence95Lower: 75 + Math.random() * 5,
        confidence95Upper: 95 + Math.random() * 5,
        iterations: 10000,
      },
      impactDelta: -3 + Math.random() * 8,
    }));

    return fetchWithFallback(`/api/circuits/comparison?season=${season}`, mockComparisons);
  },
};
