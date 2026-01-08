import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export const useTracks = () => {
  return useQuery({
    queryKey: ['tracks'],
    queryFn: api.getTracks,
    staleTime: 1000 * 60 * 5,
  });
};

export const useTrack = (trackId: string) => {
  return useQuery({
    queryKey: ['track', trackId],
    queryFn: () => api.getTrack(trackId),
    enabled: !!trackId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useTrackSVG = (trackId: string) => {
  return useQuery({
    queryKey: ['track-svg', trackId],
    queryFn: () => api.getTrackSVG(trackId),
    enabled: !!trackId,
    staleTime: 1000 * 60 * 10,
  });
};
