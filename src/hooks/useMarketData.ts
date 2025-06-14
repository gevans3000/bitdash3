import { useEffect, useRef, useState, useCallback } from 'react';
import { Candle } from '@/lib/types';
import { BinanceWebSocket } from '@/lib/market/websocket';
import { MarketRegimeDetector, MarketRegime } from '@/lib/market/regime';
import { withCache } from '@/lib/cache/browserCache';

interface UseMarketDataProps {
  symbol?: string;
  interval?: string;
  onNewCandle?: (candle: Candle) => void;
  onRegimeChange?: (regime: MarketRegime) => void;
  mockMode?: boolean;
}

interface MarketDataState {
  candles: Candle[];
  currentPrice: number | null;
  volume: number;
  regime: MarketRegime;
  adx: number;
  plusDI: number;
  minusDI: number;
  regimeDuration: number; // in milliseconds
  isConnected: boolean;
  lastUpdate: number | null;
}

export function useMarketData({
  symbol = 'BTCUSDT',
  interval = '5m',
  onNewCandle,
  onRegimeChange,
  mockMode = false,
}: UseMarketDataProps = {}) {
  const [state, setState] = useState<MarketDataState>({
    candles: [],
    currentPrice: null,
    volume: 0,
    regime: 'ranging',
    adx: 0,
    plusDI: 0,
    minusDI: 0,
    regimeDuration: 0,
    isConnected: false,
    lastUpdate: null,
  });

  // Refs to maintain WebSocket and detector instances
  const wsRef = useRef<BinanceWebSocket | null>(null);
  const regimeDetectorRef = useRef<MarketRegimeDetector>(
    new MarketRegimeDetector()
  );
  const mockModeRef = useRef<boolean>(mockMode);
  const mockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRegimeRef = useRef<MarketRegime>('ranging');

  // Fetch initial candle data
  const fetchInitialData = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/market-data?symbol=${symbol}&interval=${interval}&limit=100`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch initial data');
      }
      
      const data = await response.json();
      
      if (data.candles && Array.isArray(data.candles)) {
        // Process historical candles through the regime detector
        const regimeDetector = regimeDetectorRef.current;
        data.candles.forEach((candle: Candle) => {
          regimeDetector.update(candle);
        });
        
        const { adx, plusDI, minusDI } = regimeDetector.getADX();
        const currentRegime = regimeDetector.getCurrentRegime();
        
        setState(prev => ({
          ...prev,
          candles: data.candles,
          currentPrice: data.candles[data.candles.length - 1]?.close || null,
          volume: data.candles[data.candles.length - 1]?.volume || 0,
          regime: currentRegime,
          adx,
          plusDI,
          minusDI,
          regimeDuration: regimeDetector.getRegimeDurationMs(),
          lastUpdate: Date.now(),
        }));
        
        lastRegimeRef.current = currentRegime;
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  }, [symbol, interval]);

  // Generate mock candle data for testing
  const generateMockCandle = useCallback((): Candle => {
    const basePrice = 45000 + Math.random() * 10000; // Random price around $45-55k
    const change = (Math.random() - 0.5) * 1000; // Random change ±$500
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) + Math.random() * 200;
    const low = Math.min(open, close) - Math.random() * 200;
    
    return {
      timestamp: Date.now(),
      open,
      high,
      low,
      close,
      volume: 50 + Math.random() * 200, // Random volume 50-250
    };
  }, []);

  // Start mock mode with periodic updates
  const startMockMode = useCallback(() => {
    console.log('Starting mock market data mode for testing');
    mockModeRef.current = true;
    
    // Generate initial candles
    const initialCandles: Candle[] = [];
    for (let i = 20; i >= 0; i--) {
      initialCandles.push(generateMockCandle());
    }
    
    setState(prev => ({
      ...prev,
      candles: initialCandles,
      currentPrice: initialCandles[initialCandles.length - 1]?.close || 50000,
      volume: initialCandles[initialCandles.length - 1]?.volume || 100,
      isConnected: true,
      lastUpdate: Date.now(),
    }));

    // Update every 5 seconds with new mock data
    mockIntervalRef.current = setInterval(() => {
      const newCandle = generateMockCandle();
      setState(prev => {
        const newCandles = [...prev.candles.slice(-19), newCandle]; // Keep last 20 candles
        
        // Update market regime
        const regime = regimeDetectorRef.current.detectRegime(newCandles);
        if (regime !== prev.regime) {
          onRegimeChange?.(regime);
        }
        
        onNewCandle?.(newCandle);
        
        return {
          ...prev,
          candles: newCandles,
          currentPrice: newCandle.close,
          volume: newCandle.volume,
          regime,
          isConnected: true,
          lastUpdate: Date.now(),
        };
      });
    }, 5000);
  }, [generateMockCandle, onNewCandle, onRegimeChange]);

  // Initialize WebSocket and event handlers
  useEffect(() => {
    if (mockModeRef.current) {
      startMockMode();
    } else {
      // Initialize WebSocket
      wsRef.current = new BinanceWebSocket(symbol, interval);
      const ws = wsRef.current;

      // Set up WebSocket event handlers
      ws.on('candle', (candle: Candle) => {
        const regimeDetector = regimeDetectorRef.current;
        const newRegime = regimeDetector.update(candle);
        
        const { adx, plusDI, minusDI } = regimeDetector.getADX();
        
        setState(prev => {
          const newCandles = [...prev.candles];
          const lastCandle = newCandles[newCandles.length - 1];
          
          // Update last candle if same time, otherwise add new candle
          if (lastCandle && lastCandle.time === candle.time) {
            newCandles[newCandles.length - 1] = candle;
          } else {
            newCandles.push(candle);
            // Keep only last 1000 candles
            if (newCandles.length > 1000) {
              newCandles.shift();
            }
          }
          
          return {
            ...prev,
            candles: newCandles,
            currentPrice: candle.close,
            volume: candle.volume,
            regime: newRegime,
            adx,
            plusDI,
            minusDI,
            regimeDuration: regimeDetector.getRegimeDurationMs(),
            lastUpdate: Date.now(),
          };
        });
        
        // Call external callback if provided
        if (onNewCandle) {
          onNewCandle(candle);
        }
        
        // Notify if regime changed
        if (newRegime !== lastRegimeRef.current) {
          lastRegimeRef.current = newRegime;
          if (onRegimeChange) {
            onRegimeChange(newRegime);
          }
        }
      });
      
      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
      });
      
      ws.on('reconnect', () => {
        console.log('WebSocket reconnected, refetching initial data...');
        fetchInitialData();
      });
      
      // Fetch initial data
      fetchInitialData();
      
      // Cleanup
      return () => {
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
      };
    }
  }, [symbol, interval, onNewCandle, onRegimeChange, fetchInitialData, startMockMode]);

  // Update connection status
  useEffect(() => {
    if (!wsRef.current) return;
    
    const interval = setInterval(() => {
      const status = wsRef.current?.connectionStatus;
      if (status) {
        setState(prev => ({
          ...prev,
          isConnected: status.isConnected,
        }));
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Cleanup mock mode interval
  useEffect(() => {
    return () => {
      if (mockIntervalRef.current) {
        clearInterval(mockIntervalRef.current);
        mockIntervalRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    // Add some helper methods
    isBullish: state.plusDI > state.minusDI,
    isBearish: state.plusDI < state.minusDI,
    isStrongTrend: state.regime === 'strong-trend',
    isWeakTrend: state.regime === 'weak-trend',
    isRanging: state.regime === 'ranging',
  };
}

// Cached version of the hook
export const useCachedMarketData = withCache(useMarketData, {
  key: (props) => `market-data-${props?.symbol || 'BTCUSDT'}-${props?.interval || '5m'}`,
  ttl: 60 * 1000, // 1 minute
  staleWhileRevalidate: true,
});
