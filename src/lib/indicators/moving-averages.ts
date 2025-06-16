import { Candle } from '../types';

/**
 * Calculate Simple Moving Average
 * @param values Array of numeric values
 * @param period SMA period
 */
export function sma(values: number[], period: number): number {
  if (values.length < period) return NaN;
  
  const slice = values.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / period;
}

/**
 * Calculate SMA from candles using close prices
 */
export function candleSMA(candles: Candle[], period: number): number {
  const closes = candles.map(c => c.close);
  return sma(closes, period);
}

/**
 * Create an Exponential Moving Average calculator with the specified period
 * @param period EMA period
 */
export function ema(values: number[], period: number): number[] {
  if (values.length < period) return values.map(() => NaN); // Return array of NaNs

  const k = 2 / (period + 1);
  const emaArray: number[] = new Array(values.length).fill(NaN);

  // Initialize with SMA for the first EMA value
  let currentEma = values.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
  emaArray[period - 1] = currentEma;

  // Calculate EMA for remaining values
  for (let i = period; i < values.length; i++) {
    currentEma = values[i] * k + currentEma * (1 - k);
    emaArray[i] = currentEma;
  }
  
  return emaArray;
}

/**
 * Calculate EMA from candles using close prices
 */
export function candleEMA(candles: Candle[], period: number): number {
  const closes = candles.map(c => c.close);
  const emaValues = ema(closes, period);
  return emaValues.length > 0 ? emaValues[emaValues.length -1] : NaN;
}

/**
 * Calculate multiple EMAs at once for efficiency
 * @param candles Array of candles
 * @param periods Array of EMA periods to calculate
 * @returns Object with period as key and EMA value as value
 */
export function multiEMA(candles: Candle[], periods: number[]): Record<number, number> {
  const closes = candles.map(c => c.close);
  return periods.reduce((acc, period) => {
    const emaValues = ema(closes, period);
    acc[period] = emaValues.length > 0 ? emaValues[emaValues.length -1] : NaN;
    return acc;
  }, {} as Record<number, number>);
}

/**
 * Calculate Volume-Weighted Average Price
 * @param candles Array of candles
 */
export function vwap(candles: Candle[]): number {
  if (candles.length === 0) return NaN;
  
  let cumulativePV = 0;
  let cumulativeVolume = 0;
  
  for (const candle of candles) {
    // Typical price = (high + low + close) / 3
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativePV += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;
  }
  
  if (cumulativeVolume === 0) return NaN;
  return cumulativePV / cumulativeVolume;
}

/**
 * Hull Moving Average - Smoother and more responsive than traditional MAs
 * @param values Array of values
 * @param period HMA period
 */
export function hma(values: number[], period: number): number {
  if (values.length < period) return NaN;
  
  // Calculate WMA with period / 2
  const halfPeriod = Math.floor(period / 2);
  const sqrtPeriod = Math.floor(Math.sqrt(period));
  
  // WMA(halfPeriod) * 2 - WMA(period)
  const wmaHalf = wma(values, halfPeriod);
  const wmaPeriod = wma(values, period);
  
  if (isNaN(wmaHalf) || isNaN(wmaPeriod)) return NaN;
  
  const rawHMA = 2 * wmaHalf - wmaPeriod;
  
  // Create a new array of raw HMA values
  const rawValues = new Array(sqrtPeriod).fill(rawHMA);
  
  // Take WMA of the raw values with sqrtPeriod
  return wma(rawValues, sqrtPeriod);
}

/**
 * Weighted Moving Average
 * @param values Array of values
 * @param period WMA period
 */
function wma(values: number[], period: number): number {
  if (values.length < period) return NaN;
  
  const slice = values.slice(-period);
  
  let sum = 0;
  let weightSum = 0;
  
  for (let i = 0; i < period; i++) {
    const weight = i + 1;
    sum += slice[i] * weight;
    weightSum += weight;
  }
  
  return sum / weightSum;
}

/**
 * Detects if a crossing has occurred between two moving averages
 * @returns 1 for bullish cross (fast crosses above slow), -1 for bearish cross, 0 for no cross
 */
export function detectCrossover(
  fastValues: number[],
  slowValues: number[],
  lookback: number = 1
): number {
  if (fastValues.length < lookback + 1 || slowValues.length < lookback + 1) {
    return 0; // Not enough data
  }
  
  const currentFast = fastValues[fastValues.length - 1];
  const currentSlow = slowValues[slowValues.length - 1];
  const prevFast = fastValues[fastValues.length - 1 - lookback];
  const prevSlow = slowValues[slowValues.length - 1 - lookback];
  
  // Bullish crossover (fast crosses above slow)
  if (currentFast > currentSlow && prevFast <= prevSlow) {
    return 1;
  }
  
  // Bearish crossover (fast crosses below slow)
  if (currentFast < currentSlow && prevFast >= prevSlow) {
    return -1;
  }
  
  return 0; // No crossover
}

/**
 * Check if price is near moving average (within percentage)
 */
export function isPriceNearMA(price: number, ma: number, thresholdPercent: number = 0.5): boolean {
  if (isNaN(ma)) return false;
  
  const threshold = ma * (thresholdPercent / 100);
  return Math.abs(price - ma) <= threshold;
}
