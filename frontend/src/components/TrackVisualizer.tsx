import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

interface TrackCharacteristics {
  track_type_index: number;
  track_type_name: string;
  corners: number;
  straight_fraction: number;
  overtaking_difficulty: number;
}

interface SectorPath {
  sector: number;
  path: string;
  start_idx: number;
  end_idx: number;
}

interface TrackData {
  name: string;
  fullName: string;
  characteristics: TrackCharacteristics;
  sector_paths: SectorPath[];
}

interface TrackVisualizerProps {
  trackId?: string;
}

const F1TrackVisualization: React.FC<TrackVisualizerProps> = ({ trackId = 'monza' }) => {
  const [hoveredSector, setHoveredSector] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrackData = async () => {
      try {
        setError(null);
        // Dynamically import the track data based on trackId
        const data = await import(`../../../track_data_${trackId}.json`);
        setTrackData(data.default || data);
      } catch (err) {
        console.error(`Failed to load track data for ${trackId}:`, err);
        setError(`Track data not available for ${trackId}`);
      }
    };

    loadTrackData();
  }, [trackId]);

  if (error) {
    return (
      <div className="w-full p-8 bg-gray-800/50 rounded-lg border-2 border-gray-700 text-center">
        <p className="text-gray-400 text-sm">{error}</p>
        <p className="text-gray-500 text-xs mt-2">Run: python pathGen.py --gp {trackId} --session Q</p>
      </div>
    );
  }

  if (!trackData) {
    return (
      <div className="w-full p-8 bg-gray-800/50 rounded-lg border-2 border-gray-700 text-center">
        <p className="text-gray-400 text-sm">Loading track data...</p>
      </div>
    );
  }

  // Sector colors: Purple, Green, Yellow
  const sectorColors = {
    1: '#a855f7', // Purple
    2: '#22c55e', // Green
    3: '#eab308'  // Yellow
  };

  const getSectorColor = (sector: number): string => {
    return sectorColors[sector as keyof typeof sectorColors] || '#6b7280';
  };

  const getTrackTypeColor = (index: number): string => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
    return colors[index] || '#6b7280';
  };

  const getOvertakingColor = (difficulty: number): string => {
    const colors: Record<number, string> = {
      1: '#22c55e',
      2: '#84cc16',
      3: '#eab308',
      4: '#f97316',
      5: '#ef4444'
    };
    return colors[difficulty] || '#6b7280';
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>): void => {
    const svg = e.currentTarget.closest('svg');
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">{trackData.fullName}</h1>
          <p className="text-gray-400 text-sm">Hover over each sector for detailed characteristics</p>
        </div>

        <div className="relative">
          <svg
            viewBox="0 0 500 400"
            className="w-full h-auto bg-gray-800/50 rounded-lg border-2 border-gray-700"
          >
            {/* Track background (wider for visual depth) */}
            <path
              d={trackData.sector_paths.map(s => s.path).join(' ')}
              fill="none"
              stroke="#374151"
              strokeWidth="28"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Main track surface - base layer */}
            <path
              d={trackData.sector_paths.map(s => s.path).join(' ')}
              fill="none"
              stroke="#1f2937"
              strokeWidth="20"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Sector-colored paths */}
            {trackData.sector_paths.map((sectorPath) => (
              <g key={sectorPath.sector}>
                {/* Colored sector path */}
                <path
                  d={sectorPath.path}
                  fill="none"
                  stroke={getSectorColor(sectorPath.sector)}
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={hoveredSector === null || hoveredSector === sectorPath.sector ? 0.7 : 0.2}
                  onMouseEnter={() => setHoveredSector(sectorPath.sector)}
                  onMouseLeave={() => setHoveredSector(null)}
                  onMouseMove={handleMouseMove}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                />
                
                {/* Hover highlight */}
                {hoveredSector === sectorPath.sector && (
                  <path
                    d={sectorPath.path}
                    fill="none"
                    stroke={getSectorColor(sectorPath.sector)}
                    strokeWidth="22"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.9"
                    style={{ pointerEvents: 'none' }}
                  />
                )}
              </g>
            ))}

            {/* Center line */}
            <path
              d={trackData.sector_paths.map(s => s.path).join(' ')}
              fill="none"
              stroke="#4b5563"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6,6"
              style={{ pointerEvents: 'none' }}
            />
          </svg>

          {/* Info Card on Sector Hover */}
          {hoveredSector !== null && (
            <div
              className="absolute bg-gray-900/98 border-2 rounded-lg p-4 shadow-2xl pointer-events-none z-10"
              style={{
                left: `${mousePosition.x + 20}px`,
                top: `${mousePosition.y - 180}px`,
                minWidth: '320px',
                maxWidth: '380px',
                borderColor: getSectorColor(hoveredSector)
              }}
            >
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getSectorColor(hoveredSector) }}
                />
                <h3 className="text-white font-bold text-lg">
                  Sector {hoveredSector}
                </h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-400 font-medium">Track:</span>
                  <span className="text-white font-bold">{trackData.name}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-400 font-medium">Track Type:</span>
                  <span 
                    className="px-3 py-1 rounded-full font-bold text-sm"
                    style={{ 
                      backgroundColor: `${getTrackTypeColor(trackData.characteristics.track_type_index)}20`,
                      color: getTrackTypeColor(trackData.characteristics.track_type_index)
                    }}
                  >
                    {trackData.characteristics.track_type_name}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-400 font-medium">Total Corners:</span>
                  <span className="text-white font-bold text-lg">{trackData.characteristics.corners}</span>
                </div>

                <div className="py-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 font-medium">Straight Fraction:</span>
                    <span className="text-white font-bold">
                      {(trackData.characteristics.straight_fraction * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300"
                      style={{ 
                        width: `${trackData.characteristics.straight_fraction * 100}%`,
                        backgroundColor: getSectorColor(hoveredSector)
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-400 font-medium">Overtaking:</span>
                  <span 
                    className="px-3 py-1 rounded-full font-bold text-sm"
                    style={{ 
                      backgroundColor: `${getOvertakingColor(trackData.characteristics.overtaking_difficulty)}20`,
                      color: getOvertakingColor(trackData.characteristics.overtaking_difficulty)
                    }}
                  >
                    {trackData.characteristics.overtaking_difficulty}/5
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-400">
                    <span 
                      className="font-bold"
                      style={{ color: getSectorColor(hoveredSector) }}
                    >
                      Sector {hoveredSector}
                    </span> performance tracking enabled for lap analysis
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sector Legend */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[1, 2, 3].map((sector) => (
            <div 
              key={sector}
              className="bg-gray-800/50 rounded-lg border-2 p-4 transition-all cursor-pointer"
              style={{
                borderColor: hoveredSector === sector ? getSectorColor(sector) : '#374151'
              }}
              onMouseEnter={() => setHoveredSector(sector)}
              onMouseLeave={() => setHoveredSector(null)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getSectorColor(sector) }}
                />
                <p className="text-white font-bold">Sector {sector}</p>
              </div>
              <p className="text-gray-400 text-xs">
                {sector === 1 && 'Opening section'}
                {sector === 2 && 'Middle section'}
                {sector === 3 && 'Final section'}
              </p>
            </div>
          ))}
        </div>

        {/* Track Stats Summary */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
            <p className="text-gray-400 text-xs mb-1">Track Type</p>
            <p className="text-white font-bold text-lg">{trackData.characteristics.track_type_name}</p>
            <p className="text-gray-500 text-xs mt-1">Index: {trackData.characteristics.track_type_index}/4</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
            <p className="text-gray-400 text-xs mb-1">Total Corners</p>
            <p className="text-white font-bold text-lg">{trackData.characteristics.corners}</p>
            <p className="text-gray-500 text-xs mt-1">Technical complexity</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
            <p className="text-gray-400 text-xs mb-1">Straight Fraction</p>
            <p className="text-white font-bold text-lg">
              {(trackData.characteristics.straight_fraction * 100).toFixed(1)}%
            </p>
            <p className="text-gray-500 text-xs mt-1">Power sensitivity</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
            <p className="text-gray-400 text-xs mb-1">Overtaking</p>
            <p className="text-white font-bold text-lg">{trackData.characteristics.overtaking_difficulty}/5</p>
            <p className="text-gray-500 text-xs mt-1">
              {trackData.characteristics.overtaking_difficulty <= 2 ? 'Easy' : 
               trackData.characteristics.overtaking_difficulty === 3 ? 'Moderate' : 'Difficult'}
            </p>
          </div>
        </div>

        {/* Enhanced Legend */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-white font-semibold mb-3 text-sm">Sector-Based Performance Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="flex gap-3">
              <div className="w-3 h-3 rounded-full mt-0.5" style={{ backgroundColor: sectorColors[1] }} />
              <div>
                <div className="text-purple-400 font-bold mb-1">Sector 1 (Purple)</div>
                <div className="text-gray-300">Opening performance and race start positioning</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-3 h-3 rounded-full mt-0.5" style={{ backgroundColor: sectorColors[2] }} />
              <div>
                <div className="text-green-400 font-bold mb-1">Sector 2 (Green)</div>
                <div className="text-gray-300">Mid-track consistency and tire management</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-3 h-3 rounded-full mt-0.5" style={{ backgroundColor: sectorColors[3] }} />
              <div>
                <div className="text-yellow-400 font-bold mb-1">Sector 3 (Yellow)</div>
                <div className="text-gray-300">Final push and overtaking opportunities</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TrackVisualizer = F1TrackVisualization;
export default F1TrackVisualization;