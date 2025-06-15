// src/lib/agents/types.ts
export type AgentName = 'DataCollector' | 'IndicatorEngine' | 'SignalGenerator' | 'Orchestrator' | 'UI' | 'BasicCandleDisplay' | 'AgentInitializer';

export interface AgentMessage<T = any> {
  from: AgentName;
  type: string; // e.g., 'LIVE_CANDLE_UPDATE_5M', 'INDICATORS_READY_5M'
  payload: T;
  timestamp: number;
}

export type MessageHandler<T = any> = (message: AgentMessage<T>) => void;
