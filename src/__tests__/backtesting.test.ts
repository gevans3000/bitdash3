import { computeMetrics } from '@/lib/backtesting/engine';
import type { Trade } from '@/lib/backtesting/engine';

describe('computeMetrics', () => {
  it('calculates metrics correctly', () => {
    const trades: Trade[] = [
      { entryTime: 0, exitTime: 1, entryPrice: 100, exitPrice: 105, direction: 'long', profit: 0.05 },
      { entryTime: 1, exitTime: 2, entryPrice: 105, exitPrice: 102.9, direction: 'long', profit: -0.02 },
      { entryTime: 2, exitTime: 3, entryPrice: 102.9, exitPrice: 103.93, direction: 'long', profit: 0.01 },
      { entryTime: 3, exitTime: 4, entryPrice: 103.93, exitPrice: 100.81, direction: 'long', profit: -0.03 },
    ];
    const equity = [1000, 1050, 1029, 1039.29, 1007.11];
    const metrics = computeMetrics(trades, equity, 1000);
    expect(metrics.totalTrades).toBe(4);
    expect(metrics.winRate).toBeCloseTo(50, 1);
    expect(metrics.profitFactor).toBeCloseTo(1.2, 2);
    expect(metrics.netProfit).toBeCloseTo(7.11, 1);
    expect(metrics.maxDrawdown).toBeGreaterThan(0);
  });
});
