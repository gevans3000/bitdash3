import { Candle } from '@/lib/types';

/**
 * Calculate True Range (TR) for a single period
 */
function calculateTrueRange(current: Candle, previous: Candle): number {
  if (!previous) return current.high - current.low;
  
  const hl = current.high - current.low;
  const hc = Math.abs(current.high - previous.close);
  const lc = Math.abs(current.low - previous.close);
  
  return Math.max(hl, hc, lc);
}

/**
 * Calculate Average True Range (ATR)
 * @param candles Array of candle data
 * @param period Number of periods for ATR calculation (default: 14)
 * @returns Array of ATR values with same length as input
 */
export function calculateATR(candles: Candle[], period: number = 14): number[] {
  if (candles.length < period) {
    return new Array(candles.length).fill(0);
  }

  const trValues: number[] = [];
  const atrValues: number[] = new Array(period - 1).fill(0);

  // Calculate True Range for each period
  for (let i = 0; i < candles.length; i++) {
    const current = candles[i];
    const previous = i > 0 ? candles[i - 1] : null;
    trValues.push(calculateTrueRange(current, previous));
  }

  // Calculate first ATR as simple average of first 'period' TR values
  let atr = trValues.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
  atrValues.push(atr);

  // Calculate subsequent ATR values using the formula: ATR = [(Prior ATR * (n-1)) + Current TR] / n
  for (let i = period; i < candles.length; i++) {
    atr = (atr * (period - 1) + trValues[i]) / period;
    atrValues.push(atr);
  }

  return atrValues;
}

/**
 * Get the most recent ATR value
 * @param candles Array of candle data
 * @param period ATR period
 * @returns Most recent ATR value, or 0 if not enough data
 */
export function getCurrentATR(candles: Candle[], period: number = 14): number {
  if (candles.length < period) return 0;
  const atrValues = calculateATR(candles, period);
  return atrValues[atrValues.length - 1] || 0;
}
