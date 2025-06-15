# BitDash3 Agent-Based Architecture

**Project:** BitDash3 – Lean & Profitable 5-Minute Bitcoin Signal Dashboard
**Core Goal:** Generate clear, actionable BUY/SELL signals for BTC/USDT on the 5-minute chart to aid profitable trading decisions.

---

## 🏛️ System Architecture: Event-Driven Agents

BitDash3 employs an event-driven architecture built around specialized "Agents." These agents are independent modules that communicate by sending messages (events with data) through a central `Orchestrator` (event bus). This design promotes modularity, testability, and a clear flow of data.

### Key Agents & Their Responsibilities:

1.  **`Orchestrator` (The Message Manager / Post Office)**
    *   **Location:** `src/lib/agents/Orchestrator.ts`
    *   **Responsibility:** Manages the flow of messages between all other agents. Agents register with the Orchestrator to listen for specific message types. When an agent sends a message, the Orchestrator delivers it to all subscribed listeners.
    *   **Key Interactions:** All agents register with and send messages via the Orchestrator.

2.  **`DataCollectorAgent` (The Market Watcher)**
    *   **Location:** `src/lib/agents/DataCollector.ts`
    *   **Responsibility:**
        *   Fetches initial historical 5-minute candle data for BTC/USDT (e.g., from Binance via a proxied API route).
        *   Connects to the Binance WebSocket for live 5-minute BTC/USDT kline data.
        *   Processes raw kline data into a standardized `Candle` format.
        *   Manages a local buffer of recent candles.
    *   **Publishes Events (via Orchestrator):**
        *   `INITIAL_CANDLES_5M`: Payload is an array of historical `Candle` objects.
        *   `LIVE_CANDLE_UPDATE_5M`: Payload is the latest `Candle` object (can be an updating, non-closed candle). Includes an `isClosed` flag.
        *   `NEW_CLOSED_CANDLE_5M`: Payload is a `Candle` object that has just closed.
        *   `DATA_STATUS_UPDATE`: Payload indicates the timestamp of the last data activity.
        *   `DATA_ERROR`: Payload is an error message string if data collection fails.

3.  **`IndicatorEngineAgent` (The Analyst Robot)**
    *   **Location:** `src/lib/agents/IndicatorEngine.ts`
    *   **Responsibility:**
        *   Subscribes to `NEW_CLOSED_CANDLE_5M` events.
        *   Maintains a history of closed candles.
        *   Calculates a standard set of technical indicators (e.g., EMA(9), EMA(21), RSI(14), Bollinger Bands(20,2), Average Volume(20), ATR) based on the history of closed candles.
    *   **Publishes Events:**
        *   `INDICATORS_READY_5M`: Payload is an `IndicatorDataSet` object containing the latest values of all calculated indicators for the closed candle.

4.  **`SignalGeneratorAgent` (The Decision Maker)**
    *   **Location:** `src/lib/agents/SignalGenerator.ts`
    *   **Responsibility:**
        *   Subscribes to `INDICATORS_READY_5M` events.
        *   Uses the received `IndicatorDataSet` to:
            *   Determine the current `MarketRegime` (e.g., Trending, Ranging) by adapting logic from `src/lib/market/regime-detector.ts`.
            *   Apply confluence scoring rules (adapting logic from `src/lib/signals/confluence-scorer.ts`) based on indicators and market regime to determine a trading action (BUY, SELL, HOLD), confidence level, and reason.
            *   Calculate appropriate Stop-Loss (SL) and Take-Profit (TP) levels for BUY/SELL signals (adapting logic from `src/lib/trading/price-targets.ts`, ensuring ATR is available from `IndicatorEngineAgent`).
        *   Applies a signal cooldown logic.
    *   **Publishes Events:**
        *   `NEW_SIGNAL_5M`: Payload is a `TradingSignal` object containing the action, confidence, reason, market regime, entry price, SL, TP, and the raw indicators used.

