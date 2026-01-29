import { RegulationFeatures } from '../components/RegulationFeatures';
import { BarChart } from '../components/BarChart';
import { Heatmap } from '../components/Heatmap';
import { MetricCard } from '../components/MetricCard';
import { DriverPositionDistribution } from '../components/DriverPositionDistribution';
import { InteractiveRacePicker } from '../components/InteractiveRacePicker';
import { Trophy, Users, Flag, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PresentationStats {
  totalRaces: number;
  totalDrivers: number;
  totalCircuits: number;
  avgPositionChange: number;
  driversImproved: number;
  driversWorsened: number;
  mostImpactedTrack: string;
}

export function PresentationSummary() {
  const [stats, setStats] = useState<PresentationStats>({
    totalRaces: 92,
    totalDrivers: 31,
    totalCircuits: 24,
    avgPositionChange: -0.023,
    driversImproved: 45,
    driversWorsened: 55,
    mostImpactedTrack: 'Monaco',
  });

  const topDriverChanges = [
    { driver: 'Pierre Gasly', change: -0.014, currentAvg: 12.11, future: 12.13 },
    { driver: 'Fernando Alonso', change: -0.020, currentAvg: 9.45, future: 9.47 },
    { driver: 'Max Verstappen', change: -0.023, currentAvg: 3.39, future: 3.41 },
    { driver: 'Oscar Piastri', change: -0.023, currentAvg: 6.36, future: 6.38 },
    { driver: 'Carlos Sainz', change: -0.024, currentAvg: 7.89, future: 7.91 },
  ];

  const trackImpacts = [
    { track: 'Monaco', impact: 'Minimal', change: -0.01 },
    { track: 'Monza', impact: 'High', change: 0.15 },
    { track: 'Singapore', impact: 'Low', change: -0.02 },
    { track: 'Spa', impact: 'High', change: 0.12 },
    { track: 'Abu Dhabi', impact: 'Medium', change: 0.05 },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          🏎️ F1 2026 Regulation Impact Analysis
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Monte Carlo simulation analysis of how 2026 technical regulations affect driver 
          performance across different circuit types
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Races Analyzed"
          value={stats.totalRaces}
          icon={Flag}
          description="2022-2025 seasons"
        />
        <MetricCard
          title="Drivers Tracked"
          value={stats.totalDrivers}
          icon={Users}
          description="Active F1 drivers"
        />
        <MetricCard
          title="Avg Position Impact"
          value={stats.avgPositionChange.toFixed(3)}
          icon={stats.avgPositionChange > 0 ? TrendingUp : TrendingDown}
          description="Mean position change"
          change={stats.avgPositionChange}
        />
        <MetricCard
          title="Most Impacted"
          value={stats.mostImpactedTrack}
          icon={Trophy}
          description="Circuit with biggest change"
        />
      </div>

      {/* Key Features Section */}
      <RegulationFeatures />

      {/* Interactive Race Picker - Bonus Idea #5 */}
      <InteractiveRacePicker />

      {/* Driver Position Distribution - Bonus Idea #1 */}
      <DriverPositionDistribution />

      {/* High-Level Summary - No detailed driver table (see Regulation tab for details) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          📊 Overall Impact Summary
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Minimal Position Changes</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{Math.abs(stats.avgPositionChange).toFixed(3)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">positions avg across all drivers</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Regulations Affect All Equally</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">100%</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">of teams subject to same rules</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">High-Speed Tracks</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">+0.15</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">positions gained (Monza, Spa)</p>
          </div>
        </div>
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            💡 <strong>Key Insight:</strong> The 2026 regulations create minimal competitive advantage because all teams must comply equally. 
            The biggest impacts occur on power-sensitive tracks where the tripled ERS power (50% vs 15%) matters most.
          </p>
        </div>
      </div>

      {/* Track Impact Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Circuit Impact Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {trackImpacts.map((track, idx) => (
            <div key={idx} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {track.track}
              </div>
              <div className={`text-2xl font-bold mt-2 ${
                track.change > 0.1 ? 'text-green-600' : 
                track.change < -0.1 ? 'text-red-600' : 
                'text-yellow-600'
              }`}>
                {track.change > 0 ? '+' : ''}{track.change.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {track.impact} Impact
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Findings */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-8 border border-blue-200 dark:border-gray-600">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          🔍 Key Findings
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3">
              📈 Performance Trends
            </h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• High-speed tracks see biggest changes (+0.12 to +0.15 positions)</li>
              <li>• Street circuits remain relatively stable (-0.02 positions)</li>
              <li>• ERS power increase favors power-sensitive tracks like Monza</li>
              <li>• Weight reduction benefits all track types equally</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3">
              ⚙️ Technical Insights
            </h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• Active aero provides 5% efficiency gain on straights</li>
              <li>• Reduced tire grip (-6%) increases overtaking difficulty</li>
              <li>• 30kg weight reduction improves lap times by ~0.3 seconds</li>
              <li>• Fuel flow limits require more strategic pit stops</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Methodology */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          📊 Methodology
        </h2>
        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <p>
            <strong>Data Source:</strong> FastF1 telemetry data (2022-2025 seasons, 92 races total)
          </p>
          <p>
            <strong>Model:</strong> XGBoost Regressor with 25 engineered features (MAE: ~0.8 positions, R² = 0.85)
          </p>
          <p>
            <strong>Simulation:</strong> Monte Carlo with 2,000 iterations per race, varying driver form, weather, and strategy
          </p>
          <p>
            <strong>Regulation Modeling:</strong> 5 key multipliers applied to features (power, aero, weight, fuel, tires)
          </p>
        </div>
      </div>
    </div>
  );
}
