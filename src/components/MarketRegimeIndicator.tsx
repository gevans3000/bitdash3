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
  const getTrendDirection = () => {
    if (regime === 'ranging') return '↔️';
    return plusDI > minusDI ? '⬆️' : '⬇️';
  };

  return (
    <div className={`p-4 rounded-lg shadow-sm border ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Market Regime</h3>
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full ${getRegimeColor()}`}>
            {getRegimeDisplayName()}
          </span>
          <span className="text-sm">{getTrendDirection()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs text-gray-500">ADX</div>
          <div className="font-mono">{adx.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">+DI / -DI</div>
          <div className="font-mono">
            <span className={plusDI > minusDI ? 'font-bold' : ''}>
              {plusDI.toFixed(2)}
            </span>{' '}
            /{' '}
            <span className={minusDI > plusDI ? 'font-bold' : ''}>
              {minusDI.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Duration:</span>
          <span>{formatDurationString(regimeDuration)}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Status:</span>
          <span className="flex items-center">
            <span
              className={`inline-block w-2 h-2 rounded-full mr-1 ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {lastUpdate && (
          <div className="flex justify-between text-xs text-gray-500">
            <span>Updated:</span>
            <span>{new Date(lastUpdate).toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};
