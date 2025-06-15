"use client";

import { useEffect, useState } from 'react';
import { Candle } from '@/lib/types';
import { orchestrator } from '@/lib/agents/Orchestrator';
import { AgentName } from '@/lib/agents/types';

export default function BasicCandleDisplay() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Subscribe to initial candles
    const unsubscribeInitial = orchestrator.register('INITIAL_CANDLES_5M', (message) => {
      setCandles(message.payload);
      setError(null);
      console.log('Received initial candles:', message.payload.length);
    });

    // Subscribe to live updates
    const unsubscribeLive = orchestrator.register('LIVE_CANDLE_UPDATE_5M', (message) => {
      setCandles(prev => {
        const newCandles = [...prev];
        const existingIndex = newCandles.findIndex(c => c.time === message.payload.time);
        
        if (existingIndex >= 0) {
          // Update existing candle
          newCandles[existingIndex] = message.payload;
        } else {
          // Add new candle (shouldn't happen for 5m candles)
          newCandles.push(message.payload);
        }
        
        // Keep only the last 10 candles
        return newCandles.slice(-10);
      });
    });

    // Subscribe to errors
    const unsubscribeError = orchestrator.register('DATA_ERROR', (message) => {
      setError(message.payload?.message || 'An error occurred');
      console.error('Data error:', message.payload);
    });

    // Request initial data
    orchestrator.send({
      from: 'BasicCandleDisplay' as AgentName,
      type: 'REQUEST_INITIAL_DATA',
      payload: {},
      timestamp: Date.now()
    });

    return () => {
      unsubscribeInitial();
      unsubscribeLive();
      unsubscribeError();
    };
  }, []);

  // Format candle for display
  const formatCandle = (candle: Candle) => {
    const date = new Date(candle.time);
    return {
      time: date.toLocaleTimeString(),
      open: candle.open.toFixed(2),
      high: candle.high.toFixed(2),
      low: candle.low.toFixed(2),
      close: candle.close.toFixed(2),
      volume: candle.volume.toFixed(4)
    };
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-red-800 font-medium">Data Error</h3>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (candles.length === 0) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-800">Loading candle data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-md">
      <h2 className="text-lg font-medium mb-3">Last 10 Candles (5m)</h2>
      <div className="overflow-x-auto">
        <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-200">
          {JSON.stringify(
            candles
              .slice(-10) // Last 10 candles
              .map(candle => formatCandle(candle)), 
            null, 2
          )}
        </pre>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {candles.length} total candles loaded. Showing last 10.
      </div>
    </div>
  );
}
