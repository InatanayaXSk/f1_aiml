import React, { useState, useEffect } from 'react';
import { RotateCw } from 'lucide-react';

import type { TrackFeatures } from '../types';

interface SectorDetail {
  type: string;
  impact_factor: string;
  description: string;
}

interface SectorPath {
  sector: number;
  path: string;
}

interface TrackZone {
  type: 'DRS' | 'Aero' | 'Braking';
  start_idx: number;
  end_idx: number;
}

interface TrackCharacteristics {
  track_type_index: number;
  track_type_name: string;
  corners: number;
  straight_fraction: number;
  overtaking_difficulty: number;
  boost_rating?: number;
  regulation_delta?: number;
  sector_details?: Record<number, SectorDetail>;
}

interface TrackData {
  name: string;
  fullName: string;
  characteristics: TrackCharacteristics;
  svg_path: string;
  sector_paths: SectorPath[];
  coordinates: {
    x: number[];
    y: number[];
  };
  zones?: TrackZone[];
}

interface TrackVisualizerProps {
  trackId?: string;
  features?: TrackFeatures;
}

const REGULATION_DATA: Record<string, any> = {
  monza: {
    boost_rating: 0.95,
    regulation_delta: -0.15,
    sector_details: {
      1: { type: "High-Speed", impact_factor: "Power", description: "Features the Variante del Rettifilo. Hybrid power deployment is critical for the long run to Curva Grande." },
      2: { type: "Technical", impact_factor: "Aero", description: "Includes the Lesmos and Variante della Roggia. Requires precise Z-mode active aero management." },
      3: { type: "High-Speed", impact_factor: "Power", description: "Features the iconic Parabolica (Curva Alboreto). 2026 boost mode provides a significant exit speed advantage." }
    }
  },
  monaco: {
    boost_rating: 0.25,
    regulation_delta: 0.02,
    sector_details: {
      1: { type: "Technical", impact_factor: "Aero", description: "The climb through Beau Rivage to Casino Square. Precision steering and mechanical grip are paramount." },
      2: { type: "Very Technical", impact_factor: "Grip", description: "Includes the Loews Hairpin and the Tunnel. Battery deployment is highly limited by constant direction changes." },
      3: { type: "Technical", impact_factor: "Aero", description: "The Portier and Swimming Pool complex. Requires maximum downforce (Active Aero Z-mode)." }
    }
  },
  silverstone: {
    boost_rating: 0.78,
    regulation_delta: -0.10,
    sector_details: {
      1: { type: "High-Speed", impact_factor: "Power", description: "Abbey and Wellington Straight. 2026 boost mode provides a massive slipstream advantage here." },
      2: { type: "High-Speed", impact_factor: "Aero", description: "The Maggots-Becketts-Chapel sequence. Active Aero (X-mode) will minimize drag on the Hangar Straight." },
      3: { type: "Balanced", impact_factor: "Mixed", description: "Stowe to the finish line. Requires a balance between top speed and stability in the technical Vale section." }
    }
  },
  spa: {
    boost_rating: 0.88,
    regulation_delta: -0.12,
    sector_details: {
      1: { type: "High-Speed", impact_factor: "Power", description: "Includes Eau Rouge and the Kemmel Straight. Maximum hybrid boost deployment is essential for overtaking into Les Combes." },
      2: { type: "Technical", impact_factor: "Aero", description: "The technical mid-section from Bruxelles to Stavelot. Active Aero (Z-mode) provides critical grip in the high-speed Pouhon corner." },
      3: { type: "High-Speed", impact_factor: "Power", description: "Blanchimont to the Bus Stop chicane. Strategic 2026 boost management ensures a strong defense into the final braking zone." }
    }
  }
};

