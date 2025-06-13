import { useState, useEffect, useCallback } from 'react';
import webSocketManager from '@/lib/websocket-manager';
import type { Candle, OrderBookData, Trade } from '@/lib/types';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Custom hook for WebSocket subscriptions
 * 
 * Features:
 * - Connection status tracking
 * - Automatic subscription management based on component lifecycle
 * - Support for different data streams (candles, orderbook, trades)
 */
export function useWebSocket() {
  // Track connection status
  const [status, setStatus] = useState<ConnectionStatus>(webSocketManager.getStatus());

  // Setup status listener
  useEffect(() => {
    const handleStatusChange = (newStatus: ConnectionStatus) => {
      setStatus(newStatus);
    };

    webSocketManager.addStatusListener(handleStatusChange);
    
    return () => {
      webSocketManager.removeStatusListener(handleStatusChange);
    };
  }, []);

  // Utility for subscribing to candle updates
  const subscribeToCandles = useCallback(
    (symbol: string, interval: string, onCandle: (candle: Candle) => void) => {
      webSocketManager.subscribeToCandles(symbol, interval, onCandle);
      
      return () => {
        const stream = `${symbol.toLowerCase()}@kline_${interval}`;
        webSocketManager.unsubscribe(stream);
      };
    },
    []
  );

  // Utility for subscribing to orderbook updates
  const subscribeToOrderBook = useCallback(
    (
      symbol: string,
      onOrderBook: (orderBook: OrderBookData) => void,
      depth = 20,
      updateSpeed: '100ms' | '1000ms' = '100ms'
    ) => {
      webSocketManager.subscribeToOrderBook(symbol, onOrderBook, depth, updateSpeed);
      
      return () => {
        const stream = `${symbol.toLowerCase()}@depth${depth}@${updateSpeed}`;
        webSocketManager.unsubscribe(stream);
      };
    },
    []
  );

  // Utility for subscribing to trade updates
  const subscribeToTrades = useCallback(
    (symbol: string, onTrade: (trade: Trade) => void) => {
      webSocketManager.subscribeToTrades(symbol, onTrade);
      
      return () => {
        const stream = `${symbol.toLowerCase()}@aggTrade`;
        webSocketManager.unsubscribe(stream);
      };
    },
    []
  );

  return {
    status,
    subscribeToCandles,
    subscribeToOrderBook,
    subscribeToTrades,
  };
}

/**
 * Hook for subscribing to candle updates
 * @param symbol Trading pair (e.g., 'btcusdt')
 * @param interval Candlestick interval (e.g., '5m')
 * @returns [candles, status]
 */
export function useCandles(symbol: string, interval: string) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const { status, subscribeToCandles } = useWebSocket();

  useEffect(() => {
    // Define candle handler
    const handleCandle = (candle: Candle) => {
      setCandles(prev => {
        // Check if this candle already exists (same timestamp)
        const exists = prev.findIndex(c => c.time === candle.time);
        
        if (exists >= 0) {
          // Replace existing candle
          const updated = [...prev];
          updated[exists] = candle;
          return updated;
        } else {
          // Add new candle and keep sorted by time
          const updated = [...prev, candle].sort((a, b) => a.time - b.time);
          // Limit to 500 candles to prevent excessive memory usage
          return updated.slice(-500);
        }
      });
    };

    // Subscribe to candle updates
    const unsubscribe = subscribeToCandles(symbol, interval, handleCandle);
    
    return () => {
      unsubscribe();
    };
  }, [symbol, interval, subscribeToCandles]);

  return [candles, status] as const;
}

/**
 * Hook for subscribing to order book updates
 * @param symbol Trading pair (e.g., 'btcusdt')
 * @param depth Order book depth (default: 20)
 * @param updateSpeed Update speed (default: '100ms')
 * @returns [orderBook, status]
 */
export function useOrderBook(
  symbol: string, 
  depth = 20, 
  updateSpeed: '100ms' | '1000ms' = '100ms'
) {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const { status, subscribeToOrderBook } = useWebSocket();

  useEffect(() => {
    const handleOrderBook = (data: OrderBookData) => {
      setOrderBook(data);
    };

    const unsubscribe = subscribeToOrderBook(symbol, handleOrderBook, depth, updateSpeed);
    
    return () => {
      unsubscribe();
    };
  }, [symbol, depth, updateSpeed, subscribeToOrderBook]);

  return [orderBook, status] as const;
}

/**
 * Hook for subscribing to trade updates
 * @param symbol Trading pair (e.g., 'btcusdt')
 * @returns [trades, status]
 */
export function useTrades(symbol: string) {
  // Keep a limited number of recent trades
  const [trades, setTrades] = useState<Trade[]>([]);
  const { status, subscribeToTrades } = useWebSocket();

  useEffect(() => {
    const handleTrade = (trade: Trade) => {
      setTrades(prev => {
        // Add new trade and limit to last 50 trades
        const updated = [trade, ...prev].slice(0, 50);
        return updated;
      });
    };

    const unsubscribe = subscribeToTrades(symbol, handleTrade);
    
    return () => {
      unsubscribe();
    };
  }, [symbol, subscribeToTrades]);

  return [trades, status] as const;
}

// Simple connection status hook
export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(webSocketManager.getStatus());

  useEffect(() => {
    const handleStatusChange = (newStatus: ConnectionStatus) => {
      setStatus(newStatus);
    };

    webSocketManager.addStatusListener(handleStatusChange);
    
    return () => {
      webSocketManager.removeStatusListener(handleStatusChange);
    };
  }, []);

  return status;
}
