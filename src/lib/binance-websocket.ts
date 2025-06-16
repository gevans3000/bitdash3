import { Candle } from './types';

type CandleCallback = (candle: Candle, isClosed: boolean) => void;

class BinanceWebSocket {
  private socket: WebSocket | null = null;
  private callbacks: CandleCallback[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly symbol = 'btcusdt';
  private readonly interval = '5m';

  constructor() {
    this.connect();
  }

  private get url(): string {
    return `wss://stream.binance.com:9443/ws/${this.symbol}@kline_${this.interval}`;
  }

  private connect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = () => {
        console.log('Connected to Binance WebSocket');
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.k) {
            const candle: Candle = {
              time: data.k.t,
              open: parseFloat(data.k.o),
              high: parseFloat(data.k.h),
              low: parseFloat(data.k.l),
              close: parseFloat(data.k.c),
              volume: parseFloat(data.k.v),
              isClosed: data.k.x
            };
            this.callbacks.forEach(cb => cb(candle, candle.isClosed));
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
        this.scheduleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.socket?.close();
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    console.log('Scheduling reconnection in 3 seconds...');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  public subscribe(callback: CandleCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  public close(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
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

  public subscribeToCandleUpdates(callback: CandleCallback): () => void {
    this.candleCallbacks.push(callback);
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
const binanceWebSocket = new BinanceWebSocket();

// Export the public API
export const subscribeToCandleUpdates = binanceWebSocket.subscribe.bind(binanceWebSocket);

export default binanceWebSocket;
