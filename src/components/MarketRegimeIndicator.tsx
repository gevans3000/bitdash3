import React from 'react';
import { useMarketData } from '@/hooks/useMarketData';
import { formatDuration } from 'date-fns';

interface MarketRegimeIndicatorProps {
  symbol?: string;
  interval?: string;
  className?: string;
}

export const MarketRegimeIndicator: React.FC<MarketRegimeIndicatorProps> = ({
  symbol = 'BTCUSDT',
  interval = '5m',
  className = '',
}) => {
  const {
    regime,
    adx,
    plusDI,
    minusDI,
    regimeDuration,
    isConnected,
    lastUpdate,
  } = useMarketData({ symbol, interval });

  // Format the regime display name
  const getRegimeDisplayName = () => {
    switch (regime) {
      case 'strong-trend':
        return 'Strong Trend';
      case 'weak-trend':
        return 'Weak Trend';
      case 'ranging':
        return 'Ranging';
      default:
        return 'Loading...';
    }
  };

  // Get color based on regime
  const getRegimeColor = () => {
    switch (regime) {
      case 'strong-trend':
        return plusDI > minusDI ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
      case 'weak-trend':
        return plusDI > minusDI ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600';
      case 'ranging':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format the duration
  const formatDurationString = (ms: number) => {
    try {
      return formatDuration(
        {
          hours: Math.floor(ms / (1000 * 60 * 60)),
          minutes: Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)),
        },
        { zero: false, delimiter: ' ' }
      );
    } catch (e) {
      return '--';
    }
  };

  // Get trend direction indicator
  const getTrendDirection = (regimeType: MarketRegime) => {
    if (regimeType === 'ranging') return '↔️';
    return regimeType.endsWith('up') ? '⬆️' : '⬇️';
  };

  return (
    <div className={`p-4 rounded-lg border ${getRegimeColor(regime)} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Market Regime</h3>
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full border ${getRegimeColor(regime)}`}>
            {getRegimeDisplayName(regime)}
          </span>
          <span className="text-sm">{getTrendDirection(regime)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
        <div className="bg-white bg-opacity-50 p-2 rounded">
          <div className="text-xs text-gray-600">ADX</div>
          <div className="font-mono">{adx?.toFixed(2) || '--'}</div>
        </div>
        <div className="bg-white bg-opacity-50 p-2 rounded">
          <div className="text-xs text-gray-600">+DI / -DI</div>
          <div className="font-mono">
            <span className={plusDI > minusDI ? 'font-bold' : ''}>
              {plusDI?.toFixed(2) || '--'}
            </span>{' '}
            /{' '}
            <span className={minusDI > plusDI ? 'font-bold' : ''}>
              {minusDI?.toFixed(2) || '--'}
            </span>
          </div>
        </div>
        <div className="bg-white bg-opacity-50 p-2 rounded">
          <div className="text-xs text-gray-600">Confidence</div>
          <div className={`font-mono ${getConfidenceColor(confidence || 0)}`}>
            {confidence ? `${confidence}%` : '--'}
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">RSI(14):</span>
            <span className="font-mono">{rsi?.toFixed(2) || '--'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Volume:</span>
            <span className="font-mono">
              {volumeRatio ? `${(volumeRatio * 100).toFixed(0)}%` : '--'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">EMA Slope:</span>
            <span className={`font-mono ${emaSlope ? (emaSlope > 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
              {emaSlope !== undefined ? formatWithSign(emaSlope) : '--'}
            </span>
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-opacity-50 border-gray-300 text-xs text-gray-700">
        <div className="flex justify-between mb-1">
          <span>Duration:</span>
          <span>{regimeDuration ? formatDurationString(regimeDuration) : '--'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Status:</span>
          <span className="flex items-center">
            <span
              className={`inline-block w-2 h-2 rounded-full mr-1 ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            {isConnected ? 'Live' : 'Disconnected'}
            {lastUpdate && (
              <span className="ml-2 text-gray-500">
                {format(new Date(lastUpdate), 'HH:mm:ss')}
              </span>
            )}
          </span>
        </div>
      </div>
  );
};
