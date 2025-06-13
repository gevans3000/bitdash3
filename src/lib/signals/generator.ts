import { Candle } from '../types';
import { pricePatterns, indicatorConditions, volumeConditions, ConditionResult } from './conditions';

export type SignalDirection = 'buy' | 'sell' | 'neutral';
export type SignalStrength = 'weak' | 'moderate' | 'strong' | 'very_strong';
export type SignalTimeframe = 'short_term' | 'medium_term' | 'long_term';

export interface Signal {
  direction: SignalDirection;
  strength: SignalStrength;
  confidence: number; // 0-100
  timestamp: number;
  timeframe: SignalTimeframe;
  reasons: string[];
}

/**
 * Generate trading signals based on multiple technical indicators and conditions
 */
export function generateSignals(candles: Candle[]): Signal[] {
  if (candles.length < 50) {
    return []; // Not enough data
  }
  
  // Check all conditions
  const conditions = checkAllConditions(candles);
  
  // Return signals for different timeframes
  return [
    generateShortTermSignal(conditions, candles),
    generateMediumTermSignal(conditions, candles),
  ].filter(signal => signal.confidence > 0);
}

/**
 * Check all technical conditions
 */
function checkAllConditions(candles: Candle[]): Record<string, ConditionResult> {
  const results: Record<string, ConditionResult> = {};
  
  // Price patterns
  for (const [name, fn] of Object.entries(pricePatterns)) {
    results[`pattern_${name}`] = fn(candles);
  }
  
  // Indicator conditions
  for (const [name, fn] of Object.entries(indicatorConditions)) {
    results[`indicator_${name}`] = fn(candles);
  }
  
  // Volume conditions
  for (const [name, fn] of Object.entries(volumeConditions)) {
    results[`volume_${name}`] = fn(candles);
  }
  
  return results;
}

/**
 * Generate a short-term signal (1-5 candles)
 */
