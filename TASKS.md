# BitDash3 — Lean & Profitable 5-Minute Bitcoin Signal Dashboard

## 🎯 Mission

Guide a novice developer to build a dashboard that surfaces clear, actionable information to help a user make **profitable Bitcoin trading decisions on the 5-minute chart.** This document is your primary guide. Follow it meticulously.

## ✅ Completion Status - Updated 2025-06-16

### Phase 1: 🏗️ Data Foundation & Basic Chart Display - COMPLETED ✅
- [x] **Task 1.1**: Setup the Orchestrator (Message Manager) - *Completed 2025-06-15*
- [x] **Task 1.2**: Implement DataCollector Agent - *Completed 2025-06-15*
- [x] **Task 1.3**: Basic Candle Chart Display - *Completed 2025-06-15*
- [x] **Task 1.4**: Data Freshness Indicator - *Completed 2025-06-16*

### Phase 2: ⚙️ Core Indicator Calculation - COMPLETED ✅
- [x] **Task 2.1**: Implement IndicatorEngine Agent - *Completed 2025-06-16*
- [x] **Task 2.2**: Implement Confluence Scorer - *Completed 2025-06-16*
- [x] **Task 2.3**: Implement Position Sizer - *Completed 2025-06-16*
- [x] **Task 2.4**: Implement Strategy Switcher - *Completed 2025-06-16*

### Phase 3: 🧠 Signal Generation & Core UI Display - IN PROGRESS 🔄
- [x] **Task 3.1**: Implement SignalGenerator Agent - *Completed 2025-06-16*
- [x] **Task 3.2**: Implement TradingSignalPanel - *Completed 2025-06-16*
- [ ] **Task 3.3**: Integrate Signal History Display
- [ ] **Task 3.4**: Add Real-time Signal Updates

### Phase 4: ⚡ Actionability & Optimization
- [ ] **Task 4.1**: Implement Signal Alerts
- [ ] **Task 4.2**: Performance Tracking UI
- [ ] **Task 4.3**: Quick Action Panel

### Known Issues to Address:
- [ ] Replace SignalsDisplay with TradingSignalPanel in LiveDashboard.tsx
- [ ] Refactor signal.ts to use StrategyAutomaticSwitcher
- [ ] Add error boundaries and fallback states
- [ ] Complete signal history display integration
- [ ] Add regime change triggers for signal updates

---

## 📜 Development Philosophy & Key Principles

*   **Lean & Focused:** Only implement features *exactly* as described in each task. Avoid adding extra functionality or complexity prematurely. The goal is to build a minimal, viable product first.
*   **Mock Data First (When Applicable):** Use `npm run dev` for easy local testing. The initial tasks focus on real-time data, but this principle will apply later.
*   **Real-time Critical:** Live 5-minute candle data is paramount for this project.
*   **API Limits:** Be mindful of free tier API limits (Binance for candles is primary).
*   **Novice Friendly & Explicit Instructions:** These tasks are broken down step-by-step.
    *   **Stick to the Script:** Implement the code *exactly* as provided in the instructions for each task, unless a specific adaptation is explicitly mentioned. Do not deviate or try to "improve" the provided snippets at this stage.
    *   **Verify, Then Proceed:** Complete *all* verification steps for a task and ensure they pass *before* moving to the next task. This is crucial.
    *   **Understand the 'Why':** Read the "Why" section for each task to grasp its purpose within the larger system.
    *   **One Task at a Time:** Focus solely on the current task. Do not jump ahead or mix instructions from different tasks.

---

## 💡 Core Information for a Profitable 5-Min Trade Decision

The final dashboard *must* clearly and quickly provide:

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
## 🤖 Agent-Based Architecture (Simplified)

To keep our code organized and decoupled, we're using a simplified "Agent-Based" architecture. Imagine specialized robots (Agents) working on an assembly line:

*   `Orchestrator`: The main conveyor belt manager. It passes messages (data, events) between different Agents. Agents don't talk to each other directly; they send messages through the Orchestrator.
*   `DataCollector`: This Agent's only job is to fetch raw Bitcoin price data (5-minute candles) from an external source (Binance) and send it to the Orchestrator.
*   `IndicatorEngine`: This Agent listens for new candle data from the Orchestrator, calculates various technical indicators (like moving averages, RSI), and then sends these calculated indicators to the Orchestrator.
*   `SignalGenerator`: This Agent listens for calculated indicators from the Orchestrator, applies trading logic/strategy, determines a BUY/SELL/HOLD signal, and sends this signal to the Orchestrator.
*   `UI Components / UIAdapter`: These are your display screens (React components). They will listen to messages from the Orchestrator (often via a `UIAdapter` which aggregates state) to display information like charts, signals, and data status.

This approach helps in:
*   **Decoupling:** Agents don't need to know about each other's internal workings.
*   **Modularity:** Each agent has a specific responsibility.
*   **Testability:** Individual agents can be tested more easily.

---

## 🛠️ Lean Development Roadmap: Building the Profitable Decision Dashboard

Follow each task sequentially. Test locally using `npm run dev` at each "✅ Verification" point.

---
### Phase 1: 🏗️ Data Foundation & Basic Chart Display

**Goal:** Get live 5-minute Bitcoin candle data flowing from the `DataCollectorAgent`, through the `Orchestrator`, and displayed in a very basic UI component. This phase is crucial for verifying our core data pipeline.

