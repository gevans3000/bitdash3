"use client";
import React, { useEffect, useState } from 'react';
import { orchestrator } from '@/lib/agents/Orchestrator';
import { Candle } from '@/lib/types';

export function SimpleCandleChart() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    console.log('SimpleCandleChart: Setting up message handlers');

    const handleInitial = (msg: any) => {
      console.log('SimpleCandleChart: Received INITIAL_CANDLES_5M', msg.payload?.length);
      if (Array.isArray(msg.payload)) {
        setCandles(msg.payload);
        setIsConnected(true);
        setLastUpdate(new Date());
        setError(null);
      }
    };

    const handleUpdate = (msg: any) => {
      console.log('SimpleCandleChart: Received CANDLE_UPDATE', msg.payload);
      if (!msg.payload) return;
      
      setCandles(prev => {
        const updated = [...prev];
        const existingIndex = updated.findIndex(c => c.time === msg.payload.time);
        
        if (existingIndex >= 0) {
          updated[existingIndex] = msg.payload;
        } else {
          updated.push(msg.payload);
          updated.sort((a, b) => a.time - b.time);
        }
        
        return updated.slice(-100); // Keep last 100 candles
      });
      
      setLastUpdate(new Date());
    };

    const handleError = (msg: any) => {
      console.error('SimpleCandleChart: Error:', msg.payload);
      setError(String(msg.payload));
      setIsConnected(false);
    };

    // Register message handlers
    const unsubs = [
      orchestrator.register('INITIAL_CANDLES_5M', handleInitial),
      orchestrator.register('LIVE_CANDLE_UPDATE_5M', handleUpdate),
      orchestrator.register('DATA_ERROR', handleError)
    ];

    // Request initial data
    console.log('SimpleCandleChart: Requesting initial data...');
    orchestrator.send({
      from: 'SimpleCandleChart',
      type: 'REQUEST_INITIAL_DATA',
      payload: { limit: 100 },
      timestamp: Date.now(),
    });

    // Cleanup
    return () => {
      console.log('SimpleCandleChart: Cleaning up...');
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <p className="font-bold">Error loading chart data:</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">5-Minute BTC/USDT</h2>
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium mb-2">Last 10 Candles (Raw Data)</h3>
        <div className="overflow-auto max-h-64">
          <pre className="text-xs bg-gray-50 p-2 rounded">
            {JSON.stringify(candles.slice(-10), null, 2)}
          </pre>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Showing {Math.min(candles.length, 10)} of {candles.length} candles
        </div>
      </div>
    </div>
  );
}
