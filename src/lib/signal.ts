import type { Candle } from './types';
import { rsi14, ema, volumeSMA, bollingerBands } from './indicators';
import config from '../config/signals.json';

const emaFast = ema(config.emaPeriodFast);
const emaSlow = ema(config.emaPeriodSlow);

// Store last signal time for cooldown
let lastSignalTime = 0;

function riskParams(entry: number, side: 'BUY' | 'SELL') {
  if (side === 'BUY') {
    return {
      stopLoss: entry * (1 - 0.008),
      takeProfit: entry * 1.02,
    };
  }
  return {
    stopLoss: entry * (1 + 0.008),
    takeProfit: entry * 0.98,
  };
}

export interface SignalResult {
  signal: 'BUY' | 'SELL' | 'HOLD';
  reason: string;
  stopLoss?: number;
  takeProfit?: number;
}

export type Signal = 'BUY' | 'SELL' | 'HOLD';

export function getSignal(candles: Candle[]): SignalResult {
  if (!candles.length) return { signal: 'HOLD', reason: 'No data available' };

  const rsi = rsi14(candles);
  const fast = emaFast(candles);
  const slow = emaSlow(candles);
  const bb = bollingerBands(candles);
  const lastCandle = candles[candles.length - 1];
  const lastPrice = lastCandle.close;
  const volSma = volumeSMA(candles, 20);

  // Volume confirmation
  if (lastCandle.volume < volSma * config.volumeMultiplier) {
    return { signal: 'HOLD', reason: 'Low volume' };
  }

  // Cooldown enforcement
  const now = Date.now();
  if (now - lastSignalTime < config.signalCooldownMin * 60 * 1000) {
    return { signal: 'HOLD', reason: 'Signal cooldown active' };
  }

  // Bollinger/RSI extremes override
  if (rsi > config.rsiSell && lastPrice > bb.upper) {
    lastSignalTime = now;
    return { signal: 'SELL', reason: 'RSI overbought & above band', ...riskParams(lastPrice, 'SELL') };
  }

  if (rsi < config.rsiBuy && lastPrice < bb.lower) {
    lastSignalTime = now;
    return { signal: 'BUY', reason: 'RSI oversold & below band', ...riskParams(lastPrice, 'BUY') };
  }

  // EMA crossover logic
  if (!Number.isNaN(fast) && !Number.isNaN(slow)) {
    const prevFast = emaFast(candles.slice(0, -1));
    const prevSlow = emaSlow(candles.slice(0, -1));
    const crossUp = prevFast <= prevSlow && fast > slow;
    const crossDown = prevFast >= prevSlow && fast < slow;

    if (crossUp) {
      lastSignalTime = now;
      return { signal: 'BUY', reason: 'EMA cross up', ...riskParams(lastPrice, 'BUY') };
    }
    if (crossDown) {
      lastSignalTime = now;
      return { signal: 'SELL', reason: 'EMA cross down', ...riskParams(lastPrice, 'SELL') };
    }
  }

  return { signal: 'HOLD', reason: 'No clear signal' };
}
