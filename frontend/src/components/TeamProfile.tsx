import type { TeamPerformance } from '../types';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';

interface TeamProfileProps {
  team: TeamPerformance;
}

export const TeamProfile = ({ team }: TeamProfileProps) => {
  const change = team.predicted2026 - team.baseline2025;
  const changePercent = (change / team.baseline2025) * 100;
  const isPositive = change > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{team.teamName}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{team.constructor}</p>
        </div>
        <div
          className={`flex items-center gap-1 px-3 py-1 rounded-full ${
            isPositive
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-sm font-semibold">
            {isPositive ? '+' : ''}
            {changePercent.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">2025 Baseline</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {team.baseline2025}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">2026 Predicted</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {team.predicted2026}
          </p>
        </div>
      </div>

      {team.drivers.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Drivers</h4>
          </div>
          <div className="space-y-2">
            {team.drivers.map((driver) => (
              <div
                key={driver.id}
                className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-900/50 rounded p-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                    #{driver.number}
                  </span>
                  <span className="text-gray-900 dark:text-gray-100">{driver.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    P{driver.baseline2025Position}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span
                    className={
                      driver.predicted2026Position < driver.baseline2025Position
                        ? 'text-green-600 dark:text-green-400 font-semibold'
                        : driver.predicted2026Position > driver.baseline2025Position
                        ? 'text-red-600 dark:text-red-400 font-semibold'
                        : 'text-gray-600 dark:text-gray-400'
                    }
                  >
                    P{driver.predicted2026Position}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
