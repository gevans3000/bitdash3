import { Candle } from '@/lib/types';

export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  borderColor?: string;
  wickColor?: string;
}

export function mapCandlesToChartData(
  candles: Array<Candle & { timestamp?: number }>
): ChartCandle[] {
  if (candles.length === 0) return [];

  const volumes = candles.slice(-21).map(c => c.volume);
  const volumeMA = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;

  return candles.map(c => {
    const isLargeMove = Math.abs(c.close - c.open) / c.open > 0.02;
    const isVolumeSpike = c.volume > volumeMA * 1.5;
    return {
      time: Math.floor(((c as any).timestamp ?? c.time ?? 0) / 1000),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      ...(isLargeMove && { borderColor: '#F59E0B' }),
      ...(isVolumeSpike && { wickColor: '#3B82F6' }),
    };
  });
}
