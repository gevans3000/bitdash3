import { DataCard } from './DataCard';
import { Candle } from '@/lib/types';
import { rsi14, ema, vwap } from '@/lib/indicators';

const ema12 = ema(12);
const ema26 = ema(26);

export function IndicatorCard({ candles }: { candles: Candle[] }) {
  const rsi = rsi14(candles).toFixed(2);
  const e12 = ema12(candles).toFixed(2);
  const e26 = ema26(candles).toFixed(2);
  const vw = vwap(candles).toFixed(2);
  const last = candles[candles.length - 1]?.close.toFixed(2);
  const rows = [
    ['RSI', rsi],
    ['EMA12', e12],
    ['EMA26', e26],
    ['VWAP', vw],
    ['Last', last],
  ];
  return (
    <DataCard>
      <ul className="text-sm space-y-1">
        {rows.map(([k, v]) => (
          <li key={k} className="flex justify-between">
            <span className="text-white/60">{k}</span>
            <span className="font-medium">{v}</span>
          </li>
        ))}
      </ul>
    </DataCard>
  );
}
