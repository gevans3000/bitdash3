import { Candle } from './types';

type CandleCallback = (candle: Candle, isClosed: boolean) => void;

class BinanceWebSocket {
  private socket: WebSocket | null = null;
  private callbacks: CandleCallback[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly symbol = 'btcusdt';
  private readonly interval = '5m';

  constructor() {
    // this.connect(); // REMOVED: Do not auto-connect on instantiation
  }

  // Make connect public so DataCollectorAgent can call it.
  public connect(): void { // MODIFIED: Made explicitly public (though it was implicitly before)
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
            // Correctly map to Candle type and pass isClosed separately
            const isClosedFlag = data.k.x;
            const candleData = data.k; // kline data from websocket
            const candle: Candle = {
              time: candleData.t,
              open: parseFloat(candleData.o),
              high: parseFloat(candleData.h),
              low: parseFloat(candleData.l),
              close: parseFloat(candleData.c),
              volume: parseFloat(candleData.v),
              closeTime: candleData.T,
              quoteAssetVolume: parseFloat(candleData.q),
              trades: candleData.n,
              takerBuyBaseAssetVolume: parseFloat(candleData.V),
              takerBuyQuoteAssetVolume: parseFloat(candleData.Q),
            };
            this.callbacks.forEach(cb => cb(candle, isClosedFlag));
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      this.socket.onclose = (event: CloseEvent) => {
        console.log(`WebSocket connection closed. Code: ${event.code}, Reason: "${event.reason}", Was Clean: ${event.wasClean}`);
        this.scheduleReconnect();
      };

      this.socket.onerror = (event: Event) => {
        console.error('WebSocket error event:', event);
        if (event instanceof ErrorEvent) {
            console.error('WebSocket ErrorEvent details:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        } else {
            console.error('WebSocket generic Event details:', {
                type: event.type,
                isTrusted: event.isTrusted,
            });
        }
        try {
            console.error('WebSocket error (stringified):', JSON.stringify(event, Object.getOwnPropertyNames(event)));
        } catch (e) {
            console.error('Could not stringify WebSocket error event:', e);
        }
        this.socket?.close();
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }
  
  private get url(): string {
    return `wss://stream.binance.com:9443/ws/${this.symbol}@kline_${this.interval}`;
  }

  // Removed the duplicate private connect() method.
  // The public connect() method defined earlier (starting line 17) is the correct one.

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
    // For example, if UIAdapter needs to listen to this directly:
    // orchestrator.send({ from: 'WebSocket', type: 'WEBSOCKET_STATUS_RAW', payload: { connected, message }});
    const event = new CustomEvent('websocket-status', {
      detail: {
        connected,
        message: message || (connected ? 'Connected to WebSocket' : 'Disconnected from WebSocket'),
        timestamp: new Date().toISOString()
      }
    });
    if (typeof window !== 'undefined') { // Ensure window exists for dispatchEvent
        window.dispatchEvent(event);
    }
  }

  // Removed duplicate/problematic methods:
  // - notifyCallbacks (this.callbacks is used directly in onmessage)
  // - the second subscribeToCandleUpdates (the first one at line 102 is correct)
  // - the second close() method (the first one at line 109 is correct)
  // - cleanup() method (the functionality is largely covered by the first close() and connect() logic)
  // - isConnected property (not consistently used, connection status can be inferred or managed via onopen/onclose)
}

// Export a singleton instance
const binanceWebSocket = new BinanceWebSocket();

// Export the public API
export const subscribeToCandleUpdates = binanceWebSocket.subscribe.bind(binanceWebSocket);

export default binanceWebSocket;
