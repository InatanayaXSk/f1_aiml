import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export const useSimulations = (params?: { season?: number; trackId?: string }) => {
  return useQuery({
    queryKey: ['simulations', params],
    queryFn: () => api.getSimulations(params),
    staleTime: 1000 * 60 * 5,
  });
};

export const useCircuitComparisons = (season: number) => {
  return useQuery({
    queryKey: ['circuit-comparisons', season],
    queryFn: () => api.getCircuitComparisons(season),
    enabled: !!season,
    staleTime: 1000 * 60 * 5,
  });
};
