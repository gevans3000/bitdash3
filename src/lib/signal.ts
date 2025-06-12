import type { Candle } from './types';
import { rsi14, ema, vwap, volumeSMA, bollingerBands } from './indicators';
import config from '../config/signals.json';

const emaFast = ema(config.emaPeriodFast);
const emaSlow = ema(config.emaPeriodSlow);

// Store last signal time for cooldown
let lastSignalTime = 0;

export interface SignalResult {
  signal: 'BUY' | 'SELL' | 'HOLD';
  reason: string;
}

export type Signal = 'BUY' | 'SELL' | 'HOLD';

export function getSignal(candles: Candle[]): SignalResult {
  if (!candles.length) return { signal: 'HOLD', reason: 'No data available' };
  
  const rsi = rsi14(candles);
  const e12 = emaFast(candles);
  const e26 = emaSlow(candles);
  const vw = vwap(candles);
  const bb = bollingerBands(candles);
  const lastCandle = candles[candles.length - 1];
  const lastPrice = lastCandle.close;
  const volSma = volumeSMA(candles, 20);
  
  // Volume check
  if (lastCandle.volume < volSma * config.volumeMultiplier) {
    return { 
      signal: 'HOLD', 
      reason: 'Low volume' 
    };
  }
  
  // Cooldown check
  const now = Date.now();
  const cooldownMs = config.signalCooldownMin * 60 * 1000;
  if (now - lastSignalTime < cooldownMs) {
    return { 
      signal: 'HOLD', 
      reason: 'Signal cooldown active' 
    };
  }
  
  // BUY signal condition 1: RSI + EMA crossover + Price > VWAP
  if (rsi < config.rsiBuy && e12 > e26 && lastPrice > vw) {
    lastSignalTime = now;
    return { 
      signal: 'BUY', 
      reason: 'RSI oversold + EMA bullish + Price > VWAP' 
    };
  }
  
  // BUY signal condition 2: Price near bottom Bollinger + RSI low
  if (lastPrice < bb.lower * 1.01 && rsi < config.rsiBuy * 1.1) {
    lastSignalTime = now;
    return { 
      signal: 'BUY', 
      reason: 'Price at BB bottom + Low RSI' 
    };
  }
  
  // SELL signal condition 1: RSI + EMA crossover + Price < VWAP
  if (rsi > config.rsiSell && e12 < e26 && lastPrice < vw) {
    lastSignalTime = now;
    return { 
      signal: 'SELL', 
      reason: 'RSI overbought + EMA bearish + Price < VWAP' 
    };
  }
  
  // SELL signal condition 2: Price near upper Bollinger + RSI high
  if (lastPrice > bb.upper * 0.99 && rsi > config.rsiSell * 0.9) {
    lastSignalTime = now;
    return { 
      signal: 'SELL', 
      reason: 'Price at BB top + High RSI' 
    };
  }
  
  return { signal: 'HOLD', reason: 'No clear signal' };
}
