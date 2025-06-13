import { Candle } from '../types';
import { ema } from './moving-averages';

/**
 * Calculate Relative Strength Index (RSI)
 * @param candles Array of candles
 * @param period RSI period (default: 14)
 */
export function rsi(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) return NaN;
  
  let gainSum = 0;
  let lossSum = 0;
  
  // Initial RS calculation
  for (let i = 1; i <= period; i++) {
    const diff = candles[candles.length - i].close - candles[candles.length - i - 1].close;
    if (diff >= 0) {
      gainSum += diff;
    } else {
      lossSum += Math.abs(diff);
    }
  }
  
  // Avoid division by zero
  if (lossSum === 0) return 100;
  
  // Calculate initial RS and RSI
  const initialRS = gainSum / lossSum;
  return 100 - (100 / (1 + initialRS));
}

/**
 * RSI with smoothing for more stability
 */
export function smoothedRSI(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) return NaN;
  
  let upMoves = [];
  let downMoves = [];
  
  // Calculate up and down moves
  for (let i = 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    upMoves.push(diff > 0 ? diff : 0);
    downMoves.push(diff < 0 ? Math.abs(diff) : 0);
  }
  
  // Calculate smoothed averages
  const avgGain = ema(period)(upMoves);
  const avgLoss = ema(period)(downMoves);
  
  // Avoid division by zero
  if (avgLoss === 0) return 100;
  
  // Calculate RS and RSI
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate Stochastic Oscillator
 * @param candles Array of candles
 * @param periodK K period (default: 14)
 * @param periodD D period (default: 3)
 * @returns Object with K and D values
 */
export function stochastic(candles: Candle[], periodK = 14, periodD = 3): { k: number; d: number } {
  if (candles.length < periodK) {
    return { k: NaN, d: NaN };
  }
  
  // Get last periodK candles
  const period = candles.slice(-periodK);
  
  // Find highest high and lowest low in the period
  const highestHigh = Math.max(...period.map(c => c.high));
  const lowestLow = Math.min(...period.map(c => c.low));
  
  // Avoid division by zero
  if (highestHigh === lowestLow) {
    return { k: 50, d: 50 };
  }
  
  // Calculate %K
  const currentClose = period[period.length - 1].close;
  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  
  // Calculate %D (simple moving average of %K)
  let dSum = k;
  let dCount = 1;
  
  for (let i = 2; i <= periodD; i++) {
    if (candles.length < periodK + i - 1) continue;
    
    const prevPeriod = candles.slice(-(periodK + i - 1), -i + 1);
    const prevHighestHigh = Math.max(...prevPeriod.map(c => c.high));
    const prevLowestLow = Math.min(...prevPeriod.map(c => c.low));
    
    if (prevHighestHigh === prevLowestLow) continue;
    
    const prevClose = prevPeriod[prevPeriod.length - 1].close;
    const prevK = ((prevClose - prevLowestLow) / (prevHighestHigh - prevLowestLow)) * 100;
    
    dSum += prevK;
    dCount++;
  }
  
  const d = dSum / dCount;
  
  return { k, d };
}

/**
 * Calculate Moving Average Convergence Divergence (MACD)
 * @param candles Array of candles
 * @param fastPeriod Fast EMA period (default: 12)
 * @param slowPeriod Slow EMA period (default: 26)
 * @param signalPeriod Signal EMA period (default: 9)
 */
export function macd(
  candles: Candle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macd: number; signal: number; histogram: number } {
  if (candles.length < Math.max(fastPeriod, slowPeriod, signalPeriod)) {
    return { macd: NaN, signal: NaN, histogram: NaN };
  }
  
  const closes = candles.map(c => c.close);
  
  // Calculate fast and slow EMAs
  const fastEMA = ema(fastPeriod)(closes);
  const slowEMA = ema(slowPeriod)(closes);
  
  // Calculate MACD line
  const macdLine = fastEMA - slowEMA;
  
  // Create an array of MACD values
  const macdValues = [];
  let i = 0;
  while (macdValues.length < signalPeriod) {
    const tempFastEma = ema(fastPeriod)(closes.slice(0, closes.length - i));
    const tempSlowEma = ema(slowPeriod)(closes.slice(0, closes.length - i));
    macdValues.unshift(tempFastEma - tempSlowEma);
    i++;
  }
  
  // Calculate signal line (EMA of MACD)
  const signalLine = ema(signalPeriod)(macdValues);
  
  // Calculate histogram (MACD - signal)
  const histogram = macdLine - signalLine;
  
  return {
    macd: macdLine,
    signal: signalLine,
    histogram: histogram,
  };
}

/**
 * Check for bullish/bearish divergence between price and oscillator
 * @param candles Array of candles
 * @param oscillatorValues Array of oscillator values (same length as candles)
 * @param lookbackPeriod Period to look back for divergence patterns
 */
export function detectDivergence(
  candles: Candle[],
  oscillatorValues: number[],
  lookbackPeriod = 14
): { bullish: boolean; bearish: boolean } {
  if (candles.length < lookbackPeriod || oscillatorValues.length < lookbackPeriod) {
    return { bullish: false, bearish: false };
  }
  
  // Find local minimums and maximums within lookback period
  const priceMin = Math.min(...candles.slice(-lookbackPeriod).map(c => c.low));
  const priceMax = Math.max(...candles.slice(-lookbackPeriod).map(c => c.high));
  const oscMin = Math.min(...oscillatorValues.slice(-lookbackPeriod));
  const oscMax = Math.max(...oscillatorValues.slice(-lookbackPeriod));
  
  // Check the current price and oscillator trends
  const currentPrice = candles[candles.length - 1].close;
  const prevPrice = candles[candles.length - lookbackPeriod].close;
  const currentOsc = oscillatorValues[oscillatorValues.length - 1];
  const prevOsc = oscillatorValues[oscillatorValues.length - lookbackPeriod];
  
  // Detect bullish divergence: price makes lower low but oscillator makes higher low
  const bullishDivergence = currentPrice <= priceMin && prevPrice > currentPrice && currentOsc > oscMin && currentOsc > prevOsc;
  
  // Detect bearish divergence: price makes higher high but oscillator makes lower high
  const bearishDivergence = currentPrice >= priceMax && prevPrice < currentPrice && currentOsc < oscMax && currentOsc < prevOsc;
  
  return {
    bullish: bullishDivergence,
    bearish: bearishDivergence,
  };
}

/**
 * Check if RSI is in overbought/oversold territory
 * @param rsiValue Current RSI value
 * @param overbought Overbought threshold (default: 70)
 * @param oversold Oversold threshold (default: 30)
 */
export function isRSIExtreme(
  rsiValue: number,
  overbought = 70,
  oversold = 30
): { overbought: boolean; oversold: boolean } {
  if (isNaN(rsiValue)) {
    return { overbought: false, oversold: false };
  }
  
  return {
    overbought: rsiValue >= overbought,
    oversold: rsiValue <= oversold,
  };
}

/**
 * Check for MACD crossover events
 * @returns 1 for bullish cross (MACD crosses above signal), -1 for bearish cross, 0 for no cross
 */
export function macdCrossover(
  currentMACD: number,
  currentSignal: number,
  previousMACD: number,
  previousSignal: number
): number {
  // Bullish crossover (MACD crosses above signal)
  if (currentMACD > currentSignal && previousMACD <= previousSignal) {
    return 1;
  }
  
  // Bearish crossover (MACD crosses below signal)
  if (currentMACD < currentSignal && previousMACD >= previousSignal) {
    return -1;
  }
  
  return 0; // No crossover
}
