import { useState, useMemo } from 'react';
import { Heatmap } from '../components/Heatmap';
import { TeamProfile } from '../components/TeamProfile';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { useTeamPerformance } from '../hooks/useTeams';
import { useRegulations } from '../hooks/useRegulations';
import { ArrowUpDown, Users } from 'lucide-react';
import type { TeamPerformance } from '../types';

type SortField = 'name' | 'baseline' | 'predicted' | 'change';
type SortOrder = 'asc' | 'desc';

export const TeamComparison = () => {
  const { data: teams, isLoading: teamsLoading, error: teamsError, refetch } = useTeamPerformance();
  const { data: regulations, isLoading: regulationsLoading } = useRegulations();
  const [sortField, setSortField] = useState<SortField>('predicted');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const isLoading = teamsLoading || regulationsLoading;

  const heatmapData = useMemo(() => {
    if (!teams || !regulations) return [];

    const data = [];
    for (const team of teams) {
      for (const regulation of regulations) {
        const value = team.factorImpacts[regulation.id] || 0;
        data.push({
          row: team.teamName,
          column: regulation.name,
          value,
        });
      }
    }
    return data;
  }, [teams, regulations]);

  const sortedTeams = useMemo(() => {
    if (!teams) return [];

    return [...teams].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'name':
          aValue = a.teamName;
          bValue = b.teamName;
          break;
        case 'baseline':
          aValue = a.baseline2025;
          bValue = b.baseline2025;
          break;
        case 'predicted':
          aValue = a.predicted2026;
          bValue = b.predicted2026;
          break;
        case 'change':
          aValue = a.predicted2026 - a.baseline2025;
          bValue = b.predicted2026 - b.baseline2025;
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [teams, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (teamsError) {
    return <ErrorMessage message="Failed to load team data" onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Team Comparison
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Analyze team performance across regulation factors and predicted changes
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Team Performance vs Regulation Factors
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Heatmap showing how each team is impacted by different regulation factors. Darker colors
          indicate higher impact.
        </p>
        {heatmapData.length > 0 ? (
          <Heatmap data={heatmapData} height={450} />
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No data available for heatmap
          </p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Team Profiles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTeams.map((team) => (
            <TeamProfile key={team.teamId} team={team} />
          ))}
        </div>
      </div>
    </div>
  );
};
