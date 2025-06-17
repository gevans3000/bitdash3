import { useEffect, useRef, useState, useCallback, useMemo } from 'react'; // Added useMemo
import { Candle } from '@/lib/types';
import { orchestrator } from '@/lib/agents/Orchestrator'; // Added
import { AgentName } from '@/lib/agents/types'; // Added
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
  rsi?: number;
  volumeRatio?: number;
  emaSlope?: number;
  confidence?: number;
  lastCandle?: Candle | null;
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
    rsi: undefined,
    volumeRatio: undefined,
    emaSlope: undefined,
    confidence: undefined,
    lastCandle: null,
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
        const candlesToProcess: Candle[] = data.candles; // Assuming data.candles matches Candle[] from lib/types
        // Process historical candles through the regime detector
        const regimeDetector = regimeDetectorRef.current;
        
        // Send to orchestrator regardless of whether candles were found,
        // so downstream knows about the attempt.
        orchestrator.send<Candle[]>({
          from: 'MarketDataHook' as AgentName,
          type: 'INITIAL_CANDLES_5M',
          payload: [...candlesToProcess],
          timestamp: Date.now(),
        });
        
        if (candlesToProcess.length > 0) {
          let finalRegimeAnalysis!: ReturnType<MarketRegimeDetector['update']>; // Definite assignment assertion
          // This loop will run at least once if candlesToProcess.length > 0
          candlesToProcess.forEach((candle: Candle) => {
            finalRegimeAnalysis = regimeDetector.update(candle);
          });

          // Now finalRegimeAnalysis is guaranteed to be assigned if length > 0
          setState(prev => ({
            ...prev,
            candles: candlesToProcess,
            currentPrice: candlesToProcess[candlesToProcess.length - 1]?.close || null,
            volume: candlesToProcess[candlesToProcess.length - 1]?.volume || 0,
            regime: finalRegimeAnalysis.regime,
            adx: finalRegimeAnalysis.adx,
            plusDI: finalRegimeAnalysis.plusDI,
            minusDI: finalRegimeAnalysis.minusDI,
            regimeDuration: regimeDetector.getRegimeDurationMs(),
            rsi: finalRegimeAnalysis.rsi,
            volumeRatio: finalRegimeAnalysis.volumeRatio,
            emaSlope: finalRegimeAnalysis.emaSlope,
            confidence: finalRegimeAnalysis.confidence,
            lastCandle: finalRegimeAnalysis.lastCandle,
            lastUpdate: Date.now(),
          }));
          lastRegimeRef.current = finalRegimeAnalysis.regime;
        } else {
          // This case implies candlesToProcess was empty.
          // Reset to a default/initial state for regime-related fields.
           setState(prev => ({
             ...prev,
             candles: [], // Ensure candles is empty
             currentPrice: null,
             volume: 0,
             regime: 'ranging',
             adx: 0, plusDI: 0, minusDI: 0,
             rsi: undefined, volumeRatio: undefined, emaSlope: undefined, confidence: undefined, lastCandle: null
            }));
           lastRegimeRef.current = 'ranging';
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  }, [symbol, interval]);

  // Generate mock candle data for testing
  const generateMockCandle = useCallback((): Candle => {
    const basePrice = 108000 + (Math.random() - 0.5) * 2000; // Random price around $107k-$109k
    const change = (Math.random() - 0.5) * 500;  // Random change ±$250
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) + Math.random() * 200;
    const low = Math.min(open, close) - Math.random() * 200;
    
    // Align with Candle type from lib/types.ts for orchestrator messages
    return {
      time: Date.now(),
      open,
      high,
      low,
      close,
      volume: 50 + Math.random() * 200,
      closeTime: Date.now() + 5 * 60 * 1000 - 1, // Example: 5 min candle
      quoteAssetVolume: (50 + Math.random() * 200) * close,
      trades: Math.floor(Math.random() * 100),
      takerBuyBaseAssetVolume: (25 + Math.random() * 100),
      takerBuyQuoteAssetVolume: (25 + Math.random() * 100)
    };
  }, []);

  // Start mock mode with periodic updates
  const startMockMode = useCallback(() => {
    console.log('Starting mock market data mode for testing');
    mockModeRef.current = true;
    
    // Generate initial candles
    const initialCandles: Candle[] = [];
    // Increase to ensure enough for MIN_CANDLES_FOR_INDICATORS (which is 26)
    // Let's generate 50 to be safe and provide more history for initial calculations.
    for (let i = 49; i >= 0; i--) {
      initialCandles.push(generateMockCandle());
    }
    console.log(`useMarketData (mockMode): Generated ${initialCandles.length} initial mock candles. Attempting to send INITIAL_CANDLES_5M.`); // DEBUG LOG
    // Send to orchestrator
    orchestrator.send<Candle[]>({
      from: 'MarketDataHook' as AgentName,
      type: 'INITIAL_CANDLES_5M',
      payload: [...initialCandles], // Send a copy
      timestamp: Date.now(),
    });
    console.log(`useMarketData (mockMode): Sent INITIAL_CANDLES_5M to orchestrator.`); // DEBUG LOG
    
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
      console.log(`useMarketData (mockMode): Generated new mock candle for time ${new Date(newCandle.time).toISOString()}. Attempting to send NEW_CLOSED_CANDLE_5M.`); // DEBUG LOG
      // Send to orchestrator as a "closed" candle
      orchestrator.send<Candle>({
        from: 'MarketDataHook' as AgentName,
        type: 'NEW_CLOSED_CANDLE_5M',
        payload: newCandle,
        timestamp: Date.now(),
      });
      console.log(`useMarketData (mockMode): Sent NEW_CLOSED_CANDLE_5M to orchestrator.`); // DEBUG LOG

      setState(prev => {
        // Keep a larger buffer consistent with MAX_CANDLE_HISTORY if possible, e.g., 200
        // For mock mode, let's keep it simpler, e.g., last 50-100.
        // The slice(-19) was for a buffer of 20. If we have 50 initial, let's maintain 50.
        const newCandles = [...prev.candles.slice(-49), newCandle]; // Keep last 50 candles
        
        // Update market regime
        // Ensure regimeDetectorRef.current.detectRegime can handle Candle[] from lib/types
        // const regime = regimeDetectorRef.current.detectRegime(newCandles);
        // For now, regime detection within useMarketData is separate.
        // The main regime detection for signals will happen in SignalGeneratorAgent
        // based on data from orchestrator.

        if (onNewCandle) onNewCandle(newCandle); // Call prop callback
        
        return {
          ...prev,
          candles: newCandles,
          currentPrice: newCandle.close,
          volume: newCandle.volume,
          // regime, // Regime for this hook's state
          isConnected: true,
          lastUpdate: Date.now(),
        };
      });
    }, 5000);
  }, [generateMockCandle, onNewCandle, onRegimeChange]);

  // Initialize WebSocket and event handlers
  useEffect(() => {
    console.log(`useMarketData: Main useEffect running. mockModeRef.current is: ${mockModeRef.current}`); // DEBUG LOG
    if (mockModeRef.current) {
      console.log('useMarketData: Main useEffect detected mockMode, calling startMockMode().'); // DEBUG LOG
      startMockMode();
    } else {
      console.log('useMarketData: Main useEffect detected live mode, initializing WebSocket and fetching initial data.'); // DEBUG LOG
      // Initialize WebSocket
      wsRef.current = new BinanceWebSocket(symbol, interval);
      const ws = wsRef.current;

      // Set up WebSocket event handlers
      ws.on('onCandle', (candle: Candle & { isClosed?: boolean }) => {
        const regimeDetector = regimeDetectorRef.current;
        const currentRegimeAnalysis = regimeDetector.update(candle); // Use this for current candle's full analysis
        const newRegime = currentRegimeAnalysis.regime;
        
        // const { adx, plusDI, minusDI } = regimeDetector.getADX(); // These are in currentRegimeAnalysis

        if (candle.isClosed) {
          orchestrator.send<Candle>({
            from: 'MarketDataHook' as AgentName,
            type: 'NEW_CLOSED_CANDLE_5M',
            payload: candle,
            timestamp: Date.now(),
          });
        }
        
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
            adx: currentRegimeAnalysis.adx,
            plusDI: currentRegimeAnalysis.plusDI,
            minusDI: currentRegimeAnalysis.minusDI,
            regimeDuration: regimeDetector.getRegimeDurationMs(),
            rsi: currentRegimeAnalysis.rsi,
            volumeRatio: currentRegimeAnalysis.volumeRatio,
            emaSlope: currentRegimeAnalysis.emaSlope,
            confidence: currentRegimeAnalysis.confidence,
            lastCandle: currentRegimeAnalysis.lastCandle,
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
      
      ws.on('onError', (error: Error) => { // Corrected to onError
        console.error('WebSocket error:', error);
      });
      
      ws.on('onReconnect', () => { // Corrected to onReconnect
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

  // Memoize the state to prevent unnecessary re-renders
  const memoizedState = useMemo(() => ({
    ...state,
    // Add some helper methods
    isBullish: state.plusDI > state.minusDI,
    isBearish: state.plusDI < state.minusDI,
    isStrongTrend: state.regime === 'strong-trend-up' || state.regime === 'strong-trend-down',
    isWeakTrend: state.regime === 'weak-trend-up' || state.regime === 'weak-trend-down',
    isRanging: state.regime === 'ranging',
  }), [
    state.candles,
    state.currentPrice,
    state.volume,
    state.regime,
    state.adx,
    state.plusDI,
    state.minusDI,
    state.rsi,
    state.volumeRatio,
    state.emaSlope,
    state.confidence,
    state.regimeDuration,
    state.isConnected,
    state.lastUpdate,
    state.lastCandle
  ]);

  return memoizedState;
} // This closes the useMarketData function

// The useCachedMarketData export has been removed for now due to typing issues.
