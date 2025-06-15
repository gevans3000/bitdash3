# BitDash3 — Lean & Profitable 5-Minute Bitcoin Signal Dashboard

**Mission:** Guide a novice developer to build a dashboard that surfaces clear, actionable information to help a user make **profitable Bitcoin trading decisions on the 5-minute chart.**

**Development Philosophy:**
*   **Lean & Focused:** Only features directly contributing to a profitable trading decision.
*   **Mock Data First:** Use `npm run dev` for easy local testing with mock/cached data where possible.
*   **Real-time Critical:** Live 5-minute candle data is paramount.
*   **API Limits:** Respect free tier API limits (Binance for candles is primary).
*   **Novice Friendly:** Clear, step-by-step instructions with testable milestones.

---

## 💡 Core Information for a Profitable 5-Min Trade Decision

The dashboard *must* clearly and quickly provide:

1.  **Actionable Signal:** Is it BUY, SELL, or HOLD?
2.  **Confidence:** How strong is this signal?
3.  **Reason:** *Why* is this signal being generated (key indicators)?
4.  **Market Context:** What is the current market regime (Trend/Range)? This influences strategy.
5.  **Trade Parameters:** If BUY/SELL:
    *   Suggested Entry Price.
    *   Calculated Stop-Loss (SL).
    *   Calculated Take-Profit (TP) (aiming for >2:1 Risk/Reward).
6.  **Data Freshness:** Is the data live and trustworthy?

---
## 🛠️ Lean Development Roadmap: Building the Profitable Decision Dashboard

This roadmap uses an "Agent-Based" architecture (explained below) to keep code organized. Follow each task sequentially. Test locally using `npm run dev` at each "✅ Verification" point.

**Agent Concept (Simplified):**
Imagine specialized robots (Agents) in an assembly line:
*   `Orchestrator`: The conveyor belt manager, passing items (messages) between robots.
*   `DataCollector`: Robot that gets raw Bitcoin price data (candles).
*   `IndicatorEngine`: Robot that takes raw data and calculates technical indicators (like averages, RSI).
*   `SignalGenerator`: Robot that looks at indicators and decides if it's a BUY/SELL/HOLD.
*   React Components: These are your display screens, showing what the robots produce.

---
### Phase 1: 🏗️ Data Foundation & Basic Chart Display

**Goal:** Get live 5-minute Bitcoin candle data flowing and displayed on a basic chart.

**Task 1.1: Setup the Orchestrator (Message Manager)**
*   **Why:** To allow our "robots" (Agents) to communicate without direct dependencies.
*   **Instructions:**
    1.  Create folder: `src/lib/agents/`.
    2.  Create `src/lib/agents/types.ts`:
        ```typescript
        // src/lib/agents/types.ts
        export type AgentName = 'DataCollector' | 'IndicatorEngine' | 'SignalGenerator' | 'Orchestrator' | 'UI';
        export interface AgentMessage<T = any> {
          from: AgentName;
          type: string; // e.g., 'LIVE_CANDLE_UPDATE_5M', 'INDICATORS_READY_5M'
          payload: T;
          timestamp: number;
        }
        export type MessageHandler<T = any> = (message: AgentMessage<T>) => void;
        ```
    3.  Create `src/lib/agents/Orchestrator.ts`:
        ```typescript
        // src/lib/agents/Orchestrator.ts
        import { AgentMessage, MessageHandler } from './types';
        class OrchestratorService {
          private subscribers: Map<string, MessageHandler[]> = new Map();
          public register(messageType: string, handler: MessageHandler): () => void {
            if (!this.subscribers.has(messageType)) this.subscribers.set(messageType, []);
            this.subscribers.get(messageType)!.push(handler);
            return () => {
              const handlers = this.subscribers.get(messageType);
              if (handlers) this.subscribers.set(messageType, handlers.filter(h => h !== handler));
            };
          }
          public send<T>(message: AgentMessage<T>): void {
            console.log(`📬 Orchestrator: [${message.from}] sent [${message.type}]`, message.payload);
            const handlers = this.subscribers.get(message.type);
            if (handlers) handlers.forEach(h => { try { h(message); } catch (e) { console.error('Handler error:', e); }});
          }
        }
        export const orchestrator = new OrchestratorService();
        ```
