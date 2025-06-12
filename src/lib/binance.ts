import type { Candle } from './types';

const BASE_URL = process.env.BINANCE_BASE_URL ?? 'https://api.binance.com';
let lastCall = 0;

export async function getBinanceCandles(limit = 100): Promise<Candle[]> {
  if (process.env.NODE_ENV === 'development' && Date.now() - lastCall < 5000) {
    throw new Error('binance_rate_limit');
  }
  lastCall = Date.now();

  const url = `${BASE_URL}/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('fetch_failed');
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
}
