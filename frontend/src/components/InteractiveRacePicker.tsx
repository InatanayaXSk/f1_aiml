import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { Flag, Calendar, MapPin } from "lucide-react";

interface RaceData {
  raceKey: string;
  raceName: string;
  drivers: DriverRaceStats[];
}

interface DriverRaceStats {
  driver: string;
  lastName: string;
  currentMean: number;
  futureMean: number;
  delta: number;
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

const RACE_NAMES: Record<string, string> = {
  '2025_R01': 'Australia', '2025_R02': 'China', '2025_R03': 'Japan',
  '2025_R04': 'Bahrain', '2025_R05': 'Saudi Arabia', '2025_R06': 'Miami',
  '2025_R07': 'Emilia Romagna', '2025_R08': 'Monaco', '2025_R09': 'Spain',
  '2025_R10': 'Canada', '2025_R11': 'Austria', '2025_R12': 'Great Britain',
  '2025_R13': 'Belgium', '2025_R14': 'Hungary', '2025_R15': 'Netherlands',
  '2025_R16': 'Italy', '2025_R17': 'Azerbaijan', '2025_R18': 'Singapore',
  '2025_R19': 'United States', '2025_R20': 'Mexico', '2025_R21': 'Brazil',
  '2025_R22': 'Las Vegas', '2025_R23': 'Qatar', '2025_R24': 'Abu Dhabi',
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
        <div className="text-blue-400">
          Current: <strong>P{data.currentMean.toFixed(2)}</strong>
        </div>
        <div className="text-emerald-400">
          2026: <strong>P{data.futureMean.toFixed(2)}</strong>
        </div>
        <div className={data.delta < 0 ? "text-green-400" : "text-red-400"}>
          Change: <strong>{data.delta > 0 ? '+' : ''}{data.delta.toFixed(3)} positions</strong>
        </div>
      </div>
    </div>
  );
};

export function InteractiveRacePicker() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRace, setSelectedRace] = useState('2025_R01');
  const [viewMode, setViewMode] = useState<'top10' | 'comparison'>('top10');

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

  const raceList = useMemo(() => {
    if (!data) return [];
    return Object.keys(data)
      .filter(key => key.startsWith('2025'))
      .sort();
  }, [data]);

  const raceData = useMemo(() => {
    if (!data || !data[selectedRace]) return null;

    const current = data[selectedRace].current;
    const future = data[selectedRace]['2026'];
    
    if (!current || !future) return null;

    const drivers: DriverRaceStats[] = Object.keys(current)
      .map(driver => {
        const lastName = driver.split(' ').pop() || driver;
        const color = TEAM_COLORS[lastName] || '#9CA3AF';
        const currentMean = current[driver].mean;
        const futureMean = future[driver].mean;
        return {
          driver,
          lastName,
          currentMean,
          futureMean,
          delta: futureMean - currentMean,
          color
        };
      })
      .sort((a, b) => a.currentMean - b.currentMean); // Sort by current position

    return {
      raceKey: selectedRace,
      raceName: RACE_NAMES[selectedRace] || data[selectedRace].event_name || selectedRace,
      drivers: viewMode === 'top10' ? drivers.slice(0, 10) : drivers
    };
  }, [data, selectedRace, viewMode]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading race data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Flag className="w-6 h-6 text-emerald-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Interactive Race Analysis
        </h2>
      </div>

      {/* Controls */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Race Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Select Race
          </label>
          <select
            value={selectedRace}
            onChange={(e) => setSelectedRace(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {raceList.map(race => (
              <option key={race} value={race}>
                {RACE_NAMES[race] || race} ({race})
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            View Mode
          </label>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('top10')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'top10'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Top 10 Only
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'comparison'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All Drivers
            </button>
          </div>
        </div>
      </div>

      {/* Race Name Banner */}
      {raceData && (
        <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-lg p-4 mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
            {raceData.raceName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-1">
            Current vs 2026 Regulations Position Comparison
          </p>
        </div>
      )}

      {/* Chart */}
      {raceData && (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <ResponsiveContainer width="100%" height={viewMode === 'top10' ? 400 : 600}>
            <BarChart
              data={raceData.drivers}
              margin={{ top: 20, right: 30, left: 50, bottom: 5 }}
              layout="vertical"
            >
              <XAxis
                type="number"
                domain={[0, 20]}
                label={{
                  value: 'Finishing Position',
                  position: 'insideBottom',
                  offset: -5,
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
              <Legend />
              <Bar dataKey="currentMean" name="Current" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="futureMean" name="2026 Regs" fill="#10B981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats Summary */}
      {raceData && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {raceData.drivers.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Drivers Analyzed</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {raceData.drivers.filter(d => d.delta < 0).length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Improved in 2026</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {raceData.drivers.filter(d => d.delta > 0).length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Worsened in 2026</div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {(raceData.drivers.reduce((sum, d) => sum + Math.abs(d.delta), 0) / raceData.drivers.length).toFixed(3)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Avg Position Change</div>
          </div>
        </div>
      )}
    </div>
  );
}
