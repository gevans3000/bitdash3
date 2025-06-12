import { ema, rsi14, vwap } from '@/lib/indicators';
import { getSignal } from '@/lib/signal';
import type { Candle } from '@/lib/types';

function genCandles(prices: number[]): Candle[] {
  return prices.map((p) => ({ open: p, high: p, low: p, close: p, volume: 1 }));
}

describe('indicators', () => {
  const candles = genCandles(Array.from({ length: 30 }, (_, i) => i + 1));
  it('ema', () => {
    expect(ema(12)(candles)).toBeGreaterThan(0);
  });
  it('rsi', () => {
    expect(rsi14(candles)).toBeGreaterThan(0);
  });
  it('vwap', () => {
    expect(vwap(candles)).toBeGreaterThan(0);
  });
});

describe('signal', () => {
  it('returns BUY when criteria met', () => {
    const candles = genCandles([
      40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22,
      21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11,
    ]);
    expect(getSignal(candles)).toBe('BUY');
  });
});
