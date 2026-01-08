import { create } from 'zustand';

interface FilterState {
  selectedSeason: number;
  selectedTrack: string | null;
  selectedTeam: string | null;
  setSelectedSeason: (season: number) => void;
  setSelectedTrack: (trackId: string | null) => void;
  setSelectedTeam: (teamId: string | null) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedSeason: 2026,
  selectedTrack: null,
  selectedTeam: null,
  setSelectedSeason: (season) => set({ selectedSeason: season }),
  setSelectedTrack: (trackId) => set({ selectedTrack: trackId }),
  setSelectedTeam: (teamId) => set({ selectedTeam: teamId }),
  resetFilters: () =>
    set({
      selectedSeason: 2026,
      selectedTrack: null,
      selectedTeam: null,
    }),
}));
