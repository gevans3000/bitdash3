'use client';

import React, { useState, useEffect } from 'react';

type SignalAction = 'BUY' | 'SELL' | 'HOLD';

interface Signal {
  action: SignalAction;
  confidence: number;
  reason: string;
  timestamp: number;
}

interface TradingSignalPanelProps {
  className?: string;
}

// Static mock data for testing
const mockSignals: Signal[] = [
  { action: 'BUY', confidence: 78, reason: 'Strong uptrend with high volume', timestamp: Date.now() - 300000 },
  { action: 'HOLD', confidence: 65, reason: 'Consolidation phase', timestamp: Date.now() - 180000 },
  { action: 'SELL', confidence: 82, reason: 'Bearish divergence detected', timestamp: Date.now() - 60000 },
];

export function TradingSignalPanel({ className = '' }: TradingSignalPanelProps) {
  const [currentSignal, setCurrentSignal] = useState<Signal>(mockSignals[0]);
  const [signalHistory, setSignalHistory] = useState<Signal[]>(mockSignals);

  // Simple rotation through mock signals every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newSignal: Signal = {
        action: ['BUY', 'SELL', 'HOLD'][Math.floor(Math.random() * 3)] as SignalAction,
        confidence: 60 + Math.floor(Math.random() * 30),
        reason: [
          'Strong momentum detected',
          'RSI oversold condition',
          'Support level holding',
          'Volume confirmation',
          'Trend reversal signal'
        ][Math.floor(Math.random() * 5)],
        timestamp: Date.now()
      };
      
      setCurrentSignal(newSignal);
      setSignalHistory(prev => [newSignal, ...prev.slice(0, 4)]);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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
          {new Date(currentSignal.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* Current Signal */}
      <div className={`border rounded-lg p-4 ${getSignalColor(currentSignal.action)}`}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xl font-bold">{currentSignal.action}</span>
          <span className={`text-lg font-mono ${getConfidenceColor(currentSignal.confidence)}`}>
            {currentSignal.confidence}%
          </span>
        </div>
        <p className="text-sm">{currentSignal.reason}</p>
      </div>

      {/* Signal History */}
      {signalHistory.length > 1 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Recent Signals</h4>
          <div className="space-y-1">
            {signalHistory.slice(1, 4).map((signal, index) => (
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
