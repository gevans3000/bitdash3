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
  private latestIndicators: IndicatorDataSet | null = null;
  private currentMarketRegime: MarketRegime | null = null;

  constructor() {
    console.log('SignalGeneratorAgent: Constructor called. Subscribing to INDICATORS_READY_5M, candle updates, and MARKET_REGIME_UPDATED.');
    orchestrator.register('INDICATORS_READY_5M', this.onIndicatorsReady.bind(this));
    orchestrator.register('MARKET_REGIME_UPDATED', this.onMarketRegimeUpdated.bind(this));
    orchestrator.register('NEW_CLOSED_CANDLE_5M', (msg: AgentMessage<Candle>) => {
      this.candleHistory.push(msg.payload);
      if (this.candleHistory.length > this.MAX_CANDLE_HISTORY) {
        this.candleHistory.shift();
      }
    });
    orchestrator.register('INITIAL_CANDLES_5M', (msg: AgentMessage<Candle[]>) => {
      this.candleHistory = [...msg.payload].sort((a,b)=>a.time-b.time).slice(-this.MAX_CANDLE_HISTORY);
    });
  }

  private onIndicatorsReady(msg: AgentMessage<IndicatorDataSet>): void {
    this.latestIndicators = msg.payload;
    // console.log("SignalGeneratorAgent: Received new indicators, stored as latestIndicators", this.latestIndicators);

    if (!this.latestIndicators.atr) {
      console.warn('SignalGeneratorAgent: ATR is missing from latestIndicators. Cannot calculate SL/TP accurately. Ensure IndicatorEngine provides ATR.');
    }

    const newMarketRegime: MarketRegime = detectRegime(this.latestIndicators, this.candleHistory) || 'undefined';

    if (newMarketRegime !== this.currentMarketRegime) {
      // console.log(`SignalGeneratorAgent: Market regime changed from ${this.currentMarketRegime} to ${newMarketRegime}. Emitting event.`);
      this.currentMarketRegime = newMarketRegime;
      orchestrator.send<MarketRegime>({
        from: 'SignalGenerator' as AgentName,
        type: 'MARKET_REGIME_UPDATED',
        payload: this.currentMarketRegime,
        timestamp: Date.now(),
      });
    }
    // Process signal with the new indicators and potentially new regime
    this.generateSignal(this.latestIndicators, this.currentMarketRegime);
  }

  private onMarketRegimeUpdated(msg: AgentMessage<MarketRegime>): void {
    const newMarketRegime = msg.payload;
    // console.log(`SignalGeneratorAgent: Received MARKET_REGIME_UPDATED event. New regime: ${newMarketRegime}`);
    
    if (this.latestIndicators) {
      // Update currentMarketRegime based on the event, as it might come from an external source in the future
      this.currentMarketRegime = newMarketRegime;
      // console.log("SignalGeneratorAgent: Re-generating signal with latest indicators and new market regime.");
      this.generateSignal(this.latestIndicators, newMarketRegime);
    } else {
      // console.warn("SignalGeneratorAgent: Market regime updated, but no latest indicators available to generate a signal.");
      // Store the regime anyway, so the next indicator update uses it.
      this.currentMarketRegime = newMarketRegime;
    }
  }

  private generateSignal(indicators: IndicatorDataSet, marketRegime: MarketRegime | null): void {
    if (!indicators) {
        console.warn("SignalGeneratorAgent: generateSignal called without indicators.");
        return;
    }
    if (marketRegime === null) {
        console.warn("SignalGeneratorAgent: generateSignal called without a market regime. Detecting fallback.");
        marketRegime = detectRegime(indicators, this.candleHistory) || 'undefined';
    }

    const confluence = getSignalConfluence(indicators, marketRegime);

    let sltp: { stopLoss?: number; takeProfit?: number } = {}; // Correctly typed to match return of calculateTradeParams
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
    
    // console.log("SignalGeneratorAgent: Generated final signal:", finalSignal);
    orchestrator.send<TradingSignal>({
      from: 'SignalGenerator' as AgentName,
      type: 'NEW_SIGNAL_5M',
      payload: finalSignal,
      timestamp: Date.now(),
    });
  }
}
export const signalGeneratorAgent = new SignalGeneratorAgent();
