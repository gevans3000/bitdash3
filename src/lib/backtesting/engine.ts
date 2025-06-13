export interface Trade {
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  direction: 'long' | 'short';
  profit: number; // in decimal, e.g. 0.01 = 1%
}

export interface Metrics {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number; // percentage
  netProfit: number;
}

export interface BacktestResult {
  trades: Trade[];
  equity: number[];
  metrics: Metrics;
}

import { Candle } from '../types';
import { generateSignals, getTopSignal } from '../signals/generator';

export interface BacktestOptions {
  candles: Candle[];
  initialBalance?: number;
  startIndex?: number;
  endIndex?: number;
  preset?: 'default' | 'aggressive';
}

/**
 * Compute metrics from a list of trades and equity curve
 */
export function computeMetrics(trades: Trade[], equity: number[], initialBalance: number): Metrics {
  const wins = trades.filter(t => t.profit > 0).length;
  const losses = trades.filter(t => t.profit <= 0).length;
  let grossProfit = 0;
  let grossLoss = 0;
  for (const t of trades) {
    if (t.profit > 0) grossProfit += t.profit;
    else grossLoss += Math.abs(t.profit);
  }
  let maxDrawdown = 0;
  let peak = initialBalance;
  for (const value of equity) {
    if (value > peak) {
      peak = value;
    }
    const dd = (peak - value) / peak * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }
  const finalBalance = equity[equity.length - 1] || initialBalance;
  const netProfit = finalBalance - initialBalance;

  return {
    totalTrades: trades.length,
    winRate: trades.length ? (wins / trades.length) * 100 : 0,
    profitFactor: grossLoss === 0 ? Infinity : grossProfit / grossLoss,
    maxDrawdown,
    netProfit,
  };
}

/**
 * Run a simple backtest using existing signal logic
 */
export function runBacktest({ candles, initialBalance = 1000, startIndex = 50, endIndex = candles.length - 1, preset = 'default' }: BacktestOptions): BacktestResult {
  const trades: Trade[] = [];
  const equity: number[] = [initialBalance];
  let balance = initialBalance;
  let openTrade: { direction: 'long' | 'short'; entryPrice: number; entryIndex: number; stop: number; limit: number } | null = null;
  let cooldown = 0;

  for (let i = startIndex; i <= endIndex; i++) {
    const slice = candles.slice(0, i + 1);
    const current = candles[i];
    if (openTrade) {
      const { direction, entryPrice, stop, limit, entryIndex } = openTrade;
      const reachedStop = direction === 'long' ? current.low <= stop : current.high >= stop;
      const reachedLimit = direction === 'long' ? current.high >= limit : current.low <= limit;
      if (reachedStop || reachedLimit) {
        const exitPrice = reachedStop ? stop : limit;
        const profit = direction === 'long' ? (exitPrice - entryPrice) / entryPrice : (entryPrice - exitPrice) / entryPrice;
        balance *= 1 + profit;
        trades.push({ entryTime: candles[entryIndex].time, exitTime: current.time, entryPrice, exitPrice, direction, profit });
        equity.push(balance);
        openTrade = null;
        cooldown = 3; // wait 3 candles before next trade
        continue;
      }
      // move stop to breakeven after 6 candles
      if (i - entryIndex >= 6) {
        openTrade.stop = entryPrice;
      }
    } else if (cooldown === 0) {
      const signals = generateSignals(slice);
      const top = getTopSignal(signals);
      if (top && top.confidence >= 60 && top.direction !== 'neutral') {
        const direction = top.direction === 'buy' ? 'long' : 'short';
        const entryPrice = current.close;
        const stop = direction === 'long' ? entryPrice * (1 - 0.008) : entryPrice * (1 + 0.008);
        const limit = direction === 'long' ? entryPrice * (1 + 0.02) : entryPrice * (1 - 0.02);
        openTrade = { direction, entryPrice, entryIndex: i, stop, limit };
      }
    }

    if (cooldown > 0 && !openTrade) cooldown--;
    if (!openTrade) equity.push(balance);
  }

  const metrics = computeMetrics(trades, equity, initialBalance);
  return { trades, equity, metrics };
}
