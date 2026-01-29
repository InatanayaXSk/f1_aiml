// TopMoversTable.tsx - Quick component to show top driver position changes
// Add this file and import in PresentationSummary.tsx for instant impact visualization

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DriverChange {
  driver: string;
  change: number;
}

interface TopMoversProps {
  monteCarloData: any; // monte_carlo_results.json
  topCount?: number;
}

export const TopMoversTable: React.FC<TopMoversProps> = ({ 
  monteCarloData, 
  topCount = 5 
}) => {
  const { improvers, decliners } = useMemo(() => {
    const raceKeys = Object.keys(monteCarloData);
    const firstRace = monteCarloData[raceKeys[0]];
    const drivers = Object.keys(firstRace.current);

    const changes = drivers.map(driver => {
      const totalChange = raceKeys.reduce((sum, raceKey) => {
        const current = monteCarloData[raceKey].current[driver]?.mean || 0;
        const future = monteCarloData[raceKey]['2026'][driver]?.mean || 0;
        return sum + (future - current);
      }, 0);
      
      const avgChange = totalChange / raceKeys.length;
      return { driver, change: avgChange };
    });

    return {
      improvers: changes
        .sort((a, b) => b.change - a.change)
        .slice(0, topCount),
      decliners: changes
        .sort((a, b) => a.change - b.change)
        .slice(0, topCount)
    };
  }, [monteCarloData, topCount]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        📊 Top Position Movers
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Average position change across all 92 races (2022-2025)
      </p>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Top Improvers */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
              Top Improvers in 2026
            </h3>
          </div>
          <div className="space-y-3">
            {improvers.map((item, idx) => (
              <div 
                key={idx} 
                className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800 transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {item.driver}
                  </span>
                </div>
                <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                  +{item.change.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/5 rounded-lg border border-green-100 dark:border-green-900">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              💡 These drivers benefit most from 2026 regulations, particularly on power-sensitive tracks.
            </p>
          </div>
        </div>

        {/* Top Decliners */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Top Decliners in 2026
            </h3>
          </div>
          <div className="space-y-3">
            {decliners.map((item, idx) => (
              <div 
                key={idx} 
                className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800 transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-red-700 dark:text-red-300">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {item.driver}
                  </span>
                </div>
                <span className="text-red-600 dark:text-red-400 font-bold text-lg">
                  {item.change.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/5 rounded-lg border border-red-100 dark:border-red-900">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              ⚠️ Negative changes are minimal because regulations affect all teams equally. These are statistical variations.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Biggest Gain</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              +{improvers[0]?.change.toFixed(3)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Average Impact</p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
              {(
                [...improvers, ...decliners].reduce((sum, d) => sum + Math.abs(d.change), 0) / 
                (improvers.length + decliners.length)
              ).toFixed(3)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Biggest Loss</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {decliners[0]?.change.toFixed(3)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// HOW TO USE:
// 1. Save this file as: frontend/src/components/TopMoversTable.tsx
// 2. In PresentationSummary.tsx, add import:
//    import { TopMoversTable } from '../components/TopMoversTable';
//    import monteCarloData from '../../../outputs/monte_carlo_results.json';
// 3. Add component anywhere in the return():
//    <TopMoversTable monteCarloData={monteCarloData} topCount={5} />
