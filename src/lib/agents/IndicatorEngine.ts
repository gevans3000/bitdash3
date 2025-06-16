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
    console.log('IndicatorEngineAgent: Constructor called. Subscribing to NEW_CLOSED_CANDLE_5M.');
    orchestrator.register('NEW_CLOSED_CANDLE_5M', this.onNewClosedCandle.bind(this) as MessageHandler);
    orchestrator.register('INITIAL_CANDLES_5M', this.handleInitialCandles.bind(this) as MessageHandler);
  }

  private handleInitialCandles(msg: AgentMessage<Candle[]>): void {
    console.log('IndicatorEngineAgent: Received initial candles. Storing for calculations.');
    this.candles = [...msg.payload].sort((a,b) => a.time - b.time);
    if (this.candles.length > MAX_CANDLE_HISTORY) {
      this.candles = this.candles.slice(-MAX_CANDLE_HISTORY);
    }
    if (this.candles.length >= MIN_CANDLES_FOR_INDICATORS) {
      const latestCandle = this.candles[this.candles.length -1];
      this.calculateAndSendIndicators(latestCandle);
    }
  }

  private onNewClosedCandle(msg: AgentMessage<Candle>): void {
    const newCandle = msg.payload;
    const existingIndex = this.candles.findIndex(c => c.time === newCandle.time);
    if (existingIndex === -1) {
      this.candles.push(newCandle);
      this.candles.sort((a,b) => a.time - b.time);
      if (this.candles.length > MAX_CANDLE_HISTORY) {
        this.candles.shift();
      }
    } else {
      this.candles[existingIndex] = newCandle;
    }
    this.calculateAndSendIndicators(newCandle);
  }

  private calculateAndSendIndicators(triggeringCandle: Candle): void {
    if (this.candles.length < MIN_CANDLES_FOR_INDICATORS) {
      return;
    }

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

    orchestrator.send<IndicatorDataSet>({
      from: 'IndicatorEngine' as AgentName,
      type: 'INDICATORS_READY_5M',
      payload,
      timestamp: Date.now(),
    });
  }
}
export const indicatorEngineAgent = new IndicatorEngineAgent();
