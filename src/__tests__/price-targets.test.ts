import { calculatePriceTargets } from '@/lib/calculators/price-targets';
import type { Candle } from '@/lib/types';

function genCandles(count: number): Candle[] {
  return Array.from({ length: count }, (_, i) => ({
    time: i,
    open: 100 + i,
    high: 101 + i,
    low: 99 + i,
    close: 100 + i,
    volume: 100,
  }));
}

describe('calculatePriceTargets', () => {
  it('computes long targets with 2:1 risk-reward', () => {
    const candles = genCandles(20);
    const entry = 120;
    const res = calculatePriceTargets(candles, entry, true);
    expect(res.atr).toBeCloseTo(2, 5);
    expect(res.stopLoss).toBeCloseTo(entry - res.atr * 2.5, 5);
    expect(res.takeProfit).toBeCloseTo(entry + res.atr * 2.5 * 2, 5);
    expect(res.targetDistance / res.stopDistance).toBeCloseTo(2, 5);
  });

  it('computes short targets with 2:1 risk-reward', () => {
    const candles = genCandles(20);
    const entry = 120;
    const res = calculatePriceTargets(candles, entry, false);
    expect(res.stopLoss).toBeCloseTo(entry + res.atr * 2.5, 5);
    expect(res.takeProfit).toBeCloseTo(entry - res.atr * 2.5 * 2, 5);
    expect(res.targetDistance / res.stopDistance).toBeCloseTo(2, 5);
  });

  it('throws when not enough candles are provided', () => {
    const candles = genCandles(10);
    expect(() => calculatePriceTargets(candles, 100, true)).toThrow();
  });

  it('works with minimal required candles', () => {
    const candles = genCandles(15);
    expect(() => calculatePriceTargets(candles, 100, true)).not.toThrow();
  });
});
