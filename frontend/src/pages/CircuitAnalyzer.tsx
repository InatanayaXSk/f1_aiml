import { useState } from 'react';
import { TrackVisualizer } from '../components/TrackVisualizer';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { useTracks, useTrackSVG } from '../hooks/useTracks';
import { useCircuitComparisons } from '../hooks/useSimulations';
import { useFilterStore } from '../store/useFilterStore';
import { MapPin, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { Track } from '../types';

export const CircuitAnalyzer = () => {
  const { selectedSeason } = useFilterStore();
  const { data: tracks, isLoading: tracksLoading, error: tracksError, refetch } = useTracks();
  const { data: comparisons, isLoading: comparisonsLoading } = useCircuitComparisons(selectedSeason);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [compareTrack, setCompareTrack] = useState<Track | null>(null);

  const { data: selectedTrackSVG } = useTrackSVG(selectedTrack?.id || '');
  const { data: compareTrackSVG } = useTrackSVG(compareTrack?.id || '');

  const isLoading = tracksLoading || comparisonsLoading;

  if (isLoading) {
    return <Loading />;
  }

  if (tracksError) {
    return <ErrorMessage message="Failed to load circuit data" onRetry={() => refetch()} />;
  }

  const getComparisonForTrack = (trackId: string) => {
    return comparisons?.find((c) => c.trackId === trackId);
  };

  const renderTrackDetails = (track: Track, svg: string | null | undefined) => {
    const comparison = getComparisonForTrack(track.id);
    const impactDelta = comparison?.impactDelta || 0;

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{track.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{track.country}</p>
            </div>
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                impactDelta > 0
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : impactDelta < 0
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {impactDelta > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : impactDelta < 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : (
                <Activity className="w-4 h-4" />
              )}
              <span className="text-sm font-semibold">
                {impactDelta > 0 ? '+' : ''}
                {impactDelta.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Length</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {track.length.toFixed(3)} km
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Laps</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {track.laps}
              </p>
            </div>
          </div>

          <TrackVisualizer trackId={track.id} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Track Features</h4>
          <div className="space-y-3">
            {[
              { label: 'Sector 1 Difficulty', value: track.features.sector1Difficulty },
              { label: 'Sector 2 Difficulty', value: track.features.sector2Difficulty },
              { label: 'Sector 3 Difficulty', value: track.features.sector3Difficulty },
              { label: 'Tire Degradation', value: track.features.degradation },
              { label: 'Risk Factor', value: track.features.riskFactor },
              { label: 'Overtaking Opportunities', value: track.features.overtakingOpportunities },
              { label: 'Power Sensitivity', value: track.features.powerSensitivity },
            ].map((feature) => (
              <div key={feature.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{feature.label}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {feature.value.toFixed(1)}/10
                  </span>
                </div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(feature.value / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {comparison && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Monte Carlo Results
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">2025 Baseline</p>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-gray-600 dark:text-gray-400">Mean:</span>{' '}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {comparison.baseline2025.mean.toFixed(2)}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600 dark:text-gray-400">95% CI:</span>{' '}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {comparison.baseline2025.confidence95Lower.toFixed(2)} -{' '}
                      {comparison.baseline2025.confidence95Upper.toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">2026 Predicted</p>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-gray-600 dark:text-gray-400">Mean:</span>{' '}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {comparison.predicted2026.mean.toFixed(2)}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600 dark:text-gray-400">95% CI:</span>{' '}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {comparison.predicted2026.confidence95Lower.toFixed(2)} -{' '}
                      {comparison.predicted2026.confidence95Upper.toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Circuit Analyzer
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Compare track characteristics and regulation impacts across circuits
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Select Circuits to Compare
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Primary Circuit
            </label>
            <select
              value={selectedTrack?.id || ''}
              onChange={(e) => {
                const track = tracks?.find((t) => t.id === e.target.value);
                setSelectedTrack(track || null);
              }}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a circuit...</option>
              {tracks?.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Compare With
            </label>
            <select
              value={compareTrack?.id || ''}
              onChange={(e) => {
                const track = tracks?.find((t) => t.id === e.target.value);
                setCompareTrack(track || null);
              }}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a circuit...</option>
              {tracks
                ?.filter((t) => t.id !== selectedTrack?.id)
                .map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {selectedTrack || compareTrack ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {selectedTrack && (
            <div>{renderTrackDetails(selectedTrack, selectedTrackSVG)}</div>
          )}
          {compareTrack && (
            <div>{renderTrackDetails(compareTrack, compareTrackSVG)}</div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 border border-gray-200 dark:border-gray-700 text-center">
          <MapPin className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Select one or two circuits above to view detailed analysis
          </p>
        </div>
      )}
    </div>
  );
};
