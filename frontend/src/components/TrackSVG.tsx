import { useState } from 'react';
import type { Track } from '../types';
import { MapPin } from 'lucide-react';

interface TrackSVGProps {
  track: Track;
  svg?: string | null;
}

export const TrackSVG = ({ track, svg }: TrackSVGProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    setShowTooltip(true);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  if (svg) {
    return (
      <div className="relative">
        <div
          className="w-full bg-gray-100 dark:bg-gray-900 rounded-lg p-4"
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        {showTooltip && (
          <div
            className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 pointer-events-none"
            style={{
              left: tooltipPosition.x + 10,
              top: tooltipPosition.y + 10,
            }}
          >
            <div className="space-y-1">
              <p className="font-semibold">{track.name}</p>
              <p>Sector 1 Difficulty: {track.features.sector1Difficulty.toFixed(1)}/10</p>
              <p>Sector 2 Difficulty: {track.features.sector2Difficulty.toFixed(1)}/10</p>
              <p>Sector 3 Difficulty: {track.features.sector3Difficulty.toFixed(1)}/10</p>
              <p>Degradation: {track.features.degradation.toFixed(1)}/10</p>
              <p>Risk Factor: {track.features.riskFactor.toFixed(1)}/10</p>
              <p>Overtaking: {track.features.overtakingOpportunities.toFixed(1)}/10</p>
              <p>Power Sensitivity: {track.features.powerSensitivity.toFixed(1)}/10</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="w-full bg-gray-100 dark:bg-gray-900 rounded-lg p-8 flex flex-col items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <MapPin className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        Track layout visualization
        <br />
        <span className="text-xs">{track.name}</span>
      </p>
      {showTooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y + 10,
          }}
        >
          <div className="space-y-1">
            <p className="font-semibold">{track.name}</p>
            <p>Sector 1 Difficulty: {track.features.sector1Difficulty.toFixed(1)}/10</p>
            <p>Sector 2 Difficulty: {track.features.sector2Difficulty.toFixed(1)}/10</p>
            <p>Sector 3 Difficulty: {track.features.sector3Difficulty.toFixed(1)}/10</p>
            <p>Degradation: {track.features.degradation.toFixed(1)}/10</p>
            <p>Risk Factor: {track.features.riskFactor.toFixed(1)}/10</p>
            <p>Overtaking: {track.features.overtakingOpportunities.toFixed(1)}/10</p>
            <p>Power Sensitivity: {track.features.powerSensitivity.toFixed(1)}/10</p>
          </div>
        </div>
      )}
    </div>
  );
};