5.  **`UIAdapter` (The UI's Data Coordinator)**
    *   **Location:** `src/lib/agents/UIAdapter.ts`
    *   **Responsibility:**
        *   Acts as a bridge between the agent system and the React UI components.
        *   Subscribes to various events from other agents (`NEW_SIGNAL_5M`, `INITIAL_CANDLES_5M`, `LIVE_CANDLE_UPDATE_5M`, `INDICATORS_READY_5M`, `DATA_STATUS_UPDATE`, `DATA_ERROR`).
        *   Manages a centralized `AppState` object that holds the latest data needed by the UI.
        *   Provides a `useAppState` React hook for UI components to easily access and react to state changes.
        *   Handles logic for triggering browser notifications for high-confidence signals.
    *   **Key Interactions:** Consumes messages from multiple agents, provides state to all UI components.

---
## 📊 Data & Event Flow for a Trading Signal

1.  **`DataCollectorAgent`** receives a new 5-minute kline from Binance WebSocket.
2.  If the kline represents a **closed candle**, `DataCollectorAgent` sends a `NEW_CLOSED_CANDLE_5M` message (payload: `Candle`) to the `Orchestrator`.
3.  `Orchestrator` delivers this message to `IndicatorEngineAgent`.
4.  **`IndicatorEngineAgent`** updates its candle history and calculates all technical indicators.
5.  `IndicatorEngineAgent` sends an `INDICATORS_READY_5M` message (payload: `IndicatorDataSet`) to the `Orchestrator`.
6.  `Orchestrator` delivers this message to `SignalGeneratorAgent`.
7.  **`SignalGeneratorAgent`** uses the indicators to:
    *   Detect market regime.
    *   Apply confluence scoring.
    *   Calculate SL/TP.
8.  `SignalGeneratorAgent` sends a `NEW_SIGNAL_5M` message (payload: `TradingSignal`) to the `Orchestrator`.
9.  `Orchestrator` delivers this message to `UIAdapter`.
10. **`UIAdapter`** updates its internal `AppState`.
11. React components using the `useAppState` hook automatically re-render to display the new signal, indicators, and trade parameters.
12. If the signal is actionable and meets confidence criteria, `UIAdapter` triggers a browser notification.

*Live candle updates for the chart (`LIVE_CANDLE_UPDATE_5M`) and initial candle data (`INITIAL_CANDLES_5M`) also flow from `DataCollectorAgent` via `Orchestrator` to `UIAdapter` to update the chart display directly.*

---
## 🎯 Core Trading Logic Principles (To be implemented within Agents)

This section outlines the general trading rules that the `SignalGeneratorAgent` should embody through its use of confluence scoring, regime detection, and price target calculations.

### 1. Market Regime Detection (Influences Strategy)
*   **Input:** Primarily ADX (calculated by `IndicatorEngineAgent`), potentially other volatility/momentum indicators.
*   **Output:** `MarketRegime` (e.g., 'Trending-Up', 'Trending-Down', 'Ranging', 'Weak-Trend').
*   **Logic:** Resides in/adapted from `src/lib/market/regime-detector.ts` and used by `SignalGeneratorAgent`.
    *   **Trending (e.g., ADX > 25):** Favor trend-following entries (e.g., EMA crossovers).
    *   **Ranging (e.g., ADX < 20):** Favor mean-reversion entries (e.g., Bollinger Band touches, RSI extremes).

### 2. Signal Confluence (Core of Buy/Sell Decision)
*   **Input:** `IndicatorDataSet` from `IndicatorEngineAgent`, current `MarketRegime`.
*   **Logic:** Resides in/adapted from `src/lib/signals/confluence-scorer.ts` and used by `SignalGeneratorAgent`.
    *   **Example Rules (to be refined in `confluence-scorer.ts`):**
        *   **Trending Long:** EMA-9 crosses above EMA-21 + RSI(14) > 45 (and not overbought) + Volume confirmation.
        *   **Trending Short:** EMA-9 crosses below EMA-21 + RSI(14) < 55 (and not oversold) + Volume confirmation.
        *   **Ranging Long:** Price near lower Bollinger Band + RSI < 30 (oversold).
        *   **Ranging Short:** Price near upper Bollinger Band + RSI > 70 (overbought).
    *   **Confidence Scoring:** Assign points/weights to confirming indicators to derive a signal confidence percentage.

### 3. Trade Parameters (Risk Management)
*   **Input:** Entry Price (current price at signal), Signal Type (BUY/SELL), ATR (from `IndicatorEngineAgent`).
*   **Logic:** Resides in/adapted from `src/lib/trading/price-targets.ts` and used by `SignalGeneratorAgent`.
    *   **Stop-Loss:** Typically ATR-based (e.g., 1.5x to 2.5x ATR from entry).
    *   **Take-Profit:** Aim for a minimum 2:1 Risk/Reward Ratio relative to the Stop-Loss.

---
## 🚀 Development Focus (Derived from TASKS.md)

The primary development focus is to implement the agent pipeline as described above, ensuring each agent correctly processes its inputs and publishes the expected outputs. The `TASKS.md` file provides a detailed, step-by-step guide for this implementation, suitable for a novice developer.

**Key Milestones:**
1.  **Data Flowing:** `DataCollectorAgent` successfully fetching and publishing live/historical candle data. Basic chart displays this data. Data freshness is visible.
2.  **Indicators Calculated:** `IndicatorEngineAgent` correctly calculating and publishing all necessary indicators based on closed candles.
3.  **Signals Generated:** `SignalGeneratorAgent` producing BUY/SELL/HOLD signals with confidence, reasons, market regime, and SL/TP, based on indicators.
4.  **UI Display:** Dashboard clearly presents all components of the `TradingSignal` and supporting context for decision-making.
5.  **Alerts Active:** Browser notifications for high-confidence signals.

This agent-based architecture provides a solid foundation for a lean, effective, and maintainable trading signal dashboard.
