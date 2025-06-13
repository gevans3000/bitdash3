import { Candle } from '../types';
import { bollingerBands } from '../indicators/volatility';
import { rsi } from '../indicators/oscillators';
import { candleEMA, multiEMA, detectCrossover } from '../indicators/moving-averages';
import { isVolumeConfirming } from '../indicators/volume';

export interface ConditionResult {
  met: boolean;
  confidence: number; // 0-100
  reason?: string;
}

/**
 * Detect price action patterns
 */
export const pricePatterns = {
  /**
   * Detect bullish engulfing pattern
   */
  bullishEngulfing(candles: Candle[]): ConditionResult {
    // Safety checks for proper candle data
    if (!candles || !Array.isArray(candles) || candles.length < 2) {
      return { met: false, confidence: 0 };
    }
    
    const current = candles[candles.length - 1];
    const previous = candles[candles.length - 2];
    
    // Additional safety check for data integrity
    if (!current || !previous || 
        typeof current.close !== 'number' || 
        typeof current.open !== 'number' || 
        typeof previous.close !== 'number' || 
        typeof previous.open !== 'number') {
      return { met: false, confidence: 0 };
    }
    
    // Bearish candle followed by bullish candle
    const previousBearish = previous.close < previous.open;
    const currentBullish = current.close > current.open;
    
    // Current candle engulfs previous candle
    const engulfs = current.open < previous.close && current.close > previous.open;
    
    const met = previousBearish && currentBullish && engulfs;
    
    // Confidence based on size of engulfing and volume
    let confidence = 0;
    if (met) {
      const bodySize = Math.abs(current.close - current.open) / current.open;
      const volumeIncrease = current.volume / previous.volume;
      confidence = Math.min(100, Math.floor(50 + bodySize * 300 + volumeIncrease * 10));
    }
    
    return {
      met,
      confidence,
      reason: met ? 'Bullish engulfing pattern detected' : undefined
    };
  },
  
  /**
   * Detect bearish engulfing pattern
   */
  bearishEngulfing(candles: Candle[]): ConditionResult {
    if (candles.length < 2) {
      return { met: false, confidence: 0 };
    }
    
    const current = candles[candles.length - 1];
    const previous = candles[candles.length - 2];
    
    // Bullish candle followed by bearish candle
    const previousBullish = previous.close > previous.open;
    const currentBearish = current.close < current.open;
    
    // Current candle engulfs previous candle
    const engulfs = current.open > previous.close && current.close < previous.open;
    
    const met = previousBullish && currentBearish && engulfs;
    
    // Confidence based on size of engulfing and volume
    let confidence = 0;
    if (met) {
      const bodySize = Math.abs(current.close - current.open) / current.open;
      const volumeIncrease = current.volume / previous.volume;
      confidence = Math.min(100, Math.floor(50 + bodySize * 300 + volumeIncrease * 10));
    }
    
    return {
      met,
      confidence,
      reason: met ? 'Bearish engulfing pattern detected' : undefined
    };
  },
  
  /**
   * Detect hammer pattern (potential reversal)
   */
  hammer(candles: Candle[]): ConditionResult {
    if (candles.length < 3) {
      return { met: false, confidence: 0 };
    }
    
    const current = candles[candles.length - 1];
    
    // Check for downtrend in previous candles
    const downtrend = candles[candles.length - 3].close > candles[candles.length - 2].close;
    
    // Calculate body and shadow proportions
    const body = Math.abs(current.open - current.close);
    const upperShadow = current.high - Math.max(current.open, current.close);
    const lowerShadow = Math.min(current.open, current.close) - current.low;
    
    // Hammer has small body, small upper shadow, and long lower shadow
    const smallBody = body < (current.high - current.low) * 0.3;
    const smallUpperShadow = upperShadow < body;
    const longLowerShadow = lowerShadow > body * 2;
    
    const isHammer = smallBody && smallUpperShadow && longLowerShadow;
    const met = downtrend && isHammer;
    
    // Confidence based on shadow proportions and confirmation
    let confidence = 0;
    if (met) {
      const shadowRatio = lowerShadow / body;
      confidence = Math.min(100, Math.floor(40 + shadowRatio * 10));
      
      // Add confirmation if next candle is bullish
      if (candles.length > 3) {
        const nextCandle = candles[candles.length - 1];
        if (nextCandle.close > nextCandle.open) {
          confidence = Math.min(100, confidence + 20);
        }
      }
    }
    
    return {
      met,
      confidence,
      reason: met ? 'Hammer pattern detected' : undefined
    };
  },
  
  /**
   * Detect shooting star pattern (potential bearish reversal)
   */
  shootingStar(candles: Candle[]): ConditionResult {
    if (candles.length < 3) {
      return { met: false, confidence: 0 };
    }
    
    const current = candles[candles.length - 1];
    
    // Check for uptrend in previous candles
    const uptrend = candles[candles.length - 3].close < candles[candles.length - 2].close;
    
    // Calculate body and shadow proportions
    const body = Math.abs(current.open - current.close);
    const upperShadow = current.high - Math.max(current.open, current.close);
    const lowerShadow = Math.min(current.open, current.close) - current.low;
    
    // Shooting star has small body, long upper shadow, and small lower shadow
    const smallBody = body < (current.high - current.low) * 0.3;
    const longUpperShadow = upperShadow > body * 2;
    const smallLowerShadow = lowerShadow < body;
    
    const isShootingStar = smallBody && longUpperShadow && smallLowerShadow;
    const met = uptrend && isShootingStar;
    
    // Confidence based on shadow proportions and confirmation
    let confidence = 0;
    if (met) {
      const shadowRatio = upperShadow / body;
      confidence = Math.min(100, Math.floor(40 + shadowRatio * 10));
      
      // Add confirmation if next candle is bearish
      if (candles.length > 3) {
        const nextCandle = candles[candles.length - 1];
        if (nextCandle.close < nextCandle.open) {
          confidence = Math.min(100, confidence + 20);
        }
      }
    }
    
    return {
      met,
      confidence,
      reason: met ? 'Shooting star pattern detected' : undefined
    };
  },
  
  /**
   * Detect doji pattern (indecision)
   */
  doji(candles: Candle[]): ConditionResult {
    if (candles.length < 1) {
      return { met: false, confidence: 0 };
    }
    
    const current = candles[candles.length - 1];
    
    // Calculate body and total range
    const body = Math.abs(current.open - current.close);
    const totalRange = current.high - current.low;
    
    // Doji has very small body compared to total range
    const isDoji = body < totalRange * 0.1;
    
    // Confidence based on body to range ratio
    let confidence = 0;
    if (isDoji) {
      const bodyToRangeRatio = body / totalRange;
      confidence = Math.min(100, Math.floor(90 - bodyToRangeRatio * 500));
    }
    
    return {
      met: isDoji,
      confidence,
      reason: isDoji ? 'Doji pattern detected (market indecision)' : undefined
    };
  }
};

