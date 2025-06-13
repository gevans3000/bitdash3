import { Candle, WebSocketMessage, CandleWebSocketData, OrderBookData, Trade } from './types';

const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/ws';

type MessageHandler = (data: any) => void;
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface StreamSubscription {
  stream: string;
  handler: MessageHandler;
}

/**
 * WebSocketManager - A lightweight manager for Binance WebSocket connections
 * 
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Stream subscription management
 * - Message parsing for different data types
 * - Connection status tracking
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private subscriptions: Map<string, StreamSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private statusListeners: ((status: ConnectionStatus) => void)[] = [];
  private reconnectionEnabled = true;

  /**
   * Connect to the Binance WebSocket server
   */
  connect(): void {
    // Already connected or connecting
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    // If there are no subscriptions, don't try to connect
    if (this.subscriptions.size === 0) {
      return;
    }
    
    // Skip connection if reconnection is disabled
    if (!this.reconnectionEnabled) {
      return;
    }
    
    this.setStatus('connecting');
    
    try {
      // Create streams string from current subscriptions
      const streams = Array.from(this.subscriptions.keys()).join('/');
      if (!streams) {
        // Don't attempt to connect if there are no streams
        this.setStatus('disconnected');
        return;
      }
      
      const url = `${BINANCE_WS_BASE}/${streams}`;
      
      // Wrap WebSocket creation in a try/catch block
      try {
        this.ws = new WebSocket(url);
      } catch (err) {
        // WebSocket creation failed - quietly set status without error message
        this.setStatus('error');
        return;
      }
      
      this.ws.onopen = () => {
        this.setStatus('connected');
        console.log('WebSocket connected');
        this.reconnectAttempts = 0; // Reset reconnect counter on successful connection
        
        // Resubscribe to streams if needed
        if (this.subscriptions.size > 0) {
          this.subscribeToStreams();
        }
      };
      
      this.ws.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);
        this.setStatus('disconnected');
        this.reconnect();
      };
      
      this.ws.onerror = (error) => {
        // Only log error if reconnection is enabled to prevent noise in console
        if (this.reconnectionEnabled) {
          console.log('WebSocket connection issue detected');
        }
        this.setStatus('error');
        // Don't reconnect here, wait for onclose which will be called after error
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.setStatus('error');
      this.reconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.setStatus('disconnected');
  }
  
  /**
   * Enable or disable automatic reconnection
   */
  setReconnectionEnabled(enabled: boolean): void {
    this.reconnectionEnabled = enabled;
    
    // If we're disabling reconnection and have a pending reconnect, cancel it
    if (!enabled && this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }
  
  /**
   * Check if automatic reconnection is enabled
   */
  isReconnectionEnabled(): boolean {
    return this.reconnectionEnabled;
  }

  /**
   * Add a listener for connection status changes
   */
  addStatusListener(listener: (status: ConnectionStatus) => void): void {
    this.statusListeners.push(listener);
    // Immediately notify the new listener of the current status
    listener(this.status);
  }

  /**
   * Remove a status listener
   */
  removeStatusListener(listener: (status: ConnectionStatus) => void): void {
    const index = this.statusListeners.indexOf(listener);
    if (index !== -1) {
      this.statusListeners.splice(index, 1);
    }
  }

  /**
   * Get the current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Subscribe to a candle (kline) stream
   * @param symbol - Trading pair (e.g., 'btcusdt')
   * @param interval - Candlestick interval (e.g., '5m')
   * @param handler - Callback to handle the parsed candle data
   */
  subscribeToCandles(symbol: string, interval: string, handler: (candle: Candle) => void): void {
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    
    const streamHandler = (data: CandleWebSocketData) => {
      // Only process completed candles or if forced to process real-time updates
      if (data.k.x) {
        const candle: Candle = {
          time: data.k.t / 1000,
          open: parseFloat(data.k.o),
          high: parseFloat(data.k.h),
          low: parseFloat(data.k.l),
          close: parseFloat(data.k.c),
          volume: parseFloat(data.k.v),
        };
        handler(candle);
      }
    };
    
    this.subscribe(stream, streamHandler);
  }

  /**
   * Subscribe to order book updates
   * @param symbol - Trading pair (e.g., 'btcusdt')
   * @param handler - Callback to handle the parsed order book data
   * @param depth - Order book depth (default: 20)
   * @param updateSpeed - Update speed in ms (default: '100ms')
   */
  subscribeToOrderBook(
    symbol: string, 
    handler: (data: OrderBookData) => void,
    depth = 20,
    updateSpeed: '100ms' | '1000ms' = '100ms'
  ): void {
    const stream = `${symbol.toLowerCase()}@depth${depth}@${updateSpeed}`;
    
    const streamHandler = (data: any) => {
      const orderBook: OrderBookData = {
        lastUpdateId: data.lastUpdateId,
        bids: data.bids,
        asks: data.asks,
      };
      handler(orderBook);
    };
    
    this.subscribe(stream, streamHandler);
  }

  /**
   * Subscribe to trade execution updates
   * @param symbol - Trading pair (e.g., 'btcusdt')
   * @param handler - Callback to handle the parsed trade data
   */
  subscribeToTrades(symbol: string, handler: (trade: Trade) => void): void {
    const stream = `${symbol.toLowerCase()}@aggTrade`;
    
    const streamHandler = (data: any) => {
      const trade: Trade = {
        id: data.a,
        price: parseFloat(data.p),
        qty: parseFloat(data.q),
        time: data.T,
        isBuyerMaker: data.m,
      };
      handler(trade);
    };
    
    this.subscribe(stream, streamHandler);
  }

  /**
   * Subscribe to a WebSocket stream
   * @param stream - Stream name
   * @param handler - Message handler callback
   */
  private subscribe(stream: string, handler: MessageHandler): void {
    // Store the subscription
    this.subscriptions.set(stream, { stream, handler });
    
    // If already connected, send a subscribe message
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.subscribeToStreams();
    } else {
      // Not connected, try to connect
      this.connect();
    }
  }

  /**
   * Unsubscribe from a stream
   * @param stream - Stream to unsubscribe from
   */
  unsubscribe(stream: string): void {
    if (!this.subscriptions.has(stream)) {
      return;
    }
    
    this.subscriptions.delete(stream);
    
    // If there are no more subscriptions, disconnect
    if (this.subscriptions.size === 0) {
      this.disconnect();
      return;
    }
    
    // Otherwise, if connected, send unsubscribe message
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        method: 'UNSUBSCRIBE',
        params: [stream],
        id: Date.now()
      }));
    }
  }

  /**
   * Subscribe to all streams in the subscriptions map
   */
  private subscribeToStreams(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || this.subscriptions.size === 0) {
      return;
    }
    
    const streams = Array.from(this.subscriptions.keys());
    
    this.ws.send(JSON.stringify({
      method: 'SUBSCRIBE',
      params: streams,
      id: Date.now()
    }));
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: WebSocketMessage): void {
    // Handle different message types
    if (message.stream) {
      // Combined stream message format
      const streamName = message.stream;
      const subscription = this.subscriptions.get(streamName);
      
      if (subscription) {
        subscription.handler(message.data);
      }
    } else if (message.e) {
      // Single stream message format
      const eventType = message.e;
      
      // Find applicable handlers based on event type
      Array.from(this.subscriptions.values()).forEach(subscription => {
        if (subscription.stream.includes(eventType)) {
          subscription.handler(message);
        }
      });
    }
  }

  /**
   * Reconnect to the WebSocket server with exponential backoff
   */
  private reconnect(): void {
    // Skip reconnection if it's been disabled
    if (!this.reconnectionEnabled) {
      console.log('WebSocket reconnection is disabled, skipping reconnect');
      return;
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`Maximum reconnection attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }

    const backoffTime = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
    console.log(`Reconnecting WebSocket in ${backoffTime}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }
    
    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectAttempts += 1;
      this.connect();
    }, backoffTime);
  }

  /**
   * Set the connection status and notify listeners
   */
  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    
    // Notify all listeners
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }
}

// Export a singleton instance
export const webSocketManager = new WebSocketManager();

// For ease of use in imports
export default webSocketManager;
