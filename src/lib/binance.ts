import type { Candle, TimeFrame } from './types';

export async function getBinanceCandles(timeFrame: TimeFrame = '5m', limit = 100): Promise<Candle[]> {
  const base = (process.env.BINANCE_BASE_URL ?? 'https://api.binance.com/api/v3').replace(/\/$/, '');
  const url = `${base}/klines?symbol=BTCUSDT&interval=${timeFrame}&limit=${limit}`;
  
  try {
    console.log(`Fetching ${limit} ${timeFrame} candles from Binance...`);
    const startTime = Date.now();
    
    const res = await fetch(url);
    const responseTime = Date.now() - startTime;
    
    // Log rate limit headers in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Binance API Response Headers:');
      for (const [name, value] of res.headers.entries()) {
        if (name.toLowerCase().startsWith('x-mbx-used-weight-') || 
            name.toLowerCase().startsWith('x-mbx-order-count-')) {
          console.log(`  ${name}: ${value}`);
        }
      }
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
      time: k[0], // Keep as milliseconds for consistency
      open: +k[1],
      high: +k[2],
      low: +k[3],
      close: +k[4],
      volume: +k[5],
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
