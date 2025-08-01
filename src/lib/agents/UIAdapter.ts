// src/lib/agents/UIAdapter.ts
import { orchestrator } from './Orchestrator';
import { AgentMessage, AgentName, MessageHandler, AppState, TradingSignal, IndicatorDataSet } from './types';
import { Candle } from '@/lib/types';

const initialAppState: AppState = {
  latestSignal: null,
  signalHistory: [],
  candlesForChart: [],
  latestIndicators: null,
  currentPrice: null, // Added
  dataStatus: { text: 'Initializing...', color: 'grey', lastUpdateTime: null },
  dataError: null,
};

class UIAdapterService {
  private state: AppState = { ...initialAppState };
  private listeners = new Set<(state: AppState) => void>();

  constructor() {
    console.log('UIAdapterService: Initializing and subscribing to orchestrator messages.');

    orchestrator.register('NEW_SIGNAL_5M', ((msg: AgentMessage<TradingSignal>) => {
      const signal = msg.payload;
      this.updateState(s => {
        const history = [signal, ...s.signalHistory].slice(0, 20);
        return { ...s, latestSignal: signal, signalHistory: history };
      });
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (signal.action !== 'HOLD' && signal.confidence >= 70) {
          const title = `BitDash3 Signal: ${signal.action} BTC!`;
          const body = `Reason: ${signal.reason}\nConfidence: ${signal.confidence.toFixed(1)}%`;
          if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/bitcoin_icon.png' });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification(title, { body, icon: '/bitcoin_icon.png' });
              }
            });
          }
        }
      }
    }) as MessageHandler);

    orchestrator.register('INITIAL_CANDLES_5M', ((msg: AgentMessage<Candle[]>) => {
      const candles = msg.payload;
      this.updateState(s => ({
        ...s,
        candlesForChart: candles.slice(-200),
        currentPrice: candles.length > 0 ? candles[candles.length - 1].close : s.currentPrice
      }));
    }) as MessageHandler);

    orchestrator.register('LIVE_CANDLE_UPDATE_5M', ((msg: AgentMessage<Candle & {isClosed: boolean}>) => {
      const candle = msg.payload;
      this.updateState(s => {
        const newCandles = [...s.candlesForChart];
        const idx = newCandles.findIndex(c => c.time === candle.time);
        if (idx !== -1) newCandles[idx] = candle;
        else newCandles.push(candle);
        // currentPrice is NO LONGER updated here by live updates.
        // It will only be updated by INITIAL_CANDLES_5M (on initial load and manual refresh).
        // We still update candlesForChart for other potential uses, or this could also be restricted.
        // For true "only refresh button updates price AND chart", candlesForChart update should also move
        // to be exclusively within INITIAL_CANDLES_5M handler.
        // For now, only restricting currentPrice update.
        return {
          ...s,
          candlesForChart: newCandles.sort((a,b) => a.time - b.time).slice(-200)
          // currentPrice: candle.close // REMOVED
        };
      });
      return undefined; // Explicit return to match MessageHandler type
    }) as MessageHandler);

    // Also handle NEW_CLOSED_CANDLE_5M if it's a distinct event that UIAdapter listens to
    // Assuming for now LIVE_CANDLE_UPDATE_5M covers the necessary updates for currentPrice
    // If NEW_CLOSED_CANDLE_5M is also registered and provides Candle payload, add:
    // orchestrator.register('NEW_CLOSED_CANDLE_5M', ((msg: AgentMessage<Candle>) => {
    //   this.updateState(s => ({ ...s, currentPrice: msg.payload.close }));
    // }) as MessageHandler);

    orchestrator.register('INDICATORS_READY_5M', ((msg: AgentMessage<IndicatorDataSet>) =>
      this.updateState(s => ({ ...s, latestIndicators: msg.payload }))
    ) as MessageHandler);

    orchestrator.register('DATA_STATUS_UPDATE', ((msg: AgentMessage<{lastUpdateTime: number}>) => {
      this.updateState(s => ({
        ...s,
        dataStatus: { ...s.dataStatus, text: '● Live', color: 'green', lastUpdateTime: msg.payload.lastUpdateTime },
        dataError: null,
      }));
    }) as MessageHandler);

    orchestrator.register('DATA_ERROR', ((msg: AgentMessage<string | {message: string}>) => {
      const errorPayload = msg.payload;
      const message = typeof errorPayload === 'string' ? errorPayload : errorPayload?.message;
      this.updateState(s => ({
        ...s,
        dataError: message || 'Unknown error',
        dataStatus: { ...s.dataStatus, text: `Error: ${message ? message.substring(0,30) : 'Unknown'}`, color: 'red' },
      }));
    }) as MessageHandler);
  }

  private updateState(updater: (prevState: AppState) => AppState | Partial<AppState>) {
    this.state = { ...this.state, ...(typeof updater === 'function' ? updater(this.state) : updater) } as AppState;
    this.listeners.forEach(l => l(this.state));
  }

  public getState = (): AppState => this.state;

  public subscribe = (listener: (state: AppState) => void): (() => void) => {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  };
}
export const uiAdapter = new UIAdapterService();
