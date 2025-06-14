import React from 'react';
import { Candle } from '@/lib/types';

interface VolumeSpikesProps {
  candles: Candle[];
  currentPrice: number;
  className?: string;
}

export const VolumeSpikes: React.FC<VolumeSpikesProps> = ({
  candles,
  currentPrice,
  className = '',
}) => {
  if (!candles || candles.length < 21) {
    return null;
  }

  // Calculate 20-period volume average
  const volumes = candles.slice(-21).map(c => c.volume);
  const volumeMA = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  
  // Check if current volume is a spike (>150% of average)
  const currentVolume = candles[candles.length - 1].volume;
  const isSpike = currentVolume > volumeMA * 1.5;
  
  // Calculate volume trend (simple comparison of last 5 vs previous 5 periods)
  const recentVolumes = volumes.slice(-5);
  const previousVolumes = volumes.slice(-10, -5);
  const recentAvg = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
  const prevAvg = previousVolumes.length > 0 
    ? previousVolumes.reduce((a, b) => a + b, 0) / previousVolumes.length 
    : recentAvg;
  const volumeTrend = recentAvg > prevAvg * 1.1 ? 'up' : recentAvg < prevAvg * 0.9 ? 'down' : 'neutral';

  // Calculate volume-based confidence boost (0-0.2 range)
  const volumeConfidenceBoost = Math.min((currentVolume / (volumeMA * 2)) * 0.2, 0.2);

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {isSpike && (
        <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
          HIGH VOLUME
        </div>
      )}
      
      <div className="flex items-center space-x-1">
        <span className="text-xs text-gray-600">Volume:</span>
        <span className="text-xs font-medium">
          {(currentVolume / 1000).toFixed(1)}K
        </span>
        {volumeTrend === 'up' ? (
          <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        ) : volumeTrend === 'down' ? (
          <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : null}
      </div>
      
      <div className="text-xs text-gray-500">
        <span>Avg: </span>
        <span className="font-medium">{(volumeMA / 1000).toFixed(1)}K</span>
      </div>
    </div>
  );
};