*   **✅ Verification:** Run `npm run dev`. No errors in console. Files created.

**Task 1.2: Implement DataCollector Agent (Get Live Candles)**
*   **Why:** This agent fetches the 5-minute Bitcoin prices we need.
*   **Pre-requisite:** Ensure `src/lib/binance.ts` has:
    *   `fetchCandles(symbol, interval, params)`: For initial historical data.
    *   `subscribeToCandleStream(symbol, interval, callback)`: For live WebSocket data.
    *   Define `BinanceKline` type in `src/lib/binance.ts` or `src/lib/types.ts`.
*   **Instructions:**
    1.  Create `src/lib/agents/DataCollector.ts`:
        ```typescript
        // src/lib/agents/DataCollector.ts
        import { orchestrator } from './Orchestrator';
        import { AgentMessage } from './types';
        import { Candle } from '@/lib/types'; // Your project's Candle type
        import { fetchCandles, subscribeToCandleStream, BinanceKline } from '@/lib/binance';

        const SYMBOL = 'BTCUSDT';
        const INTERVAL = '5m';
        const HISTORICAL_LIMIT = 100; // For initial chart
        const BUFFER_MAX = 200;

        class DataCollectorAgent {
          private candleBuffer: Candle[] = [];
          private lastCandleTime: number = 0;

          constructor() { this.init(); }

          private async init() {
            try {
              const initialData = await fetchCandles(SYMBOL, INTERVAL, { limit: HISTORICAL_LIMIT });
              this.candleBuffer = initialData.map(k => ({ time: k.time, open: k.open, high: k.high, low: k.low, close: k.close, volume: k.volume }));
              if (this.candleBuffer.length > 0) this.lastCandleTime = this.candleBuffer[this.candleBuffer.length - 1].time;
              orchestrator.send<Candle[]>({ from: 'DataCollector', type: 'INITIAL_CANDLES_5M', payload: [...this.candleBuffer], timestamp: Date.now() });
              
              subscribeToCandleStream(SYMBOL, INTERVAL, (k: BinanceKline) => {
                const candle: Candle = { time: k.t, open: parseFloat(k.o), high: parseFloat(k.h), low: parseFloat(k.l), close: parseFloat(k.c), volume: parseFloat(k.v) };
                
                const idx = this.candleBuffer.findIndex(c => c.time === candle.time);
                if (idx !== -1) this.candleBuffer[idx] = candle;
                else if (candle.time > this.lastCandleTime) this.candleBuffer.push(candle);
                else return; // Old candle

                if (this.candleBuffer.length > BUFFER_MAX) this.candleBuffer.shift();
                this.lastCandleTime = Math.max(...this.candleBuffer.map(c => c.time));

                orchestrator.send<Candle & {isClosed: boolean}>({ from: 'DataCollector', type: 'LIVE_CANDLE_UPDATE_5M', payload: {...candle, isClosed: k.x}, timestamp: Date.now() });
                if (k.x) { // If candle closed
                    orchestrator.send<Candle>({ from: 'DataCollector', type: 'NEW_CLOSED_CANDLE_5M', payload: candle, timestamp: Date.now() });
                }
              });
              console.log("DataCollector: Initialized and subscribed.");
            } catch (e) { console.error("DataCollector Error:", e); orchestrator.send<string>({ from: 'DataCollector', type: 'DATA_ERROR', payload: String(e), timestamp: Date.now()}); }
          }
        }
        export const dataCollectorAgent = new DataCollectorAgent(); // Auto-starts
        ```
*   **✅ Verification:** Run `npm run dev`. Check browser console for:
    *   "DataCollector: Initialized and subscribed."
    *   `📬 Orchestrator` logs for `INITIAL_CANDLES_5M`.
    *   Then, `📬 Orchestrator` logs for `LIVE_CANDLE_UPDATE_5M` (every few seconds) and `NEW_CLOSED_CANDLE_5M` (every 5 mins).
    *   No "DataCollector Error" logs.

