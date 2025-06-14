import type { Candle } from './types';
import { rsi14, ema, volumeSMA, bollingerBands } from './indicators';
import { StrategyAutomaticSwitcher, TradingSignal } from './signals/strategy-switcher';
import { MarketRegimeDetector, MarketRegime } from './market/regime';
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

// Initialize regime detector
const regimeDetector = new MarketRegimeDetector();

// Fallback to simple EMA crossover when strategy fails
function getFallbackSignal(candles: Candle[]): SignalResult {
  if (candles.length < 30) return { signal: 'HOLD', reason: 'Insufficient data for fallback' };
  
  const emaFast = ema(9);
  const emaSlow = ema(21);
  
  const fast = emaFast(candles.map(c => c.close));
  const slow = emaSlow(candles.map(c => c.close));
  
  if (fast[fast.length - 1] > slow[slow.length - 1] && fast[fast.length - 2] <= slow[slow.length - 2]) {
    return { signal: 'BUY', reason: 'EMA Crossover (Fallback)' };
  } else if (fast[fast.length - 1] < slow[slow.length - 1] && fast[fast.length - 2] >= slow[slow.length - 2]) {
    return { signal: 'SELL', reason: 'EMA Crossover (Fallback)' };
  }
  
  return { signal: 'HOLD', reason: 'No crossover (Fallback)' };
}

export function getSignal(candles: Candle[]): SignalResult {
  // Basic validation
  if (!candles || !Array.isArray(candles) || candles.length === 0) {
    console.error('Invalid or empty candles array');
    return { signal: 'HOLD', reason: 'No data available' };
  }

  const lastCandle = candles[candles.length - 1];
  const lastPrice = lastCandle.close;
  const now = Date.now();

  // Update regime detection
  let currentRegime: MarketRegime = 'ranging';
  if (candles.length >= 28) { // Need enough data for ADX calculation
    currentRegime = regimeDetector.update(lastCandle);
  }

  // Check active trade exit conditions first
  if (activeTrade) {
    const { side, stopLoss, takeProfit } = activeTrade;
    const stopHit =
      (side === 'BUY' && lastPrice <= stopLoss) ||
      (side === 'SELL' && lastPrice >= stopLoss);
    const tpHit =
      (side === 'BUY' && lastPrice >= takeProfit) ||
      (side === 'SELL' && lastPrice <= takeProfit);

    if (stopHit || tpHit) {
      if (side === 'BUY') lastBuyTime = now; else lastSellTime = now;
      activeTrade = null;
      return {
        signal: 'HOLD',
        reason: stopHit ? 'Stop loss hit' : 'Take profit hit',
      };
    }

    // Breakeven stop adjustment after 30 minutes
    if (now - activeTrade.entryTime >= 6 * 5 * 60 * 1000 && activeTrade.stopLoss !== activeTrade.entryPrice) {
      activeTrade.stopLoss = activeTrade.entryPrice;
      return {
        signal: 'HOLD',
        reason: 'Stop moved to breakeven',
        stopLoss: activeTrade.stopLoss,
        takeProfit: activeTrade.takeProfit,
      };
    }

    return { signal: 'HOLD', reason: `${side} trade active`, stopLoss, takeProfit };
  }

  let strategySignal: TradingSignal;
  
  try {
    // Use new strategy-based signal generation with error handling
    strategySignal = StrategyAutomaticSwitcher.generateSignal(
      candles,
      currentRegime,
      lastPrice,
      {
        accountBalance: 10000,
        enablePositionSizing: true,
        minConfidenceThreshold: 55
      }
    );
    
    // Log signal generation for debugging
    console.debug('Generated signal:', {
      action: strategySignal.action,
      confidence: strategySignal.confidence,
      reason: strategySignal.reason,
      regime: currentRegime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating strategy signal, falling back to EMA crossover:', error);
    return getFallbackSignal(candles);
  }

  // Check if we should execute the signal with validation
  try {
    const shouldExecute = StrategyAutomaticSwitcher.shouldExecuteSignal(strategySignal);
    if (!shouldExecute) {
      return { 
        signal: 'HOLD', 
        reason: strategySignal.reason || 'Signal validation failed',
        confidence: strategySignal.confidence
      };
    }
  } catch (error) {
    console.error('Error validating signal, falling back to basic validation:', error);
    if (!strategySignal || !['BUY', 'SELL', 'HOLD'].includes(strategySignal.action)) {
      return { signal: 'HOLD', reason: 'Invalid signal format' };
    }
  }

  // Check cooldown
  if (isCooldown(strategySignal.action, now)) {
    return { signal: 'HOLD', reason: `${strategySignal.action} cooldown active` };
  }

  // Volume check with fallback
  try {
    const volSma = volumeSMA(candles, 20);
    if (lastCandle.volume < volSma * config.volumeMultiplier) {
      console.debug('Low volume, holding position');
      return { 
        signal: 'HOLD', 
        reason: 'Low volume confirmation',
        confidence: strategySignal.confidence
      };
    }
  } catch (error) {
    console.warn('Volume check failed, proceeding with signal:', error);
    // Continue with signal even if volume check fails
  }

  // Open new trade if signal is valid
  if (strategySignal.action !== 'HOLD') {
    const params = strategySignal.positionSize ? {
      stopLoss: strategySignal.positionSize.stopLoss,
      takeProfit: strategySignal.positionSize.takeProfit
    } : riskParams(lastPrice, strategySignal.action);

    if (strategySignal.action === 'BUY') lastBuyTime = now; 
    else lastSellTime = now;
    
    activeTrade = { 
      side: strategySignal.action, 
      entryTime: now, 
      entryPrice: lastPrice, 
      ...params 
    };

    return { 
      signal: strategySignal.action, 
      reason: strategySignal.reason,
      ...params 
    };
  }

  return { signal: 'HOLD', reason: strategySignal.reason || 'No clear signal' };
}
