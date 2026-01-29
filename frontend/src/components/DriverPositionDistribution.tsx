import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Users, TrendingUp } from "lucide-react";

interface DriverStats {
  driver: string;
  lastName: string;
  mean: number;
  std: number;
  min: number;
  max: number;
  percentile_5: number;
  percentile_95: number;
  color: string;
}

const TEAM_COLORS: Record<string, string> = {
  'Verstappen': '#3671C6', 'Perez': '#3671C6',
  'Hamilton': '#27F4D2', 'Russell': '#27F4D2',
  'Leclerc': '#E8002D', 'Sainz': '#E8002D',
  'Norris': '#FF8000', 'Piastri': '#FF8000',
  'Alonso': '#229971', 'Stroll': '#229971',
  'Gasly': '#6692FF', 'Ocon': '#6692FF',
  'Bottas': '#52E252', 'Zhou': '#52E252',
  'Magnussen': '#B6BABD', 'Hulkenberg': '#B6BABD',
  'Tsunoda': '#6692FF', 'Ricciardo': '#6692FF',
  'Albon': '#64C4FF', 'Sargeant': '#64C4FF',
  'Bearman': '#E8002D', 'Lawson': '#6692FF',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-4 shadow-xl">
      <div className="font-bold text-white mb-2 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></div>
        {data.driver}
      </div>
      <div className="space-y-1 text-sm">
        <div className="text-emerald-400">
          Mean Position: <strong>P{data.mean.toFixed(2)}</strong>
        </div>
        <div className="text-blue-400">
          Std Deviation: <strong>±{data.std.toFixed(2)}</strong>
        </div>
        <div className="text-gray-300">
          Range: <strong>P{data.min.toFixed(1)} - P{data.max.toFixed(1)}</strong>
        </div>
        <div className="text-purple-400">
          90% Range: <strong>P{data.percentile_5.toFixed(1)} - P{data.percentile_95.toFixed(1)}</strong>
        </div>
      </div>
    </div>
  );
};

export function DriverPositionDistribution() {
  const [scenario, setScenario] = useState<'current' | '2026'>('current');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/monte_carlo_results.json')
      .then(res => res.json())
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load Monte Carlo results:', err);
        setLoading(false);
      });
  }, []);

  const driverStats = useMemo(() => {
    if (!data) return [];

    const allDriverStats: Record<string, { totalMean: number; totalStd: number; count: number; min: number; max: number; p5: number; p95: number }> = {};

    // Aggregate across all races
    Object.keys(data).forEach(raceKey => {
      const raceData = data[raceKey][scenario];
      if (!raceData) return;

      Object.entries(raceData).forEach(([driver, stats]: [string, any]) => {
        if (!allDriverStats[driver]) {
          allDriverStats[driver] = {
            totalMean: 0,
            totalStd: 0,
            count: 0,
            min: 999,
            max: 0,
            p5: 0,
            p95: 0
          };
        }
        allDriverStats[driver].totalMean += stats.mean;
        allDriverStats[driver].totalStd += stats.std;
        allDriverStats[driver].count += 1;
        allDriverStats[driver].min = Math.min(allDriverStats[driver].min, stats.min);
        allDriverStats[driver].max = Math.max(allDriverStats[driver].max, stats.max);
        allDriverStats[driver].p5 += stats.percentile_5;
        allDriverStats[driver].p95 += stats.percentile_95;
      });
    });

    // Calculate averages and format
    const formatted: DriverStats[] = Object.entries(allDriverStats)
      .map(([driver, stats]) => {
        const lastName = driver.split(' ').pop() || driver;
        const color = TEAM_COLORS[lastName] || '#9CA3AF';
        return {
          driver,
          lastName,
          mean: stats.totalMean / stats.count,
          std: stats.totalStd / stats.count,
          min: stats.min,
          max: stats.max,
          percentile_5: stats.p5 / stats.count,
          percentile_95: stats.p95 / stats.count,
          color
        };
      })
      .sort((a, b) => a.mean - b.mean) // Sort by mean position (lower is better)
      .slice(0, 15); // Top 15 drivers

    return formatted;
  }, [data, scenario]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading driver statistics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Driver Position Distribution
          </h2>
        </div>
        
        {/* Scenario Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setScenario('current')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              scenario === 'current'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Current
          </button>
          <button
            onClick={() => setScenario('2026')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              scenario === '2026'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            2026 Regulations
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Average finishing position with standard deviation across all {Object.keys(data || {}).length} races. 
        Bars show mean position, error bars show ±1 standard deviation (consistency).
      </p>

      {/* Box Plot Style Chart */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={driverStats}
            margin={{ top: 20, right: 30, left: 50, bottom: 80 }}
            layout="vertical"
          >
            <XAxis
              type="number"
              domain={[0, 20]}
              label={{
                value: 'Average Finishing Position',
                position: 'insideBottom',
                offset: -10,
                style: { fill: '#9CA3AF', fontWeight: 600, fontSize: 12 }
              }}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              reversed
            />
            <YAxis
              type="category"
              dataKey="lastName"
              width={100}
              tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(75, 85, 99, 0.1)' }} />
            <ReferenceLine x={10} stroke="#6B7280" strokeDasharray="3 3" label={{ value: 'P10', fill: '#9CA3AF', fontSize: 10 }} />
            
            {/* Error bars (using rectangles) */}
            <Bar dataKey="mean" radius={[0, 4, 4, 0]}>
              {driverStats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-blue-500 rounded"></div>
          <span>Bar = Mean position across all races</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span>Lower position = Better performance</span>
        </div>
      </div>
    </div>
  );
}
