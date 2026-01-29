import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface DriverStats {
  mean: number;
  std: number;
  median: number;
  min: number;
  max: number;
  percentile_5: number;
  percentile_95: number;
  top3_probability: number;
  top5_probability: number;
}

interface RaceData {
  event_name: string;
  current: Record<string, DriverStats>;
  '2026': Record<string, DriverStats>;
}

interface MonteCarloData {
  [key: string]: RaceData;
}

const TEAM_COLORS: Record<string, string> = {
  "Max Verstappen": "#1E3A8A",
  "Sergio Perez": "#1E3A8A",
  "Charles Leclerc": "#DC2626",
  "Carlos Sainz": "#DC2626",
  "Lewis Hamilton": "#059669",
  "George Russell": "#059669",
  "Lando Norris": "#F97316",
  "Oscar Piastri": "#F97316",
  "Fernando Alonso": "#10B981",
  "Lance Stroll": "#10B981",
  "Valtteri Bottas": "#9333EA",
  "Guanyu Zhou": "#9333EA",
  "Kevin Magnussen": "#6B7280",
  "Nico Hulkenberg": "#6B7280",
  "Pierre Gasly": "#3B82F6",
  "Esteban Ocon": "#3B82F6",
  "Yuki Tsunoda": "#0EA5E9",
  "Daniel Ricciardo": "#0EA5E9",
  "Alexander Albon": "#06B6D4",
  "Logan Sargeant": "#06B6D4",
  "Mick Schumacher": "#EF4444",
  "Sebastian Vettel": "#065F46",
  "Nicholas Latifi": "#7C3AED"
};

export const PodiumProbability: React.FC = () => {
  const [monteCarloData, setMonteCarloData] = useState<MonteCarloData | null>(null);
  const [selectedRace, setSelectedRace] = useState<string>('');
  const [viewMode, setViewMode] = useState<'current' | '2026'>('current');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await import('../../../outputs/monte_carlo_results.json');
        const loadedData = data.default || data;
        setMonteCarloData(loadedData);
        
        // Set first race as default
        const firstRace = Object.keys(loadedData)[0];
        setSelectedRace(firstRace);
      } catch (err) {
        console.error('Failed to load Monte Carlo data:', err);
        setError('Monte Carlo data not available');
      }
    };

    loadData();
  }, []);

  const raceOptions = useMemo(() => {
    if (!monteCarloData) return [];
    return Object.entries(monteCarloData).map(([key, data]) => ({
      key,
      label: `${data.event_name} (${key.replace('_', ' ')})`
    }));
  }, [monteCarloData]);

  const topDrivers = useMemo(() => {
    if (!monteCarloData || !selectedRace) return [];

    const raceData = monteCarloData[selectedRace];
    const regulationData = raceData[viewMode];

    return Object.entries(regulationData)
      .map(([driver, stats]) => ({
        driver,
        lastName: driver.split(' ').pop() || driver,
        fullName: driver,
        top3: stats.top3_probability * 100,
        top5: stats.top5_probability * 100,
        expectedPos: stats.mean,
        bestPos: stats.min,
        worstPos: stats.max,
        color: TEAM_COLORS[driver] || "#6B7280"
      }))
      .filter((driver) => driver.top3 > 0)
      .sort((a, b) => a.expectedPos - b.expectedPos)
      .slice(0, 10);
  }, [monteCarloData, selectedRace, viewMode]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null;
    
    const data = payload[0].payload;
    
    return (
      <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-4 shadow-xl">
        <div className="font-bold text-white mb-2">{data.fullName}</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">🥇🥈🥉 Podium:</span>
            <span className="text-yellow-400 font-bold">{data.top3.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">🏁 Top 5:</span>
            <span className="text-emerald-400 font-bold">{data.top5.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Expected:</span>
            <span className="text-blue-400 font-bold">P{data.expectedPos.toFixed(1)}</span>
          </div>
          <div className="flex justify-between gap-4 text-xs pt-1 border-t border-gray-700">
            <span className="text-gray-500">Range:</span>
            <span className="text-gray-400">P{data.bestPos.toFixed(1)} - P{data.worstPos.toFixed(1)}</span>
          </div>
        </div>
      </div>
    );
  };

  if (error || !monteCarloData) {
    return (
      <div className="bg-gray-800/50 rounded-lg border-2 border-gray-700 p-8 text-center">
        <p className="text-gray-400">{error || 'Loading Monte Carlo data...'}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/95 rounded-xl border-2 border-gray-700 p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-700">
        <Trophy className="w-8 h-8 text-yellow-500" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">Podium Probability Analysis</h2>
          <p className="text-gray-400 text-sm">Monte Carlo simulation results (2,000 runs)</p>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Race Selector */}
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2">
            Select Race
          </label>
          <select
            value={selectedRace}
            onChange={(e) => setSelectedRace(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
          >
            {raceOptions.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Regulation Toggle */}
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2">
            Regulation Era
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('current')}
              className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                viewMode === 'current'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Current Regs
            </button>
            <button
              onClick={() => setViewMode('2026')}
              className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                viewMode === '2026'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              2026 Regs
            </button>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Top Podium Contenders
          </h3>
          <div className="text-sm text-gray-400">
            Hover bars for details
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
          <ResponsiveContainer width="100%" height={550}>
            <BarChart
              data={topDrivers}
              margin={{ top: 20, right: 30, left: 50, bottom: 80 }}
              barCategoryGap="20%"
            >
              <XAxis
                dataKey="lastName"
                angle={-35}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fill: '#9CA3AF', fontSize: 13, fontWeight: 600 }}
              />
              <YAxis
                label={{
                  value: 'Podium Probability (%)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#E5E7EB', fontWeight: 600, fontSize: 14 }
                }}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(75, 85, 99, 0.2)' }} />
              <Bar dataKey="top3" radius={[8, 8, 0, 0]} name="Podium Chance" maxBarSize={80}>
                {topDrivers.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-yellow-500 to-yellow-400"></div>
            <span className="text-gray-300">Bar height = Podium probability (Top 3)</span>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex items-start gap-3 text-xs text-gray-400">
          <div className="text-blue-400 text-lg">💡</div>
          <div>
            <p className="font-medium text-gray-300 mb-1">How to read this:</p>
            <p>
              Percentages show how often each driver finished in the top 3 or top 5 across 2,000 simulated races.
              A 92% podium chance means they finished P1-P3 in 1,840 out of 2,000 simulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PodiumProbability;
