import React from 'react';
import { useMarketData } from '@/hooks/useMarketData';
import { formatDistanceToNow, format } from 'date-fns';
import { MarketRegime } from '@/lib/market/regime-detector';

interface MarketRegimeIndicatorProps {
  symbol?: string;
  interval?: string;
  className?: string;
  showDetails?: boolean;
}

export const MarketRegimeIndicator: React.FC<MarketRegimeIndicatorProps> = ({
  symbol = 'BTCUSDT',
  interval = '5m',
  className = '',
  showDetails = true,
}) => {
  const {
    regime = 'ranging',
    adx = 0,
    plusDI = 0,
    minusDI = 0,
    rsi = null,
    volumeRatio = 1,
    emaSlope = 0,
    confidence = 0,
    regimeDuration = 0,
    isConnected = false,
    lastUpdate = null,
  } = useMarketData({ symbol, interval });

  // Format the regime display name
  const getRegimeDisplayName = (regimeType: MarketRegime) => {
    switch (regimeType) {
      case 'strong-trend-up':
        return 'Strong Uptrend';
      case 'strong-trend-down':
        return 'Strong Downtrend';
      case 'weak-trend-up':
        return 'Weak Uptrend';
      case 'weak-trend-down':
        return 'Weak Downtrend';
      case 'ranging':
        return 'Ranging';
      default:
        return 'Analyzing...';
    }
  };

  // Get color based on regime
  const getRegimeColor = (regimeType: MarketRegime) => {
    switch (regimeType) {
      case 'strong-trend-up':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'strong-trend-down':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'weak-trend-up':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'weak-trend-down':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'ranging':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get trend direction indicator
  const getTrendDirection = (regimeType: MarketRegime) => {
    if (regimeType === 'ranging') return '↔️';
    return regimeType.endsWith('up') ? '⬆️' : '⬇️';
  };

  // Format the duration
  const formatDurationString = (ms: number) => {
    try {
      return formatDistanceToNow(Date.now() - ms, { addSuffix: false });
    } catch (e) {
      return '--';
    }
  };
  
  // Get confidence color
  const getConfidenceColor = (level: number) => {
    if (level > 75) return 'text-green-600';
    if (level > 50) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Format number with sign
  const formatWithSign = (num: number) => {
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
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
    </div>
  );
};

export default MarketRegimeIndicator;
