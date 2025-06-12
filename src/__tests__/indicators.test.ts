import { ema, rsi14, vwap, volumeSMA } from '@/lib/indicators';
import { getSignal } from '@/lib/signal';
import type { Candle } from '@/lib/types';

function genCandles(prices: number[], volume = 100): Candle[] {
  return prices.map((p) => ({ open: p, high: p, low: p, close: p, volume }));
}

describe('indicators', () => {
  const candles = genCandles(Array.from({ length: 30 }, (_, i) => i + 1));
  
  it('calculates ema correctly', () => {
    expect(ema(12)(candles)).toBeCloseTo(25.06, 1);
    expect(ema(26)(candles)).toBeCloseTo(18.65, 1);
  });
  
  it('calculates rsi correctly', () => {
    expect(rsi14(candles)).toBeCloseTo(100, 0); // All prices rising = RSI 100
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
  
  it('returns BUY when criteria met', () => {
    // Falling prices = low RSI, volume higher than SMA
    const downtrend = genCandles([
      40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22,
      21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11,
    ], 200);
    expect(getSignal(downtrend)).toBe('BUY');
  });
  
  it('returns SELL when criteria met', () => {
    // Rising prices = high RSI, EMAs crossed down
    const uptrend = genCandles([
      10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
      29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
    ], 200);
    // Advance time to avoid cooldown
    mockTime += 1_000_000;
    expect(getSignal(uptrend)).toBe('SELL');
  });
  
  it('respects cooldown period', () => {
    // Same as BUY case
    const downtrend = genCandles([
      40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22,
      21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11,
    ], 200);
    // Only advance time a little, still in cooldown
    mockTime += 1000;
    expect(getSignal(downtrend)).toBe('HOLD');
  });
  
  it('respects volume threshold', () => {
    // Same as BUY case but volume too low
    const downtrend = genCandles([
      40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22,
      21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11,
    ], 10); // Low volume
    // Advance time to avoid cooldown
    mockTime += 1_000_000;
    expect(getSignal(downtrend)).toBe('HOLD');
  });
});
