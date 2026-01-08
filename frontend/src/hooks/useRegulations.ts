import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export const useRegulations = () => {
  return useQuery({
    queryKey: ['regulations'],
    queryFn: api.getRegulationFactors,
    staleTime: 1000 * 60 * 10,
  });
};
