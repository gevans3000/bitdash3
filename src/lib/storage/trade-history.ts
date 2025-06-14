/**
 * Trade History Storage
 * 
 * Handles persistent storage of trade history using localStorage with fallback
 */

const STORAGE_KEY = 'bitdash3_trade_history';

interface StoredTrade {
  id: string;
  entrySignalId: string;
  exitSignalId?: string;
  entryPrice: number;
  exitPrice?: number;
  entryTime: number;
  exitTime?: number;
  positionSize: number;
  status: 'open' | 'closed' | 'stopped_out';
  pnlPercent?: number;
  pnlAbsolute?: number;
  metadata?: {
    entryReason?: string;
    exitReason?: string;
    tags?: string[];
  };
}

/**
 * Save trades to persistent storage
 */
export function saveTrades(trades: StoredTrade[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  } catch (error) {
    console.error('Failed to save trades to localStorage:', error);
    // Silently fail in production
    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }
  }
}

/**
 * Load trades from persistent storage
 */
export function loadTrades(): StoredTrade[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    // Basic validation
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((trade: any) => {
      return (
        trade &&
        typeof trade.id === 'string' &&
        typeof trade.entryPrice === 'number' &&
        typeof trade.entryTime === 'number' &&
        typeof trade.positionSize === 'number' &&
        ['open', 'closed', 'stopped_out'].includes(trade.status)
      );
    });
  } catch (error) {
    console.error('Failed to load trades from localStorage:', error);
    return [];
  }
}

/**
 * Clear all trade history
 */
export function clearTradeHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear trade history:', error);
    // Silently fail in production
    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }
  }
}

/**
 * Migrate trades from an older storage format if needed
 */
export function migrateTradesIfNeeded(): void {
  // Add migration logic here if storage format changes
  // This is a placeholder for future migrations
}

// Initialize migrations on module load
if (typeof window !== 'undefined') {
  migrateTradesIfNeeded();
}