function generateShortTermSignal(
  conditions: Record<string, ConditionResult>,
  candles: Candle[]
): Signal {
  // Initialize signal
  const signal: Signal = {
    direction: 'neutral',
    strength: 'weak',
    confidence: 0,
    timestamp: Date.now(),
    timeframe: 'short_term',
    reasons: []
  };
  
  // Bullish signals
  let bullishPoints = 0;
  let bearishPoints = 0;
  
  // Check bullish conditions
  if (conditions['pattern_bullishEngulfing'].met) {
    bullishPoints += conditions['pattern_bullishEngulfing'].confidence / 20;
    signal.reasons.push(conditions['pattern_bullishEngulfing'].reason!);
  }
  
  if (conditions['pattern_hammer'].met) {
    bullishPoints += conditions['pattern_hammer'].confidence / 20;
    signal.reasons.push(conditions['pattern_hammer'].reason!);
  }
  
  if (conditions['indicator_rsiOversold'].met) {
    bullishPoints += conditions['indicator_rsiOversold'].confidence / 20;
    signal.reasons.push(conditions['indicator_rsiOversold'].reason!);
  }
  
  if (conditions['indicator_goldenCross'].met) {
    bullishPoints += conditions['indicator_goldenCross'].confidence / 15;
    signal.reasons.push(conditions['indicator_goldenCross'].reason!);
  }
  
  if (conditions['indicator_priceBelowLowerBand'].met) {
    bullishPoints += conditions['indicator_priceBelowLowerBand'].confidence / 25;
    signal.reasons.push(conditions['indicator_priceBelowLowerBand'].reason!);
  }
  
  // Check bearish conditions
  if (conditions['pattern_bearishEngulfing'].met) {
    bearishPoints += conditions['pattern_bearishEngulfing'].confidence / 20;
    signal.reasons.push(conditions['pattern_bearishEngulfing'].reason!);
  }
  
  if (conditions['pattern_shootingStar'].met) {
    bearishPoints += conditions['pattern_shootingStar'].confidence / 20;
    signal.reasons.push(conditions['pattern_shootingStar'].reason!);
  }
  
  if (conditions['indicator_rsiOverbought'].met) {
    bearishPoints += conditions['indicator_rsiOverbought'].confidence / 20;
    signal.reasons.push(conditions['indicator_rsiOverbought'].reason!);
  }
  
  if (conditions['indicator_deathCross'].met) {
    bearishPoints += conditions['indicator_deathCross'].confidence / 15;
    signal.reasons.push(conditions['indicator_deathCross'].reason!);
  }
  
  if (conditions['indicator_priceAboveUpperBand'].met) {
    bearishPoints += conditions['indicator_priceAboveUpperBand'].confidence / 25;
    signal.reasons.push(conditions['indicator_priceAboveUpperBand'].reason!);
  }
  
  // Volume confirmation
  if (conditions['volume_volumeConfirmsPriceMove'].met) {
    // The direction of the volume confirmation
    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];
    
    if (lastCandle.close > prevCandle.close) {
      // Bullish move confirmed by volume
      bullishPoints += conditions['volume_volumeConfirmsPriceMove'].confidence / 20;
    } else {
      // Bearish move confirmed by volume
      bearishPoints += conditions['volume_volumeConfirmsPriceMove'].confidence / 20;
    }
    
    signal.reasons.push(conditions['volume_volumeConfirmsPriceMove'].reason!);
  }
  
  // Calculate net points and set signal direction
  const netPoints = bullishPoints - bearishPoints;
  
  if (netPoints > 1) {
    signal.direction = 'buy';
    signal.confidence = Math.min(100, Math.round(netPoints * 20));
  } else if (netPoints < -1) {
    signal.direction = 'sell';
    signal.confidence = Math.min(100, Math.round(Math.abs(netPoints) * 20));
  } else {
    signal.direction = 'neutral';
    signal.confidence = Math.min(100, Math.round(Math.abs(netPoints) * 10));
  }
  
  // Set signal strength based on confidence
  if (signal.confidence >= 80) {
    signal.strength = 'very_strong';
  } else if (signal.confidence >= 60) {
    signal.strength = 'strong';
  } else if (signal.confidence >= 40) {
    signal.strength = 'moderate';
  } else {
    signal.strength = 'weak';
  }
  
  return signal;
}

/**
 * Generate a medium-term signal (5-20 candles)
 */
