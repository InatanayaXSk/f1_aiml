import { useState } from 'react';
import { BarChart } from '../components/BarChart';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { useRegulations } from '../hooks/useRegulations';
import { useFilterStore } from '../store/useFilterStore';
import type { RegulationFactor } from '../types';
import { Info } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  power: 'Power Unit',
  aero: 'Aerodynamics',
  weight: 'Weight',
  tire: 'Tires',
  fuel: 'Fuel',
};

export const RegulationExplorer = () => {
  const { data: regulations, isLoading, error, refetch } = useRegulations();
  const { selectedSeason } = useFilterStore();
  const [selectedFactor, setSelectedFactor] = useState<RegulationFactor | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load regulations" onRetry={() => refetch()} />;
  }

  const filteredRegulations = categoryFilter
    ? regulations?.filter((r) => r.category === categoryFilter)
    : regulations;

  const chartData =
    filteredRegulations?.map((r) => ({
      label: r.name,
      value: r.impact,
      category: r.category,
    })) || [];

  const categories = Array.from(new Set(regulations?.map((r) => r.category) || []));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Regulation Explorer
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Analyze the impact of 2026 F1 regulations on team performance
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Regulation Impact Factors
        </h3>
        <BarChart
          data={chartData}
          height={450}
          onBarClick={(item) => {
            const factor = regulations?.find((r) => r.name === item.label);
            setSelectedFactor(factor || null);
          }}
        />
      </div>

      {selectedFactor && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {selectedFactor.name}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Impact Level</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${selectedFactor.impact * 100}%` }}
                        />
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {(selectedFactor.impact * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Category</p>
                  <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm font-medium">
                    {categoryLabels[selectedFactor.category] || selectedFactor.category}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Description</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedFactor.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regulations?.map((regulation) => (
          <div
            key={regulation.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
            onClick={() => setSelectedFactor(regulation)}
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                {regulation.name}
              </h4>
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                {categoryLabels[regulation.category]}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {regulation.description}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${regulation.impact * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {(regulation.impact * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
