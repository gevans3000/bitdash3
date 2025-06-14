import { detectEMACross } from '@/lib/signals/ema-crossover';
import type { Candle } from '@/lib/types';

function genCandles(prices: number[]): Candle[] {
  return prices.map((p, i) => ({
    time: i,
    open: p,
    high: p,
    low: p,
    close: p,
    volume: 100,
  }));
}

describe('detectEMACross', () => {
  it('returns BUY on bullish crossover', () => {
    const prices = [...Array(21).fill(100), 90, 80, 120];
    const candles = genCandles(prices);
    const res = detectEMACross(candles);
    expect(res.signal.type).toBe('BUY');
  });

  it('returns SELL on bearish crossover', () => {
    const prices = [...Array(21).fill(100), 120, 120, 80, 70];
    const candles = genCandles(prices);
    const res = detectEMACross(candles);
    expect(res.signal.type).toBe('SELL');
  });

  it('returns NEUTRAL when no crossover', () => {
    const candles = genCandles(new Array(25).fill(100));
    const res = detectEMACross(candles);
    expect(res.signal.type).toBe('NEUTRAL');
  });

  it('RSI lowers confidence when overbought on bullish cross', () => {
    const neutralPrices = [...Array(21).fill(100), 90, 80, 120];
    const overboughtPrices = [...Array(21).fill(100), 80, 80, 120, 130];
    const neutral = detectEMACross(genCandles(neutralPrices));
    const overbought = detectEMACross(genCandles(overboughtPrices));
    expect(neutral.signal.type).toBe('BUY');
    expect(overbought.signal.type).toBe('BUY');
    expect(neutral.signal.confidence).toBeGreaterThan(overbought.signal.confidence);
  });

  it('RSI lowers confidence when oversold on bearish cross', () => {
    const neutralPrices = [...Array(21).fill(100), 110, 90, 94];
    const oversoldPrices = [...Array(21).fill(100), 120, 120, 80, 70];
    const neutral = detectEMACross(genCandles(neutralPrices));
    const oversold = detectEMACross(genCandles(oversoldPrices));
    expect(neutral.signal.type).toBe('SELL');
    expect(oversold.signal.type).toBe('SELL');
    expect(neutral.signal.confidence).toBeGreaterThan(oversold.signal.confidence);
  });
});
