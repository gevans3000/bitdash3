import { isVolumeSpike, isVolumeConfirming } from '@/lib/indicators/volume';
import type { Candle } from '@/lib/types';

function genCandles(prices: number[], volume: number | number[] = 100): Candle[] {
  return prices.map((p, i) => ({
    time: i,
    open: p,
    high: p,
    low: p,
    close: p,
    volume: Array.isArray(volume) ? volume[i] : volume,
  }));
}

describe('isVolumeSpike', () => {
  it('detects spikes when volume exceeds threshold', () => {
    const prices = Array(21).fill(100);
    const volumes = [...Array(20).fill(100), 300];
    const candles = genCandles(prices, volumes);
    expect(isVolumeSpike(candles, 20, 2)).toBe(true);
  });

  it('does not trigger below threshold', () => {
    const prices = Array(21).fill(100);
    const volumes = [...Array(20).fill(100), 150];
    const candles = genCandles(prices, volumes);
    expect(isVolumeSpike(candles, 20, 2)).toBe(false);
  });

  it('returns false for insufficient data', () => {
    const candles = genCandles([100, 100], [100, 120]);
    expect(isVolumeSpike(candles, 20, 2)).toBe(false);
  });
});

describe('isVolumeConfirming', () => {
  it('returns 1 for uptrend with high volume', () => {
    const prices = [1, 2, 3, 4];
    const volumes = [100, 100, 100, 200];
    const candles = genCandles(prices, volumes);
    expect(isVolumeConfirming(candles, 2)).toBe(1);
  });

  it('returns -1 for downtrend with high volume', () => {
    const prices = [4, 3, 2, 1];
    const volumes = [100, 100, 100, 200];
    const candles = genCandles(prices, volumes);
    expect(isVolumeConfirming(candles, 2)).toBe(-1);
  });

  it('returns 0 when volume is low', () => {
    const prices = [1, 2, 3, 4];
    const volumes = [100, 100, 100, 120];
    const candles = genCandles(prices, volumes);
    expect(isVolumeConfirming(candles, 2)).toBe(0);
  });

  it('returns 0 for insufficient data', () => {
    const candles = genCandles([1], [100]);
    expect(isVolumeConfirming(candles, 3)).toBe(0);
  });
});