**Task 1.1: Setup the Orchestrator (Message Manager)**
*   **Why:** To create the central message bus that allows our "Agents" to communicate without being directly dependent on each other. This is the backbone of our application's internal communication.
*   **Instructions:**
    1.  Create folder: `src/lib/agents/` (if it doesn't exist).
    2.  Create file `src/lib/agents/types.ts` with the following exact content:
        ```typescript
        // src/lib/agents/types.ts
        export type AgentName = 
          | 'DataCollector' 
          | 'IndicatorEngine' 
          | 'SignalGenerator' 
          | 'Orchestrator' 
          | 'UI' 
          | 'BasicCandleDisplay' // For our simple verification chart
          | 'AgentInitializer'   // For initializing agents if needed later
          | 'DataFreshnessIndicator';

        export interface AgentMessage<T = any> {
          from: AgentName;
          type: string; // e.g., 'LIVE_CANDLE_UPDATE_5M', 'INDICATORS_READY_5M'
          payload: T;
          timestamp: number;
        }

        export type MessageHandler<T = any> = (message: AgentMessage<T>) => void;
        ```
    3.  Create file `src/lib/agents/Orchestrator.ts` with the following exact content:
        ```typescript
        // src/lib/agents/Orchestrator.ts
        import { AgentMessage, MessageHandler } from './types';

        class OrchestratorService {
          private subscribers: Map<string, MessageHandler[]> = new Map();

          public register(messageType: string, handler: MessageHandler): () => void {
            if (!this.subscribers.has(messageType)) {
              this.subscribers.set(messageType, []);
            }
            this.subscribers.get(messageType)!.push(handler);
            
            // Return an unsubscribe function
            return () => {
              const handlers = this.subscribers.get(messageType);
              if (handlers) {
                this.subscribers.set(messageType, handlers.filter(h => h !== handler));
              }
            };
          }

          public send<T>(message: AgentMessage<T>): void {
            console.log(`📬 Orchestrator: [${message.from}] sent [${message.type}]`, message.payload);
            const handlers = this.subscribers.get(message.type);
            if (handlers) {
              handlers.forEach(h => {
                try {
                  h(message);
                } catch (e) {
                  console.error(`Orchestrator: Error in handler for [${message.type}] from [${message.from}]:`, e);
                }
              });
            }
          }
        }

        export const orchestrator = new OrchestratorService();
        ```
*   **✅ Verification:**
    1.  Run `npm run dev`.
    2.  Open your browser's developer console.
    3.  There should be **no errors** in the console related to these new files.
    4.  Confirm the files `src/lib/agents/types.ts` and `src/lib/agents/Orchestrator.ts` exist with the content provided.

**Task 1.2: Implement DataCollector Agent (Get Live Candles)**
*   **Why:** This agent is responsible for fetching the 5-minute Bitcoin price data (candles) from Binance. It will then send this data to the `Orchestrator` so other parts of our application can use it.
*   **Key Principles for this Task:**
    *   Implement the agent *exactly* as shown to ensure it integrates correctly with the system we're building.
    *   This agent should auto-start its data fetching process upon initialization.
*   **Pre-requisites:**
    1.  Ensure your `src/lib/binance.ts` file exports a function like `getBinanceCandles(symbol: string, interval: string, params?: { limit?: number })` for fetching initial historical candle data.
    2.  Ensure your `src/lib/binance-websocket.ts` file exports a function like `subscribeToCandleUpdates(callback: (candle: Candle, isClosed: boolean) => void)` for live WebSocket data. (Note: The actual `subscribeToCandleUpdates` might take `symbol` and `interval` as arguments too, adapt the call in `DataCollector.ts` if needed, but the callback signature is key).
    3.  Ensure you have a `Candle` type defined in `src/lib/types.ts` (e.g., `{ time: number; open: number; high: number; low: number; close: number; volume: number; }`).
    4.  Ensure you have a type for Binance WebSocket Kline data (Task 1.2 in original `TASKS.md` called it `BinanceKline`, you might have it as `CandleWebSocketData`'s `k` property in `src/lib/types.ts`). This is what `subscribeToCandleUpdates` will provide to its callback.
*   **Instructions:**
    1.  Create file `src/lib/agents/DataCollector.ts` with the following exact content. Pay close attention to the function names used for fetching data (e.g., `getBinanceCandles`, `subscribeToCandleUpdates`) and ensure they match what's available in your `binance.ts` and `binance-websocket.ts`.
        ```typescript
        // src/lib/agents/DataCollector.ts
        import { orchestrator } from './Orchestrator';
        import { AgentMessage, AgentName } from './types';
        import { Candle } from '@/lib/types'; // Your project's Candle type
        // Adjust these imports if your function names or file locations differ:
        import { getBinanceCandles } from '@/lib/binance'; 
        import { subscribeToCandleUpdates } from '@/lib/binance-websocket'; 
        // If your subscribeToCandleUpdates needs symbol/interval, pass them in setupWebSocket.

        const SYMBOL = 'BTCUSDT';
        const INTERVAL = '5m';
        const HISTORICAL_LIMIT = 100; // For initial chart data
        const BUFFER_MAX = 200;       // Max candles to keep in memory

        class DataCollectorAgent {
          private candleBuffer: Candle[] = [];
          private lastCandleTime: number = 0;
          private unsubscribeWebSocket: (() => void) | null = null;
          private isInitializing: boolean = false; // Prevent multiple init calls

          constructor() {
            console.log("DataCollectorAgent: Constructor called. Initializing...");
            this.init();
          }

          private async init(): Promise<void> {
            if (this.isInitializing) return;
            this.isInitializing = true;

            try {
              // 1. Fetch initial historical candles
              console.log("DataCollectorAgent: Fetching initial historical candles...");
              const initialData = await getBinanceCandles(SYMBOL, INTERVAL, { limit: HISTORICAL_LIMIT });
              
              this.candleBuffer = initialData.map(k => ({ 
                time: k.time, // Ensure this is a number (timestamp)
                open: Number(k.open), 
                high: Number(k.high), 
                low: Number(k.low), 
                close: Number(k.close), 
                volume: Number(k.volume) 
              })).sort((a, b) => a.time - b.time); // Ensure sorted by time

              if (this.candleBuffer.length > 0) {
                this.lastCandleTime = this.candleBuffer[this.candleBuffer.length - 1].time;
                console.log(`DataCollectorAgent: Loaded ${this.candleBuffer.length} initial candles. Last candle time: ${new Date(this.lastCandleTime).toISOString()}`);
                
                // Send initial candles to the Orchestrator
                orchestrator.send<Candle[]>({ 
                  from: 'DataCollector' as AgentName, 
                  type: 'INITIAL_CANDLES_5M', 
                  payload: [...this.candleBuffer], 
                  timestamp: Date.now() 
                });
              } else {
                console.warn("DataCollectorAgent: No initial candles were loaded.");
              }

              // 2. Subscribe to live candle updates
              this.setupWebSocket();
              
              console.log("DataCollectorAgent: Initialization complete and subscribed to live updates.");
              orchestrator.send({ from: 'DataCollector' as AgentName, type: 'DATA_COLLECTOR_READY', payload: null, timestamp: Date.now() });

            } catch (e: any) {
              console.error("DataCollectorAgent: Initialization Error:", e);
              orchestrator.send<string>({ 
                from: 'DataCollector' as AgentName, 
                type: 'DATA_ERROR', 
                payload: e.message || String(e), 
                timestamp: Date.now()
              });
            } finally {
              this.isInitializing = false;
            }
          }

          private setupWebSocket(): void {
            if (this.unsubscribeWebSocket) { // Unsubscribe from previous if any
                this.unsubscribeWebSocket();
                this.unsubscribeWebSocket = null;
            }
            console.log("DataCollectorAgent: Subscribing to live candle stream...");
            // Adapt this call if your subscribeToCandleUpdates takes SYMBOL & INTERVAL
            this.unsubscribeWebSocket = subscribeToCandleUpdates((klineData, isClosed) => {
              // Assuming klineData is the raw data from WebSocket (e.g., data.k from original TASKS.md)
              // And isClosed is a boolean indicating if the candle is final.
              const candle: Candle = { 
                time: klineData.t, // Ensure this is a number (timestamp)
                open: parseFloat(klineData.o), 
                high: parseFloat(klineData.h), 
                low: parseFloat(klineData.l), 
                close: parseFloat(klineData.c), 
                volume: parseFloat(klineData.v)
              };
              
              const idx = this.candleBuffer.findIndex(c => c.time === candle.time);
              if (idx !== -1) { // Update existing candle
                this.candleBuffer[idx] = candle;
              } else if (candle.time > this.lastCandleTime) { // Add new candle
                this.candleBuffer.push(candle);
                this.candleBuffer.sort((a,b) => a.time - b.time); // Keep sorted
              } else {
                // console.log("DataCollectorAgent: Received old candle, ignoring.", candle.time, new Date(candle.time).toISOString());
                return; // Old candle, ignore
              }

              if (this.candleBuffer.length > BUFFER_MAX) {
                this.candleBuffer.shift(); // Maintain buffer size
              }
              this.lastCandleTime = Math.max(...this.candleBuffer.map(c => c.time));

              // Send live update to Orchestrator
              orchestrator.send<Candle & {isClosed: boolean}>({ 
                from: 'DataCollector' as AgentName, 
                type: 'LIVE_CANDLE_UPDATE_5M', 
                payload: {...candle, isClosed: isClosed}, 
                timestamp: Date.now() 
              });

              if (isClosed) { // If candle is closed, send a specific message
                // console.log(`DataCollectorAgent: New closed candle ${new Date(candle.time).toISOString()}`);
                orchestrator.send<Candle>({ 
                  from: 'DataCollector' as AgentName, 
                  type: 'NEW_CLOSED_CANDLE_5M', 
                  payload: candle, 
                  timestamp: Date.now() 
                });
              }
            });
            console.log("DataCollectorAgent: WebSocket subscription established.");
          }
          
          public cleanup(): void {
            console.log("DataCollectorAgent: Cleaning up...");
            if (this.unsubscribeWebSocket) {
              this.unsubscribeWebSocket();
              this.unsubscribeWebSocket = null;
              console.log("DataCollectorAgent: Unsubscribed from WebSocket.");
            }
          }
        }

        // Auto-starts the agent when this module is imported
        export const dataCollectorAgent = new DataCollectorAgent();

        // Optional: Add cleanup if running in a browser environment
        if (typeof window !== 'undefined') {
          window.addEventListener('beforeunload', () => {
            dataCollectorAgent.cleanup();
          });
        }
        ```
*   **✅ Verification:**
    1.  Run `npm run dev`.
    2.  Open your browser's developer console.
    3.  You **must** see:
        *   `DataCollectorAgent: Constructor called. Initializing...`
        *   `DataCollectorAgent: Fetching initial historical candles...`
        *   (After a short delay) `DataCollectorAgent: Loaded X initial candles...` (where X > 0)
        *   `📬 Orchestrator: [DataCollector] sent [INITIAL_CANDLES_5M]` (inspect payload: should be an array of candles)
        *   `DataCollectorAgent: Subscribing to live candle stream...`
        *   `DataCollectorAgent: WebSocket subscription established.`
        *   `DataCollectorAgent: Initialization complete and subscribed to live updates.`
        *   `📬 Orchestrator: [DataCollector] sent [DATA_COLLECTOR_READY]`
    4.  Then, every few seconds (for live updates) or every 5 minutes (for closed candles), you **must** see:
        *   `📬 Orchestrator: [DataCollector] sent [LIVE_CANDLE_UPDATE_5M]` (inspect payload: should be a single candle with `isClosed` property)
        *   And, when a 5-minute candle closes: `📬 Orchestrator: [DataCollector] sent [NEW_CLOSED_CANDLE_5M]` (inspect payload: should be a single candle)
    5.  There should be **no** "DataCollectorAgent: Initialization Error" or "DATA_ERROR" messages from `DataCollector` in the console at this stage.

**Task 1.3: Basic Candle Chart Display (Verification Step)**
*   **Why:** This task is **CRITICAL** for verifying that our `DataCollectorAgent` and `Orchestrator` are working correctly and that data is flowing through the system. We will create a **very simple** React component that listens to the `Orchestrator` and displays raw candle data. **This is NOT the final chart for the dashboard; it's a temporary diagnostic tool.**
*   **Key Principles for this Task:**
    *   **Simplicity is Key:** Do NOT use any charting libraries (like `lightweight-charts`) for this task.
    *   **Direct Orchestrator Subscription:** This component MUST subscribe directly to the `Orchestrator` to receive candle data. Do NOT use custom hooks like `useMarketData` for this specific verification task.
    *   **Stick to the Snippet:** Implement the component *exactly* as provided below.
*   **Instructions:**
    1.  Create file `src/components/BasicCandleDisplay.tsx` with the following exact content:
        ```tsx
        // src/components/BasicCandleDisplay.tsx
        "use client";
        import React, { useEffect, useState } from 'react';
        import { orchestrator } from '@/lib/agents/Orchestrator';
        import { AgentMessage, AgentName, MessageHandler } from '@/lib/agents/types';
        import { Candle } from '@/lib/types';

        export default function BasicCandleDisplay() {
          const [candles, setCandles] = useState<Candle[]>([]);
          const [error, setError] = useState<string | null>(null);
          const [lastMessageTimestamp, setLastMessageTimestamp] = useState<number>(0);

          useEffect(() => {
            console.log("BasicCandleDisplay: Mounting and subscribing to Orchestrator.");

            const handleInitial = (msg: AgentMessage<Candle[]>) => {
              console.log("BasicCandleDisplay: Received INITIAL_CANDLES_5M", msg.payload.length);
              setCandles(msg.payload.slice(-100)); // Keep a reasonable buffer for display
              setError(null);
              setLastMessageTimestamp(Date.now());
            };

            const handleUpdate = (msg: AgentMessage<Candle & {isClosed: boolean}>) => {
              // console.log("BasicCandleDisplay: Received LIVE_CANDLE_UPDATE_5M", msg.payload);
              setCandles(prev => {
                const c = msg.payload;
                const updated = [...prev];
                const idx = updated.findIndex(pc => pc.time === c.time);
                if (idx !== -1) updated[idx] = c;
                else updated.push(c);
                // Sort by time and keep the most recent ones
                return updated.sort((a,b) => a.time - b.time).slice(-100); 
              });
              setLastMessageTimestamp(Date.now());
            };
            
            const handleError = (msg: AgentMessage<string | {message: string}>) => {
              const errorMessage = typeof msg.payload === 'string' ? msg.payload : msg.payload?.message;
              console.error("BasicCandleDisplay: Received DATA_ERROR", errorMessage);
              setError(errorMessage || "An unknown data error occurred.");
              setLastMessageTimestamp(Date.now());
            };

            // Important: Cast handlers to MessageHandler to satisfy Orchestrator's register method
            const unsubs = [
              orchestrator.register('INITIAL_CANDLES_5M', handleInitial as MessageHandler),
              orchestrator.register('LIVE_CANDLE_UPDATE_5M', handleUpdate as MessageHandler),
              orchestrator.register('NEW_CLOSED_CANDLE_5M', handleUpdate as MessageHandler), // Also update on new closed candle
              orchestrator.register('DATA_ERROR', handleError as MessageHandler)
            ];
            
            // Request initial data once after subscriptions are set up
            // The DataCollectorAgent might be set up to listen for this or send data proactively.
            // If DataCollector sends proactively, this might just ensure it if there was a race condition.
            orchestrator.send({
                from: 'BasicCandleDisplay' as AgentName,
                type: 'REQUEST_INITIAL_DATA', // Or DataCollector might send 'INITIAL_CANDLES_5M' automatically
                payload: {},
                timestamp: Date.now()
            });
            console.log("BasicCandleDisplay: Sent REQUEST_INITIAL_DATA");

            return () => {
              console.log("BasicCandleDisplay: Unmounting and unsubscribing.");
              unsubs.forEach(u => u());
            };
          }, []);

          if (error) {
            return <div style={{ color: 'red', border: '1px solid red', padding: '10px', margin: '10px' }}>
              <h4>Chart Error:</h4>
              <pre>{error}</pre>
              <p>Last update attempt: {new Date(lastMessageTimestamp).toLocaleTimeString()}</p>
            </div>;
          }
          
          return (
            <div style={{border: '1px solid #ccc', padding: '10px', margin: '10px'}}>
              <h4>5-Min Candles (Raw Data - Last 10 Displayed)</h4>
              <p>Last message received: {lastMessageTimestamp ? new Date(lastMessageTimestamp).toLocaleTimeString() : 'N/A'}</p>
              <pre style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', padding: '5px', background: '#f9f9f9'}}>
                {candles.length > 0 
                  ? JSON.stringify(candles.slice(-10).map(c => ({...c, time: new Date(c.time).toISOString()})), null, 2)
                  : "Awaiting candle data..."}
              </pre>
              <p style={{fontSize: '0.8em'}}>Total candles in local buffer: {candles.length}</p>
            </div>
          );
        }
        ```
    2.  Modify `src/app/dashboard/page.tsx` to include this `BasicCandleDisplay` component. You can add it alongside any existing chart for now.
        ```tsx
        // src/app/dashboard/page.tsx
        // ... other imports
        import BasicCandleDisplay from '@/components/BasicCandleDisplay'; // Add this import

        export default function DashboardPage() {
          return (
            // ... existing layout
            // Add the BasicCandleDisplay component, for example:
            <div>
              {/* ... other components ... */}
              <BasicCandleDisplay /> 
              {/* You can keep your advanced CandleChart component too if you wish,
                  but BasicCandleDisplay is for verifying Task 1.3 data flow. */}
              {/* <CandleChart height={600} /> */} 
            </div>
            // ... rest of layout
          );
        }
        ```
*   **✅ Verification:**
    1.  Run `npm run dev`.
    2.  Navigate to your dashboard page in the browser.
    3.  You **must** see the "BasicCandleDisplay" section.
    4.  Initially, it might show "Awaiting candle data...".
    5.  After a short period (once `INITIAL_CANDLES_5M` is received from the `Orchestrator`), the `<pre>` tag **must** populate with JSON data for the last 10 candles. The timestamps should be in ISOString format.
    6.  The `<pre>` tag should then update every few seconds as `LIVE_CANDLE_UPDATE_5M` messages arrive.
    7.  Check the browser console. You should see:
        *   `BasicCandleDisplay: Mounting and subscribing to Orchestrator.`
        *   `BasicCandleDisplay: Sent REQUEST_INITIAL_DATA`
        *   `BasicCandleDisplay: Received INITIAL_CANDLES_5M X` (where X is the number of initial candles)
        *   (Periodically) Logs from `LIVE_CANDLE_UPDATE_5M` if you uncomment the console.log in its handler.
    8.  There should be **no** "Chart Error" message displayed by `BasicCandleDisplay` at this stage.
    9.  **Crucially, this verifies that `DataCollectorAgent` -> `Orchestrator` -> `BasicCandleDisplay` data pipeline is working.**

**Task 1.4: Data Freshness Indicator (Trust Factor)**
*   **Why:** The user *must* know if the data they are seeing is live and up-to-date, or if there's a problem. This component builds trust.
*   **Instructions:**
    1.  **Modify `DataCollectorAgent` (`src/lib/agents/DataCollector.ts`):**
        *   In the `subscribeToCandleUpdates` callback (inside `setupWebSocket`), after sending `LIVE_CANDLE_UPDATE_5M` and `NEW_CLOSED_CANDLE_5M` messages, add a new message send for `DATA_STATUS_UPDATE`.
        ```typescript
        // Inside DataCollector.ts, within the callback for subscribeToCandleUpdates (in setupWebSocket method)
        // After sending LIVE_CANDLE_UPDATE_5M and potentially NEW_CLOSED_CANDLE_5M:
        
        orchestrator.send<{ lastUpdateTime: number; lastCandleTime: number }>({ 
          from: 'DataCollector' as AgentName, 
          type: 'DATA_STATUS_UPDATE', 
          payload: { lastUpdateTime: Date.now(), lastCandleTime: candle.time }, 
          timestamp: Date.now() 
        });
        ```
    2.  Create `src/components/DataFreshnessIndicator.tsx` with the following exact content:
        ```tsx
        // src/components/DataFreshnessIndicator.tsx
        "use client";
        import React, { useState, useEffect } from 'react';
        import { orchestrator } from '@/lib/agents/Orchestrator';
        import { AgentMessage, AgentName, MessageHandler } from '@/lib/agents/types';

        interface DataStatusPayload {
          lastUpdateTime: number;
          lastCandleTime?: number; // Optional, but good to have
        }
        interface DataErrorPayload {
            message: string;
            context?: string;
            // other fields if your DATA_ERROR payload is more complex
        }

        export default function DataFreshnessIndicator() {
          const [statusText, setStatusText] = useState("Connecting...");
          const [statusColor, setStatusColor] = useState("orange");
          const [lastDataTimestamp, setLastDataTimestamp] = useState<number | null>(null);

          useEffect(() => {
            console.log("DataFreshnessIndicator: Mounting and subscribing.");
            
            const handleStatusUpdate = (msg: AgentMessage<DataStatusPayload>) => {
              setLastDataTimestamp(msg.payload.lastUpdateTime);
              // setError(null); // Clear any previous error if we get a good status
            };

            const handleError = (msg: AgentMessage<DataErrorPayload | string>) => {
              const errorPayload = msg.payload;
              const message = typeof errorPayload === 'string' ? errorPayload : errorPayload?.message;
              setStatusText(`Error: ${message ? message.substring(0,30) : 'Unknown'}`);
              setStatusColor("red");
              // setLastDataTimestamp(null); // Or keep last known good time?
              console.error("DataFreshnessIndicator: Received DATA_ERROR", msg.payload);
            };

            const unsubs = [
              orchestrator.register('DATA_STATUS_UPDATE', handleStatusUpdate as MessageHandler),
              orchestrator.register('DATA_ERROR', handleError as MessageHandler)
            ];

            const intervalId = setInterval(() => {
              if (statusColor === "red") return; // Stay in error state if already there

              if (lastDataTimestamp === null) {
                setStatusText("Connecting...");
                setStatusColor("orange");
                return;
              }
              
              const ageSeconds = (Date.now() - lastDataTimestamp) / 1000;

              if (ageSeconds < 10) { // Less than 10 seconds old
                setStatusText("● Live");
                setStatusColor("green");
              } else if (ageSeconds < 30) { // 10-30 seconds old
                setStatusText(`● ${Math.round(ageSeconds)}s ago`);
                setStatusColor("lightgreen");
              } else if (ageSeconds < 120) { // 30s to 2min old
                setStatusText(`● ${Math.round(ageSeconds)}s ago (stale)`);
                setStatusColor("orange");
              } else { // Older than 2 minutes
                setStatusText(`● >2m stale!`);
                setStatusColor("red");
              }
            }, 2000); // Check every 2 seconds

            return () => {
              console.log("DataFreshnessIndicator: Unmounting.");
              unsubs.forEach(u => u());
              clearInterval(intervalId);
            };
          }, [lastDataTimestamp, statusColor]); // Rerun effect if these change

          return (
            <div style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
              Data Status: <strong style={{ color: statusColor }}>{statusText}</strong>
            </div>
          );
        }
        ```
    3.  Add `<DataFreshnessIndicator />` to `src/app/dashboard/page.tsx`.
        ```tsx
        // src/app/dashboard/page.tsx
        // ... other imports
        import DataFreshnessIndicator from '@/components/DataFreshnessIndicator'; // Add this

        export default function DashboardPage() {
          return (
            // ... existing layout
            <div>
              <DataFreshnessIndicator /> {/* Add this, perhaps at the top */}
              {/* ... other components ... */}
              <BasicCandleDisplay /> 
            </div>
            // ... rest of layout
          );
        }
        ```
*   **✅ Verification:**
    1.  Run `npm run dev`.
    2.  On your dashboard page, you should see the "Data Status:" indicator.
    3.  Initially, it might show "Connecting...".
    4.  Once the `DataCollectorAgent` starts sending `DATA_STATUS_UPDATE` messages (triggered by live candle updates), the indicator should change to "● Live" (green).
    5.  If you simulate data stopping (e.g., disconnect internet briefly, if possible, or stop the `npm run dev` process if it serves mock data that stops), the indicator should change through "● Xs ago" (lightgreen/orange) and eventually to "● >2m stale!" (red).
    6.  If a `DATA_ERROR` message is sent by `DataCollectorAgent`, the indicator should show an error state (red).
    7.  Check console logs from `DataFreshnessIndicator` for mounting/unmounting and `DATA_ERROR` messages.

---
### Phase 2: ⚙️ Core Indicator Calculation - The Analyst Robot

**Goal:** Calculate key technical indicators from the live candle data. This phase introduces the `IndicatorEngineAgent`.

**Task 2.1: Implement IndicatorEngine Agent**
*   **Why:** This agent centralizes all technical indicator calculations. It listens for *closed* candles from the `DataCollectorAgent`, performs calculations, and then sends a dataset of all calculated indicators to the `Orchestrator`. This keeps other agents (like the `SignalGenerator`) cleaner, as they can just consume the final indicator values.
*   **Key Principles for this Task:**
    *   The `IndicatorEngineAgent` should *only* calculate indicators when a **new closed candle** is available (`NEW_CLOSED_CANDLE_5M` message).
    *   Indicator calculation functions (e.g., for EMA, RSI, Bollinger Bands, ATR) should ideally be pure functions located in `src/lib/indicators/`.
*   **Pre-requisite:**
    1.  You will need functions to calculate:
        *   EMA (Exponential Moving Average) - e.g., `ema(prices: number[], period: number): number[]`
        *   RSI (Relative Strength Index) - e.g., `rsi(prices: number[], period: number): number[]`
        *   Bollinger Bands - e.g., `bollingerBands(prices: number[], period: number, stdDev: number): { upper: number[], middle: number[], lower: number[] }`
        *   **ATR (Average True Range) - e.g., `atr(candles: Candle[], period: number): number[]` - This is crucial for later tasks (Stop Loss/Take Profit). Ensure this function is created and returns the ATR values.**
    2.  Place these functions in appropriate files within `src/lib/indicators/` (e.g., `src/lib/indicators/moving-averages.ts`, `src/lib/indicators/oscillators.ts`, `src/lib/indicators/volatility.ts`).
*   **Instructions:**
    1.  Define the `IndicatorDataSet` interface. This will be the structure of the data packet this agent sends. Add it to `src/lib/agents/types.ts` or create a new `src/lib/agents/IndicatorEngineTypes.ts` if preferred. For now, let's add to `types.ts` for simplicity:
        ```typescript
        // src/lib/agents/types.ts
        // ... (other types) ...

        export interface IndicatorDataSet {
          emaFast: number | null;
          emaSlow: number | null;
          rsi: number | null;
          bbUpper: number | null;
          bbMiddle: number | null;
          bbLower: number | null;
          atr: number | null; // Average True Range
          // avgVolume: number | null; // Add if you implement average volume
          currentPrice: number; // Close price of the candle that triggered calculation
          timestamp: number;    // Timestamp of the candle that triggered calculation
        }
        ```
    2.  Create `src/lib/agents/IndicatorEngine.ts`:
        ```typescript
        // src/lib/agents/IndicatorEngine.ts
        import { orchestrator } from './Orchestrator';
        import { AgentMessage, AgentName, MessageHandler, IndicatorDataSet } from './types'; // Or your specific types file
        import { Candle } from '@/lib/types';
        
        // --- IMPORT YOUR ACTUAL INDICATOR FUNCTIONS ---
        // Example:
        import { ema } from '@/lib/indicators/moving-averages';
        import { rsi } from '@/lib/indicators/oscillators';
        import { bollingerBands } from '@/lib/indicators/bollinger-bands'; // Assuming you create this
        import { atr } from '@/lib/indicators/atr'; // Assuming you create this for ATR

        const EMA_FAST_PERIOD = 9;
        const EMA_SLOW_PERIOD = 21;
        const RSI_PERIOD = 14;
        const BB_PERIOD = 20;
        const BB_STDDEV = 2;
        const ATR_PERIOD = 14;

        // Determine the minimum number of candles needed based on the longest period indicator
        const MIN_CANDLES_FOR_INDICATORS = Math.max(EMA_SLOW_PERIOD, RSI_PERIOD, BB_PERIOD, ATR_PERIOD) + 5; // Add a small buffer
        const MAX_CANDLE_HISTORY = 200; // How many recent candles to keep for calculations

        class IndicatorEngineAgent {
          private candles: Candle[] = [];

          constructor() {
            console.log("IndicatorEngineAgent: Constructor called. Subscribing to NEW_CLOSED_CANDLE_5M.");
            // This agent only acts when a new 5-minute candle is fully closed.
            orchestrator.register('NEW_CLOSED_CANDLE_5M', this.onNewClosedCandle.bind(this) as MessageHandler);
            orchestrator.register('INITIAL_CANDLES_5M', this.handleInitialCandles.bind(this) as MessageHandler)
          }

          private handleInitialCandles(msg: AgentMessage<Candle[]>): void {
            console.log("IndicatorEngineAgent: Received initial candles. Storing for calculations.");
            // Store initial candles to have history for first calculations
            this.candles = [...msg.payload].sort((a,b) => a.time - b.time);
            if (this.candles.length > MAX_CANDLE_HISTORY) {
                this.candles = this.candles.slice(-MAX_CANDLE_HISTORY);
            }
            // Optionally, calculate indicators for the latest of these initial candles
            if (this.candles.length >= MIN_CANDLES_FOR_INDICATORS) {
                const latestCandle = this.candles[this.candles.length -1];
                this.calculateAndSendIndicators(latestCandle);
            }
          }

          private onNewClosedCandle(msg: AgentMessage<Candle>): void {
            const newCandle = msg.payload;
            // console.log(`IndicatorEngineAgent: Received new closed candle for ${new Date(newCandle.time).toISOString()}`);

            // Add new candle to our history and maintain buffer size
            const existingIndex = this.candles.findIndex(c => c.time === newCandle.time);
            if (existingIndex === -1) {
                this.candles.push(newCandle);
                this.candles.sort((a,b) => a.time - b.time); // Ensure sorted
                if (this.candles.length > MAX_CANDLE_HISTORY) {
                    this.candles.shift(); // Remove oldest
                }
            } else {
                this.candles[existingIndex] = newCandle; // Update if somehow received again
            }
            
            this.calculateAndSendIndicators(newCandle);
          }

          private calculateAndSendIndicators(triggeringCandle: Candle): void {
            if (this.candles.length < MIN_CANDLES_FOR_INDICATORS) {
              // console.log(`IndicatorEngineAgent: Not enough candle data (${this.candles.length}/${MIN_CANDLES_FOR_INDICATORS}) to calculate all indicators.`);
              return;
            }

            const closes = this.candles.map(c => c.close);
            // For ATR, you need high, low, close. Pass the full `this.candles` array.

            // Calculate indicators - these functions should handle insufficient data gracefully (e.g., return null or empty array)
            const emaFastValues = ema(closes, EMA_FAST_PERIOD);
            const emaSlowValues = ema(closes, EMA_SLOW_PERIOD);
            const rsiValues = rsi(closes, RSI_PERIOD);
            const bbValues = bollingerBands(closes, BB_PERIOD, BB_STDDEV);
            const atrValues = atr(this.candles, ATR_PERIOD); // Pass full candles for ATR

            const payload: IndicatorDataSet = {
              emaFast: emaFastValues.length ? emaFastValues[emaFastValues.length - 1] : null,
              emaSlow: emaSlowValues.length ? emaSlowValues[emaSlowValues.length - 1] : null,
              rsi: rsiValues.length ? rsiValues[rsiValues.length - 1] : null,
              bbUpper: bbValues && bbValues.upper.length ? bbValues.upper[bbValues.upper.length - 1] : null,
              bbMiddle: bbValues && bbValues.middle.length ? bbValues.middle[bbValues.middle.length - 1] : null,
              bbLower: bbValues && bbValues.lower.length ? bbValues.lower[bbValues.lower.length - 1] : null,
              atr: atrValues.length ? atrValues[atrValues.length - 1] : null,
              currentPrice: triggeringCandle.close,
              timestamp: triggeringCandle.time,
            };

            // console.log("IndicatorEngineAgent: Calculated Indicators:", payload);
            orchestrator.send<IndicatorDataSet>({ 
              from: 'IndicatorEngine' as AgentName, 
              type: 'INDICATORS_READY_5M', 
              payload, 
              timestamp: Date.now() 
            });
          }
        }
        export const indicatorEngineAgent = new IndicatorEngineAgent(); // Auto-starts
        ```
*   **✅ Verification:**
    1.  Run `npm run dev`.
    2.  Ensure your `DataCollectorAgent` is sending `NEW_CLOSED_CANDLE_5M` messages (this happens every 5 minutes after a candle closes).
    3.  In the browser console, after enough candles have been collected (at least `MIN_CANDLES_FOR_INDICATORS`), you **must** see:
        *   `IndicatorEngineAgent: Constructor called...`
        *   (Potentially) `IndicatorEngineAgent: Received initial candles...`
        *   When a new 5-min candle closes and `DataCollectorAgent` sends `NEW_CLOSED_CANDLE_5M`:
            *   `📬 Orchestrator: [IndicatorEngine] sent [INDICATORS_READY_5M]`
        *   Inspect the `payload` of the `INDICATORS_READY_5M` message. It should contain values for `emaFast`, `emaSlow`, `rsi`, `bbUpper`, `bbMiddle`, `bbLower`, and importantly, `atr`. These values should seem reasonable (not all null, unless there truly isn't enough data yet).
    4.  If your indicator functions log errors or return unexpected `null`s, investigate them. Ensure they can handle cases where they might not have enough data points yet (e.g., at the very beginning).

---
### Phase 3: 🧠 Signal Generation & Core UI Display - The Decision Helper

**Goal:** Generate a clear BUY/SELL/HOLD signal with all necessary context for a profitable decision, and display this information in the UI.

**Task 3.1: Implement SignalGenerator Agent**
*   **Why:** This agent is the "brain" of our trading logic. It takes the calculated indicators from the `IndicatorEngineAgent` and the current market context to decide whether to issue a BUY, SELL, or HOLD signal.
*   **Key Principles for this Task:**
    *   This agent listens for `INDICATORS_READY_5M` messages.
    *   It will use helper functions for:
        *   Detecting market regime (e.g., trending, ranging).
        *   Calculating a confluence score for signals (combining multiple indicator conditions).
        *   Calculating stop-loss and take-profit targets.
    *   **Crucial Dependency:** This agent relies on the `IndicatorEngineAgent` (Task 2.1) to provide all necessary data, **especially ATR** for calculating trade parameters.
*   **Pre-requisite:**
    1.  Ensure `IndicatorEngineAgent` (Task 2.1) is correctly calculating and sending `atr` in its `IndicatorDataSet` payload.
    2.  You will need to create or adapt functions for:
        *   `detectRegime(indicators: IndicatorDataSet, candles: Candle[]): MarketRegime` (e.g., in `src/lib/market/regime-detector.ts`). `MarketRegime` could be a type like `'trending-up' | 'trending-down' | 'ranging' | 'volatile'`. This function might need historical candle data in addition to the latest indicators.
        *   `getSignalConfluence(indicators: IndicatorDataSet, regime: MarketRegime): { action: 'BUY' | 'SELL' | 'HOLD'; confidence: number; reason: string; }` (e.g., in `src/lib/signals/confluence-scorer.ts`). This is your core strategy logic.
        *   `calculateTradeParams(params: { entryPrice: number; signalType: 'BUY' | 'SELL'; atrValue: number; candles?: Candle[]; riskRewardRatio?: number }): { stopLoss?: number; takeProfit?: number; }` (e.g., in `src/lib/signals/price-targets.ts` or `src/lib/trading/`).
*   **Instructions:**
    1.  Define the `TradingSignal` interface. This is the final output for the UI. Add to `src/lib/agents/types.ts`:
        ```typescript
        // src/lib/agents/types.ts
        // ... (other types) ...
        export type MarketRegime = 'trending-up' | 'trending-down' | 'ranging' | 'volatile' | 'undefined'; // Define your regime types

        export interface TradingSignal {
          action: 'BUY' | 'SELL' | 'HOLD';
          confidence: number; // e.g., 0-100%
          reason: string;     // Brief explanation of why the signal was generated
          marketRegime: MarketRegime;
          entryPrice?: number;
          stopLoss?: number;
          takeProfit?: number;
          timestamp: number; // Timestamp of the indicators that generated this signal
          rawIndicators?: IndicatorDataSet; // Optional: for display/debugging
        }
        ```
    2.  Create `src/lib/agents/SignalGenerator.ts`:
        ```typescript
        // src/lib/agents/SignalGenerator.ts
        import { orchestrator } from './Orchestrator';
        import { AgentMessage, AgentName, MessageHandler, IndicatorDataSet, TradingSignal, MarketRegime } from './types'; // Or your specific types file
        import { Candle } from '@/lib/types'; // If needed by your helper functions

        // --- IMPORT YOUR ACTUAL HELPER FUNCTIONS ---
        // Example:
        import { detectRegime } from '@/lib/market/regime-detector'; // You'll create this
        import { getSignalConfluence } from '@/lib/signals/confluence-scorer'; // You'll create this
        import { calculateTradeParams } from '@/lib/signals/price-targets'; // You'll create this

        class SignalGeneratorAgent {
          private candleHistory: Candle[] = []; // To pass to regime detector if needed
          private readonly MAX_CANDLE_HISTORY = 50; // Keep a small history for regime context

          constructor() {
            console.log("SignalGeneratorAgent: Constructor called. Subscribing to INDICATORS_READY_5M and candle updates.");
            orchestrator.register('INDICATORS_READY_5M', this.onIndicatorsReady.bind(this) as MessageHandler);
            
            // Store some recent candle history if regime detection needs it
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
            // console.log("SignalGeneratorAgent: Received new indicators:", indicators);

            if (!indicators.atr) {
                console.warn("SignalGeneratorAgent: ATR is missing from indicators. Cannot calculate SL/TP accurately. Ensure IndicatorEngine provides ATR.");
                // return; // Or proceed with degraded functionality
            }

            // 1. Determine Market Regime
            // Pass `this.candleHistory` if your detectRegime function needs it.
            const marketRegime: MarketRegime = detectRegime(indicators, this.candleHistory) || 'undefined'; 

            // 2. Get Confluence Score (Your Core Trading Strategy)
            // This function will look at indicators.emaFast, indicators.rsi, etc., and the marketRegime
            const confluence = getSignalConfluence(indicators, marketRegime); 
            // confluence should be: { action: 'BUY' | 'SELL' | 'HOLD'; confidence: number; reason: string; }

            // 3. Calculate Price Targets if it's a BUY or SELL signal
            let sltp = { stopLoss: undefined as number | undefined, takeProfit: undefined as number | undefined };
            if (confluence.action !== 'HOLD' && indicators.currentPrice && indicators.atr) {
              sltp = calculateTradeParams({ 
                entryPrice: indicators.currentPrice, 
                signalType: confluence.action, 
                atrValue: indicators.atr, // ATR is crucial here!
                candles: this.candleHistory, // Optional: if your SL/TP logic needs more candle context
                riskRewardRatio: 2 // Example: Aim for 2:1 R/R
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
              rawIndicators: indicators, // Include for potential UI display or debugging
            };

            // console.log("SignalGeneratorAgent: Generated final signal:", finalSignal);
            orchestrator.send<TradingSignal>({ 
              from: 'SignalGenerator' as AgentName, 
              type: 'NEW_SIGNAL_5M', 
              payload: finalSignal, 
              timestamp: Date.now() 
            });
          }
        }
        export const signalGeneratorAgent = new SignalGeneratorAgent(); // Auto-starts
        ```
    3.  **Crucial Implementation Step:** You **must** implement the helper functions:
        *   `detectRegime`
        *   `getSignalConfluence` (This is where your primary trading rules go, e.g., "IF EMA fast > EMA slow AND RSI > 50 THEN action: 'BUY'")
        *   `calculateTradeParams` (This should use ATR to set reasonable SL/TP levels).
*   **✅ Verification:**
    1.  Run `npm run dev`.
    2.  Ensure `IndicatorEngineAgent` is sending `INDICATORS_READY_5M` messages.
    3.  In the browser console, after an `INDICATORS_READY_5M` event, you **must** see:
        *   `SignalGeneratorAgent: Constructor called...`
        *   `📬 Orchestrator: [SignalGenerator] sent [NEW_SIGNAL_5M]`
        *   Inspect the `payload` of the `NEW_SIGNAL_5M` message. It should contain:
            *   `action`: 'BUY', 'SELL', or 'HOLD'.
            *   `confidence`: A number.
            *   `reason`: A string.
            *   `marketRegime`: A value from your `MarketRegime` type.
            *   `entryPrice`, `stopLoss`, `takeProfit` (should be numbers if action is BUY/SELL and ATR was available, otherwise `undefined`).
            *   `timestamp` and `rawIndicators`.
    4.  Verify that the `stopLoss` and `takeProfit` values make sense relative to the `entryPrice` and the market's volatility (which ATR helps measure).
    5.  If `ATR is missing` warning appears, go back to Task 2.1 and ensure `IndicatorEngineAgent` calculates and sends ATR.

**Task 3.2: Display Core Signal & Parameters in UI (via UIAdapter)**
*   **Why:** To present the actionable trading signal and its context (reason, SL/TP, etc.) to the user on the dashboard. We'll introduce a `UIAdapter` to simplify state management for React components.
*   **Agent Concept: `UIAdapter`**
    *   The `UIAdapter` is a non-visual agent that subscribes to various messages from the `Orchestrator` (like new signals, candle data, data status).
    *   It maintains an aggregated `AppState` object.
    *   React components can then use a simple hook (`useAppState`) to get the latest state from the `UIAdapter` and re-render when it changes. This avoids having many components subscribe to the `Orchestrator` individually.
*   **Instructions:**
    1.  Define `AppState` in `src/lib/agents/types.ts` (or a dedicated UIAdapter types file):
        ```typescript
        // src/lib/agents/types.ts
        // ... (other types) ...

        export interface AppState {
          latestSignal: TradingSignal | null;
          candlesForChart: Candle[]; // For the actual charting library later
          latestIndicators: IndicatorDataSet | null;
          dataStatus: { text: string; color: string; lastUpdateTime: number | null };
          dataError: string | null;
        }
        ```
    2.  Create `src/lib/agents/UIAdapter.ts`:
        ```typescript
        // src/lib/agents/UIAdapter.ts
        import { orchestrator } from './Orchestrator';
        import { AgentMessage, AgentName, MessageHandler, AppState, TradingSignal, IndicatorDataSet } from './types';
        import { Candle } from '@/lib/types';

        // Define initial state structure
        const initialAppState: AppState = {
          latestSignal: null,
          candlesForChart: [],
          latestIndicators: null,
          dataStatus: { text: "Initializing...", color: "grey", lastUpdateTime: null },
          dataError: null,
        };

        class UIAdapterService {
          private state: AppState = { ...initialAppState };
          private listeners = new Set<(state: AppState) => void>();

          constructor() {
            console.log("UIAdapterService: Initializing and subscribing to orchestrator messages.");
            
            // Subscribe to messages needed by the UI
            orchestrator.register('NEW_SIGNAL_5M', 
              (msg: AgentMessage<TradingSignal>) => this.updateState(s => ({ ...s, latestSignal: msg.payload })) as MessageHandler
            );
            orchestrator.register('INITIAL_CANDLES_5M', 
              (msg: AgentMessage<Candle[]>) => this.updateState(s => ({ ...s, candlesForChart: msg.payload.slice(-200) })) as MessageHandler // Keep a buffer
            );
            orchestrator.register('LIVE_CANDLE_UPDATE_5M', 
              (msg: AgentMessage<Candle & {isClosed: boolean}>) => {
                const candle = msg.payload;
                this.updateState(s => {
                  const newCandles = [...s.candlesForChart];
                  const idx = newCandles.findIndex(c => c.time === candle.time);
                  if (idx !== -1) newCandles[idx] = candle;
                  else newCandles.push(candle);
                  return { ...s, candlesForChart: newCandles.sort((a,b)=>a.time-b.time).slice(-200) }; // Maintain buffer & sort
                });
              } as MessageHandler
            );
            orchestrator.register('INDICATORS_READY_5M', 
              (msg: AgentMessage<IndicatorDataSet>) => this.updateState(s => ({ ...s, latestIndicators: msg.payload })) as MessageHandler
            );
            
            // Handle data status and errors for the DataFreshnessIndicator via AppState
            orchestrator.register('DATA_STATUS_UPDATE', 
              (msg: AgentMessage<{lastUpdateTime: number}>) => {
                this.updateState(s => ({ 
                  ...s, 
                  dataStatus: { ...s.dataStatus, text: "● Live", color: "green", lastUpdateTime: msg.payload.lastUpdateTime },
                  dataError: null // Clear error on good status
                }));
              } as MessageHandler
            );
            orchestrator.register('DATA_ERROR', 
              (msg: AgentMessage<string | {message: string}>) => {
                const errorPayload = msg.payload;
                const message = typeof errorPayload === 'string' ? errorPayload : errorPayload?.message;
                this.updateState(s => ({ 
                  ...s, 
                  dataError: message || "Unknown error",
                  dataStatus: { ...s.dataStatus, text: `Error: ${message ? message.substring(0,30) : 'Unknown'}`, color: "red" }
                }));
              } as MessageHandler
            );
          }

          private updateState(updater: (prevState: AppState) => AppState | Partial<AppState>) {
            this.state = typeof updater === 'function' ? updater(this.state) as AppState : { ...this.state, ...updater };
            this.listeners.forEach(l => l(this.state));
          }

          public getState = (): AppState => this.state;

          public subscribe = (listener: (state: AppState) => void): (() => void) => {
            this.listeners.add(listener);
            listener(this.state); // Immediately provide current state
            return () => this.listeners.delete(listener);
          };
        }
        export const uiAdapter = new UIAdapterService(); // Auto-initializes
        ```
    3.  Create `src/hooks/useAppState.ts`:
        ```typescript
        // src/hooks/useAppState.ts
        import { useState, useEffect }_ from 'react';
        import { uiAdapter } from '@/lib/agents/UIAdapter';
        import { AppState } from '@/lib/agents/types'; // Or your UIAdapter types file

        export function useAppState() {
          const [appState, setAppState] = useState<AppState>(() => uiAdapter.getState());

          useEffect(() => {
            const unsub = uiAdapter.subscribe(setAppState);
            return unsub; // Cleanup subscription on unmount
          }, []);

          return appState;
        }
        ```
    4.  Create `src/components/SignalDisplay.tsx`:
        ```tsx
        // src/components/SignalDisplay.tsx
        "use client";
        import React from 'react';
        import { useAppState } from '@/hooks/useAppState';
        import { TradingSignal } from '@/lib/agents/types'; // Or your specific types file

        export default function SignalDisplay() {
          const { latestSignal, latestIndicators } = useAppState();

          if (!latestSignal) {
            return <div className="p-4 text-center text-gray-500">Awaiting first signal...</div>;
          }

          const { action, confidence, reason, marketRegime, entryPrice, stopLoss, takeProfit, timestamp, rawIndicators } = latestSignal;

          const getActionColor = () => {
            if (action === 'BUY') return 'green';
            if (action === 'SELL') return 'red';
            return 'gray';
          };

          return (
            <div style={{ border: `3px solid ${getActionColor()}`, padding: '15px', margin: '10px 0', borderRadius: '8px', backgroundColor: '#fff' }}>
              <h3 style={{ color: getActionColor(), marginTop: 0, marginBottom: '10px', fontSize: '1.5em' }}>
                Current Signal: {action}
              </h3>
              <p><strong>Confidence: {confidence.toFixed(1)}%</strong></p>
              <p><strong>Reason:</strong> {reason}</p>
              <p><strong>Market Regime:</strong> {marketRegime}</p>
              <p><strong>Signal Time:</strong> {new Date(timestamp).toLocaleTimeString()}</p>
              {action !== 'HOLD' && entryPrice && (
                <>
                  <hr style={{margin: '10px 0'}} />
                  <p><strong>Entry Price:</strong> {entryPrice.toFixed(2)}</p>
                  <p><strong>Stop-Loss:</strong> {stopLoss?.toFixed(2) || 'N/A (Check ATR)'}</p>
                  <p><strong>Take-Profit:</strong> {takeProfit?.toFixed(2) || 'N/A (Check ATR)'}</p>
                </>
              )}
              {rawIndicators && (
                <details style={{marginTop: '10px'}}>
                  <summary style={{cursor: 'pointer', fontWeight: 'bold'}}>Raw Indicators (at signal time)</summary>
                  <pre style={{ fontSize: '0.8em', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto' }}>
                    {JSON.stringify(rawIndicators, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          );
        }
        ```
    5.  **Update `DataFreshnessIndicator.tsx` to use `useAppState`:**
        *   Remove its direct `orchestrator.register` calls for `DATA_STATUS_UPDATE` and `DATA_ERROR`.
        *   Import and use `useAppState`.
        *   Get `dataStatus` and `dataError` from the `appState`.
        ```tsx
        // src/components/DataFreshnessIndicator.tsx - MODIFIED
        "use client";
        import React, { useState, useEffect } from 'react';
        import { useAppState } from '@/hooks/useAppState'; // Use this hook

        export default function DataFreshnessIndicator() {
          const { dataStatus, dataError } = useAppState(); // Get state from UIAdapter

          const [statusText, setStatusText] = useState(dataStatus.text);
          const [statusColor, setStatusColor] = useState(dataStatus.color);

          useEffect(() => {
            // If there's a direct data error from appState, prioritize it
            if (dataError) {
              setStatusText(`Error: ${dataError.substring(0,30)}`);
              setStatusColor("red");
              return; // Don't run interval logic if there's a persistent error
            }

            // Update based on dataStatus from appState
            const lastUpdateTime = dataStatus.lastUpdateTime;

            if (lastUpdateTime === null) {
              setStatusText(dataStatus.text); // "Initializing..." or "Connecting..."
              setStatusColor(dataStatus.color); // "grey" or "orange"
              return;
            }
            
            const ageSeconds = (Date.now() - lastUpdateTime) / 1000;

            if (ageSeconds < 10) {
              setStatusText("● Live");
              setStatusColor("green");
            } else if (ageSeconds < 30) {
              setStatusText(`● ${Math.round(ageSeconds)}s ago`);
              setStatusColor("lightgreen");
            } else if (ageSeconds < 120) {
              setStatusText(`● ${Math.round(ageSeconds)}s ago (stale)`);
              setStatusColor("orange");
            } else {
              setStatusText(`● >2m stale!`);
              setStatusColor("red");
            }
            // This effect now depends on dataStatus from useAppState
          }, [dataStatus, dataError]); 

          return (
            <div style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
              Data Status: <strong style={{ color: statusColor }}>{statusText}</strong>
            </div>
          );
        }
        ```
    6.  Add `<SignalDisplay />` to `src/app/dashboard/page.tsx`.
        ```tsx
        // src/app/dashboard/page.tsx
        // ... other imports
        import SignalDisplay from '@/components/SignalDisplay'; // Add this

        export default function DashboardPage() {
          return (
            // ... existing layout
            <div>
              <DataFreshnessIndicator />
              <SignalDisplay /> {/* Add this */}
              <BasicCandleDisplay /> 
              {/* ... other components ... */}
            </div>
            // ... rest of layout
          );
        }
        ```
*   **✅ Verification:**
    1.  Run `npm run dev`.
    2.  On your dashboard page:
        *   The `DataFreshnessIndicator` should now get its status from `UIAdapter` via `useAppState`. Verify it still works correctly (shows "● Live", stale states, and errors).
        *   You should see the `SignalDisplay` component. Initially, it will show "Awaiting first signal...".
        *   Once `SignalGeneratorAgent` sends its first `NEW_SIGNAL_5M` message, the `SignalDisplay` **must** update to show:
            *   The action (BUY/SELL/HOLD) with appropriate color.
            *   Confidence, Reason, Market Regime.
            *   Entry, SL, TP if applicable.
            *   The raw indicators should be viewable in the `<details>` section.
    3.  Check the console for logs from `UIAdapterService` showing it's subscribing and receiving messages.
    4.  Verify that the displayed signal information is clear and directly helpful for making a trading decision (as per the "Core Information" section).

---
### Phase 4: ⚡ Actionability - Don't Miss the Trade!

**Goal:** Notify the user of important trading signals even if they aren't looking directly at the dashboard.

**Task 4.1: Implement Signal Alerts**
*   **Why:** To provide timely browser notifications for high-confidence BUY or SELL signals, so the user doesn't miss potential trading opportunities.
*   **Instructions:**
    1.  Modify `UIAdapter.ts` (`src/lib/agents/UIAdapter.ts`):
        *   In its constructor, when handling the `NEW_SIGNAL_5M` message, add logic to trigger a browser notification if the signal is BUY/SELL and meets a confidence threshold.
        ```typescript
        // Inside UIAdapter.ts constructor, within the NEW_SIGNAL_5M handler:
        // orchestrator.register('NEW_SIGNAL_5M', 
        //   (msg: AgentMessage<TradingSignal>) => {
        //     const signal = msg.payload; // Already have this
        //     this.updateState(s => ({ ...s, latestSignal: signal }));
            
            // --- ADD THIS NOTIFICATION LOGIC ---
            if (typeof window !== 'undefined' && 'Notification' in window) { // Check if running in browser and Notification API is supported
              if (signal.action !== 'HOLD' && signal.confidence >= 70) { // Example: Alert threshold of 70% confidence
                const notificationTitle = `BitDash3 Signal: ${signal.action} BTC!`;
                const notificationBody = `Reason: ${signal.reason}\nConfidence: ${signal.confidence.toFixed(1)}%`;
                
                if (Notification.permission === 'granted') {
                  new Notification(notificationTitle, { body: notificationBody, icon: '/bitcoin_icon.png' }); // Optional: add an icon
                } else if (Notification.permission !== 'denied') {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      new Notification(notificationTitle, { body: notificationBody, icon: '/bitcoin_icon.png' });
                    }
                  });
                }
              }
            }
        //   } as MessageHandler
        // );
        ```
        *   **Note:** You'll need to place an icon (e.g., `bitcoin_icon.png`) in your `public/` directory if you want to use an icon.
*   **✅ Verification:**
    1.  Run `npm run dev`.
    2.  The first time a high-confidence (e.g., >= 70%) BUY or SELL signal is generated, your browser should ask for permission to show notifications. Grant it.
    3.  Subsequently, whenever a BUY or SELL signal with confidence >= 70% (or your chosen threshold) appears, a browser notification **must** pop up.
    4.  The notification should display the action, symbol (BTC), reason, and confidence.

---
## 🏁 Final Check for the Novice Developer

Once all tasks are marked as complete:

1.  **Go Through Each "✅ Verification" Step Again:** Does *every single verification step* throughout this document still pass correctly?
2.  **Clarity of Information:** Is the displayed signal information on the dashboard clear, concise, and directly helpful for making a trading decision?
3.  **Data Freshness:** Is the `DataFreshnessIndicator` reliably showing the current status of the data?
4.  **Alerts:** Are browser alerts timely and accurate for high-confidence signals?
5.  **Console Cleanliness:** Are there any unexpected errors or excessive/unnecessary console logs? (Debug logs are fine during development but consider removing them or making them conditional for a "production" build).
6.  **Code Readability:** Is the code you've written (especially in helper functions like signal logic) understandable and well-commented where necessary?

This lean roadmap focuses on the critical path to a decision-making tool. Further enhancements (detailed performance tracking, more advanced UI elements, user settings, etc.) can be added in subsequent phases after this foundation is rock solid.