function generateMediumTermSignal(
  conditions: Record<string, ConditionResult>,
  candles: Candle[]
): Signal {
  // Initialize signal
  const signal: Signal = {
    direction: 'neutral',
    strength: 'weak',
    confidence: 0,
    timestamp: Date.now(),
    timeframe: 'medium_term',
    reasons: []
  };
  
  // Medium-term signals rely more on indicators than patterns
  let bullishPoints = 0;
  let bearishPoints = 0;
  
  // Check bullish conditions (weighted for medium-term)
  if (conditions['indicator_goldenCross'].met) {
    bullishPoints += conditions['indicator_goldenCross'].confidence / 10;
    signal.reasons.push(conditions['indicator_goldenCross'].reason! + ' (medium-term)');
  }
  
  if (conditions['indicator_tripleEMAConfirmation'].met) {
    const currentPrice = candles[candles.length - 1].close;
    // Check if EMA9 > EMA21 > EMA50 indicates an uptrend
    if (currentPrice > candles[candles.length - 2].close) {
      bullishPoints += conditions['indicator_tripleEMAConfirmation'].confidence / 10;
      signal.reasons.push('Triple EMA confirmed uptrend (medium-term)');
    }
  }
  
  // Check bearish conditions
  if (conditions['indicator_deathCross'].met) {
    bearishPoints += conditions['indicator_deathCross'].confidence / 10;
    signal.reasons.push(conditions['indicator_deathCross'].reason! + ' (medium-term)');
  }
  
  if (conditions['indicator_tripleEMAConfirmation'].met) {
    const currentPrice = candles[candles.length - 1].close;
    // Check if EMA9 < EMA21 < EMA50 indicates a downtrend
    if (currentPrice < candles[candles.length - 2].close) {
      bearishPoints += conditions['indicator_tripleEMAConfirmation'].confidence / 10;
      signal.reasons.push('Triple EMA confirmed downtrend (medium-term)');
    }
  }
  
  // Look at trend over medium term
  const recentCandles = candles.slice(-10);
  let upCandles = 0;
  let downCandles = 0;
  
  for (let i = 1; i < recentCandles.length; i++) {
    if (recentCandles[i].close > recentCandles[i - 1].close) {
      upCandles++;
    } else if (recentCandles[i].close < recentCandles[i - 1].close) {
      downCandles++;
    }
  }
  
  if (upCandles >= 7) {
    bullishPoints += 3;
    signal.reasons.push('Medium-term uptrend (7+ up candles in last 10)');
  } else if (downCandles >= 7) {
    bearishPoints += 3;
    signal.reasons.push('Medium-term downtrend (7+ down candles in last 10)');
  }
  
  // Calculate net points and set signal direction
  const netPoints = bullishPoints - bearishPoints;
  
  if (netPoints > 1) {
    signal.direction = 'buy';
    signal.confidence = Math.min(100, Math.round(netPoints * 20));
  } else if (netPoints < -1) {
    signal.direction = 'sell';
    signal.confidence = Math.min(100, Math.round(Math.abs(netPoints) * 20));
  } else {
    signal.direction = 'neutral';
    signal.confidence = Math.min(100, Math.round(Math.abs(netPoints) * 10));
  }
  
  // Set signal strength based on confidence
  if (signal.confidence >= 80) {
    signal.strength = 'very_strong';
  } else if (signal.confidence >= 60) {
    signal.strength = 'strong';
  } else if (signal.confidence >= 40) {
    signal.strength = 'moderate';
  } else {
    signal.strength = 'weak';
  }
  
  return signal;
}

/**
 * Get the most confident signal
 */
export function getTopSignal(signals: Signal[]): Signal | null {
  if (signals.length === 0) return null;
  
  return signals.reduce((top, signal) => 
    signal.confidence > top.confidence ? signal : top, signals[0]);
}

/**
 * Format signal for display
 */
export function formatSignal(signal: Signal): string {
  const directionEmoji = signal.direction === 'buy' 
    ? '🟢' 
    : signal.direction === 'sell' 
      ? '🔴' 
      : '⚪';
  
  const strengthStars = {
    'weak': '★☆☆☆',
    'moderate': '★★☆☆',
    'strong': '★★★☆',
    'very_strong': '★★★★'
  }[signal.strength];
  
  return `${directionEmoji} ${signal.direction.toUpperCase()} (${signal.confidence}%) ${strengthStars}`;
}

/**
 * Get a quick summary of all signals
 */
export function getSignalSummary(signals: Signal[]): string {
  if (signals.length === 0) return 'No signals available';
  
  const buySignals = signals.filter(s => s.direction === 'buy');
  const sellSignals = signals.filter(s => s.direction === 'sell');
  const neutralSignals = signals.filter(s => s.direction === 'neutral');
  
  const buyConfidence = buySignals.length > 0 
    ? Math.round(buySignals.reduce((sum, s) => sum + s.confidence, 0) / buySignals.length)
    : 0;
    
  const sellConfidence = sellSignals.length > 0
    ? Math.round(sellSignals.reduce((sum, s) => sum + s.confidence, 0) / sellSignals.length)
    : 0;
  
  if (buySignals.length > sellSignals.length && buyConfidence > 50) {
    return `🟢 BUY - ${buySignals.length} signals (avg ${buyConfidence}% confidence)`;
  } else if (sellSignals.length > buySignals.length && sellConfidence > 50) {
    return `🔴 SELL - ${sellSignals.length} signals (avg ${sellConfidence}% confidence)`;
  } else {
    return `⚪ NEUTRAL - Market lacks clear direction`;
  }
}
