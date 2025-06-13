import { NextResponse } from 'next/server';
import { Candle, OrderBookData, Trade } from '@/lib/types';

// Data source types for tracking and metrics
type DataSource = 'binance' | 'coingecko' | 'mock';

interface DataSourceMetrics {
  name: DataSource;
  status: 'available' | 'unavailable' | 'rate-limited' | 'error';
  lastChecked: number;
  errorCount: number;
  successCount: number;
}

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

// Fetch data from CoinGecko as a fallback when Binance API is unavailable
async function fetchCoinGeckoData(symbol = 'BTCUSDT'): Promise<any> {
  console.log('Attempting to fetch data from CoinGecko...');
  
  // Parse symbol to match CoinGecko's expected format
  const cryptoId = symbol.toLowerCase().includes('btc') ? 'bitcoin' : 
                   symbol.toLowerCase().includes('eth') ? 'ethereum' : 'bitcoin';
                   
  try {
    // Fetch current price and market data
    const priceResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true&precision=full`,
      { next: { revalidate: 60 } }
    );
    
    if (!priceResponse.ok) {
      throw new Error(`CoinGecko price API returned ${priceResponse.status}`);
    }
    
    const priceData = await priceResponse.json();
    
    // Fetch historical data for candles (hourly data for the past 3 days)
    const marketChartResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=3&interval=hourly`,
      { next: { revalidate: 3600 } }
    );
    
    if (!marketChartResponse.ok) {
      throw new Error(`CoinGecko market chart API returned ${marketChartResponse.status}`);
    }
    
    const marketChartData = await marketChartResponse.json();
    
    // Convert to our app's format
    const currentPrice = priceData[cryptoId].usd;
    const volume24h = priceData[cryptoId].usd_24h_vol;
    const priceChange24h = priceData[cryptoId].usd_24h_change;
    const lastUpdated = priceData[cryptoId].last_updated_at;
    
    // Convert CoinGecko price data to candle format
    const prices = marketChartData.prices;
    const volumes = marketChartData.total_volumes;
    
    const candles: Candle[] = [];
    for (let i = 0; i < prices.length; i++) {
      const timestamp = prices[i][0] / 1000; // Convert to seconds
      const price = prices[i][1];
      
      // For realistic OHLC, use nearby prices to estimate
      const priceVariation = price * 0.005; // 0.5% variation for high/low
      
      candles.push({
        time: timestamp,
        open: price,
        high: price + priceVariation,
        low: price - priceVariation,
        close: price,
        volume: volumes[i] ? volumes[i][1] : 0,
        closeTime: timestamp + 3600, // 1 hour later
        quoteAssetVolume: volumes[i] ? volumes[i][1] : 0,
        trades: 100, // Default value
        takerBuyBaseAssetVolume: 0,
        takerBuyQuoteAssetVolume: 0
      });
    }
    
    // Generate order book based on current price
    const orderBook: OrderBookData = {
      lastUpdateId: Date.now(),
      bids: [],
      asks: []
    };
    
    // Add some realistic order book depth
    for (let i = 0; i < 20; i++) {
      orderBook.bids.push([
        currentPrice * (1 - 0.0001 * (i + 1) * (i + 1)),
        (5 / (i + 1)) + (Math.random() * 2)
      ]);
      
      orderBook.asks.push([
        currentPrice * (1 + 0.0001 * (i + 1) * (i + 1)),
        (5 / (i + 1)) + (Math.random() * 2)
      ]);
    }
    
    // Create trades based on recent price data
    const trades: Trade[] = [];
    const recentPrices = prices.slice(-20);
    
    for (let i = 0; i < recentPrices.length; i++) {
      const time = recentPrices[i][0];
      const price = recentPrices[i][1];
      const isBuyerMaker = i % 2 === 0;
      
      trades.push({
        id: `cg-${Date.now()}-${i}`,
        price,
        qty: 0.05 + (Math.random() * 0.5),
        time,
        isBuyerMaker,
        isBestMatch: true
      });
    }
    
    // Sort trades by time (newest first)
    trades.sort((a, b) => b.time - a.time);
    
    console.log('Successfully fetched data from CoinGecko');
    return {
      candles,
      orderBook,
      trades,
      dataSource: 'coingecko',
      currentPrice,
      priceChange24h,
      volume24h,
      lastUpdated
    };
  } catch (error) {
    console.error('CoinGecko API error:', error);
    throw error;
  }
}

