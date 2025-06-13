import { useState, useEffect, useRef, useCallback } from 'react';
import { Candle } from '../lib/types';
import { generateSignals, Signal, getTopSignal } from '../lib/signals/generator';

/**
 * Options for the useSignals hook
 */
interface UseSignalsOptions {
  /** Array of candles to generate signals from */
  candles?: Candle[];
  /** Whether to automatically refresh signals */
  autoRefresh?: boolean;
  /** Interval in milliseconds between automatic refreshes */
  refreshInterval?: number;
}

interface SignalsState {
  signals: Signal[];
  topSignal: Signal | null;
  lastUpdated: number;
  isLoading: boolean;
}

/**
 * React hook for accessing trading signals
 *
 * @param options - Configuration options object containing candles data and refresh settings
 * @returns Signal state and utility functions for managing signals
 *
 * @example
 * // Basic usage
 * const { signals, topSignal } = useSignals({ candles });
 *
 * @example
 * // With auto-refresh disabled
 * const { signals, refreshSignals } = useSignals({ candles, autoRefresh: false });
 */
export function useSignals({
  candles = [],
  autoRefresh = true,
  refreshInterval = 5000,
}: UseSignalsOptions = {}) {
  const [state, setState] = useState<SignalsState>({
    signals: [],
    topSignal: null,
    lastUpdated: 0,
    isLoading: false,
  });
  
  const signalsHistory = useRef<Signal[]>([]);
  const signalsRef = useRef<Signal[]>([]);
  
  // Use a ref to track previous candles length to prevent unnecessary re-calculation
  const prevCandlesLengthRef = useRef<number>(0);
  const prevCandlesTimestampRef = useRef<number | null>(null);
  
  // Memoized function to check if candles have actually changed significantly
  const haveCandlesChanged = useCallback(() => {
    if (!candles || !Array.isArray(candles)) return false;
    
    // Different length - definitely changed
    if (prevCandlesLengthRef.current !== candles.length) {
      prevCandlesLengthRef.current = candles.length;
      return true;
    }
    
    // Check the timestamp of the last candle to detect data updates
    if (candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      const lastTimestamp = typeof lastCandle.time === 'number' ? lastCandle.time : null;
      
      if (lastTimestamp !== prevCandlesTimestampRef.current) {
        prevCandlesTimestampRef.current = lastTimestamp;
        return true;
      }
    }
    
    return false;
  }, [candles]);
  
  // Generate signals when candles update
  useEffect(() => {
    // Skip the effect if candles haven't meaningfully changed
    if (!haveCandlesChanged()) return;
    
    // Safety checks for candles array
    if (!candles || !Array.isArray(candles) || candles.length < 50) {
      setState({
        signals: [],
        topSignal: null,
        isLoading: false,
        lastUpdated: Date.now()
      });
      return;
    }
    
    // Validate candle data structure
    const isValidData = candles.every(candle => (
      candle && 
      typeof candle === 'object' && 
      'time' in candle && 
      'open' in candle && 
      'high' in candle && 
      'low' in candle && 
      'close' in candle && 
      'volume' in candle
    ));
    
    if (!isValidData) {
      console.warn('Invalid candle data structure in useSignals');
      setState(prev => ({
        ...prev,
        signals: [],
        topSignal: null,
        isLoading: false,
        lastUpdated: Date.now()
      }));
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Use setTimeout to prevent blocking the UI thread for complex calculations
    setTimeout(() => {
      try {
        const newSignals = generateSignals(candles);
        const top = getTopSignal(newSignals);
        
        setState({
          signals: newSignals,
          topSignal: top,
          lastUpdated: Date.now(),
          isLoading: false,
        });
        
        // Update refs
        signalsRef.current = newSignals;
        
        // Add to history (avoid duplicates)
        if (top && (!signalsHistory.current.length || 
            signalsHistory.current[0].timestamp !== top.timestamp)) {
          signalsHistory.current = [
            top,
            ...signalsHistory.current.slice(0, 19) // Keep last 20 signals
          ];
        }
      } catch (error) {
        console.error('Error generating signals:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }, 0);
  }, [candles]);
  
  // Set up auto-refresh interval if enabled
  useEffect(() => {
    if (!autoRefresh || !candles || candles.length < 50) return;
    
    const intervalId = setInterval(() => {
      try {
        // Don't regenerate signals if candles haven't changed
        if (!haveCandlesChanged()) {
          return;
        }
        
        const newSignals = generateSignals(candles);
        const top = getTopSignal(newSignals);
        
        setState({
          signals: newSignals,
          topSignal: top,
          lastUpdated: Date.now(),
          isLoading: false,
        });
        
        // Update refs
        signalsRef.current = newSignals;
        
        // Add to history (avoid duplicates)
        if (top && (!signalsHistory.current.length || 
            signalsHistory.current[0].timestamp !== top.timestamp)) {
          signalsHistory.current = [
            top,
            ...signalsHistory.current.slice(0, 19) // Keep last 20 signals
          ];
        }
      } catch (error) {
        console.error('Error refreshing signals:', error);
      }
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, candles, haveCandlesChanged]);
  
  // Force refresh the signals
  const refreshSignals = () => {
    if (!candles || candles.length < 50) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    setTimeout(() => {
      try {
        const newSignals = generateSignals(candles);
        const top = getTopSignal(newSignals);
        
        setState({
          signals: newSignals,
          topSignal: top,
          lastUpdated: Date.now(),
          isLoading: false,
        });
        
        // Update refs
        signalsRef.current = newSignals;
      } catch (error) {
        console.error('Error refreshing signals:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }, 0);
  };
  
  // Get signals history (last 20 signals)
  const getSignalsHistory = () => {
    return signalsHistory.current;
  };
  
  // Check for signal changes
  const hasNewSignals = () => {
    return state.lastUpdated > 0 && state.signals.length > 0;
  };
  
  // Get signals for a specific timeframe
  const getSignalsByTimeframe = (timeframe: 'short_term' | 'medium_term' | 'long_term') => {
    return state.signals.filter(s => s.timeframe === timeframe);
  };
  
  // Get signals by direction
  const getSignalsByDirection = (direction: 'buy' | 'sell' | 'neutral') => {
    return state.signals.filter(s => s.direction === direction);
  };
  
  return {
    ...state,
    refreshSignals,
    getSignalsHistory,
    hasNewSignals,
    getSignalsByTimeframe,
    getSignalsByDirection
  };
}