const getTrackZones = (trackId: string, totalPoints: number): TrackZone[] => {
  switch (trackId) {
    case 'monza':
      return [
        { type: "DRS", start_idx: Math.floor(totalPoints * 0.05), end_idx: Math.floor(totalPoints * 0.20) },
        { type: "Aero", start_idx: Math.floor(totalPoints * 0.05), end_idx: Math.floor(totalPoints * 0.20) },
        { type: "DRS", start_idx: Math.floor(totalPoints * 0.45), end_idx: Math.floor(totalPoints * 0.60) },
        { type: "Aero", start_idx: Math.floor(totalPoints * 0.45), end_idx: Math.floor(totalPoints * 0.60) }
      ];
    case 'monaco':
      return [
        { type: "DRS", start_idx: Math.floor(totalPoints * 0.85), end_idx: Math.floor(totalPoints * 0.98) }
      ];
    case 'silverstone':
      return [
        { type: "DRS", start_idx: Math.floor(totalPoints * 0.07), end_idx: Math.floor(totalPoints * 0.23) },
        { type: "Aero", start_idx: Math.floor(totalPoints * 0.07), end_idx: Math.floor(totalPoints * 0.23) },
        { type: "DRS", start_idx: Math.floor(totalPoints * 0.54), end_idx: Math.floor(totalPoints * 0.69) },
        { type: "Aero", start_idx: Math.floor(totalPoints * 0.54), end_idx: Math.floor(totalPoints * 0.69) }
      ];
    case 'spa':
      return [
        { type: "DRS", start_idx: Math.floor(totalPoints * 0.05), end_idx: Math.floor(totalPoints * 0.15) },
        { type: "Aero", start_idx: Math.floor(totalPoints * 0.05), end_idx: Math.floor(totalPoints * 0.15) }
      ];
    default:
      return [];
  }
};

const SIMULATION_MAPPING: Record<string, string> = {
  // Legacy mappings
  monza: "2022_R16",
  monaco: "2022_R08",
  silverstone: "2022_R12",
  spa: "2022_R13",
  bahrain: "2022_R04",

  // Full 2025 Season Mappings
  'australia': "2022_R01",
  'china': "2022_R02",
  'japan': "2022_R03",
  'saudi-arabia': "2022_R05",
  'miami': "2022_R06",
  'emilia-romagna': "2022_R07",
  'spain': "2022_R09",
  'canada': "2022_R10",
  'austria': "2022_R11",
  'great-britain': "2022_R12",
  'belgium': "2022_R13",
  'hungary': "2022_R14",
  'netherlands': "2022_R15",
  'italy': "2022_R16",
  'azerbaijan': "2022_R17",
  'singapore': "2022_R18",
  'united-states': "2022_R19",
  'mexico': "2022_R20",
  'brazil': "2022_R21",
  'las-vegas': "2022_R22",
  'qatar': "2022_R23",
  'abu-dhabi': "2022_R24"
};

const SECTOR_ANALYSIS_MODULES = import.meta.glob(
  '../../../outputs/json/track_sector_analysis_*.json'
);

const AVAILABLE_SIM_KEYS = new Set(
  Object.keys(SECTOR_ANALYSIS_MODULES)
    .map((path) => path.match(/track_sector_analysis_(.+)\.json$/)?.[1])
    .filter(Boolean) as string[]
);

const findAvailableSimKey = async (trackId: string, preferredKey?: string): Promise<string> => {
  if (preferredKey && AVAILABLE_SIM_KEYS.has(preferredKey)) {
    return preferredKey;
  }

  const fallbackKey = SIMULATION_MAPPING[trackId];
  if (fallbackKey && AVAILABLE_SIM_KEYS.has(fallbackKey)) {
    return fallbackKey;
  }

  const firstAvailable = AVAILABLE_SIM_KEYS.values().next().value as string | undefined;
  return preferredKey || firstAvailable || '2022_R01';
};

