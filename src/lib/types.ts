export type TimeFrame = '1m' | '5m' | '15m' | '1h';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteAssetVolume: number;
  trades: number;
  takerBuyBaseAssetVolume: number;
  takerBuyQuoteAssetVolume: number;
}

export interface WebSocketMessage {
  type: string;
  data: unknown;
}

export interface CandleWebSocketData {
  k: {
    t: number;   // Start time of the candle
    o: string;   // Open price
    h: string;   // High price
    l: string;   // Low price
    c: string;   // Close price
    v: string;   // Volume
    T: number;   // End time of the candle
    s: string;   // Symbol
    i: string;   // Interval
    f: number;   // First trade ID
    L: number;   // Last trade ID
    n: number;   // Number of trades
    x: boolean;  // Is this the close of the candle?
  };
}

export interface OrderBookData {
  lastUpdateId: number;
  bids: [number, number][];
  asks: [number, number][];
}

export interface Trade {
  id: string | number;
  price: number;
  qty: number;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch?: boolean;
  size?: number; // Add size property
  side?: 'buy' | 'sell'; // Add side property
}
