import { Candle } from '../types';
import { sma } from './moving-averages';

/**
 * Calculate Bollinger Bands
 * @param candles Array of candles
 * @param period Period for moving average (default: 20)
 * @param stdDevMultiplier Standard deviation multiplier (default: 2)
 */
export function bollingerBands(
  candles: Candle[],
  period = 20,
  stdDevMultiplier = 2
): { upper: number; middle: number; lower: number } {
  if (candles.length < period) {
    return { upper: NaN, middle: NaN, lower: NaN };
  }
  
  // Calculate middle band (SMA)
  const closes = candles.map(c => c.close);
  const middle = sma(closes, period);
  
  // Calculate standard deviation
  const slice = closes.slice(-period);
  const variance = slice.reduce((sum, close) => sum + Math.pow(close - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  // Calculate upper and lower bands
  const upper = middle + (stdDevMultiplier * stdDev);
  const lower = middle - (stdDevMultiplier * stdDev);
  
  return { upper, middle, lower };
}

/**
 * Calculate Average True Range (ATR)
 * @param candles Array of candles
 * @param period ATR period (default: 14)
 */
export function atr(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) {
    return NaN;
  }
  
  // Calculate True Range series
  const trueRanges = [];
  
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    
    // True Range is the greatest of:
    // 1. Current High minus current Low
    // 2. Absolute value of current High minus previous Close
    // 3. Absolute value of current Low minus previous Close
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    
    const trueRange = Math.max(tr1, tr2, tr3);
    trueRanges.push(trueRange);
  }
  
  // Calculate ATR as SMA of true ranges for first `period` values
  if (trueRanges.length <= period) {
    return sma(trueRanges, trueRanges.length);
  }
  
  // For subsequent periods, use the smoothing formula
  const initialATR = sma(trueRanges.slice(0, period), period);
  
  return trueRanges.slice(period).reduce((atrValue, tr) => {
    return ((atrValue * (period - 1)) + tr) / period;
  }, initialATR);
}

/**
 * Calculate historical volatility (standard deviation of returns)
 * @param candles Array of candles
 * @param period Period for calculation (default: 20)
 * @param annualized Whether to annualize the volatility (default: true)
 */
export function historicalVolatility(
  candles: Candle[],
  period = 20,
  annualized = true
): number {
  if (candles.length < period + 1) {
    return NaN;
  }
  
  // Calculate logarithmic returns
  const returns = [];
  for (let i = 1; i < candles.length; i++) {
    const logReturn = Math.log(candles[i].close / candles[i - 1].close);
    returns.push(logReturn);
  }
  
  // Calculate mean return
  const meanReturn = returns.slice(-period).reduce((sum, ret) => sum + ret, 0) / period;
  
  // Calculate variance
  const variance = returns.slice(-period).reduce(
    (sum, ret) => sum + Math.pow(ret - meanReturn, 2),
    0
  ) / (period - 1); // Using N-1 for sample standard deviation
  
  // Calculate standard deviation (volatility)
  let volatility = Math.sqrt(variance);
  
  // Annualize if requested (multiply by sqrt of trading days per year)
  if (annualized) {
    // Assuming 365 trading days for crypto (24/7 market)
    volatility = volatility * Math.sqrt(365);
  }
  
  return volatility;
}

/**
 * Detect volatility regime based on Bollinger Band width
 * @param bands Bollinger Bands object
 * @returns 'high', 'medium', or 'low' volatility regime
 */
export function volatilityRegime(
  bands: { upper: number; middle: number; lower: number },
  thresholdHigh = 0.1,
  thresholdLow = 0.03
): 'high' | 'medium' | 'low' {
  if (isNaN(bands.upper) || isNaN(bands.middle) || isNaN(bands.lower)) {
    return 'medium';
  }
  
  // Calculate band width as percentage of middle band
  const bandWidth = (bands.upper - bands.lower) / bands.middle;
  
  if (bandWidth > thresholdHigh) {
    return 'high';
  } else if (bandWidth < thresholdLow) {
    return 'low';
  } else {
    return 'medium';
  }
}

/**
 * Calculate Keltner Channels
 * @param candles Array of candles
 * @param emaPeriod Period for EMA (default: 20)
 * @param atrPeriod Period for ATR (default: 10)
 * @param multiplier ATR multiplier (default: 2)
 */
export function keltnerChannels(
  candles: Candle[],
  emaPeriod = 20,
  atrPeriod = 10,
  multiplier = 2
): { upper: number; middle: number; lower: number } {
  if (candles.length < Math.max(emaPeriod, atrPeriod)) {
    return { upper: NaN, middle: NaN, lower: NaN };
  }
  
  // Calculate middle band (EMA)
  const closes = candles.map(c => c.close);
  const emaValues = [];
  
  // Calculate initial SMA
  const initialSma = sma(closes.slice(0, emaPeriod), emaPeriod);
  emaValues.push(initialSma);
  
  // Calculate EMA for remaining values
  const k = 2 / (emaPeriod + 1);
  for (let i = emaPeriod; i < closes.length; i++) {
    emaValues.push(closes[i] * k + emaValues[emaValues.length - 1] * (1 - k));
  }
  
  const middle = emaValues[emaValues.length - 1];
  
  // Calculate ATR
  const atrValue = atr(candles, atrPeriod);
  
  // Calculate upper and lower bands
  const upper = middle + (multiplier * atrValue);
  const lower = middle - (multiplier * atrValue);
  
  return { upper, middle, lower };
}

/**
 * Check if price is outside Bollinger Bands
 * Returns: 1 for above upper band, -1 for below lower band, 0 for inside bands
 */
export function priceRelativeToBands(
  price: number,
  bands: { upper: number; middle: number; lower: number }
): number {
  if (isNaN(bands.upper) || isNaN(bands.lower)) {
    return 0;
  }
  
  if (price > bands.upper) {
    return 1;
  } else if (price < bands.lower) {
    return -1;
  } else {
    return 0;
  }
}
