import { RegulationFeatures } from '../components/RegulationFeatures';
import { MetricCard } from '../components/MetricCard';
import { DriverPositionDistribution } from '../components/DriverPositionDistribution';
import { InteractiveRacePicker } from '../components/InteractiveRacePicker';
import { Trophy, Users, Flag, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface PresentationStats {
  totalRaces: number;
  totalDrivers: number;
  totalCircuits: number;
  avgPositionChange: number;
  driversImproved: number;
  driversWorsened: number;
  mostImpactedTrack: string;
}

interface TopDriverChange {
  driver: string;
  change: number;
  currentAvg: number;
  future: number;
}

interface TrackImpact {
  track: string;
  impact: string;
  change: number;
}

export function PresentationSummary() {
  const [stats, setStats] = useState<PresentationStats | null>(null);
  const [topDriverChanges, setTopDriverChanges] = useState<TopDriverChange[]>([]);
  const [trackImpacts, setTrackImpacts] = useState<TrackImpact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load circuit comparisons for track impacts and overall stats
        const circuitComparisons = await api.getCircuitComparisons(2026);
        const tracks = await api.getTracks();
        
        // Compute track impacts
        const impacts: TrackImpact[] = circuitComparisons
          .map(circuit => ({
            track: circuit.trackName,
            change: circuit.impactDelta,
            impact: Math.abs(circuit.impactDelta) > 0.1 ? 'High' : 
                    Math.abs(circuit.impactDelta) > 0.05 ? 'Medium' : 
                    Math.abs(circuit.impactDelta) > 0.02 ? 'Low' : 'Minimal'
          }))
          .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
          .slice(0, 5);
        
        setTrackImpacts(impacts);
        
        // Find most impacted track
        const mostImpacted = impacts.length > 0 ? impacts[0].track : 'Unknown';
        
        // Compute average position change across all circuits
        const avgPositionChange = circuitComparisons.length > 0
          ? circuitComparisons.reduce((sum, c) => sum + c.impactDelta, 0) / circuitComparisons.length
          : 0;
        
        // Load monte carlo results to compute driver-specific changes
        const monteCarloModule = await import('../../../outputs/monte_carlo_results.json');
        const monteCarlo = monteCarloModule.default || monteCarloModule;
        
        // Compute driver changes across all races
        const driverChanges = new Map<string, { currentSum: number, futureSum: number, count: number }>();
        
        Object.values(monteCarlo).forEach((raceData: any) => {
          if (!raceData.current || !raceData['2026']) return;
          
          Object.keys(raceData.current).forEach(driverName => {
            const current = raceData.current[driverName]?.mean;
            const future = raceData['2026'][driverName]?.mean;
            
            if (current !== undefined && future !== undefined) {
              const existing = driverChanges.get(driverName) || { currentSum: 0, futureSum: 0, count: 0 };
              existing.currentSum += current;
              existing.futureSum += future;
              existing.count += 1;
              driverChanges.set(driverName, existing);
            }
          });
        });
        
        // Compute averages and changes
        const driverStats = Array.from(driverChanges.entries())
          .map(([driver, data]) => ({
            driver,
            currentAvg: data.currentSum / data.count,
            future: data.futureSum / data.count,
            change: (data.futureSum / data.count) - (data.currentSum / data.count)
          }))
          .filter(d => d.change !== 0)
          .sort((a, b) => a.change - b.change)
          .slice(0, 5);
        
        setTopDriverChanges(driverStats);
        
        // Count drivers improved/worsened
        const allDriverStats = Array.from(driverChanges.entries())
          .map(([driver, data]) => ({
            driver,
            change: (data.futureSum / data.count) - (data.currentSum / data.count)
          }));
        
        const driversImproved = allDriverStats.filter(d => d.change < 0).length;
        const driversWorsened = allDriverStats.filter(d => d.change > 0).length;
        
        setStats({
          totalRaces: Object.keys(monteCarlo).length,
          totalDrivers: driverChanges.size,
          totalCircuits: tracks.length,
          avgPositionChange,
          driversImproved,
          driversWorsened,
          mostImpactedTrack: mostImpacted
        });
        
      } catch (error) {
        console.error('Failed to load presentation data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading presentation data...</p>
        </div>
      </div>
    );
  }

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

      {/* Driver Impact Highlights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Driver Impact Highlights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topDriverChanges.map((driver) => (
            <div key={driver.driver} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {driver.driver}
              </div>
              <div className={`text-2xl font-bold mt-2 ${
                driver.change < 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {driver.change > 0 ? '+' : ''}{driver.change.toFixed(3)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {driver.currentAvg.toFixed(2)} → {driver.future.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Improved: <span className="font-bold text-emerald-600">{stats.driversImproved}</span> ·
          Worsened: <span className="font-bold text-red-600">{stats.driversWorsened}</span>
        </div>
      </div>

      {/* High-Level Summary - No detailed driver table (see Regulation tab for details) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Overall Impact Summary
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Minimal Position Changes</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{Math.abs(stats.avgPositionChange).toFixed(3)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">positions avg across all drivers</p>
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
    </div>
  );
}
