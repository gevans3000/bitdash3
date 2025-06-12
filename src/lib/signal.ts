import type { Candle } from './types';
import { rsi14, ema, vwap } from './indicators';

const ema12 = ema(12);
const ema26 = ema(26);

export type Signal = 'BUY' | 'HOLD';

export function getSignal(candles: Candle[]): Signal {
  const rsi = rsi14(candles);
  const e12 = ema12(candles);
  const e26 = ema26(candles);
  const vw = vwap(candles);
  const lastPrice = candles[candles.length - 1].close;
  return rsi < 30 && e12 > e26 && lastPrice > vw ? 'BUY' : 'HOLD';
}
