import { SignalPerformanceTracker } from '@/lib/tracking/signal-performance';

describe('SignalPerformanceTracker', () => {
  it('records trades and calculates metrics', () => {
    const tracker = new SignalPerformanceTracker();

    tracker.recordEntry({
      id: 't1',
      entrySignalId: 's1',
      entryPrice: 100,
      entryTime: 0,
      positionSize: 1,
    });
    tracker.recordEntry({
      id: 't2',
      entrySignalId: 's2',
      entryPrice: 100,
      entryTime: 1,
      positionSize: 1,
    });
    tracker.recordEntry({
      id: 't3',
      entrySignalId: 's3',
      entryPrice: 100,
      entryTime: 2,
      positionSize: 1,
    });

    expect(tracker.getOpenTrades()).toHaveLength(3);
    expect(tracker.getClosedTrades()).toHaveLength(0);

    tracker.recordExit('t1', 110, 10);
    expect(tracker.getOpenTrades()).toHaveLength(2);
    expect(tracker.getClosedTrades()).toHaveLength(1);

    tracker.recordExit('t2', 90, 20);
    tracker.recordExit('t3', 105, 30);

    expect(tracker.getOpenTrades()).toHaveLength(0);
    expect(tracker.getClosedTrades()).toHaveLength(3);

    const metrics = tracker.calculateMetrics();
    expect(metrics.totalTrades).toBe(3);
    expect(metrics.winRate).toBeCloseTo(66.67, 1);
    expect(metrics.profitFactor).toBeCloseTo(1.5, 2);
    expect(metrics.maxDrawdown).toBeCloseTo(10, 1);
  });
});
