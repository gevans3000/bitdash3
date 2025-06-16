console.log('IndicatorEngine.ts module loading...'); // ADDED FOR DEBUGGING
// src/lib/agents/IndicatorEngine.ts
import { orchestrator } from './Orchestrator';
import { AgentMessage, AgentName, MessageHandler, IndicatorDataSet } from './types';
import { Candle } from '@/lib/types';

import { candleEMA } from '@/lib/indicators/moving-averages';
import { calculateRSI } from '@/lib/indicators/rsi';
import { bollingerBands } from '@/lib/indicators/volatility';
import { calculateATR } from '@/lib/indicators/atr';

const EMA_FAST_PERIOD = 9;
const EMA_SLOW_PERIOD = 21;
const RSI_PERIOD = 14;
const BB_PERIOD = 20;
const BB_STDDEV = 2;
const ATR_PERIOD = 14;

const MIN_CANDLES_FOR_INDICATORS = Math.max(EMA_SLOW_PERIOD, RSI_PERIOD, BB_PERIOD, ATR_PERIOD) + 5;
const MAX_CANDLE_HISTORY = 200;

class IndicatorEngineAgent {
  private candles: Candle[] = [];

  constructor() {
    console.log('IndicatorEngineAgent: Constructor called. Subscribing to NEW_CLOSED_CANDLE_5M and INITIAL_CANDLES_5M.');
    orchestrator.register('NEW_CLOSED_CANDLE_5M', this.onNewClosedCandle.bind(this) as MessageHandler<Candle>);
    orchestrator.register('INITIAL_CANDLES_5M', this.handleInitialCandles.bind(this) as MessageHandler<Candle[]>);
  }

  private handleInitialCandles(msg: AgentMessage<Candle[]>): void {
    console.log(`IndicatorEngineAgent: Received INITIAL_CANDLES_5M with ${msg.payload.length} candles.`);
    this.candles = [...msg.payload].sort((a,b) => a.time - b.time);
    if (this.candles.length > MAX_CANDLE_HISTORY) {
      console.log(`IndicatorEngineAgent: Initial candles trimmed from ${this.candles.length} to ${MAX_CANDLE_HISTORY}.`);
      this.candles = this.candles.slice(-MAX_CANDLE_HISTORY);
    }
    console.log(`IndicatorEngineAgent: Stored ${this.candles.length} initial candles.`);
    if (this.candles.length >= MIN_CANDLES_FOR_INDICATORS) {
      const latestCandle = this.candles[this.candles.length -1];
      console.log('IndicatorEngineAgent: Sufficient initial candles to calculate indicators.');
      this.calculateAndSendIndicators(latestCandle);
    } else {
      console.log(`IndicatorEngineAgent: Insufficient initial candles. Need ${MIN_CANDLES_FOR_INDICATORS}, have ${this.candles.length}.`);
    }
  }

  private onNewClosedCandle(msg: AgentMessage<Candle>): void {
    const newCandle = msg.payload;
    console.log(`IndicatorEngineAgent: Received NEW_CLOSED_CANDLE_5M for time ${new Date(newCandle.time).toISOString()}.`);
    const existingIndex = this.candles.findIndex(c => c.time === newCandle.time);
    if (existingIndex === -1) {
      this.candles.push(newCandle);
      this.candles.sort((a,b) => a.time - b.time);
      if (this.candles.length > MAX_CANDLE_HISTORY) {
        this.candles.shift();
      }
    } else {
      this.candles[existingIndex] = newCandle;
      console.log(`IndicatorEngineAgent: Updated existing candle for time ${new Date(newCandle.time).toISOString()}.`);
    }
    this.calculateAndSendIndicators(newCandle);
  }

  private calculateAndSendIndicators(triggeringCandle: Candle): void {
    console.log(`IndicatorEngineAgent: Attempting to calculate indicators. Have ${this.candles.length} candles, need ${MIN_CANDLES_FOR_INDICATORS}.`);
    if (this.candles.length < MIN_CANDLES_FOR_INDICATORS) {
      console.log('IndicatorEngineAgent: Not enough candle data to calculate indicators.');
      return;
    }
    console.log('IndicatorEngineAgent: Calculating indicators...');
    const emaFast = candleEMA(this.candles, EMA_FAST_PERIOD);
    const emaSlow = candleEMA(this.candles, EMA_SLOW_PERIOD);
    const rsiValues = calculateRSI(this.candles, RSI_PERIOD);
    const rsi = rsiValues[rsiValues.length -1] ?? null;
    const bb = bollingerBands(this.candles, BB_PERIOD, BB_STDDEV);
    const atrValues = calculateATR(this.candles, ATR_PERIOD);
    const atr = atrValues[atrValues.length -1] ?? null;

    const payload: IndicatorDataSet = {
      emaFast: isNaN(emaFast) ? null : emaFast,
      emaSlow: isNaN(emaSlow) ? null : emaSlow,
      rsi: rsi ?? null,
      bbUpper: isNaN(bb.upper) ? null : bb.upper,
      bbMiddle: isNaN(bb.middle) ? null : bb.middle,
      bbLower: isNaN(bb.lower) ? null : bb.lower,
      atr: atr ?? null,
      currentPrice: triggeringCandle.close,
      timestamp: triggeringCandle.time,
    };
    
    console.log('IndicatorEngineAgent: Sending INDICATORS_READY_5M with payload:', payload);
    orchestrator.send<IndicatorDataSet>({
      from: 'IndicatorEngine' as AgentName,
      type: 'INDICATORS_READY_5M',
      payload,
      timestamp: Date.now(),
    });
  }
}
export const indicatorEngineAgent = new IndicatorEngineAgent();
// Ensure this module is imported in a global context (e.g., _app.tsx or a main layout/provider)
// for the agent to be instantiated and register itself.
