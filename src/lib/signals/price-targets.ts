import { Candle } from '@/lib/types';

interface Params {
  entryPrice: number;
  signalType: 'BUY' | 'SELL';
  atrValue: number;
  candles?: Candle[];
  riskRewardRatio?: number;
}

export function calculateTradeParams(params: Params): { stopLoss?: number; takeProfit?: number } {
  const { entryPrice, signalType, atrValue, riskRewardRatio = 2 } = params;
  if (!atrValue || atrValue <= 0) return {};
  const distance = atrValue * 1.5;
  if (signalType === 'BUY') {
    return {
      stopLoss: entryPrice - distance,
      takeProfit: entryPrice + distance * riskRewardRatio,
    };
  }
  return {
    stopLoss: entryPrice + distance,
    takeProfit: entryPrice - distance * riskRewardRatio,
  };
}
