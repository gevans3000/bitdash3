'use client';

import { useEffect, useState } from 'react';
import { orchestrator } from '@/lib/agents/Orchestrator';
import { AgentMessage } from '@/lib/agents/types';
import { Candle } from '@/lib/types';

export default function TestDataCollector() {
  const [messages, setMessages] = useState<Array<{type: string, payload: any, timestamp: number}>>([]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to orchestrator messages
    const unsubscribe = orchestrator.subscribe((message: AgentMessage<any>) => {
      console.log('TestDataCollector: Received message:', message);
      
      setMessages(prev => [
        {
          type: message.type,
          payload: message.payload,
          timestamp: message.timestamp
        },
        ...prev.slice(0, 99) // Keep last 100 messages
      ]);

      // Handle different message types
      switch (message.type) {
        case 'INITIAL_CANDLES_5M':
          setCandles(prev => [...(message.payload || [])].sort((a, b) => a.time - b.time));
          break;
          
        case 'LIVE_CANDLE_UPDATE_5M':
        case 'NEW_CLOSED_CANDLE_5M':
          setCandles(prev => {
            const newCandles = [...prev];
            const existingIndex = newCandles.findIndex(c => c.time === message.payload.time);
            
            if (existingIndex >= 0) {
              newCandles[existingIndex] = message.payload;
            } else {
              newCandles.push(message.payload);
              newCandles.sort((a, b) => a.time - b.time);
            }
            
            return newCandles;
          });
          break;
          
        case 'WEBSOCKET_STATUS':
          setIsConnected(message.payload.connected);
          break;
          
        case 'DATA_ERROR':
          setError(message.payload.message || 'Unknown error');
          break;
          
        case 'DATA_READY':
          console.log('DataCollector is ready with', message.payload.candleCount, 'candles');
          break;
      }
    });

    // Clean up subscription
    return () => {
      unsubscribe();
    };
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">DataCollector Test</h1>
      
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Status</h2>
        <div className="flex items-center mb-2">
          <div 
            className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        {error && (
          <div className="text-red-600 p-2 bg-red-100 rounded mt-2">
            Error: {error}
          </div>
        )}
        <div className="text-sm text-gray-600 mt-2">
          {candles.length > 0 && (
            <p>Latest candle: {formatTime(candles[candles.length - 1].time)}</p>
          )}
          <p>Total candles: {candles.length}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Latest Messages</h2>
          <div className="border rounded overflow-auto h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {messages.map((msg, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(msg.timestamp)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {msg.type}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {msg.type.includes('CANDLE') ? (
                        <span>
                          {new Date(msg.payload.time).toLocaleTimeString()}: 
                          O:{msg.payload.open.toFixed(2)} H:{msg.payload.high.toFixed(2)} 
                          L:{msg.payload.low.toFixed(2)} C:{msg.payload.close.toFixed(2)}
                        </span>
                      ) : (
                        <pre className="text-xs">
                          {JSON.stringify(msg.payload, null, 2)}
                        </pre>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Latest Candles</h2>
          <div className="border rounded overflow-auto h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">High</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Low</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Close</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...candles].reverse().map((candle, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {new Date(candle.time).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {candle.open.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {candle.high.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {candle.low.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {candle.close.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {candle.volume.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// This ensures the page is client-side only
export const dynamic = 'force-dynamic';