**Task 1.3: Basic Candle Chart Display (Visual Check)**
*   **Why:** To see if our live data is coming through correctly.
*   **Instructions:**
    1.  Modify/Create `src/components/CandleChart.tsx`:
        ```tsx
        // src/components/CandleChart.tsx
        "use client";
        import React, { useEffect, useState } from 'react';
        import { orchestrator } from '@/lib/agents/Orchestrator';
        import { AgentMessage, MessageHandler } from '@/lib/agents/types';
        import { Candle } from '@/lib/types';
        // For a real chart, you'd import a library like 'lightweight-charts'

        export default function CandleChart() {
          const [candles, setCandles] = useState<Candle[]>([]);
          const [error, setError] = useState<string | null>(null);

          useEffect(() => {
            const handleInitial = (msg: AgentMessage<Candle[]>) => setCandles(msg.payload);
            const handleUpdate = (msg: AgentMessage<Candle & {isClosed: boolean}>) => {
              setCandles(prev => {
                const c = msg.payload;
                const idx = prev.findIndex(pc => pc.time === c.time);
                const updated = [...prev];
                if (idx !== -1) updated[idx] = c; else updated.push(c);
                return updated.sort((a,b)=>a.time-b.time).slice(-200); // Keep buffer
              });
            };
            const handleError = (msg: AgentMessage<string>) => setError(msg.payload);

            const unsubs = [
              orchestrator.register('INITIAL_CANDLES_5M', handleInitial as MessageHandler),
              orchestrator.register('LIVE_CANDLE_UPDATE_5M', handleUpdate as MessageHandler),
              orchestrator.register('DATA_ERROR', handleError as MessageHandler)
            ];
            return () => unsubs.forEach(u => u());
          }, []);

          if (error) return <p style={{color: 'red'}}>Chart Error: {error}</p>;
          // TODO: Replace <pre> with actual charting library for visualization
          return (
            <div>
              <h4>5-Min Candles (Last 10 - Raw Data)</h4>
              <pre style={{maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc'}}>{JSON.stringify(candles.slice(-10), null, 2)}</pre>
            </div>
          );
        }
        ```
    2.  Add `<CandleChart />` to `src/app/dashboard/page.tsx`.
*   **✅ Verification:** Run `npm run dev`. Go to your dashboard page.
    *   The `<pre>` tag should show initial candles, then update with live data.
    *   No "Chart Error" message.

**Task 1.4: Data Freshness Indicator (Trust Factor)**
*   **Why:** User *must* know if data is live or stale.
*   **Instructions:**
    1.  Modify `DataCollectorAgent`: In `subscribeToCandleStream` callback, after sending candle updates, add:
        ```typescript
        // Inside DataCollector.ts, subscribeToCandleStream callback
        orchestrator.send<{ lastUpdateTime: number }>({ from: 'DataCollector', type: 'DATA_STATUS_UPDATE', payload: { lastUpdateTime: Date.now() }, timestamp: Date.now() });
        ```
    2.  Create `src/components/DataFreshnessIndicator.tsx`:
        ```tsx
        // src/components/DataFreshnessIndicator.tsx
        "use client";
        import React, { useState, useEffect } from 'react';
        import { orchestrator } from '@/lib/agents/Orchestrator';
        import { AgentMessage, MessageHandler } from '@/lib/agents/types';

        export default function DataFreshnessIndicator() {
          const [status, setStatus] = useState({ text: "Connecting...", color: "orange" });

          useEffect(() => {
            let lastUpdateTime = 0;
            const handleStatus = (msg: AgentMessage<{lastUpdateTime: number}>) => lastUpdateTime = msg.payload.lastUpdateTime;
            const handleError = (msg: AgentMessage<string>) => setStatus({text: `Error: ${msg.payload.substring(0,30)}...`, color: "red"});
            
            const unsubs = [
                orchestrator.register('DATA_STATUS_UPDATE', handleStatus as MessageHandler),
                orchestrator.register('DATA_ERROR', handleError as MessageHandler)
            ];

            const intervalId = setInterval(() => {
              if (lastUpdateTime === 0 && status.text !== "Connecting...") return; // No error, but no data yet
              if (status.color === "red") return; // If already in error state, don't change
              const ageSec = (Date.now() - lastUpdateTime) / 1000;
              if (ageSec < 10) setStatus({ text: "● Live", color: "green" });
              else if (ageSec < 60) setStatus({ text: `● ${Math.round(ageSec)}s ago`, color: "lightgreen" });
              else setStatus({ text: `● >1m stale`, color: "orange" });
            }, 3000); // Update status text every 3s

            return () => { unsubs.forEach(u => u()); clearInterval(intervalId); };
          }, [status.text, status.color]); // Rerun effect if error state changes

          return <div style={{fontSize: '0.9em'}}>Data: <strong style={{color: status.color}}>{status.text}</strong></div>;
        }
        ```
    3.  Add `<DataFreshnessIndicator />` to `src/app/dashboard/page.tsx`.
