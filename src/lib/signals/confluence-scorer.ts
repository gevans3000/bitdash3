import { Candle } from '../types';
import { MarketRegime } from '../market/regime';
import { rsi } from '../indicators/oscillators';
import { ema } from '../indicators/moving-averages';
import { atr, bollingerBands } from '../indicators/volatility';

export interface ConfluenceSignal {
  score: number;
  maxScore: number;
  confidence: number;
  signals: SignalComponent[];
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  regime: MarketRegime;
}

export interface SignalComponent {
  name: string;
  points: number;
  active: boolean;
  description: string;
}

export class ConfluenceScorer {
  private static readonly MIN_SCORE_THRESHOLD = 5;
  private static readonly MAX_SCORE = 9;

  /**
   * Calculate confluence score based on market regime and technical indicators
   */
  public static calculateScore(
    candles: Candle[],
    regime: MarketRegime,
    currentPrice: number
  ): ConfluenceSignal {
    if (candles.length < 50) {
      return this.createEmptySignal(regime);
    }

    const signals: SignalComponent[] = [];
    let totalScore = 0;

    // EMA Crossover Signal (3 points)
    const emaSignal = this.evaluateEMACrossover(candles);
    signals.push(emaSignal);
    if (emaSignal.active) totalScore += emaSignal.points;

    // RSI Confirmation (2 points)
    const rsiSignal = this.evaluateRSI(candles, regime);
    signals.push(rsiSignal);
    if (rsiSignal.active) totalScore += rsiSignal.points;

    // Volume Spike (2 points)
    const volumeSignal = this.evaluateVolume(candles);
    signals.push(volumeSignal);
    if (volumeSignal.active) totalScore += volumeSignal.points;

    // Bollinger Band Touch (2 points)
    const bbSignal = this.evaluateBollingerBands(candles, currentPrice, regime);
    signals.push(bbSignal);
    if (bbSignal.active) totalScore += bbSignal.points;

    const confidence = (totalScore / this.MAX_SCORE) * 100;
    const recommendation = this.determineRecommendation(totalScore, signals, regime);

    return {
      score: totalScore,
      maxScore: this.MAX_SCORE,
      confidence,
      signals,
      recommendation,
      regime
    };
  }

  private static evaluateEMACrossover(candles: Candle[]): SignalComponent {
    const closes = candles.map(c => c.close);
    const ema9 = ema(closes, 9);
    const ema21 = ema(closes, 21);
    
    if (candles.length < 3) {
      return {
        name: 'EMA Crossover',
        points: 3,
        active: false,
        description: 'Insufficient data for EMA crossover'
      };
    }

    const current9 = ema9[ema9.length - 1];
    const current21 = ema21[ema21.length - 1];
    const prev9 = ema9[ema9.length - 2];
    const prev21 = ema21[ema21.length - 2];

    const bullishCross = prev9 <= prev21 && current9 > current21;
    const bearishCross = prev9 >= prev21 && current9 < current21;

    return {
      name: 'EMA Crossover',
      points: 3,
      active: bullishCross || bearishCross,
      description: bullishCross ? 'EMA 9 crossed above EMA 21 (bullish)' : 
                   bearishCross ? 'EMA 9 crossed below EMA 21 (bearish)' : 
                   'No EMA crossover detected'
    };
  }

  private static evaluateRSI(candles: Candle[], regime: MarketRegime): SignalComponent {
    const rsiValue = rsi(candles, 14);
    
    if (isNaN(rsiValue)) {
      return {
        name: 'RSI Confirmation',
        points: 2,
        active: false,
        description: 'Insufficient data for RSI calculation'
      };
    }

    let active = false;
    let description = '';

    if (regime === 'ranging') {
      // In ranging markets, look for overbought/oversold
      active = rsiValue > 70 || rsiValue < 30;
      description = rsiValue > 70 ? 'RSI overbought (>70) - bearish' :
                   rsiValue < 30 ? 'RSI oversold (<30) - bullish' :
                   `RSI neutral (${rsiValue.toFixed(1)})`;
    } else {
      // In trending markets, look for momentum confirmation
      active = (rsiValue > 45 && rsiValue < 80) || (rsiValue < 55 && rsiValue > 20);
      description = rsiValue > 50 ? `RSI bullish momentum (${rsiValue.toFixed(1)})` :
                   `RSI bearish momentum (${rsiValue.toFixed(1)})`;
    }

    return {
      name: 'RSI Confirmation',
      points: 2,
      active,
      description
    };
  }

