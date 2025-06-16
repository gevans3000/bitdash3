// src/lib/agents/SignalGenerator.ts
import { orchestrator } from './Orchestrator';
import { AgentMessage, AgentName, MessageHandler, IndicatorDataSet, TradingSignal, MarketRegime } from './types';
import { Candle } from '@/lib/types';

import { detectRegime } from '@/lib/market/regime-detector';
import { getSignalConfluence } from '@/lib/signals/confluence-scorer';
import { calculateTradeParams } from '@/lib/signals/price-targets';

class SignalGeneratorAgent {
  private candleHistory: Candle[] = [];
  private readonly MAX_CANDLE_HISTORY = 50;

  constructor() {
    console.log('SignalGeneratorAgent: Constructor called. Subscribing to INDICATORS_READY_5M and candle updates.');
    orchestrator.register('INDICATORS_READY_5M', this.onIndicatorsReady.bind(this) as MessageHandler);
    orchestrator.register('NEW_CLOSED_CANDLE_5M', (msg: AgentMessage<Candle>) => {
      this.candleHistory.push(msg.payload);
      if (this.candleHistory.length > this.MAX_CANDLE_HISTORY) {
        this.candleHistory.shift();
      }
    } as MessageHandler);
    orchestrator.register('INITIAL_CANDLES_5M', (msg: AgentMessage<Candle[]>) => {
      this.candleHistory = [...msg.payload].sort((a,b)=>a.time-b.time).slice(-this.MAX_CANDLE_HISTORY);
    } as MessageHandler);
  }

  private onIndicatorsReady(msg: AgentMessage<IndicatorDataSet>): void {
    const indicators = msg.payload;

    if (!indicators.atr) {
      console.warn('SignalGeneratorAgent: ATR is missing from indicators. Cannot calculate SL/TP accurately. Ensure IndicatorEngine provides ATR.');
    }

    const marketRegime: MarketRegime = detectRegime(indicators, this.candleHistory) || 'undefined';
    const confluence = getSignalConfluence(indicators, marketRegime);

    let sltp = { stopLoss: undefined as number | undefined, takeProfit: undefined as number | undefined };
    if (confluence.action !== 'HOLD' && indicators.currentPrice && indicators.atr) {
      sltp = calculateTradeParams({
        entryPrice: indicators.currentPrice,
        signalType: confluence.action,
        atrValue: indicators.atr,
        candles: this.candleHistory,
        riskRewardRatio: 2,
      });
    }

    const finalSignal: TradingSignal = {
      action: confluence.action,
      confidence: confluence.confidence,
      reason: confluence.reason,
      marketRegime,
      entryPrice: confluence.action !== 'HOLD' ? indicators.currentPrice : undefined,
      stopLoss: sltp.stopLoss,
      takeProfit: sltp.takeProfit,
      timestamp: indicators.timestamp,
      rawIndicators: indicators,
    };

    orchestrator.send<TradingSignal>({
      from: 'SignalGenerator' as AgentName,
      type: 'NEW_SIGNAL_5M',
      payload: finalSignal,
      timestamp: Date.now(),
    });
  }
}
export const signalGeneratorAgent = new SignalGeneratorAgent();
