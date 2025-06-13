import { Candle } from '../types';
import { sma } from './moving-averages';

/**
 * Calculate On-Balance Volume (OBV)
 * @param candles Array of candles
 * @returns Current OBV value
 */
export function obv(candles: Candle[]): number {
  if (candles.length < 2) {
    return 0;
  }
  
  let currentOBV = 0;
  
  for (let i = 1; i < candles.length; i++) {
    const currentClose = candles[i].close;
    const previousClose = candles[i - 1].close;
    const currentVolume = candles[i].volume;
    
    if (currentClose > previousClose) {
      // Price up, add volume
      currentOBV += currentVolume;
    } else if (currentClose < previousClose) {
      // Price down, subtract volume
      currentOBV -= currentVolume;
    }
    // If price unchanged, OBV unchanged
  }
  
  return currentOBV;
}

/**
 * Calculate Volume-Price Trend (VPT)
 * Similar to OBV but considers the percentage of price change
 */
export function vpt(candles: Candle[]): number {
  if (candles.length < 2) {
    return 0;
  }
  
  let currentVPT = 0;
  
  for (let i = 1; i < candles.length; i++) {
    const currentClose = candles[i].close;
    const previousClose = candles[i - 1].close;
    const currentVolume = candles[i].volume;
    
    // Calculate percentage price change
    const priceChange = (currentClose - previousClose) / previousClose;
    
    // Update VPT
    currentVPT += currentVolume * priceChange;
  }
  
  return currentVPT;
}

/**
 * Calculate Volume Moving Average
 * @param candles Array of candles
 * @param period Period for moving average
 */
export function volumeSMA(candles: Candle[], period = 20): number {
  if (candles.length < period) {
    return NaN;
  }
  
  const volumes = candles.map(c => c.volume);
  return sma(volumes, period);
}

/**
 * Calculate Volume-Weighted Moving Average (VWMA)
 * @param candles Array of candles
 * @param period Period for moving average
 */
export function vwma(candles: Candle[], period = 20): number {
  if (candles.length < period) {
    return NaN;
  }
  
  const slice = candles.slice(-period);
  let sumVolumePrice = 0;
  let sumVolume = 0;
  
  for (const candle of slice) {
    sumVolumePrice += candle.volume * candle.close;
    sumVolume += candle.volume;
  }
  
  if (sumVolume === 0) {
    return NaN;
  }
  
  return sumVolumePrice / sumVolume;
}

/**
 * Calculate Chaikin Money Flow (CMF)
 * @param candles Array of candles
 * @param period Period for calculation (default: 20)
 */
export function cmf(candles: Candle[], period = 20): number {
  if (candles.length < period) {
    return NaN;
  }
  
  let sumMoneyFlowVolume = 0;
  let sumVolume = 0;
  
  const slice = candles.slice(-period);
  
  for (const candle of slice) {
    // Money Flow Multiplier
    const high = candle.high;
    const low = candle.low;
    const close = candle.close;
    const volume = candle.volume;
    
    const range = high - low;
    
    // Avoid division by zero
    if (range === 0) {
      continue;
    }
    
    const moneyFlowMultiplier = ((close - low) - (high - close)) / range;
    const moneyFlowVolume = moneyFlowMultiplier * volume;
    
    sumMoneyFlowVolume += moneyFlowVolume;
    sumVolume += volume;
  }
  
  if (sumVolume === 0) {
    return 0;
  }
  
  return sumMoneyFlowVolume / sumVolume;
}

/**
 * Calculate Volume Profile (VPVR - Volume Profile Visible Range)
 * Groups volume into price buckets to see where most trading occurred
 * @param candles Array of candles
 * @param buckets Number of price buckets (default: 10)
 */
export function volumeProfile(candles: Candle[], buckets = 10): Array<{price: number, volume: number}> {
  if (candles.length < 2) {
    return [];
  }
  
  // Find price range
  let minPrice = candles[0].low;
  let maxPrice = candles[0].high;
  
  for (const candle of candles) {
    minPrice = Math.min(minPrice, candle.low);
    maxPrice = Math.max(maxPrice, candle.high);
  }
  
  // Add a small buffer to max price
  maxPrice = maxPrice * 1.001;
  
  // Initialize buckets
  const bucketSize = (maxPrice - minPrice) / buckets;
  const profile = Array(buckets).fill(0).map((_, i) => ({
    price: minPrice + bucketSize * (i + 0.5), // Middle of the bucket
    volume: 0
  }));
  
  // Assign volume to buckets
  for (const candle of candles) {
    // Approximate typical price
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    
    // Find bucket index
    const bucketIndex = Math.min(
      buckets - 1,
      Math.floor((typicalPrice - minPrice) / bucketSize)
    );
    
    // Add volume to bucket
    if (bucketIndex >= 0) {
      profile[bucketIndex].volume += candle.volume;
    }
  }
  
  return profile;
}

/**
 * Detect volume spikes (unusual volume)
 * @param candles Array of candles
 * @param lookbackPeriod Period to calculate average volume (default: 20)
 * @param threshold Threshold multiple of average volume (default: 2.5)
 * @returns True if current volume is a spike
 */
export function isVolumeSpike(candles: Candle[], lookbackPeriod = 20, threshold = 2.5): boolean {
  if (candles.length < lookbackPeriod + 1) {
    return false;
  }
  
  // Calculate average volume over lookback period
  const lookbackVolumes = candles.slice(-lookbackPeriod - 1, -1).map(c => c.volume);
  const avgVolume = lookbackVolumes.reduce((sum, vol) => sum + vol, 0) / lookbackPeriod;
  
  // Current volume
  const currentVolume = candles[candles.length - 1].volume;
  
  // Check if current volume exceeds threshold multiple of average volume
  return currentVolume > avgVolume * threshold;
}

/**
 * Detect if volume is confirming price movement
 * @returns 1 for confirmed uptrend, -1 for confirmed downtrend, 0 for no confirmation
 */
export function isVolumeConfirming(candles: Candle[], lookbackPeriod = 3): number {
  if (candles.length < lookbackPeriod + 1) {
    return 0;
  }
  
  // Check price trend
  const priceChange = candles[candles.length - 1].close - candles[candles.length - lookbackPeriod - 1].close;
  
  // Calculate average volume over lookback period
  const lookbackVolumes = candles.slice(-lookbackPeriod - 1, -1).map(c => c.volume);
  const avgVolume = lookbackVolumes.reduce((sum, vol) => sum + vol, 0) / lookbackPeriod;
  
  // Current volume
  const currentVolume = candles[candles.length - 1].volume;
  
  if (priceChange > 0 && currentVolume > avgVolume * 1.5) {
    // Uptrend with higher than average volume
    return 1;
  } else if (priceChange < 0 && currentVolume > avgVolume * 1.5) {
    // Downtrend with higher than average volume
    return -1;
  }
  
  return 0; // No confirmation
}
