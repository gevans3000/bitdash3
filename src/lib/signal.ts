import type { Candle } from './types';
import { rsi14, ema, volumeSMA, bollingerBands } from './indicators';
import config from '../config/signals.json';

const emaFast = ema(config.emaPeriodFast);
const emaSlow = ema(config.emaPeriodSlow);

// Store last signal times for cooldown per trade side
let lastBuyTime = 0;
let lastSellTime = 0;

interface ActiveTrade {
  side: 'BUY' | 'SELL';
  entryTime: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
}

// Track the currently open trade (if any)
let activeTrade: ActiveTrade | null = null;

function isCooldown(side: 'BUY' | 'SELL', now: number) {
  const last = side === 'BUY' ? lastBuyTime : lastSellTime;
  return now - last < config.signalCooldownMin * 60 * 1000;
}

function openTrade(side: 'BUY' | 'SELL', price: number, now: number, reason: string): SignalResult {
  const params = riskParams(price, side);
  if (side === 'BUY') lastBuyTime = now; else lastSellTime = now;
  activeTrade = { side, entryTime: now, entryPrice: price, ...params };
  return { signal: side, reason, ...params };
}

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

  const now = Date.now();

  // Breakeven stop adjustment
  if (activeTrade && now - activeTrade.entryTime >= 6 * 5 * 60 * 1000 && activeTrade.stopLoss !== activeTrade.entryPrice) {
    activeTrade.stopLoss = activeTrade.entryPrice;
    return {
      signal: 'HOLD',
      reason: 'Stop moved to breakeven',
      stopLoss: activeTrade.stopLoss,
      takeProfit: activeTrade.takeProfit,
    };
  }

  // Cooldown checks will run per trade side

  // Bollinger/RSI extremes override
  if (rsi > config.rsiSell && lastPrice > bb.upper && !isCooldown('SELL', now)) {
    return openTrade('SELL', lastPrice, now, 'RSI overbought & above band');
  }

  if (rsi < config.rsiBuy && lastPrice < bb.lower && !isCooldown('BUY', now)) {
    return openTrade('BUY', lastPrice, now, 'RSI oversold & below band');
  }

  // EMA crossover logic
  if (!Number.isNaN(fast) && !Number.isNaN(slow)) {
    const prevFast = emaFast(candles.slice(0, -1));
    const prevSlow = emaSlow(candles.slice(0, -1));
    const crossUp = prevFast <= prevSlow && fast > slow;
    const crossDown = prevFast >= prevSlow && fast < slow;

    if (crossUp && !isCooldown('BUY', now)) {
      return openTrade('BUY', lastPrice, now, 'EMA cross up');
    }
    if (crossDown && !isCooldown('SELL', now)) {
      return openTrade('SELL', lastPrice, now, 'EMA cross down');
    }
  }

  return { signal: 'HOLD', reason: 'No clear signal' };
}