/**
 * Indicator-based technical conditions
 */
export const indicatorConditions = {
  /**
   * RSI oversold condition
   */
  rsiOversold(candles: Candle[], threshold = 30): ConditionResult {
    if (candles.length < 15) {
      return { met: false, confidence: 0 };
    }
    
    const rsiValue = rsi(candles);
    const met = rsiValue < threshold;
    
    // Confidence increases as RSI decreases
    let confidence = 0;
    if (met) {
      confidence = Math.min(100, Math.floor(100 - ((rsiValue / threshold) * 100)));
    }
    
    return {
      met,
      confidence,
      reason: met ? `RSI oversold (${rsiValue.toFixed(2)} < ${threshold})` : undefined
    };
  },
  
  /**
   * RSI overbought condition
   */
  rsiOverbought(candles: Candle[], threshold = 70): ConditionResult {
    if (candles.length < 15) {
      return { met: false, confidence: 0 };
    }
    
    const rsiValue = rsi(candles);
    const met = rsiValue > threshold;
    
    // Confidence increases as RSI increases
    let confidence = 0;
    if (met) {
      confidence = Math.min(100, Math.floor(((rsiValue - threshold) / (100 - threshold)) * 100));
    }
    
    return {
      met,
      confidence,
      reason: met ? `RSI overbought (${rsiValue.toFixed(2)} > ${threshold})` : undefined
    };
  },
  
  /**
   * Golden cross (short-term MA crosses above long-term MA)
   */
  goldenCross(candles: Candle[], fastPeriod = 9, slowPeriod = 21): ConditionResult {
    if (candles.length < slowPeriod + 5) {
      return { met: false, confidence: 0 };
    }
    
    const recentCandles = candles.slice(-slowPeriod - 5);
    
    // Calculate EMAs for recent candles
    const closes = recentCandles.map(c => c.close);
    let fastEMAs = [];
    let slowEMAs = [];
    
    for (let i = 0; i < 5; i++) {
      const slicedCandles = recentCandles.slice(0, recentCandles.length - i);
      fastEMAs.push(candleEMA(slicedCandles, fastPeriod));
      slowEMAs.push(candleEMA(slicedCandles, slowPeriod));
    }
    
    // Check for golden cross (fast MA crosses above slow MA)
    const crossUp = fastEMAs[0] > slowEMAs[0] && fastEMAs[1] <= slowEMAs[1];
    const met = crossUp;
    
    // Confidence based on steepness of cross and volume confirmation
    let confidence = 0;
    if (met) {
      const crossAngle = (fastEMAs[0] - fastEMAs[1]) / fastEMAs[1];
      confidence = Math.min(100, Math.floor(50 + crossAngle * 2000));
      
      // Add volume confirmation
      const volumeConfirmation = isVolumeConfirming(candles, 3);
      if (volumeConfirmation > 0) {
        confidence = Math.min(100, confidence + 20);
      }
    }
    
    return {
      met,
      confidence,
      reason: met ? `Golden cross (${fastPeriod}/${slowPeriod} EMAs)` : undefined
    };
  },
  
  /**
   * Death cross (short-term MA crosses below long-term MA)
   */
  deathCross(candles: Candle[], fastPeriod = 9, slowPeriod = 21): ConditionResult {
    if (candles.length < slowPeriod + 5) {
      return { met: false, confidence: 0 };
    }
    
    const recentCandles = candles.slice(-slowPeriod - 5);
    
    // Calculate EMAs for recent candles
    const closes = recentCandles.map(c => c.close);
    let fastEMAs = [];
    let slowEMAs = [];
    
    for (let i = 0; i < 5; i++) {
      const slicedCandles = recentCandles.slice(0, recentCandles.length - i);
      fastEMAs.push(candleEMA(slicedCandles, fastPeriod));
      slowEMAs.push(candleEMA(slicedCandles, slowPeriod));
    }
    
    // Check for death cross (fast MA crosses below slow MA)
    const crossDown = fastEMAs[0] < slowEMAs[0] && fastEMAs[1] >= slowEMAs[1];
    const met = crossDown;
    
    // Confidence based on steepness of cross and volume confirmation
    let confidence = 0;
    if (met) {
      const crossAngle = (fastEMAs[1] - fastEMAs[0]) / fastEMAs[1];
      confidence = Math.min(100, Math.floor(50 + crossAngle * 2000));
      
      // Add volume confirmation
      const volumeConfirmation = isVolumeConfirming(candles, 3);
      if (volumeConfirmation < 0) {
        confidence = Math.min(100, confidence + 20);
      }
    }
    
    return {
      met,
      confidence,
      reason: met ? `Death cross (${fastPeriod}/${slowPeriod} EMAs)` : undefined
    };
  },
  
  /**
   * Price breaks above Bollinger Band upper band
   */
  priceAboveUpperBand(candles: Candle[], period = 20, stdDev = 2): ConditionResult {
    if (candles.length < period) {
      return { met: false, confidence: 0 };
    }
    
    const bands = bollingerBands(candles, period, stdDev);
    const currentPrice = candles[candles.length - 1].close;
    const met = currentPrice > bands.upper;
    
    // Confidence based on how far price is above the upper band
    let confidence = 0;
    if (met) {
      const deviation = (currentPrice - bands.upper) / bands.upper;
      confidence = Math.min(100, Math.floor(50 + deviation * 1000));
    }
    
    return {
      met,
      confidence,
      reason: met ? `Price above upper Bollinger Band (${period}, ${stdDev})` : undefined
    };
  },
  
  /**
   * Price breaks below Bollinger Band lower band
   */
  priceBelowLowerBand(candles: Candle[], period = 20, stdDev = 2): ConditionResult {
    if (candles.length < period) {
      return { met: false, confidence: 0 };
    }
    
    const bands = bollingerBands(candles, period, stdDev);
    const currentPrice = candles[candles.length - 1].close;
    const met = currentPrice < bands.lower;
    
    // Confidence based on how far price is below the lower band
    let confidence = 0;
    if (met) {
      const deviation = (bands.lower - currentPrice) / bands.lower;
      confidence = Math.min(100, Math.floor(50 + deviation * 1000));
    }
    
    return {
      met,
      confidence,
      reason: met ? `Price below lower Bollinger Band (${period}, ${stdDev})` : undefined
    };
  },
  
  /**
   * Triple EMA confirmation (all pointing in same direction)
   */
  tripleEMAConfirmation(candles: Candle[]): ConditionResult {
    if (candles.length < 50) {
      return { met: false, confidence: 0 };
    }
    
    // Calculate fast (9), medium (21), slow (50) EMAs
    const emas = multiEMA(candles, [9, 21, 50]);
    
    // Check if they are in order
    const bullish = emas[9] > emas[21] && emas[21] > emas[50];
    const bearish = emas[9] < emas[21] && emas[21] < emas[50];
    
    const met = bullish || bearish;
    const sentiment = bullish ? 'bullish' : 'bearish';
    
    // Calculate confidence based on spacing between EMAs
    let confidence = 0;
    if (met) {
      // Measure the percentage gap between EMAs
      const gap1 = Math.abs(emas[9] - emas[21]) / emas[21];
      const gap2 = Math.abs(emas[21] - emas[50]) / emas[50];
      
      confidence = Math.min(100, Math.floor(50 + (gap1 + gap2) * 1000));
    }
    
    return {
      met,
      confidence,
      reason: met ? `Triple EMA confirmation (${sentiment})` : undefined
    };
  }
};

/**
 * Volume-based conditions
 */
export const volumeConditions = {
  /**
   * Volume confirms price movement
   */
  volumeConfirmsPriceMove(candles: Candle[]): ConditionResult {
    if (candles.length < 5) {
      return { met: false, confidence: 0 };
    }
    
    const confirmation = isVolumeConfirming(candles);
    const met = confirmation !== 0;
    const direction = confirmation > 0 ? 'uptrend' : 'downtrend';
    
    // Calculate confidence based on volume increase
    let confidence = 0;
    if (met) {
      const current = candles[candles.length - 1];
      const previousVolumes = candles.slice(-6, -1).map(c => c.volume);
      const avgPrevVolume = previousVolumes.reduce((sum, vol) => sum + vol, 0) / previousVolumes.length;
      
      const volumeIncrease = current.volume / avgPrevVolume;
      confidence = Math.min(100, Math.floor(40 + volumeIncrease * 20));
    }
    
    return {
      met,
      confidence,
      reason: met ? `Volume confirms ${direction}` : undefined
    };
  }
};