*   **✅ Verification:** Run `npm run dev`. Indicator shows "● Live" (green) when data flows, changes color/text if data becomes stale or if a `DATA_ERROR` is sent.

---
### Phase 2: ⚙️ Core Indicator Calculation - The Analyst Robot

**Goal:** Calculate key technical indicators from the live candle data.

**Task 2.1: Implement IndicatorEngine Agent**
*   **Why:** Centralizes all indicator math. Keeps other agents cleaner.
*   **Pre-requisite:** Your indicator functions in `src/lib/indicators/` (e.g., `ema`, `rsi`, `bollingerBands`, `averageVolume`) must be robust and tested.
*   **Instructions:**
    1.  Create `src/lib/agents/IndicatorEngine.ts`:
        ```typescript
        // src/lib/agents/IndicatorEngine.ts
        import { orchestrator } from './Orchestrator';
        import { AgentMessage, MessageHandler } from './types';
        import { Candle } from '@/lib/types';
        import { ema, rsi, bollingerBands, /* your_avg_volume_func */ } from '@/lib/indicators'; // Adapt imports

        export interface IndicatorDataSet { // Data packet this agent will send
          emaFast: number | null; emaSlow: number | null; rsi: number | null;
          bbUpper: number | null; bbMiddle: number | null; bbLower: number | null;
          avgVolume: number | null; currentPrice: number; timestamp: number;
        }

        class IndicatorEngineAgent {
          private candles: Candle[] = [];
          private readonly MIN_PERIOD = 21; // For EMA 21, BB 20
          private readonly MAX_HISTORY = 200;

          constructor() {
            orchestrator.register('NEW_CLOSED_CANDLE_5M', this.onNewClosedCandle.bind(this) as MessageHandler);
          }

          private onNewClosedCandle(msg: AgentMessage<Candle>): void {
            const candle = msg.payload;
            if (!this.candles.find(c=>c.time === candle.time)) this.candles.push(candle);
            this.candles.sort((a,b)=>a.time-b.time);
            if (this.candles.length > this.MAX_HISTORY) this.candles.shift();

            if (this.candles.length < this.MIN_PERIOD) return; // Not enough data

            const closes = this.candles.map(c => c.close);
            const volumes = this.candles.map(c => c.volume); // If needed for avgVolume

            const emaFastVal = ema(closes, 9); // Assume returns array, take last
            const emaSlowVal = ema(closes, 21);
            const rsiVal = rsi(closes, 14);
            const bbVal = bollingerBands(closes, 20, 2); // Assume returns {upper:[], middle:[], lower:[]}
            // const avgVolVal = your_avg_volume_func(volumes, 20); // Adapt

            const payload: IndicatorDataSet = {
              emaFast: emaFastVal.length ? emaFastVal[emaFastVal.length-1] : null,
              emaSlow: emaSlowVal.length ? emaSlowVal[emaSlowVal.length-1] : null,
              rsi: rsiVal.length ? rsiVal[rsiVal.length-1] : null,
              bbUpper: bbVal && bbVal.upper.length ? bbVal.upper[bbVal.upper.length-1] : null,
              bbMiddle: bbVal && bbVal.middle.length ? bbVal.middle[bbVal.middle.length-1] : null,
              bbLower: bbVal && bbVal.lower.length ? bbVal.lower[bbVal.lower.length-1] : null,
              avgVolume: null, // Replace with actual avgVolVal logic
              currentPrice: candle.close,
              timestamp: candle.time,
            };
            orchestrator.send<IndicatorDataSet>({ from: 'IndicatorEngine', type: 'INDICATORS_READY_5M', payload, timestamp: Date.now() });
          }
        }
        export const indicatorEngineAgent = new IndicatorEngineAgent(); // Auto-starts
        ```
