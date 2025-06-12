import type { Candle } from './types';
import { rsi14, ema, vwap, volumeSMA } from './indicators';
import config from '../config/signals.json';

const emaFast = ema(config.emaPeriodFast);
const emaSlow = ema(config.emaPeriodSlow);

// Store last signal time for cooldown
let lastSignalTime = 0;

export type Signal = 'BUY' | 'SELL' | 'HOLD';

export function getSignal(candles: Candle[]): Signal {
  if (!candles.length) return 'HOLD';
  
  const rsi = rsi14(candles);
  const e12 = emaFast(candles);
  const e26 = emaSlow(candles);
  const vw = vwap(candles);
  const lastCandle = candles[candles.length - 1];
  const lastPrice = lastCandle.close;
  const volSma = volumeSMA(candles, 20);
  
  // Volume check
  if (lastCandle.volume < volSma * config.volumeMultiplier) {
    return 'HOLD';
  }
  
  // Cooldown check
  const now = Date.now();
  const cooldownMs = config.signalCooldownMin * 60 * 1000;
  if (now - lastSignalTime < cooldownMs) {
    return 'HOLD';
  }
  
  // BUY signal
  if (rsi < config.rsiBuy && e12 > e26 && lastPrice > vw) {
    lastSignalTime = now;
    return 'BUY';
  }
  
  // SELL signal
  if (rsi > config.rsiSell && e12 < e26 && lastPrice < vw) {
    lastSignalTime = now;
    return 'SELL';
  }
  
  return 'HOLD';
}