const F1TrackVisualization: React.FC<TrackVisualizerProps> = ({ trackId = 'monza', features }) => {
  const [hoveredSector, setHoveredSector] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [simData, setSimData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    const loadTrackData = async () => {
      try {
        setError(null);
        // Load base track data
        const data = await import(`../../../track_data_${trackId}.json`);
        const baseData = data.default || data;

        // Load simulation data with fallback year detection
        const preferredKey = SIMULATION_MAPPING[trackId];
        const simKey = await findAvailableSimKey(trackId, preferredKey);
        
        let overtakingInfo = null;
        let sectorAnalysis = null;

        try {
          const overtakingModule = await import(`../../../outputs/json/overtaking_analysis.json`);
          const overtakingData = overtakingModule.default || overtakingModule;
          overtakingInfo = overtakingData.circuits?.find((c: any) => c.circuit_key === simKey);

          // Try to load specific sector analysis with found key
          try {
            const analysisData = await import(`../../../outputs/json/track_sector_analysis_${simKey}.json`);
            sectorAnalysis = analysisData.default || analysisData;
            console.log(`✅ Loaded sector analysis for ${trackId} using ${simKey}`);
          } catch (e) {
            console.warn(`No sector analysis found for ${simKey}`);
          }
        } catch (e) {
          console.warn("Could not load simulation JSONs");
        }

        // Augment data with frontend constants (fallback/simulation)
        const regData = REGULATION_DATA[trackId] || {};
        const totalPoints = baseData.coordinates?.x?.length || 0;

        const augmentedData: TrackData = {
          ...baseData,
          characteristics: {
            ...baseData.characteristics,
            // Prioritize JSON fields if present, fallback to constants
            boost_rating: baseData.characteristics.boost_rating ?? regData.boost_rating,
            regulation_delta: baseData.characteristics.regulation_delta ?? regData.regulation_delta,
            sector_details: baseData.characteristics.sector_details ?? regData.sector_details,
          },
          zones: baseData.zones ?? getTrackZones(trackId, totalPoints)
        };

        setTrackData(augmentedData);
        setSimData({
          overtaking: overtakingInfo,
          analysis: sectorAnalysis
        });
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
  const sectorColors: Record<number, string> = {
    1: '#a855f7', // Purple
    2: '#22c55e', // Green
    3: '#eab308'  // Yellow
  };

  const getSectorColor = (sector: number): string => {
    return sectorColors[sector] || '#6b7280';
  };

  const getTrackTypeColor = (index: number): string => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
    return colors[index] || '#6b7280';
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>): void => {
    const svg = e.currentTarget.closest('svg');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
  };

  const renderZonePath = (start: number, end: number): string => {
    if (!trackData || !trackData.coordinates) return '';
    const { x, y } = trackData.coordinates;
    const startIdx = Math.max(0, start);
    const endIdx = Math.min(x.length - 1, end);

    if (startIdx >= endIdx) return '';

    let d = `M ${x[startIdx].toFixed(2)} ${y[startIdx].toFixed(2)}`;
    const rangeStep = Math.max(1, Math.floor((endIdx - startIdx) / 100));
    for (let i = startIdx + rangeStep; i <= endIdx; i += rangeStep) {
      d += ` L ${x[i].toFixed(2)} ${y[i].toFixed(2)}`;
    }
    if ((endIdx - startIdx) % rangeStep !== 0) {
      d += ` L ${x[endIdx].toFixed(2)} ${y[endIdx].toFixed(2)}`;
    }
    return d;
  };

  const getZoneColor = (type: string): string => {
    switch (type) {
      case 'DRS': return '#22c55e';
      case 'Aero': return '#3b82f6';
      case 'Braking': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">{trackData.fullName}</h1>
          <p className="text-gray-400 text-sm">Hover over each sector for detailed characteristics</p>
        </div>

        <div className="mb-6 flex justify-center">
          <button
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-full border border-gray-600 transition-all hover:scale-105 active:scale-95 shadow-lg group"
            title="Rotate 90° Clockwise"
          >
            <RotateCw className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            <span className="text-sm font-bold tracking-wide">Rotate Track View</span>
            <span className="ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-400 group-hover:text-blue-400 font-mono">
              {rotation}°
            </span>
          </button>
        </div>

        <div className="relative">
          <svg
            viewBox="0 0 500 400"
            className="w-full h-auto bg-gray-800/50 rounded-lg border-2 border-gray-700"
            style={{ transition: 'transform 0.3s ease-out' }}
          >
            <g transform={`rotate(${rotation} 250 200)`}>
              <path
                d={trackData.sector_paths.map(s => s.path).join(' ')}
                fill="none"
                stroke="#374151"
                strokeWidth="28"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={trackData.sector_paths.map(s => s.path).join(' ')}
                fill="none"
                stroke="#1f2937"
                strokeWidth="20"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {trackData.sector_paths.map((sectorPath) => (
                <g key={sectorPath.sector}>
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
              {trackData.zones?.map((zone, idx) => (
                <g key={`zone-${idx}`} className="group/zone shadow-xl">
                  <path
                    d={renderZonePath(zone.start_idx, zone.end_idx)}
                    fill="none"
                    stroke={getZoneColor(zone.type)}
                    strokeWidth="24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.15"
                    className="transition-opacity group-hover/zone:opacity-30"
                  />
                  <path
                    d={renderZonePath(zone.start_idx, zone.end_idx)}
                    fill="none"
                    stroke={getZoneColor(zone.type)}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={zone.type === 'Aero' ? '8,4' : 'none'}
                    className="transition-all"
                  />
                  <circle
                    cx={trackData.coordinates!.x[zone.start_idx]}
                    cy={trackData.coordinates!.y[zone.start_idx]}
                    r="4"
                    fill={getZoneColor(zone.type)}
                    className="animate-pulse"
                  />
                </g>
              ))}
            </g>
          </svg>

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
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getSectorColor(hoveredSector) }} />
                <h3 className="text-white font-bold text-lg">Sector {hoveredSector}</h3>
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

                {trackData.characteristics.boost_rating !== undefined && (
                  <div className="mt-2 pt-2 border-t border-gray-700/50">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-indigo-400 font-bold">2026 Boost Rating:</span>
                      <span className="text-white font-bold">{(trackData.characteristics.boost_rating * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t-2 border-dashed border-blue-500/30 bg-blue-500/5 p-3 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Simulation Insights</span>
                    <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[10px] uppercase">10k Runs</span>
                  </div>

                  {trackData.characteristics.sector_details?.[hoveredSector] && (
                    <>
                      <div className="flex justify-between items-center text-xs pb-1 mb-1 border-b border-blue-500/10">
                        <span className="text-gray-400">Sector Type:</span>
                        <span className="text-blue-300 font-bold">{trackData.characteristics.sector_details[hoveredSector].type}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pb-1 mb-1 border-b border-blue-500/10">
                        <span className="text-gray-400">Impact Factor:</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">{trackData.characteristics.sector_details[hoveredSector].impact_factor}</span>
                      </div>
                    </>
                  )}

                  {features && (
                    <div className="flex justify-between items-center text-xs pb-1 mb-1 border-b border-blue-500/10">
                      <span className="text-gray-400">Sector Difficulty:</span>
                      <span className="text-white font-bold">
                        {hoveredSector === 1 ? features.sector1Difficulty :
                          hoveredSector === 2 ? features.sector2Difficulty :
                            features.sector3Difficulty}/10
                      </span>
                    </div>
                  )}

                  {simData?.analysis?.sectors && simData.analysis.sectors[hoveredSector - 1] && (
                    <>
                      <div className="flex justify-between items-center text-xs pb-1 mb-1 border-b border-blue-500/10">
                        <span className="text-gray-400">Sector Time Delta:</span>
                        <span className={`font-bold ${
                          simData.analysis.sectors[hoveredSector - 1].delta_seconds < 0 
                            ? 'text-emerald-400' 
                            : 'text-red-400'
                        }`}>
                          {simData.analysis.sectors[hoveredSector - 1].delta_seconds > 0 ? '+' : ''}
                          {simData.analysis.sectors[hoveredSector - 1].delta_seconds.toFixed(2)}s
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs pb-1 mb-1 border-b border-blue-500/10">
                        <span className="text-gray-400">Position Spread:</span>
                        <span className="text-blue-300 font-bold">
                          ±{(simData.analysis.sectors[hoveredSector - 1].position_variance || 0).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">2026 Impact Level:</span>
                        <span className={`font-bold px-2 py-0.5 rounded ${
                          Math.abs(simData.analysis.sectors[hoveredSector - 1].delta_seconds) > 0.5 
                            ? 'bg-red-500/20 text-red-400' 
                            : Math.abs(simData.analysis.sectors[hoveredSector - 1].delta_seconds) > 0.2
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {Math.abs(simData.analysis.sectors[hoveredSector - 1].delta_seconds) > 0.5 
                            ? 'High' 
                            : Math.abs(simData.analysis.sectors[hoveredSector - 1].delta_seconds) > 0.2
                            ? 'Medium'
                            : 'Low'}
                        </span>
                      </div>
                    </>
                  )}

                  {simData?.analysis?.lap_summary && (
                    <div className="flex justify-between items-center text-xs mt-1 pt-1 border-t border-blue-500/10">
                      <span className="text-gray-400">Full Lap Delta:</span>
                      <span className={`${simData.analysis.lap_summary.delta_seconds < 0 ? 'text-emerald-400' : 'text-red-400'} font-bold`}>
                        {simData.analysis.lap_summary.delta_seconds > 0 ? '+' : ''}
                        {simData.analysis.lap_summary.delta_seconds.toFixed(3)}s
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-400">
                    <span className="font-bold" style={{ color: getSectorColor(hoveredSector) }}>Sector {hoveredSector}</span> - {trackData.characteristics.sector_details?.[hoveredSector]?.description || 'Performance tracking enabled'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {[1, 2, 3].map((sector) => (
            <div
              key={sector}
              className="bg-gray-800/50 rounded-lg border-2 p-4 transition-all cursor-pointer"
              style={{ borderColor: hoveredSector === sector ? getSectorColor(sector) : '#374151' }}
              onMouseEnter={() => setHoveredSector(sector)}
              onMouseLeave={() => setHoveredSector(null)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getSectorColor(sector) }} />
                <p className="text-white font-bold">Sector {sector}</p>
              </div>
              <p className="text-gray-400 text-xs text-center">{sector === 1 ? 'Opening' : sector === 2 ? 'Middle' : 'Final'} Section</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
            <p className="text-gray-400 text-xs mb-1">Track Type</p>
            <p className="text-white font-bold text-lg">{trackData.characteristics.track_type_name}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
            <p className="text-gray-400 text-xs mb-1">Total Corners</p>
            <p className="text-white font-bold text-lg">{trackData.characteristics.corners}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
            <p className="text-gray-400 text-xs mb-1">Straight Fraction</p>
            <p className="text-white font-bold text-lg">{(trackData.characteristics.straight_fraction * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
            <p className="text-gray-400 text-xs mb-1">Overtaking</p>
            <p className="text-white font-bold text-lg">{trackData.characteristics.overtaking_difficulty}/5</p>
          </div>
          {simData?.overtaking && (
            <div className="bg-gray-800/50 rounded-lg border-2 border-emerald-700 p-4">
              <p className="text-gray-400 text-xs mb-1">2026 Overtaking</p>
              <p className="text-emerald-400 font-bold text-lg">
                +{simData.overtaking.overtake_increase_pct.toFixed(1)}%
              </p>
            </div>
          )}
          {simData?.overtaking && (
            <div className="bg-gray-800/50 rounded-lg border border-blue-700 p-4">
              <p className="text-gray-400 text-xs mb-1">Current Overtakes</p>
              <p className="text-white font-bold text-lg">{simData.overtaking.current_avg_overtakes.toFixed(0)}</p>
            </div>
          )}
          {simData?.overtaking && (
            <div className="bg-gray-800/50 rounded-lg border border-green-700 p-4">
              <p className="text-gray-400 text-xs mb-1">2026 Overtakes</p>
              <p className="text-green-400 font-bold text-lg">{simData.overtaking['2026_avg_overtakes'].toFixed(0)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const TrackVisualizer = F1TrackVisualization;
export default F1TrackVisualization;