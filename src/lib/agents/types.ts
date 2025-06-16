// src/lib/agents/types.ts
import { Candle } from '@/lib/types';
export type AgentName =
  | 'DataCollector'
  | 'IndicatorEngine'
  | 'SignalGenerator'
  | 'Orchestrator'
  | 'UI'
  | 'BasicCandleDisplay'
  | 'AgentInitializer'
  | 'DataFreshnessIndicator';

export interface AgentMessage<T = any> {
  from: AgentName;
  type: string; // e.g., 'LIVE_CANDLE_UPDATE_5M', 'INDICATORS_READY_5M'
  payload: T;
  timestamp: number;
}

export type MessageHandler<T = any> = (message: AgentMessage<T>) => void;

export interface IndicatorDataSet {
  emaFast: number | null;
  emaSlow: number | null;
  rsi: number | null;
  bbUpper: number | null;
  bbMiddle: number | null;
  bbLower: number | null;
  atr: number | null;
  currentPrice: number;
  timestamp: number;
}

export type MarketRegime =
  | 'trending-up'
  | 'trending-down'
  | 'ranging'
  | 'volatile'
  | 'undefined';

export interface TradingSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  marketRegime: MarketRegime;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  timestamp: number;
  rawIndicators?: IndicatorDataSet;
}

export interface AppState {
  latestSignal: TradingSignal | null;
  signalHistory: TradingSignal[];
  candlesForChart: Candle[];
  latestIndicators: IndicatorDataSet | null;
  dataStatus: { text: string; color: string; lastUpdateTime: number | null };
  dataError: string | null;
}
