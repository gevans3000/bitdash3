/**
 * Signal Performance Tracker
 * 
 * Tracks and calculates performance metrics for trading signals
 */

export interface TradeRecord {
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

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  totalPnlPercent: number;
  maxDrawdown: number;
  riskRewardRatio: number;
  expectancy: number;
  trades: TradeRecord[];
}

export class SignalPerformanceTracker {
  private trades: Map<string, TradeRecord> = new Map();
  private closedTrades: TradeRecord[] = [];
  
  /**
   * Record a new trade entry
   */
  recordEntry(params: Omit<TradeRecord, 'status' | 'pnlPercent' | 'pnlAbsolute' | 'exitPrice' | 'exitTime'>): string {
    const trade: TradeRecord = {
      ...params,
      status: 'open',
    };
    
    this.trades.set(trade.id, trade);
    return trade.id;
  }
  
  /**
   * Record a trade exit
   */
  recordExit(tradeId: string, exitPrice: number, exitTime: number, reason?: string): boolean {
    const trade = this.trades.get(tradeId);
    if (!trade || trade.status !== 'open') return false;
    
    // Calculate P&L
    const pnlPercent = ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
    const pnlAbsolute = (exitPrice - trade.entryPrice) * trade.positionSize;
    
    // Update trade
    const updatedTrade: TradeRecord = {
      ...trade,
      exitPrice,
      exitTime,
      pnlPercent,
      pnlAbsolute,
      status: 'closed',
      metadata: {
        ...trade.metadata,
        exitReason: reason || trade.metadata?.exitReason,
      },
    };
    
    // Move to closed trades
    this.trades.delete(tradeId);
    this.closedTrades.push(updatedTrade);
    
    return true;
  }
  
  /**
   * Get all open trades
   */
  getOpenTrades(): TradeRecord[] {
    return Array.from(this.trades.values());
  }
  
  /**
   * Get all closed trades
   */
  getClosedTrades(): TradeRecord[] {
    return [...this.closedTrades];
  }
  
  /**
   * Calculate performance metrics
   */
  calculateMetrics(): PerformanceMetrics {
    const closedTrades = this.getClosedTrades();
    const winningTrades = closedTrades.filter(t => (t.pnlPercent || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.pnlPercent || 0) <= 0);
    
    const totalTrades = closedTrades.length;
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    
    const totalPnlPercent = closedTrades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0);
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0) / winningTrades.length 
      : 0;
    const avgLoss = losingTrades.length > 0 
      ? losingTrades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0) / losingTrades.length 
      : 0;
    
    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = 0;
    let runningPnl = 0;
    
    closedTrades.forEach(trade => {
      runningPnl += trade.pnlPercent || 0;
      if (runningPnl > peak) {
        peak = runningPnl;
      }
      const drawdown = peak - runningPnl;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });
    
    // Calculate profit factor
    const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnlAbsolute || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnlAbsolute || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;
    
    // Calculate risk/reward ratio
    const avgWinAbs = winningTrades.reduce((sum, t) => sum + Math.abs(t.pnlPercent || 0), 0) / (winningTrades.length || 1);
    const avgLossAbs = losingTrades.reduce((sum, t) => sum + Math.abs(t.pnlPercent || 0), 0) / (losingTrades.length || 1);
    const riskRewardRatio = avgLossAbs > 0 ? avgWinAbs / avgLossAbs : 0;
    
    // Calculate expectancy
    const winProbability = winningTrades.length / (totalTrades || 1);
    const lossProbability = losingTrades.length / (totalTrades || 1);
    const expectancy = (winProbability * avgWin) - (lossProbability * Math.abs(avgLoss));
    
    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      avgWin,
      avgLoss: Math.abs(avgLoss),
      profitFactor,
      totalPnlPercent,
      maxDrawdown,
      riskRewardRatio,
      expectancy,
      trades: [...closedTrades],
    };
  }
}

// Singleton instance
export const performanceTracker = new SignalPerformanceTracker();

// Helper function to format performance metrics for display
export function formatMetrics(metrics: PerformanceMetrics) {
  return {
    'Total Trades': metrics.totalTrades,
    'Win Rate': `${metrics.winRate.toFixed(1)}%`,
    'Avg Win': `${metrics.avgWin.toFixed(2)}%`,
    'Avg Loss': `${metrics.avgLoss.toFixed(2)}%`,
    'Profit Factor': metrics.profitFactor.toFixed(2),
    'Total P&L': `${metrics.totalPnlPercent.toFixed(2)}%`,
    'Max Drawdown': `${metrics.maxDrawdown.toFixed(2)}%`,
    'Risk/Reward': metrics.riskRewardRatio.toFixed(2),
    'Expectancy': `${metrics.expectancy.toFixed(2)}%`,
  };
}
