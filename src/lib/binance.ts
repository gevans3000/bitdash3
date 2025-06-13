import type { Candle } from './types';

export async function getBinanceCandles(limit = 100): Promise<Candle[]> {
  const base =
    (process.env.BINANCE_BASE_URL ?? 'https://api.binance.com/api/v3').replace(
      /\/$/,
      ''
    );
  const url = `${base}/klines?symbol=BTCUSDT&interval=5m&limit=${limit}`;
  const res = await fetch(url);

  // Only log headers in development mode
  if (process.env.NODE_ENV === 'development') {
    // Log rate limit headers in a more compatible way
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
    // Store information about the error
    const status = res.status;
    const retryAfter = res.headers.get('Retry-After');
    
    try {
      // Try to get error body as text
      const errorBodyText = await res.text();
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`Binance API Error: Status ${status}, Body: ${errorBodyText}`);
        
        if (status === 429 || status === 418) {
          console.error(`Rate limit exceeded. Retry-After: ${retryAfter || 'N/A'} seconds.`);
        }
      }
      
      if (status === 429 || status === 418) {
        throw new Error(`fetch_failed_rate_limit: Status ${status}, Retry-After: ${retryAfter || 'N/A'}. Body: ${errorBodyText}`);
      }
      throw new Error(`fetch_failed: Status ${status}. Body: ${errorBodyText}`);
    } catch (e) {
      // In case we can't read the response body, throw with what we know
      if (status === 429 || status === 418) {
        throw new Error(`fetch_failed_rate_limit: Status ${status}, Retry-After: ${retryAfter || 'N/A'}.`);
      }
      throw new Error(`fetch_failed: Status ${status}.`);
    }
  }
  
  try {
    // Only try to parse JSON if we have a successful response
    // Binance returns [ open time, open, high, low, close, volume, ... ]
    const arr = (await res.json()) as unknown[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return arr.map((c: any) => ({
      time: c[0] / 1000,
      open: +c[1],
      high: +c[2],
      low: +c[3],
      close: +c[4],
      volume: +c[5],
    }));
  } catch (e) {
    console.error('Failed to parse Binance response as JSON:', e);
    throw new Error('fetch_failed: Could not parse response as JSON');
  }
}
