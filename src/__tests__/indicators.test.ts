import { ema, rsi14, vwap, volumeSMA } from '@/lib/indicators';
import originalConfig from '@/config/signals.json';

function loadSignal(cfg = originalConfig) {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const config = require('@/config/signals.json');
  Object.assign(config, cfg);
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  return require('@/lib/signal').getSignal as typeof import('@/lib/signal').getSignal;
}
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

describe('indicators', () => {
  const candles = genCandles(Array.from({ length: 30 }, (_, i) => i + 1));
  
  it('calculates ema correctly', () => {
    expect(ema(12)(candles)).toBeCloseTo(25.38, 1);
    expect(ema(26)(candles)).toBeCloseTo(19.33, 1);
  });
  
  it('calculates rsi correctly', () => {
    expect(rsi14(candles)).toBeCloseTo(100, 0); // All prices rising = RSI 100
  });

  it('returns NaN for short datasets', () => {
    const shortCandles = genCandles(Array.from({ length: 10 }, (_, i) => i + 1));
    expect(rsi14(shortCandles)).toBeNaN();
  });
  
  it('calculates vwap correctly', () => {
    expect(vwap(candles)).toBeCloseTo(15.5, 1);
  });
  
  it('calculates volume SMA correctly', () => {
    const mixedVolumes = candles.map((c, i) => ({ ...c, volume: (i + 1) * 10 }));
    expect(volumeSMA(mixedVolumes, 10)).toBeCloseTo(255, 0);
  });
});

describe('signal', () => {
  // Mock Date.now for consistent testing
  const originalNow = Date.now;
  let mockTime = 1000;

  beforeAll(() => {
    Date.now = jest.fn(() => mockTime);
  });

  afterAll(() => {
    Date.now = originalNow;
  });

  it('returns SELL on EMA cross down', () => {
    mockTime += 1_000_000;
    const getSignal = loadSignal({ ...originalConfig, rsiBuy: 0, rsiSell: 100 });
    const prices = [...Array(50).fill(100), 90];
    const volumes = [...Array(50).fill(300), 500];
    const candles = genCandles(prices, volumes);
    expect(getSignal(candles).signal).toBe('SELL');
  });

  it('returns BUY when oversold below Bollinger band', () => {
    mockTime += 1_000_000;
    const getSignal = loadSignal();
    const prices = [...Array(20).fill(100), 90];
    const volumes = [...Array(20).fill(300), 500];
    const candles = genCandles(prices, volumes);
    const res = getSignal(candles);
    expect(res.signal).toBe('BUY');
  });

  it('returns SELL when overbought above Bollinger band', () => {
    mockTime += 1_000_000;
    const getSignal = loadSignal();
    const prices = [...Array(20).fill(100), 110];
    const volumes = [...Array(20).fill(300), 500];
    const candles = genCandles(prices, volumes);
    expect(getSignal(candles).signal).toBe('SELL');
  });

  it('respects cooldown period', () => {
    const getSignal = loadSignal({ ...originalConfig, rsiBuy: 0, rsiSell: 100 });
    const prices = [...Array(50).fill(100), 110];
    const candles = genCandles(prices, 300);
    // Trigger first trade
    getSignal(candles);
    // Not enough time elapsed
    expect(getSignal(candles).signal).toBe('HOLD');
  });

  it('respects volume threshold', () => {
    mockTime += 1_000_000;
    const getSignal = loadSignal({ ...originalConfig, rsiBuy: 0, rsiSell: 100 });
    const prices = [...Array(50).fill(100), 110];
    const candles = genCandles(prices, 10); // low volume
    expect(getSignal(candles).signal).toBe('HOLD');
  });
});
