import React from 'react';
import { useSignals } from '../hooks/useSignals';
import { Candle } from '../lib/types';
import { formatSignal } from '../lib/signals/generator';

interface SignalsDisplayProps {
  candles?: Candle[];
  className?: string;
}

/**
 * Component to display trading signals based on technical analysis
 */
export default function SignalsDisplay({ candles, className = '' }: SignalsDisplayProps) {
  const { signals, topSignal, isLoading, lastUpdated, getSignalsByTimeframe } = useSignals({
    candles,
    autoRefresh: true,
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  // Get signals by timeframe
  const shortTermSignals = getSignalsByTimeframe('short_term');
  const mediumTermSignals = getSignalsByTimeframe('medium_term');

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // No candle data
  if (!candles || candles.length < 50) {
    return (
      <div className={`p-4 border border-gray-700 bg-black bg-opacity-50 rounded ${className}`}>
        <h3 className="text-lg font-bold mb-2">Trading Signals</h3>
        <p className="text-yellow-400">Not enough candle data for signal generation</p>
      </div>
    );
  }

  // Loading state
  if (isLoading && signals.length === 0) {
    return (
      <div className={`p-4 border border-gray-700 bg-black bg-opacity-50 rounded ${className}`}>
        <h3 className="text-lg font-bold mb-2">Trading Signals</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3 mb-2"></div>
        </div>
      </div>
    );
  }

  // No signals available
  if (signals.length === 0) {
    return (
      <div className={`p-4 border border-gray-700 bg-black bg-opacity-50 rounded ${className}`}>
        <h3 className="text-lg font-bold mb-2">Trading Signals</h3>
        <p className="text-gray-400">No signals available</p>
      </div>
    );
  }

  // Determine the overall signal color
  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'buy':
        return 'text-green-500';
      case 'sell':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`p-4 border border-gray-700 bg-black bg-opacity-50 rounded ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold">Trading Signals</h3>
        <div className="text-xs text-gray-500">
          {lastUpdated ? `Updated: ${formatTime(lastUpdated)}` : ''}
          {isLoading && <span className="ml-2">⟳</span>}
        </div>
      </div>

      {/* Top signal */}
      {topSignal && (
        <div className="mb-4 p-3 border border-gray-800 rounded bg-black bg-opacity-30">
          <div className="flex items-center">
            <div className={`text-xl font-bold ${getDirectionColor(topSignal.direction)}`}>
              {formatSignal(topSignal)}
            </div>
          </div>
          <div className="mt-2 text-sm">
            <h4 className="font-medium mb-1">Reasons:</h4>
            <ul className="list-disc list-inside pl-2">
              {topSignal.reasons.slice(0, 3).map((reason, index) => (
                <li key={index} className="text-gray-300">{reason}</li>
              ))}
              {topSignal.reasons.length > 3 && (
                <li className="text-gray-500">{topSignal.reasons.length - 3} more...</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Signal summaries by timeframe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Short-term signals */}
        <div className="border border-gray-800 rounded p-2">
          <h4 className="text-sm font-bold mb-1">Short-term</h4>
          {shortTermSignals.length > 0 ? (
            shortTermSignals.map((signal, idx) => (
              <div key={idx} className={`text-sm ${getDirectionColor(signal.direction)}`}>
                {formatSignal(signal)}
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No short-term signals</div>
          )}
        </div>

        {/* Medium-term signals */}
        <div className="border border-gray-800 rounded p-2">
          <h4 className="text-sm font-bold mb-1">Medium-term</h4>
          {mediumTermSignals.length > 0 ? (
            mediumTermSignals.map((signal, idx) => (
              <div key={idx} className={`text-sm ${getDirectionColor(signal.direction)}`}>
                {formatSignal(signal)}
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No medium-term signals</div>
          )}
        </div>
      </div>

      {/* Active indicator summary */}
      <div className="mt-3 pt-2 border-t border-gray-800">
        <h4 className="text-xs text-gray-400 uppercase mb-1">Active Indicators</h4>
        <div className="text-xs flex flex-wrap gap-1">
          {signals.flatMap(s => s.reasons)
            .filter((reason, index, self) => self.indexOf(reason) === index)
            .slice(0, 5)
            .map((indicator, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-800 rounded-full">
                {indicator.split(' (')[0]}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
