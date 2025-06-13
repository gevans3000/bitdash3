import { useMemo } from 'react';
import { useSignals } from './useSignals';
import type { Candle, OrderBookData } from '@/lib/types';
import { rsi14 } from '@/lib/indicators';
import { detectDivergence } from '@/lib/indicators/oscillators';

interface SocialSentiment {
  galaxy_score?: number;
  alt_rank?: number;
}

interface MacroContext {
  data: {
    fedFundsRate: { trend: string };
    cpi: { trend: string };
    unemployment: { trend: string };
  };
}

export interface DecisionSupportInputs {
  candles: Candle[];
  sentiment?: SocialSentiment | null;
  macro?: MacroContext | null;
  orderBook?: OrderBookData | null;
}

export interface DecisionSupport {
  score: number;
  indicatorScore: number;
  sentimentScore: number;
  macroScore: number;
  orderBookScore: number;
  divergence: { bullish: boolean; bearish: boolean };
}

export function computeDecisionScore(values: {
  indicator: number;
  sentiment: number;
  macro: number;
  orderBook: number;
}) {
  const weights = { indicators: 0.4, sentiment: 0.2, macro: 0.2, orderBook: 0.2 };
  const score =
    values.indicator * weights.indicators +
    values.sentiment * weights.sentiment +
    values.macro * weights.macro +
    values.orderBook * weights.orderBook;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function useDecisionSupport({
  candles,
  sentiment,
  macro,
  orderBook,
}: DecisionSupportInputs): DecisionSupport {
  const { topSignal } = useSignals({ candles });

  const indicatorScore = useMemo(() => {
    return topSignal ? topSignal.confidence : 50;
  }, [topSignal]);

  const sentimentScore = useMemo(() => {
    if (!sentiment) return 50;
    if (typeof sentiment.galaxy_score === 'number') return sentiment.galaxy_score;
    if (typeof sentiment.alt_rank === 'number') {
      return 100 - Math.min(100, sentiment.alt_rank);
    }
    return 50;
  }, [sentiment]);

  const macroScore = useMemo(() => {
    if (!macro) return 50;
    let score = 50;
    if (macro.data.fedFundsRate.trend === 'down') score += 10;
    if (macro.data.fedFundsRate.trend === 'up') score -= 10;
    if (macro.data.cpi.trend === 'down') score += 5;
    if (macro.data.cpi.trend === 'up') score -= 5;
    if (macro.data.unemployment.trend === 'down') score += 5;
    if (macro.data.unemployment.trend === 'up') score -= 5;
    return Math.max(0, Math.min(100, score));
  }, [macro]);

  const orderBookScore = useMemo(() => {
    if (!orderBook) return 50;
    const depth = 20;
    const bidVol = orderBook.bids
      .slice(0, depth)
      .reduce((sum, [, qty]) => sum + parseFloat(qty), 0);
    const askVol = orderBook.asks
      .slice(0, depth)
      .reduce((sum, [, qty]) => sum + parseFloat(qty), 0);
    const total = bidVol + askVol;
    if (!total) return 50;
    const imbalance = (bidVol - askVol) / total;
    return Math.round(imbalance * 50 + 50);
  }, [orderBook]);

  const score = useMemo(
    () =>
      computeDecisionScore({
        indicator: indicatorScore,
        sentiment: sentimentScore,
        macro: macroScore,
        orderBook: orderBookScore,
      }),
    [indicatorScore, sentimentScore, macroScore, orderBookScore]
  );

  const divergence = useMemo(() => {
    const rsiSeries: number[] = [];
    for (let i = 0; i < candles.length; i++) {
      rsiSeries.push(rsi14(candles.slice(0, i + 1)));
    }
    return detectDivergence(candles, rsiSeries);
  }, [candles]);

  return {
    score,
    indicatorScore,
    sentimentScore,
    macroScore,
    orderBookScore,
    divergence,
  };
}
