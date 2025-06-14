import { mapCandlesToChartData } from '@/lib/chart/candleMapping';
import { Candle } from '@/lib/types';

describe('CandleChart candle mapping', () => {
  it('adds yellow border for moves greater than 2%', () => {
    const candles: Array<Candle & { timestamp: number }> = [
      { timestamp: 0, open: 100, high: 103, low: 97, close: 103, volume: 100 },
    ];
    const result = mapCandlesToChartData(candles);
    expect(result[0].borderColor).toBe('#F59E0B');
  });

  it('colors wick blue on volume spikes above 150% of average', () => {
    const base: Array<Candle & { timestamp: number }> = Array.from({ length: 21 }, (_, i) => ({
      timestamp: i,
      open: 100,
      high: 101,
      low: 99,
      close: 100,
      volume: 100,
    }));
    const spike = { timestamp: 21, open: 100, high: 101, low: 99, close: 100, volume: 200 };
    const candles = [...base, spike];
    const result = mapCandlesToChartData(candles);
    expect(result[result.length - 1].wickColor).toBe('#3B82F6');
  });
});
