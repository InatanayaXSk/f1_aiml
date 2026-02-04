import { Link } from 'react-router-dom';
import { MetricCard } from '../components/MetricCard';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { PodiumProbability } from '../components/PodiumProbability';
import { useSimulations } from '../hooks/useSimulations';
import { useTeamPerformance } from '../hooks/useTeams';
import { useTracks } from '../hooks/useTracks';
import { Activity, Calendar, Flag, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

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

  // Top performer is team with best (lowest) predicted position
  // Also consider improvement from baseline
  const topTeam = teams && teams.length > 0
    ? teams.reduce((best, current) => {
        // Lower position is better, but also consider improvement
        const bestScore = best.predicted2026 + (best.baseline2025 - best.predicted2026) * 0.5;
        const currentScore = current.predicted2026 + (current.baseline2025 - current.predicted2026) * 0.5;
        return currentScore < bestScore ? current : best;
      })
    : null;
  
  const avgTeamImprovement =
    teams?.reduce((acc, team) => {
      // Improvement is when predicted position is lower (better) than baseline
      const positionChange = team.baseline2025 - team.predicted2026; // Positive = improvement
      const change = team.baseline2025 > 0 
        ? (positionChange / team.baseline2025) * 100 
        : 0;
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
          title="Total Simulation per track"
          value={2000}
          icon={Activity}
          description="Monte Carlo simulation runs"
        />
        {/* <MetricCard
          title="Average Confidence"
          value={`${(avgConfidence * 100).toFixed(1)}%`}
          icon={TrendingUp}
          description="Prediction accuracy"
        /> */}
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

      {/* Model Validation Info Card */}
      <Link
        to="/validation"
        className="block bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Model Validated
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                MAE 0.60 · Coverage 89.8%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Rolling-origin evaluation
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
        </div>
      </Link>

      {topTeam && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 border border-blue-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Top Predicted Performer 2026
          </h3>
          <div className="flex items-baseline gap-4 flex-wrap">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {topTeam.teamName}
            </p>
            <p className="text-xl text-gray-700 dark:text-gray-300">
              Avg Position: P{topTeam.predicted2026.toFixed(1)}
            </p>
            {topTeam.baseline2025 - topTeam.predicted2026 !== 0 && (
              <span className={`text-sm font-semibold ${
                topTeam.baseline2025 > topTeam.predicted2026
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {topTeam.baseline2025 > topTeam.predicted2026 ? '↓' : '↑'}
                {Math.abs(topTeam.baseline2025 - topTeam.predicted2026).toFixed(1)} positions
                {topTeam.baseline2025 > topTeam.predicted2026 ? ' improvement' : ' decline'} from 2025
              </span>
            )}
          </div>
        </div>
      )}

      {/* Podium Probability Component */}
      <div className="mb-8">
        <PodiumProbability />
      </div>

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
