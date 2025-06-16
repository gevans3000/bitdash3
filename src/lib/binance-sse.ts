import { Candle } from './types';

type CandleCallback = (candle: Candle, isClosed: boolean) => void;

export class BinanceWebSocket {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private candleCallbacks: CandleCallback[] = [];
  private isConnected = false;
  private symbol: string = 'btcusdt';
  private interval: string = '5m';
  private wsUrl: string;

  constructor() {
    this.wsUrl = this.getWebSocketUrl();
    this.connect();
  }

  private getWebSocketUrl(): string {
    if (typeof window === 'undefined') {
      return '';
    }
    
    // In development, use WebSocket server on port 3001
    if (process.env.NODE_ENV === 'development') {
      return 'ws://localhost:3001/api/binance-ws';
    }
    
    // In production, use the same host as the page
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/binance-ws`;
  }

  private connect(): void {
    if (this.isConnected || typeof window === 'undefined') return;
    
    try {
      // Close existing connection if any
      this.close();
      
      console.log(`Connecting to WebSocket at ${this.wsUrl}`);
      this.socket = new WebSocket(this.wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.handleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected to Binance stream');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      
      // Notify all callbacks that we're connected
      this.candleCallbacks.forEach(callback => callback({
        time: Date.now(),
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        volume: 0,
        isFinal: false
      }, false));
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
            isFinal: data.k.x
          };
          
          this.candleCallbacks.forEach(callback => callback(candle, data.k.x));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.close();
      this.handleReconnect();
    };
    
    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
      this.isConnected = false;
      this.handleReconnect();
    };
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect();
      // Exponential backoff with max delay of 30 seconds
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    }, this.reconnectDelay);
  }
  
  public close(): void {
    if (this.socket) {
      this.socket.close();
      this.isConnected = false;
      this.socket = null;
    }
  }

  public subscribeToCandleUpdates(callback: CandleCallback): () => void {
    this.candleCallbacks.push(callback);
    return () => {
      this.candleCallbacks = this.candleCallbacks.filter(cb => cb !== callback);
    };
  }
}

// Export a singleton instance
export const binanceSSE = new BinanceWebSocket();
