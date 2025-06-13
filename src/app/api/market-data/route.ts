import { NextResponse } from 'next/server';
import { Candle, OrderBookData, Trade } from '@/lib/types';

// Format raw Binance candle data to our app's format
function formatCandles(rawCandles: any[]): Candle[] {
  return rawCandles.map(candle => ({
    time: Number(candle[0]) / 1000,
    open: Number(candle[1]),
    high: Number(candle[2]),
    low: Number(candle[3]),
    close: Number(candle[4]),
    volume: Number(candle[5]),
    closeTime: Number(candle[6]) / 1000,
    quoteAssetVolume: Number(candle[7]),
    trades: Number(candle[8]),
    takerBuyBaseAssetVolume: Number(candle[9]),
    takerBuyQuoteAssetVolume: Number(candle[10])
  }));
}

// Format order book data
function formatOrderBook(rawOrderBook: any): OrderBookData {
  return {
    lastUpdateId: rawOrderBook.lastUpdateId,
    bids: rawOrderBook.bids.map((b: string[]) => [Number(b[0]), Number(b[1])]),
    asks: rawOrderBook.asks.map((a: string[]) => [Number(a[0]), Number(a[1])])
  };
}

// Format trade data
function formatTrades(rawTrades: any[]): Trade[] {
  return rawTrades.map(trade => ({
    id: trade.id,
    price: Number(trade.price),
    qty: Number(trade.qty),
    time: Number(trade.time),
    isBuyerMaker: trade.isBuyerMaker,
    isBestMatch: trade.isBestMatch
  }));
}

// Generate mock data when Binance API is unavailable
function generateMockData(symbol: string) {
  const now = Math.floor(Date.now() / 1000);
  const basePrice = 38000; // For BTCUSDT
  
  // Generate mock candles
  const mockCandles: Candle[] = [];
  for (let i = 99; i >= 0; i--) {
    const timeOffset = i * 5 * 60; // 5 minutes per candle (seconds)
    const time = now - timeOffset;
    const volatility = Math.random() * 100 - 50;
    const close = basePrice + volatility;
    const open = close + (Math.random() * 50 - 25);
    const high = Math.max(open, close) + Math.random() * 25;
    const low = Math.min(open, close) - Math.random() * 25;
    
    mockCandles.push({
      time,
      open,
      high,
      low,
      close,
      volume: Math.random() * 10 + 1,
      closeTime: time + 5 * 60,
      quoteAssetVolume: Math.random() * 100000 + 10000,
      trades: Math.floor(Math.random() * 100 + 50),
      takerBuyBaseAssetVolume: Math.random() * 5 + 0.5,
      takerBuyQuoteAssetVolume: Math.random() * 50000 + 5000
    });
  }
  
  // Generate mock order book
  const mockOrderBook: OrderBookData = {
    lastUpdateId: now,
    bids: [],
    asks: []
  };
  
  const currentPrice = basePrice + (Math.random() * 200 - 100);
  
  // Generate 10 bids (below current price)
  for (let i = 0; i < 10; i++) {
    const price = currentPrice - (i * 10 + Math.random() * 5);
    const quantity = Math.random() * 2 + 0.1;
    mockOrderBook.bids.push([price, quantity]);
  }
  
  // Generate 10 asks (above current price)
  for (let i = 0; i < 10; i++) {
    const price = currentPrice + (i * 10 + Math.random() * 5);
    const quantity = Math.random() * 2 + 0.1;
    mockOrderBook.asks.push([price, quantity]);
  }
  
  // Generate mock trades
  const mockTrades: Trade[] = [];
  for (let i = 0; i < 20; i++) {
    const tradeTime = now - (i * 10000); // 10 seconds between trades
    const isBuyerMaker = Math.random() > 0.5;
    const price = currentPrice + (Math.random() * 20 - 10);
    
    mockTrades.push({
      id: `mock-${now}-${i}`,
      price,
      qty: Math.random() * 1 + 0.01,
      time: tradeTime,
      isBuyerMaker,
      isBestMatch: true
    });
  }
  
  return {
    candles: mockCandles,
    orderBook: mockOrderBook,
    trades: mockTrades,
    isMocked: true
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get('symbol') || 'BTCUSDT';
  const interval = url.searchParams.get('interval') || '5m';
  
  try {
    // Try to fetch data from Binance API
    let candles: Candle[] = [];
    let orderBook: OrderBookData | null = null;
    let trades: Trade[] = [];
    let usedMockData = false;
    
    try {
      // Fetch candles data (candles don't change frequently, cache for 1 minute)
      const candlesRes = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`,
        { next: { revalidate: 60 } }
      );
      
      if (candlesRes.ok) {
        const candlesData = await candlesRes.json();
        candles = formatCandles(candlesData);
      }
    } catch (candleErr) {
      console.warn('Failed to fetch candles:', candleErr);
      // Will fallback to mock data if all API calls fail
    }
    
    try {
      // Fetch order book (changes rapidly, minimal cache)
      const orderBookRes = await fetch(
        `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=20`,
        { next: { revalidate: 5 } }
      );
      
      if (orderBookRes.ok) {
        const orderBookData = await orderBookRes.json();
        orderBook = formatOrderBook(orderBookData);
      }
    } catch (orderBookErr) {
      console.warn('Failed to fetch order book:', orderBookErr);
      // Will fallback to mock data if all API calls fail
    }
    
    try {
      // Fetch recent trades (also changes rapidly, minimal cache)
      const tradesRes = await fetch(
        `https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=20`,
        { next: { revalidate: 10 } }
      );
      
      if (tradesRes.ok) {
        const tradesData = await tradesRes.json();
        trades = formatTrades(tradesData);
      }
    } catch (tradesErr) {
      console.warn('Failed to fetch trades:', tradesErr);
      // Will fallback to mock data if all API calls fail
    }
    
    // If any data is missing, use mock data for all to ensure consistency
    if (candles.length === 0 || !orderBook || trades.length === 0) {
      console.log('Using mock data for market data');
      const mockData = generateMockData(symbol);
      candles = mockData.candles;
      orderBook = mockData.orderBook;
      trades = mockData.trades;
      usedMockData = true;
    }
    
    // Format and return all data
    const response = {
      timestamp: Date.now(),
      candles,
      orderBook,
      trades,
      usedMockData
    };
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59'
      }
    });
  } catch (error) {
    // If everything fails, use mock data as final fallback
    console.error('Error in market data API route, using mock data:', error);
    const mockData = generateMockData(symbol);
    
    return NextResponse.json({
      timestamp: Date.now(),
      ...mockData,
      usedMockData: true
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59'
      }
    });
  }
}
