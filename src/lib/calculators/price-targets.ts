import { Candle } from '@/lib/types';
import { calculateATR } from '@/lib/indicators/atr';

export interface PriceTargets {
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  stopDistance: number;
  targetDistance: number;
  atr: number;
  atrMultiple: number;
  isLong: boolean;
}

/**
 * Calculate price targets based on ATR and risk-reward ratio
 * @param candles Array of candles for ATR calculation
 * @param entryPrice Entry price for the trade
 * @param isLong Whether this is a long or short position
 * @param atrPeriod ATR period (default: 14)
 * @param atrMultiplier ATR multiplier for stop loss (default: 2.5)
 * @param riskRewardRatio Desired risk-reward ratio (default: 2)
 * @returns Price targets with entry, stop loss, and take profit levels
 */
export function calculatePriceTargets(
  candles: Candle[],
  entryPrice: number,
  isLong: boolean,
  atrPeriod: number = 14,
  atrMultiplier: number = 2.5,
  riskRewardRatio: number = 2
): PriceTargets {
  if (candles.length < atrPeriod + 1) {
    throw new Error(`Need at least ${atrPeriod + 1} candles for ATR calculation`);
  }

  // Calculate ATR for volatility-based stop loss
  const atr = calculateATR(candles, atrPeriod)[candles.length - 1] || 0;
  const atrStopDistance = atr * atrMultiplier;
  
  // Calculate stop loss and take profit based on position direction
  let stopLoss: number;
  let takeProfit: number;
  
  if (isLong) {
    stopLoss = entryPrice - atrStopDistance;
    takeProfit = entryPrice + (atrStopDistance * riskRewardRatio);
  } else {
    stopLoss = entryPrice + atrStopDistance;
    takeProfit = entryPrice - (atrStopDistance * riskRewardRatio);
  }
  
  // Ensure stop loss is not below zero for long positions
  stopLoss = Math.max(0.01, stopLoss);
  
  return {
    entry: entryPrice,
    stopLoss,
    takeProfit,
    riskRewardRatio,
    stopDistance: Math.abs(entryPrice - stopLoss),
    targetDistance: Math.abs(takeProfit - entryPrice),
    atr,
    atrMultiple: atrMultiplier,
    isLong
  };
}

/**
 * Calculate position size based on account size and risk percentage
 * @param accountSize Total account size in quote currency (e.g., USDT)
 * @param riskPercentage Risk per trade as percentage (e.g., 1 for 1%)
 * @param entryPrice Entry price of the asset
 * @param stopLossPrice Stop loss price
 * @returns Position size in base currency (e.g., BTC)
 */
export function calculatePositionSize(
  accountSize: number,
  riskPercentage: number,
  entryPrice: number,
  stopLossPrice: number
): number {
  const riskAmount = accountSize * (riskPercentage / 100);
  const priceDistance = Math.abs(entryPrice - stopLossPrice);
  
  if (priceDistance === 0) {
    throw new Error('Entry and stop loss prices are the same');
  }
  
  const positionSize = riskAmount / priceDistance;
  return positionSize;
}

/**
 * Format price with appropriate decimal places based on price
 * @param price Price to format
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(0);
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.1) return price.toFixed(4);
  return price.toFixed(8);
}