  private static evaluateVolume(candles: Candle[]): SignalComponent {
    if (candles.length < 20) {
      return {
        name: 'Volume Spike',
        points: 2,
        active: false,
        description: 'Insufficient data for volume analysis'
      };
    }

    const currentVolume = candles[candles.length - 1].volume;
    const volumes = candles.slice(-20).map(c => c.volume);
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    
    const volumeRatio = currentVolume / avgVolume;
    const active = volumeRatio >= 1.5;

    return {
      name: 'Volume Spike',
      points: 2,
      active,
      description: active ? 
        `Volume spike detected (${volumeRatio.toFixed(1)}x average)` :
        `Normal volume (${volumeRatio.toFixed(1)}x average)`
    };
  }

  private static evaluateBollingerBands(
    candles: Candle[], 
    currentPrice: number, 
    regime: MarketRegime
  ): SignalComponent {
    const bands = bollingerBands(candles, 20, 2);
    
    if (isNaN(bands.upper) || isNaN(bands.lower)) {
      return {
        name: 'Bollinger Band Touch',
        points: 2,
        active: false,
        description: 'Insufficient data for Bollinger Bands'
      };
    }

    const touchUpper = currentPrice >= bands.upper * 0.995; // Within 0.5% of upper band
    const touchLower = currentPrice <= bands.lower * 1.005; // Within 0.5% of lower band
    
    let active = false;
    let description = '';

    if (regime === 'ranging') {
      // In ranging markets, band touches are reversal signals
      active = touchUpper || touchLower;
      description = touchUpper ? 'Price at upper BB - potential reversal' :
                   touchLower ? 'Price at lower BB - potential reversal' :
                   'Price within Bollinger Bands';
    } else {
      // In trending markets, band touches can be continuation signals
      active = touchUpper || touchLower;
      description = touchUpper ? 'Price at upper BB - trend strength' :
                   touchLower ? 'Price at lower BB - trend weakness' :
                   'Price within Bollinger Bands';
    }

    return {
      name: 'Bollinger Band Touch',
      points: 2,
      active,
      description
    };
  }

  private static determineRecommendation(
    score: number, 
    signals: SignalComponent[], 
    regime: MarketRegime
  ): 'BUY' | 'SELL' | 'HOLD' {
    if (score < this.MIN_SCORE_THRESHOLD) {
      return 'HOLD';
    }

    // Analyze signal components to determine direction
    const emaSignal = signals.find(s => s.name === 'EMA Crossover');
    const rsiSignal = signals.find(s => s.name === 'RSI Confirmation');
    const bbSignal = signals.find(s => s.name === 'Bollinger Band Touch');

    let bullishSignals = 0;
    let bearishSignals = 0;

    // EMA direction
    if (emaSignal?.active) {
      if (emaSignal.description.includes('above')) bullishSignals++;
      if (emaSignal.description.includes('below')) bearishSignals++;
    }

    // RSI direction
    if (rsiSignal?.active) {
      if (rsiSignal.description.includes('bullish') || rsiSignal.description.includes('oversold')) {
        bullishSignals++;
      }
      if (rsiSignal.description.includes('bearish') || rsiSignal.description.includes('overbought')) {
        bearishSignals++;
      }
    }

    // Bollinger Band context
    if (bbSignal?.active) {
      if (regime === 'ranging') {
        // In ranging markets, band touches are contrarian
        if (bbSignal.description.includes('lower')) bullishSignals++;
        if (bbSignal.description.includes('upper')) bearishSignals++;
      } else {
        // In trending markets, band touches can be continuation
        if (bbSignal.description.includes('upper')) bullishSignals++;
        if (bbSignal.description.includes('lower')) bearishSignals++;
      }
    }

    return bullishSignals > bearishSignals ? 'BUY' : 
           bearishSignals > bullishSignals ? 'SELL' : 'HOLD';
  }

  private static createEmptySignal(regime: MarketRegime): ConfluenceSignal {
    return {
      score: 0,
      maxScore: this.MAX_SCORE,
      confidence: 0,
      signals: [],
      recommendation: 'HOLD',
      regime
    };
  }
}

import { IndicatorDataSet } from '../agents/types';

export function getSignalConfluence(indicators: IndicatorDataSet, regime: MarketRegime): { action: 'BUY' | 'SELL' | 'HOLD'; confidence: number; reason: string } {
  if (!indicators.emaFast || !indicators.emaSlow || !indicators.rsi) {
    return { action: 'HOLD', confidence: 0, reason: 'Insufficient indicators' };
  }

  if (indicators.emaFast > indicators.emaSlow && indicators.rsi > 55) {
    return { action: 'BUY', confidence: 70, reason: 'EMA fast above slow and RSI >55' };
  }

  if (indicators.emaFast < indicators.emaSlow && indicators.rsi < 45) {
    return { action: 'SELL', confidence: 70, reason: 'EMA fast below slow and RSI <45' };
  }

  return { action: 'HOLD', confidence: 50, reason: 'No strong signal' };
}
