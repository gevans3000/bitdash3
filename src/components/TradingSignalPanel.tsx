'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { TradingSignal } from '@/lib/agents/types';

type SignalAction = TradingSignal['action'];

interface TradingSignalPanelProps {
  className?: string;
}

export function TradingSignalPanel({ className = '' }: TradingSignalPanelProps) {
  const { latestSignal, signalHistory } = useAppState();
  const [history, setHistory] = useState<TradingSignal[]>(signalHistory);

  useEffect(() => {
    if (latestSignal) {
      setHistory(prev => [latestSignal, ...prev].slice(0, 5));
    }
  }, [latestSignal]);

  const currentSignal = latestSignal || history[0];

  const getSignalColor = (action: SignalAction) => {
    switch (action) {
      case 'BUY': return 'bg-green-900/30 border-green-500/30 text-green-400';
      case 'SELL': return 'bg-red-900/30 border-red-500/30 text-red-400';
      case 'HOLD': return 'bg-yellow-900/30 border-yellow-500/30 text-yellow-400';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <h3 className="text-lg font-semibold text-white">Trading Signals</h3>
        </div>
        <div className="text-xs text-gray-400">
          {currentSignal ? new Date(currentSignal.timestamp).toLocaleTimeString() : 'No signal yet'}
        </div>
      </div>

      {/* Current Signal */}
      {currentSignal ? (
        <div className={`border rounded-lg p-4 ${getSignalColor(currentSignal.action)}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xl font-bold">{currentSignal.action}</span>
            <span className={`text-lg font-mono ${getConfidenceColor(currentSignal.confidence)}`}>
              {currentSignal.confidence}%
            </span>
          </div>
          <p className="text-sm">{currentSignal.reason}</p>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-800/30 border-gray-700/50 text-gray-400">
          <p className="text-center">Waiting for signal data...</p>
        </div>
      )}

      {/* Signal History */}
      {history.length > 1 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Recent Signals</h4>
          <div className="space-y-1">
            {history.slice(1, 4).map((signal, index) => (
              <div key={`${signal.timestamp}-${index}`} className="text-xs p-2 rounded bg-gray-800/30">
                <div className="flex justify-between">
                  <span className={`font-medium ${
                    signal.action === 'BUY' ? 'text-green-400' : 
                    signal.action === 'SELL' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {signal.action}
                  </span>
                  <span className={getConfidenceColor(signal.confidence)}>
                    {signal.confidence}%
                  </span>
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  {new Date(signal.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