*   **✅ Verification:** Run `npm run dev`. After ~21 closed candles (approx 1.5-2 hours of live data, or ensure your `fetchCandles` gets enough for testing), check console for `📬 Orchestrator` logs of `INDICATORS_READY_5M`. Inspect payload: are EMA, RSI, BB values present and sensible?

---
### Phase 3: 🧠 Signal Generation & Core UI Display - The Decision Helper

**Goal:** Generate a clear BUY/SELL/HOLD signal with all necessary context for a profitable decision.

**Task 3.1: Implement SignalGenerator Agent**
*   **Why:** This agent makes the trading recommendation.
*   **Pre-requisite:** Your core signal logic functions (confluence scorer, market regime, price targets) from `src/lib/signals/`, `src/lib/market/`, `src/lib/trading/` must be adaptable.
*   **Instructions:**
    1.  Create `src/lib/agents/SignalGenerator.ts`:
        ```typescript
        // src/lib/agents/SignalGenerator.ts
        import { orchestrator } from './Orchestrator';
        import { AgentMessage, MessageHandler } from './types';
        import { IndicatorDataSet } from './IndicatorEngine';
        import { MarketRegime } from '@/lib/market/regime'; // Your type
        // --- Adapt these imports to your actual functions/locations ---
        import { getSignalConfluence } from '@/lib/signals/confluence-scorer'; 
        import { detectRegime } from '@/lib/market/regime-detector';
        import { calculateTradeParams } from '@/lib/trading/price-targets';

        export interface TradingSignal { // The final output for the UI
          action: 'BUY' | 'SELL' | 'HOLD'; confidence: number; reason: string;
          marketRegime: MarketRegime; entryPrice?: number; stopLoss?: number; takeProfit?: number;
          rawIndicators?: IndicatorDataSet; // For UI display
        }

        class SignalGeneratorAgent {
          constructor() {
            orchestrator.register('INDICATORS_READY_5M', this.onIndicatorsReady.bind(this) as MessageHandler);
          }
          private onIndicatorsReady(msg: AgentMessage<IndicatorDataSet>): void {
            const indicators = msg.payload;
            
            // 1. Determine Market Regime (Adapt your detectRegime function)
            // It might need more than just latest indicators; it might need historical candles.
            // For now, assume it can work with IndicatorDataSet or you fetch history.
            const marketRegime: MarketRegime = detectRegime(indicators, /* pass candle history if needed */) || 'ranging';

            // 2. Get Confluence Score (Adapt your getSignalConfluence function)
            // This is your core strategy logic.
            const confluence = getSignalConfluence(indicators, marketRegime); // Should return {action, confidence, reason}

            // 3. Calculate Price Targets (Adapt your calculateTradeParams)
            let sltp = { stopLoss: undefined, takeProfit: undefined };
            if (confluence.action !== 'HOLD' && indicators.currentPrice) {
              // You'll need ATR. For now, placeholder. **IndicatorEngine should provide ATR.**
              const atrPlaceholder = indicators.currentPrice * 0.015; 
              sltp = calculateTradeParams({ entryPrice: indicators.currentPrice, signalType: confluence.action, atrValue: atrPlaceholder, candles: [] /* pass history if needed */ });
            }

            const finalSignal: TradingSignal = {
              action: confluence.action,
              confidence: confluence.confidence,
              reason: confluence.reason,
              marketRegime,
              entryPrice: confluence.action !== 'HOLD' ? indicators.currentPrice : undefined,
              stopLoss: sltp.stopLoss,
              takeProfit: sltp.takeProfit,
              rawIndicators: indicators,
            };
            orchestrator.send<TradingSignal>({ from: 'SignalGenerator', type: 'NEW_SIGNAL_5M', payload: finalSignal, timestamp: Date.now() });
          }
        }
        export const signalGeneratorAgent = new SignalGeneratorAgent(); // Auto-starts
        ```
    2.  **Crucial:** Adapt your existing functions (`getSignalConfluence`, `detectRegime`, `calculateTradeParams`) to be callable by this agent. **The `IndicatorEngine` MUST be updated to calculate and include ATR in its `IndicatorDataSet` payload for `calculateTradeParams` to work correctly.**
