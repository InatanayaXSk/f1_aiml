import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export const useTeamPerformance = () => {
  return useQuery({
    queryKey: ['team-performance'],
    queryFn: api.getTeamPerformance,
    staleTime: 1000 * 60 * 5,
  });
};