// Generate mock data when all external APIs are unavailable
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
  
  // Track data sources and their status
  const dataSourceMetrics: Record<DataSource, DataSourceMetrics> = {
    binance: { name: 'binance', status: 'unavailable', lastChecked: 0, errorCount: 0, successCount: 0 },
    coingecko: { name: 'coingecko', status: 'unavailable', lastChecked: 0, errorCount: 0, successCount: 0 },
    mock: { name: 'mock', status: 'available', lastChecked: 0, errorCount: 0, successCount: 0 }
  };
  
  try {
    // Try to fetch data from Binance API
    let candles: Candle[] = [];
    let orderBook: OrderBookData | null = null;
    let trades: Trade[] = [];
    let dataSource: DataSource = 'binance'; // Default source
    let usedFallbackApi = false;
    let usedMockData = false;
    let additionalData: Record<string, any> = {};
    
    // 1. ATTEMPT BINANCE API
    dataSourceMetrics.binance.lastChecked = Date.now();
    
    try {
      // Fetch candles data with appropriate cache time
      const candlesRes = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`,
        { next: { revalidate: interval === '1m' ? 30 : 60 } }
      );
      
      if (!candlesRes.ok) {
        throw new Error(`Binance candles API returned ${candlesRes.status}`);
      }
      
      const candlesData = await candlesRes.json();
      candles = formatCandles(candlesData);
      dataSourceMetrics.binance.successCount++;
    } catch (candleErr) {
      console.warn('Failed to fetch candles from Binance:', candleErr);
      dataSourceMetrics.binance.errorCount++;
      dataSourceMetrics.binance.status = 'error';
    }
    
    // Only continue with Binance if candles were successful
    if (candles.length > 0) {
      try {
        // Fetch order book (changes rapidly, minimal cache)
        const orderBookRes = await fetch(
          `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=20`,
          { next: { revalidate: 5 } }
        );
        
        if (!orderBookRes.ok) {
          throw new Error(`Binance orderbook API returned ${orderBookRes.status}`);
        }
        
        const orderBookData = await orderBookRes.json();
        orderBook = formatOrderBook(orderBookData);
        dataSourceMetrics.binance.successCount++;
      } catch (orderBookErr) {
        console.warn('Failed to fetch order book from Binance:', orderBookErr);
        dataSourceMetrics.binance.errorCount++;
      }
      
      try {
        // Fetch recent trades
        const tradesRes = await fetch(
          `https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=20`,
          { next: { revalidate: 10 } }
        );
        
        if (!tradesRes.ok) {
          throw new Error(`Binance trades API returned ${tradesRes.status}`);
        }
        
        const tradesData = await tradesRes.json();
        trades = formatTrades(tradesData);
        dataSourceMetrics.binance.successCount++;
      } catch (tradesErr) {
        console.warn('Failed to fetch trades from Binance:', tradesErr);
        dataSourceMetrics.binance.errorCount++;
      }
    }
    
    // Check if Binance data is complete
    if (candles.length > 0 && orderBook && trades.length > 0) {
      dataSourceMetrics.binance.status = 'available';
      console.log('Successfully fetched complete data from Binance');
    } else {
      dataSourceMetrics.binance.status = 'unavailable';
      
      // 2. ATTEMPT COINGECKO FALLBACK
      dataSourceMetrics.coingecko.lastChecked = Date.now();
      
      try {
        console.log('Binance data incomplete, trying CoinGecko fallback...');
        const coinGeckoData = await fetchCoinGeckoData(symbol);
        
        candles = coinGeckoData.candles;
        orderBook = coinGeckoData.orderBook;
        trades = coinGeckoData.trades;
        usedFallbackApi = true;
        dataSource = 'coingecko';
        additionalData = {
          currentPrice: coinGeckoData.currentPrice,
          priceChange24h: coinGeckoData.priceChange24h,
          volume24h: coinGeckoData.volume24h
        };
        
        dataSourceMetrics.coingecko.status = 'available';
        dataSourceMetrics.coingecko.successCount++;
      } catch (coingeckoErr) {
        console.warn('Failed to fetch data from CoinGecko:', coingeckoErr);
        dataSourceMetrics.coingecko.status = 'error';
        dataSourceMetrics.coingecko.errorCount++;
        
        // 3. FALLBACK TO MOCK DATA AS LAST RESORT
        console.log('All APIs failed, using mock data as last resort');
        const mockData = generateMockData(symbol);
        candles = mockData.candles;
        orderBook = mockData.orderBook;
        trades = mockData.trades;
        usedMockData = true;
        dataSource = 'mock';
        dataSourceMetrics.mock.successCount++;
      }
    }
    
    // Format and return all data
    const response = {
      timestamp: Date.now(),
      candles,
      orderBook,
      trades,
      dataSource,
      usedMockData,
      usedFallbackApi,
      dataSourceMetrics: {
        primary: dataSourceMetrics.binance.status,
        fallback: dataSourceMetrics.coingecko.status
      },
      ...additionalData
    };
    
    // Set appropriate cache headers based on data source
    const cacheMaxAge = dataSource === 'binance' ? 10 : 
                       dataSource === 'coingecko' ? 30 : 5;
                      
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=${cacheMaxAge * 6}`
      }
    });
  } catch (error) {
    // If everything fails, use mock data as final fallback
    console.error('Error in market data API route, using mock data:', error);
    const mockData = generateMockData(symbol);
    
    return NextResponse.json({
      timestamp: Date.now(),
      ...mockData,
      dataSource: 'mock' as DataSource,
      usedMockData: true,
      usedFallbackApi: false,
      dataSourceMetrics: {
        primary: 'error',
        fallback: 'error'
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30'
      }
    });
  }
}
