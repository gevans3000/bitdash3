import { MarketRegimeDetector } from '@/lib/market/regime';
import type { Candle } from '@/lib/types';

function genCandles(start: number, step: number, count: number, volume = 100): Candle[] {
  const candles: Candle[] = [];
  let price = start;
  for (let i = 0; i < count; i++) {
    const open = price;
    const close = price + step;
    const high = Math.max(open, close) + Math.abs(step);
    const low = Math.min(open, close) - Math.abs(step);
    candles.push({ time: i, open, high, low, close, volume });
    price += step;
  }
  return candles;
}

describe('MarketRegimeDetector', () => {
  const originalNow = Date.now;
  let mockTime = 0;

  beforeAll(() => {
    Date.now = jest.fn(() => mockTime);
  });

  afterAll(() => {
    Date.now = originalNow;
  });

  const advance = (ms: number) => { mockTime += ms; };

  it('detects strong trend regimes', () => {
    const detector = new MarketRegimeDetector({ adxPeriod: 3, rsiPeriod: 3, emaPeriod: 3, volumeLookback: 3 });
    const candles = genCandles(100, 5, 10, 500);
    candles.forEach(c => { detector.update(c); advance(1000); });
    expect(detector.getCurrentRegime().startsWith('strong-trend')).toBe(true);
  });

  it('detects weak trend regimes', () => {
    const detector = new MarketRegimeDetector({ adxPeriod: 3, rsiPeriod: 3, emaPeriod: 3, volumeLookback: 3 });
    const candles = genCandles(100, 1, 10, 200);
    candles.forEach(c => { detector.update(c); advance(1000); });
    expect(detector.getCurrentRegime().startsWith('weak-trend')).toBe(true);
  });

  it('detects ranging regimes', () => {
    const detector = new MarketRegimeDetector({ adxPeriod: 3, rsiPeriod: 3, emaPeriod: 3, volumeLookback: 3 });
    const candles = genCandles(100, 0, 10, 100);
    candles.forEach(c => { detector.update(c); advance(1000); });
    expect(detector.getCurrentRegime()).toBe('ranging');
  });

  it('tracks regime duration correctly', () => {
    const detector = new MarketRegimeDetector({ adxPeriod: 3, rsiPeriod: 3, emaPeriod: 3, volumeLookback: 3 });
    const candles = genCandles(100, 5, 6, 500);
    candles.forEach(c => { detector.update(c); advance(1000); });
    const startDuration = detector.getRegimeDurationMs();
    advance(5000);
    genCandles(100 + 5 * 6, 5, 5, 500).forEach(c => { detector.update(c); advance(1000); });
    expect(Math.round(detector.getRegimeDurationMs() / 1000)).toBe(Math.round((startDuration + 5000) / 1000));
  });
});
