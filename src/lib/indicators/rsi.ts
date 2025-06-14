import { Candle } from '@/lib/types';

/**
 * Calculate RSI (Relative Strength Index)
 * @param candles Array of candle data
 * @param period Number of periods (default: 14)
 * @returns Array of RSI values with same length as input
 */
export function calculateRSI(candles: Candle[], period: number = 14): number[] {
  if (candles.length < period + 1) {
    return new Array(candles.length).fill(50); // Neutral RSI if not enough data
  }

  const changes: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  const rsi: number[] = new Array(period).fill(NaN);

  // Calculate price changes
  for (let i = 1; i < candles.length; i++) {
    changes.push(candles[i].close - candles[i - 1].close);
  }

  // Calculate initial average gains and losses
  let avgGain = 0;
  let avgLoss = 0;
  
  for (let i = 0; i < period; i++) {
    const change = changes[i];
    if (change >= 0) {
      avgGain += change;
    } else {
      avgLoss += Math.abs(change);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  // Calculate RS and RSI
  for (let i = period; i < changes.length + 1; i++) {
    let rs = 0;
    if (avgLoss === 0) {
      rs = 100; // Prevent division by zero
    } else {
      rs = avgGain / avgLoss;
    }
    
    rsi.push(100 - (100 / (1 + rs)));

    // Update average gain and loss for next period (smoothed)
    if (i < changes.length) {
      const change = changes[i];
      avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
      avgLoss = (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
    }
  }

  return rsi;
}

/**
 * Get RSI signal state (overbought/oversold/neutral)
 * @param rsiValue Current RSI value
 * @returns Signal state and strength (0-1)
 */
export function getRSISignal(rsiValue: number): { state: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL'; strength: number } {
  if (rsiValue >= 70) {
    return { state: 'OVERBOUGHT', strength: Math.min((rsiValue - 70) / 30, 1) };
  } else if (rsiValue <= 30) {
    return { state: 'OVERSOLD', strength: Math.min((30 - rsiValue) / 30, 1) };
  }
  return { state: 'NEUTRAL', strength: 0 };
}
