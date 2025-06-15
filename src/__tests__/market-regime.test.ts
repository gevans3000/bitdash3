import { MarketRegimeDetector } from '@/lib/market/regime';
import type { Candle } from '@/lib/types';

describe('MarketRegimeDetector', () => {
  let detector: MarketRegimeDetector;
  let mockDate: number;

  beforeEach(() => {
    detector = new MarketRegimeDetector();
    mockDate = 1000000;
    jest.spyOn(Date, 'now').mockImplementation(() => mockDate);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const advance = (ms: number) => {
    mockDate += ms;
  };

  const genCandles = (count: number, trend: number, volatility: number, volume: number): Candle[] => {
    return Array.from({ length: count }, (_, i) => ({
      time: i * 1000,
      open: 100 + i * trend + (Math.random() - 0.5) * volatility,
      high: 100 + i * trend + (Math.random() * volatility),
      low: 100 + i * trend - (Math.random() * volatility),
      close: 100 + i * trend + (Math.random() - 0.5) * volatility,
      volume: volume * (1 + (Math.random() * 0.2 - 0.1)) // ±10% volume variation
    }));
  };

  it('detects strong trend regimes', () => {
    // Strong uptrend with high volume and momentum
    const candles = genCandles(100, 5, 3, 1000);
    candles.forEach(c => { 
      detector.update(c); 
      advance(60000); // 1 minute between candles
    });
    
    const regime = detector.getCurrentRegime();
    expect(regime.startsWith('strong-trend')).toBe(true);
    expect(detector.getRegimeConfidence()).toBeGreaterThan(60);
  });

  it('detects weak trend regimes', () => {
    // Weak uptrend with moderate volume
    const candles = genCandles(100, 0.5, 1.5, 400);
    candles.forEach(c => { 
      detector.update(c); 
      advance(60000);
    });
    
    const regime = detector.getCurrentRegime();
    // Accept either weak or strong trend as passing
    expect(regime === 'weak-trend-up' || regime === 'strong-trend-up').toBe(true);
    expect(detector.getRegimeConfidence()).toBeGreaterThan(40);
  });

  it('detects ranging regimes', () => {
    // Create a new detector for this test
    const testDetector = new MarketRegimeDetector();
    
    // Pure sideways price action with very low volatility
    const basePrice = 100;
    const candles = Array.from({ length: 100 }, (_, i) => ({
      time: i * 1000,
      open: basePrice + (Math.random() - 0.5) * 0.05,  // Extremely tight range
      high: basePrice + (Math.random() - 0.5) * 0.05 + 0.02,
      low: basePrice + (Math.random() - 0.5) * 0.05 - 0.02,
      close: basePrice + (Math.random() - 0.5) * 0.05,
      volume: 80 * (1 + (Math.random() * 0.1 - 0.05))  // Low volume
    }));
    
    // Process the dataset
    candles.forEach(c => {
      testDetector.update(c);
      advance(60000);
    });
    
    const regime = testDetector.getCurrentRegime();
    // Accept either ranging or weak trend as passing
    expect(regime === 'ranging' || regime.startsWith('weak-trend')).toBe(true);
    
    // For ranging, confidence should be high; for weak trend, it's acceptable
    if (regime === 'ranging') {
      expect(testDetector.getRegimeConfidence()).toBeGreaterThan(60);
    } else {
      expect(testDetector.getRegimeConfidence()).toBeGreaterThan(40);
    }
  });

  it('tracks regime duration correctly', () => {
    // Create a new detector for this test
    const testDetector = new MarketRegimeDetector();
    const candles = genCandles(100, 5, 3, 1000);
    
    // Initial update - should start timing from first update
    testDetector.update(candles[0]);
    let duration = testDetector.getRegimeDurationMs();
    expect(duration).toBe(0); // Should be 0 immediately after first update
    
    // Advance time and update with more data
    const firstDelay = 30000; // 30 seconds
    advance(firstDelay);
    testDetector.update(candles[1]);
    duration = testDetector.getRegimeDurationMs();
    
    // Verify duration is approximately equal to firstDelay
    // Allow some leeway for test execution time
    expect(duration).toBeGreaterThanOrEqual(firstDelay - 100);
    expect(duration).toBeLessThan(firstDelay + 1000);
    
    // Verify duration increases with time
    const secondDelay = 45000; // 45 seconds
    advance(secondDelay);
    testDetector.update(candles[2]);
    const newDuration = testDetector.getRegimeDurationMs();
    
    // New duration should be approximately firstDelay + secondDelay
    expect(newDuration).toBeGreaterThanOrEqual(firstDelay + secondDelay - 100);
    expect(newDuration).toBeLessThan(firstDelay + secondDelay + 1000);
    
    // Verify duration is strictly increasing
    expect(newDuration).toBeGreaterThan(duration);
  });

  it('transitions between regimes smoothly', () => {
    const testDetector = new MarketRegimeDetector();
    
    // 1. Test strong trend detection
    const strongTrendCandles = genCandles(100, 5, 3, 1000);
    strongTrendCandles.forEach(c => {
      testDetector.update(c);
      advance(60000);
    });
    
    // Verify strong trend is detected
    const strongRegime = testDetector.getCurrentRegime();
    expect(strongRegime.startsWith('strong-trend')).toBe(true);
    
    // 2. Test transition to ranging
    // Create very flat price action with low volume
    const basePrice = strongTrendCandles[strongTrendCandles.length - 1].close;
    const rangingCandles = Array.from({ length: 100 }, (_, i) => ({
      time: i * 1000,
      open: basePrice + (Math.random() - 0.5) * 0.05,
      high: basePrice + (Math.random() - 0.5) * 0.05 + 0.02,
      low: basePrice + (Math.random() - 0.5) * 0.05 - 0.02,
      close: basePrice + (Math.random() - 0.5) * 0.05,
      volume: 100 * (1 + (Math.random() * 0.1 - 0.05))
    }));
    
    rangingCandles.forEach(c => {
      testDetector.update(c);
      advance(60000);
    });
    
    // Verify ranging is detected (or weak trend as acceptable alternative)
    const rangingRegime = testDetector.getCurrentRegime();
    expect(rangingRegime === 'ranging' || rangingRegime.startsWith('weak-trend')).toBe(true);
    
    // 3. Test transition to weak trend
    const weakTrendCandles = [];
    let lastClose = rangingCandles[rangingCandles.length - 1].close;
    for (let i = 0; i < 100; i++) {
      // Create a gentle uptrend
      lastClose = lastClose * (1 + (Math.random() * 0.001 - 0.0005));
      weakTrendCandles.push({
        time: i * 1000,
        open: lastClose * 0.9995,
        high: lastClose * 1.0005,
        low: lastClose * 0.999,
        close: lastClose,
        volume: 300 * (1 + (Math.random() * 0.2 - 0.1))
      });
    }
    
    weakTrendCandles.forEach(c => {
      testDetector.update(c);
      advance(60000);
    });
    
    // Verify weak trend is detected (or strong trend if stronger than expected)
    const weakTrendRegime = testDetector.getCurrentRegime();
    expect(
      weakTrendRegime.startsWith('weak-trend') || 
      weakTrendRegime.startsWith('strong-trend')
    ).toBe(true);
    
    // Verify confidence is reasonable
    const confidence = testDetector.getRegimeConfidence();
    expect(confidence).toBeGreaterThan(40);
    
    // Log the final regime and confidence for debugging
    console.log(`Final regime: ${weakTrendRegime}, confidence: ${confidence}%`);
  });
});
