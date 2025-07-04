import type { Candle } from './types';

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
}

export function bollingerBands(candles: Candle[], period = 20, stdDev = 2): BollingerBands {
  if (candles.length < period) {
    return { upper: NaN, middle: NaN, lower: NaN };
  }
  
  // Calculate SMA (middle band)
  const closes = candles.slice(-period).map(c => c.close);
  const sma = closes.reduce((sum, close) => sum + close, 0) / period;
  
  // Calculate standard deviation
  const squaredDiffs = closes.map(close => Math.pow(close - sma, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
  const stdev = Math.sqrt(variance);
  
  // Calculate upper and lower bands
  const upper = sma + stdDev * stdev;
  const lower = sma - stdDev * stdev;
  
  return { upper, middle: sma, lower };
}

export function volumeSMA(candles: Candle[], period: number): number {
  if (candles.length < period) return 0;
  const slice = candles.slice(-period);
  const sum = slice.reduce((acc, c) => acc + c.volume, 0);
  return sum / period;
}

export function rsi14(candles: Candle[]): number {
  if (candles.length < 15) return NaN;
  let gains = 0;
  let losses = 0;
  for (let i = candles.length - 15; i < candles.length - 1; i++) {
    const diff = candles[i + 1].close - candles[i].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const rs = gains / (losses || 1e-9);
  const rsi = 100 - 100 / (1 + rs);
  return rsi;
}

export function ema(period: number) {
  const k = 2 / (period + 1);
  return (candles: Candle[]): number => {
    if (candles.length < period) return NaN;
    let emaPrev = candles[candles.length - period].close;
    for (let i = candles.length - period + 1; i < candles.length; i++) {
      emaPrev = candles[i].close * k + emaPrev * (1 - k);
    }
    return emaPrev;
  };
}

export function vwap(candles: Candle[]): number {
  let cumPV = 0;
  let cumVol = 0;
  for (const c of candles) {
    const price = (c.high + c.low + c.close) / 3;
    cumPV += price * c.volume;
    cumVol += c.volume;
  }
  return cumPV / (cumVol || 1e-9);
}

export { ichimoku } from './indicators/ichimoku';
