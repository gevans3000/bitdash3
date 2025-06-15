import { Candle, CandleWebSocketData } from './types';

type CandleCallback = (candle: Candle, isClosed: boolean) => void;

class BinanceWebSocket {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second delay
  private candleCallbacks: CandleCallback[] = [];
  private isConnected = false;

  constructor() {
    this.connect();
  }

  private getWebSocketUrl(symbol: string, interval: string): string {
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    return `wss://stream.binance.com:9443/ws/${stream}`;
  }

  private connect(): void {
    if (this.isConnected) return;
    
    const symbol = 'btcusdt';
    const interval = '5m';
    
    try {
      this.socket = new WebSocket(this.getWebSocketUrl(symbol, interval));
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000; // Reset delay on successful connection
      this.notifyConnectionStatus(true, 'Successfully connected to Binance WebSocket');
    };

    this.socket.onmessage = (event) => {
      try {
        const data: CandleWebSocketData = JSON.parse(event.data);
        if (data.k) {
          const candle: Candle = {
            time: data.k.t,
            open: parseFloat(data.k.o),
            high: parseFloat(data.k.h),
            low: parseFloat(data.k.l),
            close: parseFloat(data.k.c),
            volume: parseFloat(data.k.v)
          };
          this.notifyCallbacks(candle, data.k.x);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
      this.handleReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnected = false;
    };
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.notifyConnectionStatus(false);
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms...`);
    
    // Notify about reconnection attempt
    this.notifyConnectionStatus(false, `Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      console.log('Attempting to establish new WebSocket connection...');
      this.connect();
      // Exponential backoff with max delay of 30 seconds
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    }, this.reconnectDelay);
  }
  
  private notifyConnectionStatus(connected: boolean, message?: string): void {
    // This would be used to notify the UI about connection status changes
    console.log(`WebSocket ${connected ? 'connected' : 'disconnected'}: ${message || ''}`);
    
    // You could also emit an event here that your UI components can listen to
    const event = new CustomEvent('websocket-status', {
      detail: { 
        connected,
        message: message || (connected ? 'Connected to WebSocket' : 'Disconnected from WebSocket'),
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);
  }

  private notifyCallbacks(candle: Candle, isClosed: boolean): void {
    this.candleCallbacks.forEach(callback => {
      try {
        callback(candle, isClosed);
      } catch (error) {
        console.error('Error in candle callback:', error);
      }
    });
  }

  public subscribe(callback: CandleCallback): () => void {
    this.candleCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.candleCallbacks = this.candleCallbacks.filter(cb => cb !== callback);
    };
  }

  public close(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      
      if (this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.close();
          console.log('WebSocket connection closed cleanly');
        } catch (error) {
          console.error('Error closing WebSocket:', error);
        }
      }
      
      this.socket = null;
    }
    
    this.isConnected = false;
    this.notifyConnectionStatus(false, 'WebSocket connection closed');
  }
}

// Export a singleton instance
export const binanceWebSocket = new BinanceWebSocket();

// Helper function to subscribe to candle updates
export function subscribeToCandleUpdates(callback: CandleCallback): () => void {
  return binanceWebSocket.subscribe(callback);
}