*   **✅ Verification:** Run `npm run dev`. After `INDICATORS_READY_5M` events, console should show `📬 Orchestrator` logs for `NEW_SIGNAL_5M`. Payload should have `action`, `confidence`, `reason`, `marketRegime`, and SL/TP if BUY/SELL.

**Task 3.2: Display Core Signal & Parameters in UI**
*   **Why:** Show the user the actionable decision-making information.
*   **Instructions:**
    1.  **Create `src/hooks/useAppState.ts` (if not already done from previous full version):**
        ```typescript
        // src/hooks/useAppState.ts
        import { useState, useEffect } from 'react';
        import { uiAdapter, AppState } from '@/lib/agents/UIAdapter'; // UIAdapter will be created next

        export function useAppState() {
          const [appState, setAppState] = useState<AppState>(() => uiAdapter.getState());
          useEffect(() => {
            const unsub = uiAdapter.subscribe(setAppState);
            return unsub;
          }, []);
          return appState;
        }
        ```
    2.  **Create `src/lib/agents/UIAdapter.ts` (Simplified):**
        ```typescript
        // src/lib/agents/UIAdapter.ts
        import { orchestrator } from './Orchestrator';
        import { AgentMessage, MessageHandler } from './types';
        import { TradingSignal } from './SignalGenerator';
        import { Candle } from '@/lib/types';
        import { IndicatorDataSet } from './IndicatorEngine';

        export interface AppState { // State the UI will consume
          latestSignal: TradingSignal | null;
          candlesForChart: Candle[];
          latestIndicators: IndicatorDataSet | null; // For displaying raw indicator values
          dataStatus: { text: string; color: string; lastUpdateTime: number | null };
          dataError: string | null;
        }
        type StateUpdaterCb = (prevState: AppState) => AppState;
        class UIAdapterService {
          private state: AppState = { latestSignal: null, candlesForChart: [], latestIndicators: null, dataStatus: {text:"Init...", color:"grey", lastUpdateTime: null}, dataError: null };
          private listeners = new Set<(state: AppState) => void>();
          constructor() {
            // Register for all messages the UI needs
            orchestrator.register('NEW_SIGNAL_5M', m => this.updateState(s => ({...s, latestSignal: m.payload}))) as MessageHandler;
            orchestrator.register('INITIAL_CANDLES_5M', m => this.updateState(s => ({...s, candlesForChart: m.payload}))) as MessageHandler;
            orchestrator.register('LIVE_CANDLE_UPDATE_5M', m => {
                const candle = m.payload as Candle & {isClosed: boolean};
                this.updateState(s => {
                    const idx = s.candlesForChart.findIndex(c=>c.time === candle.time);
                    const newCandles = [...s.candlesForChart];
                    if(idx !== -1) newCandles[idx] = candle; else newCandles.push(candle);
                    return {...s, candlesForChart: newCandles.sort((a,b)=>a.time-b.time).slice(-200)};
                });
            }) as MessageHandler;
            orchestrator.register('INDICATORS_READY_5M', m => this.updateState(s => ({...s, latestIndicators: m.payload}))) as MessageHandler;
            orchestrator.register('DATA_STATUS_UPDATE', m => this.updateState(s => ({...s, dataStatus: {...s.dataStatus, lastUpdateTime: (m.payload as any).lastUpdateTime}}))) as MessageHandler;
            orchestrator.register('DATA_ERROR', m => this.updateState(s => ({...s, dataError: m.payload, dataStatus:{text:`Error!`, color:"red", lastUpdateTime:s.dataStatus.lastUpdateTime}}))) as MessageHandler;
          }
          private updateState(updater: StateUpdaterCb | Partial<AppState>) {
            this.state = typeof updater === 'function' ? updater(this.state) : { ...this.state, ...updater };
            this.listeners.forEach(l => l(this.state));
          }
          getState = () => this.state;
          subscribe = (l: (s: AppState) => void) => { this.listeners.add(l); return () => this.listeners.delete(l); };
        }
        export const uiAdapter = new UIAdapterService();
        ```
    3.  **Create `src/components/SignalDisplay.tsx`:**
        ```tsx
        // src/components/SignalDisplay.tsx
        "use client";
        import { useAppState } from '@/hooks/useAppState';
        export default function SignalDisplay() {
          const { latestSignal, latestIndicators } = useAppState();
          if (!latestSignal) return <p>Awaiting signal...</p>;
          const { action, confidence, reason, marketRegime, entryPrice, stopLoss, takeProfit } = latestSignal;
          return (
            <div style={{border: `3px solid ${action === 'BUY' ? 'green' : action === 'SELL' ? 'red' : 'grey'}`, padding: '15px', margin: '10px 0'}}>
              <h3>Current Signal: <span style={{color: action === 'BUY' ? 'green' : action === 'SELL' ? 'red' : 'black'}}>{action}</span></h3>
              <p><strong>Confidence: {confidence.toFixed(1)}%</strong></p>
              <p>Reason: {reason}</p>
              <p>Market Regime: {marketRegime}</p>
              {action !== 'HOLD' && entryPrice && (
                <>
                  <p>Entry: {entryPrice.toFixed(2)}</p>
                  <p>Stop-Loss: {stopLoss?.toFixed(2) || 'N/A'}</p>
                  <p>Take-Profit: {takeProfit?.toFixed(2) || 'N/A'}</p>
                </>
              )}
              {latestIndicators && <details><summary>Indicators</summary><pre style={{fontSize:'0.8em'}}>{JSON.stringify(latestIndicators, null, 2)}</pre></details>}
            </div>
          );
        }
        ```
    4.  Add `<SignalDisplay />` to `src/app/dashboard/page.tsx`. Also, update `DataFreshnessIndicator` to use `useAppState`.
