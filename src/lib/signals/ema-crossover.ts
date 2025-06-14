import { Candle } from '@/lib/types';
import { calculateRSI, getRSISignal } from '@/lib/indicators/rsi';

export interface EMASignal {
  type: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number;
  fastEMA: number;
  slowEMA: number;
  timestamp: number;
  price: number;
  rsi?: number;
  rsiSignal?: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
  rsiStrength?: number;
}

export interface EMACrossResult {
  signal: EMASignal;
  fastEMA: number[];
  slowEMA: number[];
}

export function calculateEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [prices[0]]; // Initialize with first price

  for (let i = 1; i < prices.length; i++) {
    ema.push(prices[i] * k + ema[i - 1] * (1 - k));
  }

  return ema;
}

export function detectEMACross(candles: Candle[]): EMACrossResult {
  if (candles.length < 22) { // Need at least 21 candles for EMA21
    return {
      signal: {
        type: 'NEUTRAL',
        confidence: 0,
        fastEMA: 0,
        slowEMA: 0,
        timestamp: 0,
        price: 0
      },
      fastEMA: [],
      slowEMA: []
    };
  }

  const closes = candles.map(c => c.close);
  const fastEMA = calculateEMA(closes, 9);
  const slowEMA = calculateEMA(closes, 21);
  
  const currentCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  
  const currentFastEMA = fastEMA[fastEMA.length - 1];
  const currentSlowEMA = slowEMA[slowEMA.length - 1];
  const prevFastEMA = fastEMA[fastEMA.length - 2];
  const prevSlowEMA = slowEMA[slowEMA.length - 2];
  
  const fastAboveSlow = currentFastEMA > currentSlowEMA;
  const prevFastBelowSlow = prevFastEMA < prevSlowEMA;
  const prevFastAboveSlow = prevFastEMA > prevSlowEMA;
  const fastBelowSlow = currentFastEMA < currentSlowEMA;
  
  // Calculate confidence based on angle of crossover
  const fastAngle = Math.atan2(
    currentFastEMA - prevFastEMA,
    1
  ) * (180 / Math.PI);
  
  const slowAngle = Math.atan2(
    currentSlowEMA - prevSlowEMA,
    1
  ) * (180 / Math.PI);
  
  const angleDiff = Math.abs(fastAngle - slowAngle);
  let baseConfidence = Math.min(angleDiff / 5, 1); // Normalize to 0-1 range
  
  // Calculate RSI for confirmation
  const rsiValues = calculateRSI(candles, 14);
  const currentRSI = rsiValues[rsiValues.length - 1] || 50;
  const rsiSignal = getRSISignal(currentRSI);
  
  let signal: EMASignal = {
    type: 'NEUTRAL',
    confidence: 0,
    fastEMA: currentFastEMA,
    slowEMA: currentSlowEMA,
    timestamp: currentCandle.timestamp,
    price: currentCandle.close,
    rsi: currentRSI,
    rsiSignal: rsiSignal.state,
    rsiStrength: rsiSignal.strength
  };
  
  // Determine base signal from EMA crossover
  let baseSignal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  
  if (fastAboveSlow && prevFastBelowSlow) {
    baseSignal = 'BUY';
    baseConfidence = 0.5 + (baseConfidence * 0.5); // 0.5-1.0 range
  }
  // Bearish crossover
  else if (fastBelowSlow && prevFastAboveSlow) {
    baseSignal = 'SELL';
    baseConfidence = 0.5 + (baseConfidence * 0.5); // 0.5-1.0 range
  }
  // No crossover, but still in trend
  else if (fastAboveSlow) {
    baseSignal = 'BUY';
    baseConfidence = 0.3 + (baseConfidence * 0.4); // 0.3-0.7 range
  } else if (fastBelowSlow) {
    baseSignal = 'SELL';
    baseConfidence = 0.3 + (baseConfidence * 0.4); // 0.3-0.7 range
  }
  
  // Apply RSI confirmation
  if (baseSignal !== 'NEUTRAL') {
    const rsiConfirms = 
      (baseSignal === 'BUY' && rsiSignal.state !== 'OVERBOUGHT') ||
      (baseSignal === 'SELL' && rsiSignal.state !== 'OVERSOLD');
    
    // Increase confidence if RSI confirms, decrease if it contradicts
    const rsiAdjustment = rsiConfirms 
      ? 0.1 + (rsiSignal.strength * 0.2)  // +10% to +30% boost
      : -0.3;  // -30% penalty
    
    signal.type = baseSignal;
    signal.confidence = Math.min(Math.max(baseConfidence + rsiAdjustment, 0.1), 0.95);
  }
  
  return {
    signal,
    fastEMA,
    slowEMA
  };
}

export function useEMASignal(candles: Candle[]): EMACrossResult {
  return detectEMACross(candles);
}
