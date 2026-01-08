import { Link } from 'react-router-dom';
import { MetricCard } from '../components/MetricCard';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { useSimulations } from '../hooks/useSimulations';
import { useTeamPerformance } from '../hooks/useTeams';
import { useTracks } from '../hooks/useTracks';
import { Activity, Calendar, Flag, TrendingUp } from 'lucide-react';

export const Home = () => {
  const { data: simulations, isLoading: simulationsLoading, error: simulationsError } = useSimulations();
  const { data: teams, isLoading: teamsLoading } = useTeamPerformance();
  const { data: tracks, isLoading: tracksLoading } = useTracks();

  const isLoading = simulationsLoading || teamsLoading || tracksLoading;

  if (isLoading) {
    return <Loading />;
  }

  if (simulationsError) {
    return <ErrorMessage message="Failed to load dashboard data" />;
  }

  const recentSimulations = simulations?.slice(0, 3) || [];
  const avgConfidence =
    simulations?.reduce((acc, sim) => acc + sim.confidence, 0) / (simulations?.length || 1);

  const topTeam = teams?.sort((a, b) => b.predicted2026 - a.predicted2026)[0];
  const avgTeamImprovement =
    teams?.reduce((acc, team) => {
      const change = ((team.predicted2026 - team.baseline2025) / team.baseline2025) * 100;
      return acc + change;
    }, 0) / (teams?.length || 1);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Dashboard Overview
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Track F1 2026 regulation impacts across teams, circuits, and simulations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Simulations"
          value={simulations?.length || 0}
          icon={Activity}
          description="Monte Carlo simulation runs"
        />
        <MetricCard
          title="Average Confidence"
          value={`${(avgConfidence * 100).toFixed(1)}%`}
          icon={TrendingUp}
          description="Prediction accuracy"
        />
        <MetricCard
          title="Circuits Analyzed"
          value={tracks?.length || 0}
          icon={Flag}
          description="Track configurations"
        />
        <MetricCard
          title="Avg Team Change"
          value={`${avgTeamImprovement > 0 ? '+' : ''}${avgTeamImprovement.toFixed(1)}%`}
          change={avgTeamImprovement}
          icon={Calendar}
          description="2025 to 2026 forecast"
        />
      </div>

      {topTeam && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 border border-blue-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Top Predicted Performer 2026
          </h3>
          <div className="flex items-baseline gap-4">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {topTeam.teamName}
            </p>
            <p className="text-xl text-gray-700 dark:text-gray-300">
              {topTeam.predicted2026} points
            </p>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              (+{topTeam.predicted2026 - topTeam.baseline2025} from 2025)
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Simulations
          </h3>
          {recentSimulations.length > 0 ? (
            <div className="space-y-3">
              {recentSimulations.map((sim) => {
                const track = tracks?.find((t) => t.id === sim.trackId);
                const winner = sim.results[0];
                return (
                  <div
                    key={sim.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {track?.name || sim.trackId}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Winner: Driver #{winner?.driverId || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {new Date(sim.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Confidence: {(sim.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No simulations available
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Quick Links
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <Link
              to="/regulations"
              className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Regulation Explorer
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Analyze 2026 regulation impacts
                </p>
              </div>
              <span className="text-blue-600 dark:text-blue-400">→</span>
            </Link>
            <Link
              to="/circuits"
              className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors border border-green-200 dark:border-green-800"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Circuit Analyzer</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Compare track performance
                </p>
              </div>
              <span className="text-green-600 dark:text-green-400">→</span>
            </Link>
            <Link
              to="/teams"
              className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors border border-orange-200 dark:border-orange-800"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Team Comparison</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View team performance heatmaps
                </p>
              </div>
              <span className="text-orange-600 dark:text-orange-400">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