*   **✅ Verification:** Run `npm run dev`. Dashboard should show:
    *   "Awaiting signal..." then update with BUY/SELL/HOLD, confidence, reason, regime, and SL/TP.
    *   The border color should change based on BUY/SELL.
    *   Indicator details should be viewable.

---
### Phase 4: ⚡ Actionability - Don't Miss the Trade!

**Task 4.1: Implement Signal Alerts**
*   **Why:** Notifies user of high-confidence signals for timely action.
*   **Instructions:**
    1.  Modify `UIAdapter.ts`: In its constructor, when handling `NEW_SIGNAL_5M`:
        ```typescript
        // Inside UIAdapter.ts constructor, within the NEW_SIGNAL_5M handler:
        // orchestrator.register('NEW_SIGNAL_5M', m => {
        //   const signal = m.payload as TradingSignal; // Cast to TradingSignal
        //   this.updateState(s => ({...s, latestSignal: signal}));
        //   // ADD THIS:
        //   if (signal.action !== 'HOLD' && signal.confidence >= 65) { // Alert threshold
        //     if (Notification.permission === 'granted') {
        //       new Notification(`BitDash3: ${signal.action} BTC (${signal.confidence.toFixed(0)}%)`, { body: signal.reason });
        //     } else if (Notification.permission !== 'denied') {
        //       Notification.requestPermission().then(p => { if (p === 'granted') new Notification(...); });
        //     }
        //   }
        // }) as MessageHandler;
        ```
*   **✅ Verification:** Run `npm run dev`. When a BUY/SELL signal with confidence >= 65% appears, a browser notification should pop up (you may need to grant permission first).

---
**Final Check for the Novice Developer:**
*   Go through each "✅ Verification" step again. Does everything work as described?
*   Is the displayed signal information clear and directly helpful for making a trading decision?
*   Is the data freshness indicator reliable?
*   Are alerts timely for high-confidence signals?

This lean roadmap focuses on the critical path to a decision-making tool. Further enhancements (detailed performance tracking, advanced UI elements, etc.) can be added later.
