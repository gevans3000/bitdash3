import { Candle } from '../types';

export interface IchimokuValues {
  tenkan: number;
  kijun: number;
  senkouA: number;
  senkouB: number;
  chikou: number;
}

function highestHigh(candles: Candle[], period: number, offset = 0) {
  const slice = candles.slice(-(period + offset), candles.length - offset || undefined);
  return Math.max(...slice.map(c => c.high));
}

function lowestLow(candles: Candle[], period: number, offset = 0) {
  const slice = candles.slice(-(period + offset), candles.length - offset || undefined);
  return Math.min(...slice.map(c => c.low));
}

export function ichimoku(
  candles: Candle[],
  conversionPeriod = 9,
  basePeriod = 26,
  spanBPeriod = 52
): IchimokuValues {
  if (candles.length < spanBPeriod) {
    return { tenkan: NaN, kijun: NaN, senkouA: NaN, senkouB: NaN, chikou: NaN };
  }

  const tenkan = (highestHigh(candles, conversionPeriod) + lowestLow(candles, conversionPeriod)) / 2;
  const kijun = (highestHigh(candles, basePeriod) + lowestLow(candles, basePeriod)) / 2;
  const senkouA = (tenkan + kijun) / 2;
  const senkouB = (highestHigh(candles, spanBPeriod) + lowestLow(candles, spanBPeriod)) / 2;
  const chikouIndex = candles.length - basePeriod - 1;
  const chikou = chikouIndex >= 0 ? candles[chikouIndex].close : NaN;

  return { tenkan, kijun, senkouA, senkouB, chikou };
}
