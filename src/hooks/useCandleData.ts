import { useState, useEffect, useCallback } from 'react';
import { Candle } from '@/lib/types';
import { orchestrator } from '@/lib/agents/Orchestrator';

// Maximum number of candles to keep in memory
const MAX_CANDLES = 500;

// Time in milliseconds to wait before showing a loading error
const LOADING_TIMEOUT = 15000;

export function useCandleData() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  console.log('useCandleData: Initializing hook');
  
  // Memoize the update function to prevent unnecessary re-renders
  const updateCandles = useCallback((newCandle: Candle, isClosed: boolean) => {
    setCandles(prevCandles => {
      const updated = [...prevCandles];
      const existingIndex = updated.findIndex(c => c.time === newCandle.time);

      if (existingIndex >= 0) {
        // Update existing candle
        updated[existingIndex] = newCandle;
      } else if (isClosed) {
        // Only add new candle if it's closed or we don't have any candles yet
        updated.push(newCandle);
        updated.sort((a, b) => a.time - b.time);
      } else if (updated.length > 0) {
        // For updates to the current (incomplete) candle
        const lastCandle = updated[updated.length - 1];
        if (newCandle.time >= lastCandle.time) {
          updated[updated.length - 1] = newCandle;
        }
      } else {
        // If we have no candles, add the new one
        updated.push(newCandle);
      }

      // Keep only the last MAX_CANDLES candles
      return updated.slice(-MAX_CANDLES);
    });
    
    setLastUpdate(new Date());
  }, []);

  // Handle incoming WebSocket status updates
  useEffect(() => {
    const handleWebSocketStatus = (event: Event) => {
      const { connected, message } = (event as CustomEvent).detail;
      console.log(`useCandleData: WebSocket ${connected ? 'connected' : 'disconnected'}:`, message);
      
      setIsConnected(connected);
      
      // If we just reconnected, request fresh data
      if (connected) {
        console.log('useCandleData: WebSocket reconnected, requesting fresh data...');
        orchestrator.send({
          from: 'useCandleData',
          type: 'REQUEST_INITIAL_DATA',
          payload: { limit: 100 },
          timestamp: Date.now()
        });
      }
    };
    
    window.addEventListener('websocket-status', handleWebSocketStatus);
    return () => {
      window.removeEventListener('websocket-status', handleWebSocketStatus);
    };
  }, []);

  // Handle incoming messages from the orchestrator
  useEffect(() => {
    console.log('useCandleData: Setting up message handler');

    const handleMessage = (message: any) => {
      console.log('useCandleData: Received message:', message.type, message);
      setLastUpdate(new Date());

      try {
        switch (message.type) {
          case 'INITIAL_CANDLES_5M': {
            const candles = message.payload;
            console.log('useCandleData: Received INITIAL_CANDLES with', candles?.length || 0, 'candles');
            
            if (!Array.isArray(candles)) {
              throw new Error('Invalid initial candles data: not an array');
            }
            
            // Validate candle structure
            if (candles.length > 0) {
              const firstCandle = candles[0];
              const requiredFields = ['time', 'open', 'high', 'low', 'close', 'volume'];
              const missingFields = requiredFields.filter(field => !(field in firstCandle));
              
              if (missingFields.length > 0) {
                throw new Error(`Invalid candle data: missing fields ${missingFields.join(', ')}`);
              }
              
              console.log('useCandleData: First candle:', {
                time: new Date(firstCandle.time).toISOString(),
                open: firstCandle.open,
                high: firstCandle.high,
                low: firstCandle.low,
                close: firstCandle.close,
                volume: firstCandle.volume
              });
            }
            
            // Update state with new candles
            setCandles(candles);
            setIsLoading(false);
            setIsConnected(true);
            setError(null);
            console.log('useCandleData: Updated candles state with', candles.length, 'candles');
            break;
          }

          case 'CANDLE_UPDATE_5M':
          case 'LIVE_CANDLE_UPDATE_5M':
            console.log('useCandleData: Received CANDLE_UPDATE:', message.payload);
            if (typeof message.payload !== 'object') {
              console.error('useCandleData: Invalid candle update received:', message.payload);
              return;
            }
            
            // Use the memoized update function
            updateCandles(message.payload, false);
            setIsConnected(true);
            setError(null);
            break;
            
          case 'NEW_CLOSED_CANDLE_5M':
            console.log('useCandleData: Received NEW_CLOSED_CANDLE:', message.payload);
            if (typeof message.payload !== 'object') {
              console.error('useCandleData: Invalid closed candle received:', message.payload);
              return;
            }
            
            // Use the memoized update function with isClosed=true
            updateCandles(message.payload, true);
            setIsConnected(true);
            setError(null);
            break;

          case 'DATA_READY':
            console.log('useCandleData: Received DATA_READY');
            setIsConnected(true);
            setError(null);
            break;

          case 'DATA_ERROR':
          case 'ERROR':
            console.error('useCandleData: Received error:', message.payload);
            setError(message.payload?.message || 'Unknown data error');
            setIsLoading(false);
            setIsConnected(false);
            break;

          case 'WEBSOCKET_STATUS':
            // We handle this in a separate effect
            break;

          default:
            console.log('useCandleData: Ignoring message type:', message.type);
        }
      } catch (err) {
        console.error('useCandleData: Error processing message:', err);
        setError(`Error processing data: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoading(false);
      }
    };

    console.log('useCandleData: Registering message handlers with orchestrator');
    
    // Register for all message types we're interested in
    const unregisterHandlers = [
      orchestrator.register('INITIAL_CANDLES_5M', handleMessage),
      orchestrator.register('CANDLE_UPDATE_5M', handleMessage),
      orchestrator.register('LIVE_CANDLE_UPDATE_5M', handleMessage),
      orchestrator.register('NEW_CLOSED_CANDLE_5M', handleMessage),
      orchestrator.register('DATA_READY', handleMessage),
      orchestrator.register('DATA_ERROR', handleMessage),
      orchestrator.register('WEBSOCKET_STATUS', handleMessage)
    ];

    // Request initial data if we don't have any
    if (candles.length === 0) {
      console.log('useCandleData: Requesting initial data...');
      orchestrator.send({
        from: 'useCandleData',
        type: 'REQUEST_INITIAL_DATA',
        payload: { limit: 100 },
        timestamp: Date.now()
      });
    } else {
      // We already have data, so we're not loading anymore
      setIsLoading(false);
    }

    // Setup a timeout to check if we're still loading after a while
    const loadingTimeout = setTimeout(() => {
      if (isLoading && candles.length === 0) {
        console.warn('useCandleData: Still loading after timeout, showing error');
        setError('Taking longer than expected to load data. Please check your connection.');
        setIsLoading(false);
      }
    }, LOADING_TIMEOUT);

    // Cleanup function
    return () => {
      console.log('useCandleData: Cleaning up...');
      clearTimeout(loadingTimeout);
      
      // Unregister all message handlers
      unregisterHandlers.forEach(unregister => unregister());
    };
  }, []);

  return { 
    candles, 
    isLoading, 
    error, 
    isConnected, 
    lastUpdate 
  };
}
