import type { Candle, TimeFrame } from './types';

export async function getBinanceCandles(timeFrame: TimeFrame = '5m', limit = 100): Promise<Candle[]> {
  const url = `/api/binance-proxy/klines?symbol=BTCUSDT&interval=${timeFrame}&limit=${limit}`;
  
  try {
    console.log(`Fetching ${limit} ${timeFrame} candles from Binance...`);
    const startTime = Date.now();
    
    const res = await fetch(url);
    const responseTime = Date.now() - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Fetched ${limit} ${timeFrame} candles in ${responseTime}ms`);
    }

    // Handle error cases
    if (!res.ok) {
      const status = res.status;
      const retryAfter = res.headers.get('Retry-After');
      
      try {
        // Try to get error body as text
        const errorBodyText = await res.text();
        
        console.error(`Binance API Error: Status ${status}, Body: ${errorBodyText}`);
        
        if (status === 429 || status === 418) {
          const errorMsg = `Rate limit exceeded. Retry-After: ${retryAfter || 'N/A'} seconds.`;
          console.error(errorMsg);
          throw new Error(`fetch_failed_rate_limit: ${errorMsg} Status: ${status}`);
        }
        
        throw new Error(`fetch_failed: Status ${status}. ${errorBodyText}`);
      } catch (e) {
        // In case we can't read the response body, throw with what we know
        if (status === 429 || status === 418) {
          throw new Error(`fetch_failed_rate_limit: Status ${status}, Retry-After: ${retryAfter || 'N/A'}.`);
        }
        throw new Error(`fetch_failed: Status ${status}.`);
      }
    }
    
    // Parse successful response
    const klines = await res.json();
    
    if (!Array.isArray(klines)) {
      throw new Error('Invalid response format from Binance API: Expected array');
    }
    
    const candles = klines.map((k: any) => ({
      time: Number(k[0]), // Keep as milliseconds for consistency
      open: Number(k[1]),
      high: Number(k[2]),
      low: Number(k[3]),
      close: Number(k[4]),
      volume: Number(k[5]),
      closeTime: Number(k[6]),
      quoteAssetVolume: Number(k[7]),
      trades: Number(k[8]),
      takerBuyBaseAssetVolume: Number(k[9]),
      takerBuyQuoteAssetVolume: Number(k[10]),
    }));
    
    console.log(`Fetched ${candles.length} candles in ${responseTime}ms`);
    
    if (candles.length > 0) {
      console.log('First candle:', {
        time: new Date(candles[0].time).toISOString(),
        open: candles[0].open,
        close: candles[0].close
      });
      console.log('Last candle:', {
        time: new Date(candles[candles.length - 1].time).toISOString(),
        open: candles[candles.length - 1].open,
        close: candles[candles.length - 1].close
      });
    }
    
    return candles;
  } catch (error) {
    console.error('Error in getBinanceCandles:', error);
    throw error; // Re-throw to be handled by the caller
  }
}
