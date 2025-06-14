import { Candle } from '@/lib/types';

type WebSocketMessage = {
  type: 'candle' | 'ticker' | 'orderbook' | 'error';
  data: any;
};

type WebSocketCallbacks = {
  onCandle?: (candle: Candle) => void;
  onOrderBook?: (orderBook: any) => void;
  onTicker?: (ticker: any) => void;
  onError?: (error: Error) => void;
  onReconnect?: () => void;
};

export class BinanceWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private callbacks: WebSocketCallbacks = {};
  private isConnected = false;
  private lastPing = 0;
  private pingInterval: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL = 30000; // 30 seconds

  constructor(private symbol: string, private interval: string = '5m') {
    this.connect();
  }

  private getWebSocketUrl(): string {
    const streamName = `${this.symbol.toLowerCase()}@kline_${this.interval}`;
    return `wss://stream.binance.com:9443/ws/${streamName}`;
  }

  private connect(): void {
    if (this.ws) {
      this.ws.close();
    }

    try {
      this.ws = new WebSocket(this.getWebSocketUrl());      
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.startPing();
      this.callbacks.onReconnect?.();
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.stopPing();
      console.log('WebSocket disconnected');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.callbacks.onError?.(new Error('WebSocket error'));
      this.handleReconnect();
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    if (message.e === 'kline') {
      const candle: Candle = {
        time: message.k.t / 1000, // Convert to seconds
        open: parseFloat(message.k.o),
        high: parseFloat(message.k.h),
        low: parseFloat(message.k.l),
        close: parseFloat(message.k.c),
        volume: parseFloat(message.k.v),
        isClosed: message.k.x,
      };
      this.callbacks.onCandle?.(candle);
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    
    console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startPing(): void {
    this.stopPing();
    this.lastPing = Date.now();
    
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        // Send ping
        this.ws.send(JSON.stringify({ method: 'PING' }));
        this.lastPing = Date.now();
      }
    }, this.PING_INTERVAL);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public on<T extends keyof WebSocketCallbacks>(
    event: T,
    callback: WebSocketCallbacks[T]
  ): void {
    this.callbacks[event] = callback as any;
  }

  public close(): void {
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  public get connectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      lastPing: this.lastPing,
      uptime: this.lastPing ? Date.now() - this.lastPing : 0,
    };
  }
}
