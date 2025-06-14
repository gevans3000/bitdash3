/**
 * Quick Trade Helpers
 *
 * Simplified wrappers around the performance tracker and trade history modules
 * to execute mock BUY and SELL actions. These functions are intended for
 * demonstration purposes only and do not interact with real exchanges.
 */

import { performanceTracker } from '@/lib/tracking/signal-performance';
import { loadTrades, saveTrades } from '@/lib/storage/trade-history';

export interface QuickTradeEntryParams {
  /** Price at which the mock trade is executed */
  price: number;
  /** Calculated position size for this trade */
  positionSize: number;
  /** Optional reason to store with the trade record */
  reason?: string;
}

/**
 * Execute a mock BUY trade and persist it to history.
 * @returns Generated trade ID
 */
export function executeMockBuy({ price, positionSize, reason = 'Quick Action BUY' }: QuickTradeEntryParams): string {
  const id = `trade-${Date.now()}`;

  // Track entry for performance statistics
  performanceTracker.recordEntry({
    id,
    entrySignalId: 'manual-buy',
    entryPrice: price,
    entryTime: Date.now(),
    positionSize,
    metadata: { entryReason: reason },
  });

  // Persist to trade history
  const trades = loadTrades();
  trades.push({
    id,
    entrySignalId: 'manual-buy',
    entryPrice: price,
    entryTime: Date.now(),
    positionSize,
    status: 'open',
  });
  saveTrades(trades);

  return id;
}

/**
 * Execute a mock SELL trade, closing the position if found.
 * @returns true if the trade was successfully closed
 */
export function executeMockSell(tradeId: string, exitPrice: number, reason = 'Quick Action SELL'): boolean {
  const closed = performanceTracker.recordExit(tradeId, exitPrice, Date.now(), reason);

  const trades = loadTrades().map(t => {
    if (t.id === tradeId && t.status === 'open') {
      const pnlPercent = ((exitPrice - t.entryPrice) / t.entryPrice) * 100;
      const pnlAbsolute = (exitPrice - t.entryPrice) * t.positionSize;
      return { ...t, exitPrice, exitTime: Date.now(), pnlPercent, pnlAbsolute, status: 'closed' };
    }
    return t;
  });
  saveTrades(trades);

  return closed;
}
