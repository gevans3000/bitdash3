# BitDash3 — 5-Minute Bitcoin Profit Dashboard

**Mission:** Help users identify 2-3 profitable Bitcoin trading opportunities daily from 5-minute chart analysis.

**Development Philosophy:** Mock data by default (`npm run dev`), real APIs only on manual refresh to respect rate limits. Prioritize low code, minimal compute, and maximum performance. The sole purpose is to generate actionable BUY/SELL signals for BTC/USDT on the 5-minute timeframe.

---

## 💡 Key Information for Profitable Trading Decisions (User Perspective)

To empower users to make profitable 5-minute Bitcoin trading choices, the dashboard must clearly present the following, derived from the system's analysis:

1.  **Core Signal & Rationale:**
    *   **Actionable Signal:** Prominent "BUY", "SELL", or "HOLD" status.
    *   **Signal Confidence:** A percentage indicating the strength of the signal (e.g., "75% Confidence").
    *   **Reason for Signal:** A concise explanation of the primary drivers (e.g., "EMA Crossover confirmed by Bullish RSI Momentum").

2.  **Market Context:**
    *   **Current Market Regime:** Clearly display "Strong Trend", "Weak Trend", or "Ranging" to set expectations.
    *   **Active Strategy:** Briefly state the strategy being applied by the system (e.g., "Trend-Following" or "Mean-Reversion").

3.  **Supporting Indicator Data (Contributors to the Signal):**
    *   **EMA Status:** e.g., "EMA9 above EMA21".
    *   **RSI Status:** e.g., "RSI (14): 65 - Bullish Momentum".
    *   **Volume Insights:** e.g., "Volume: Spike (2.1x average)" or "Volume: Normal".
    *   **Bollinger Bands:** e.g., "Price near Upper Bollinger Band".

4.  **Trade Execution Parameters (For BUY/SELL Signals):**
    *   **Signal Entry Price:** The price at which the signal was triggered.
    *   **Suggested Stop-Loss:** The calculated SL price.
    *   **Suggested Take-Profit:** The calculated TP price.
    *   **(Optional) Implied Risk/Reward Ratio:** e.g., "R:R approx 1:2.5".

5.  **Active Trade Management (If a position is open):**
    *   **Current Position:** "LONG", "SHORT", or "FLAT".
    *   **Trade Entry Price:** Price of the current open position.
    *   **Active Stop-Loss:** Current SL for the open position (note if moved to breakeven).
    *   **Active Take-Profit:** Current TP for the open position.
    *   **Trade Duration:** How long the current position has been open.

6.  **Data Integrity:**
    *   **Data Freshness Indicator:** Crucial for 5-minute charts, showing data age and source.

This user-centric view should guide the development and presentation of all dashboard elements.
---
## 📈 Recommended Dashboard Elements

The dashboard should surface the most actionable information at a glance so a
trader can quickly decide whether to enter or exit a position. Use these
components to maximize clarity, ensuring they deliver the "Key Information for Profitable Trading Decisions":

- **Central Signal Panel** – Prominently display the current core signal (BUY/SELL/HOLD), its confidence level, and a concise reason (e.g., "EMA Crossover + RSI Confirmation"). This is the primary action hub.
- **Market Regime Indicator** – Show whether the market is "Strong Trend", "Weak Trend", or "Ranging", and indicate the active trading strategy (e.g., "Trend-Following").
- **5‑Minute Candle Chart** – Candlesticks with EMA‑9/EMA‑21 overlays, volume bars, and markers for significant price moves or volume spikes. Consider overlaying Bollinger Bands here or in a separate panel.
- **RSI Panel** – Display current RSI value, its interpretation (e.g., "Bullish Momentum", "Oversold"), and highlight overbought/oversold zones.
- **Volume Insights Panel** – Show current volume relative to average (e.g., "Spike: 2.1x avg"), and potentially a mini volume trend indicator. This could integrate "Volume Spike Alerts".
- **Price Target & Risk Panel** – For active BUY/SELL signals, display the signal entry price, calculated stop-loss, take-profit levels, and the implied Risk/Reward ratio (e.g., "R/R: 1:2.5").
- **Active Trade Status Panel** – If a trade is open, show current position (LONG/SHORT), entry price, active SL/TP (noting if SL moved to breakeven), and trade duration.
- **Bollinger Bands Display** – Show current price in relation to Bollinger Bands (e.g., "Testing Upper Band"). This could be on the main chart or a dedicated small indicator.
- **Data Freshness Indicator** – Show the age and source of the data, critical for 5-minute analysis.
- **Performance Metrics Panel** – Track win rate, profit factor, and recent trade outcomes to evaluate signal reliability.
- **Quick Action Buttons** – Optional shortcuts for copying trade parameters or executing mock trades.

---
## 🚀 Profit-Focused Task Roadmap for BitDash3

This roadmap prioritizes tasks based on their direct impact on generating profitable 5-minute Bitcoin trading signals and enabling users to act on them effectively. All API usage must adhere to free-tier limits, primarily using Binance (cached) for candle data.

### 🏆 Core Signal Engine: Generate Actionable Trade Setups

These tasks form the heart of BitDash3, creating the signals users trade on.

1.  **🏆 EMA Crossover Signal Logic**
    *   **Goal:** Implement robust EMA(9)/EMA(21) crossover detection for BUY/SELL signals.
    *   **Action:** Calculate EMAs from 5-min candle closes. Generate BUY signal if EMA9 crosses above EMA21 & price confirms. Generate SELL if EMA9 crosses below EMA21 & price confirms. HOLD otherwise.
    *   **Impact:** Primary signal generator.
    *   **Files:** `src/lib/signals/ema-crossover.ts` (create/enhance), `src/lib/signal.ts` (integrate)

2.  **🏆 RSI Confirmation Filter**
    *   **Goal:** Refine EMA signals with RSI(14) to improve quality and reduce false positives.
    *   **Action:** Filter BUY signals if RSI > 50 (approaching overbought for entry). Filter SELL signals if RSI < 50 (approaching oversold for entry). Boost confidence if RSI confirms trend.
    *   **Impact:** Increases signal reliability, leading to more profitable trades.
    *   **Files:** `src/lib/indicators/rsi.ts` (create/enhance), `src/lib/signals/ema-crossover.ts` (enhance), `src/lib/signal.ts` (integrate)

3.  **🏆 Volume Spike Confirmation**
    *   **Goal:** Use significant volume spikes (>150% of 20-period average) to confirm signal strength.
    *   **Action:** Identify volume spikes. Boost signal confidence if a spike aligns with the signal direction.
    *   **Impact:** Validates momentum behind signals.
    *   **Files:** `src/lib/indicators/volume.ts` (or `volume-analysis.ts`), `src/lib/signals/ema-crossover.ts` (enhance), `src/lib/signal.ts` (integrate)

4.  **🏆 Market Regime-Adaptive Strategy**
    *   **Goal:** Implement market regime detection (Trending/Ranging) to adjust signal logic and interpretation.
    *   **Action:** Classify market state. Adapt EMA/RSI/Volume logic based on regime (e.g., trend-following in trends, mean-reversion in ranges).
    *   **Impact:** Crucial for applying the right strategy to current market conditions.
    *   **Files:** `src/lib/market/regime-detector.ts` (enhance), `src/lib/signal.ts` (integrate `StrategyAutomaticSwitcher`), `src/lib/signals/confluence-scorer.ts` (regime-aware logic)

5.  **🏆 Actionable Price Targets (Entry, SL, TP)**
    *   **Goal:** Provide clear Entry, Stop-Loss (ATR-based or swing points), and Take-Profit (min 2:1 R:R) for every signal.
    *   **Action:** Calculate and display these three key price levels for every BUY/SELL signal.
    *   **Impact:** Defines the trade, manages risk, and secures profit.
    *   **Files:** `src/lib/trading/price-targets.ts` (create/enhance), `src/lib/signal.ts` (integrate), `src/lib/signals/position-sizer.ts`

### 🎯 Essential Foundations & User Trust

These tasks ensure data is accurate, timely, and clearly presented.

6.  **🎯 Crystal-Clear 5-Minute Candle Chart**
    *   **Goal:** Display an accurate and easy-to-read 5-minute BTC/USDT candle chart.
    *   **Action:** Render candles (Open, High, Low, Close), volume bars. Overlay EMAs (9/21). Highlight significant price moves (>2%) and volume spikes. Use Binance API (cached via `/api/candles`).
    *   **Impact:** Core visualization for all analysis.
    *   **Files:** `src/components/CandleChart.tsx`, `src/app/api/candles/route.ts`

7.  **🎯 Real-Time Data Freshness Indicator**
    *   **Goal:** Ensure users always know the timeliness of the displayed data.
    *   **Action:** Display data age (e.g., "Live", "15s ago", "Cached >1m"). Indicate if using mock data. Implement smart refresh logic respecting API limits.
    *   **Impact:** Builds trust and prevents trading on stale data.
    *   **Files:** `src/components/DataFreshnessIndicator.tsx`, `src/lib/cache/smart-cache.ts`, `src/lib/api/data-health.ts`

### ✅ Actionability & User Experience

These tasks help users act swiftly and confidently on signals.

8.  **✅ Instant Signal Alerts**
    *   **Goal:** Notify users immediately of new, high-confidence trading signals.
    *   **Action:** Implement browser notifications (and optional sound) for new BUY/SELL signals meeting a defined confidence threshold.
    *   **Impact:** Enables timely action on fleeting 5-minute opportunities.
    *   **Files:** `src/components/AlertManager.tsx`, `src/hooks/useSignalNotifications.ts`

9.  **✅ Visual Signal & Context Display**
    *   **Goal:** Clearly present the generated signal, its confidence, reason, and supporting data.
    *   **Action:** Create UI panels to show: Core Signal (BUY/SELL/HOLD), Confidence %, Reason, Market Regime, Active Strategy, EMA status, RSI value/interpretation, Volume insights, Bollinger Bands status.
    *   **Impact:** Provides all necessary info for a quick, informed decision.
    *   **Files:** `src/components/TradingSignalPanel.tsx` (enhance), `src/components/RSIIndicator.tsx`, `src/components/MarketRegimeIndicator.tsx`, `src/components/VolumeSpikes.tsx` (or integrate into main panel)

### ⚙️ Enhancements & Long-Term Refinement

These tasks improve usability and help validate strategy performance over time.

10. **⚙️ Quick Action Panel**
    *   **Goal:** Provide one-click shortcuts for common actions related to a signal.
    *   **Action:** Buttons to "Copy Trade Parameters (Entry, SL, TP)", "Set Price Alert (mock)", "Calculate Position Size (helper)".
    *   **Impact:** Streamlines user workflow.
    *   **Files:** `src/components/QuickActionPanel.tsx`, `src/lib/trading/quick-trades.ts`

11. **⚙️ Basic Performance Tracking**
    *   **Goal:** Track the historical performance of generated signals to build confidence and identify areas for improvement.
    *   **Action:** Record signal (type, time, price), and its outcome (e.g., hit TP, SL, or closed manually after X bars). Display basic win rate & P/L factor. Store locally.
    *   **Impact:** Validates strategy effectiveness over time.
    *   **Files:** `src/lib/tracking/signal-performance.ts`, `src/components/PerformanceMetricsPanel.tsx`, `src/lib/storage/trade-history.ts`

---
## 📋 TASK COMPLETION STATUS (Original Sequence)

(This section can be gradually deprecated or mapped to the new roadmap items as they are completed)

### ✅ Task 1: Enhanced 5-Minute Candles
- [x] Basic candle visualization
- [x] Color-coded price moves
- [ ] Volume spike detection (partially implemented)
- [ ] Performance optimizations for real-time updates

### ✅ Task 2: EMA Signal Generation
- [x] Basic EMA crossover detection
- [x] Confidence scoring
- [ ] Integration with real market data
- [ ] Performance optimizations

### ⚠️ Task 3: Volume Spike Detection
- [x] Volume spike calculation
- [ ] Integration with trading signals
- [ ] Visual indicators on chart
- [ ] Performance testing

### ⚠️ Task 4: RSI Confirmation Filter
- [x] RSI calculation
- [ ] Integration with trading signals
- [ ] Overbought/oversold visualization
- [ ] Performance testing

### ⚠️ Task 5: Price Target Calculator
- [x] Basic ATR calculation
- [ ] Integration with trading signals
- [ ] Visual indicators on chart
- [ ] Risk management rules

### ⚠️ Task 6: Market Regime Detection
- [x] Basic regime classification
- [ ] Confidence scoring improvements
- [ ] Integration with trading signals
- [ ] Performance optimizations

### ⚠️ Task 7: Real-Time Alert System
- [x] Basic notification system
- [ ] Sound alerts
- [ ] Custom alert rules
- [ ] Performance testing

### ❌ Task 8: Performance Tracking
- [ ] Trade history storage
- [ ] Win/loss calculations
- [ ] Performance metrics
- [ ] Visual dashboard

### ❌ Task 9: Quick Action Panel
- [ ] Quick-trade execution
- [ ] Position sizing calculator
- [ ] One-click actions
- [ ] Integration with trading signals

### ⚠️ Task 10: Data Freshness & Reliability
- [x] Basic data freshness indicators
- [ ] Automatic refresh
- [ ] Error handling
- [ ] Offline support

---
## Next Steps (General Project)

1. **Immediate Fixes**
   - Complete integration of market regime detection
   - Fix failing tests (`market-regime.test.ts`, `indicators.test.ts`)
   - Implement proper data persistence for performance tracking

2. **Short-term Goals (Aligned with Profit Roadmap)**
   - Fully implement all 🏆 and 🎯 tasks from the "Profit-Focused Task Roadmap".
   - Enhance data reliability and error handling for API calls.

3. **Testing & Optimization**
   - Add unit tests for all core signal logic and indicator calculations.
   - Implement integration tests for the complete signal pipeline.
   - Optimize UI rendering performance.

4. **Documentation**
   - Update README with any new setup or API considerations.
   - Add JSDoc comments to all new/modified functions and components.
   - Create a concise user guide explaining how to interpret signals.

---
**Final Success Criteria:**
- ✅ Dashboard helps users identify 2-3 daily Bitcoin trading opportunities.
- ✅ All signals include clear Entry, Stop Loss, and Take Profit levels.
- ✅ Win rate tracking (basic) shows signal accuracy over time.
- ✅ Users can act quickly on profitable setups.
- ✅ No API rate limit violations (Strict adherence to caching and proxying).
- ✅ Works reliably with mock data offline.
- ✅ Unit tests for core signal components (EMA, RSI, Volume, Price Targets, Regime).

**Ready for Production:** When all 🏆 and 🎯 tasks are complete and validated through testing.
- ✅ Unused development files removed.

---
## Testing Results

### Current Status
- ✅ 16 test suites passing
- ❌ 2 test suites failing:
  - `market-regime.test.ts` - Issues with regime detection logic
  - `indicators.test.ts` - Indicator calculation discrepancies

### Issues Identified

#### Market Regime Detector
1. **Strong Trend Detection**:
   - Fails to detect strong trends with high confidence
   - ADX thresholds may need adjustment for shorter timeframes
   - Volume confirmation requirements too strict

2. **Ranging Market Detection**:
   - Overly sensitive to minor price movements
   - Needs better handling of low-volatility conditions

#### Indicator Calculations
1. **EMA Calculation**:
   - Slight discrepancies in EMA values compared to expected
   - May be due to initialization method

2. **RSI Calculation**:
   - Edge cases with all-rising or all-falling prices
   - Needs better handling of initial periods

### Next Steps (Testing & Bug Fixing)

1. **Immediate Fixes (1-2 hours)**
   - Adjust ADX thresholds for 5-minute timeframe in `MarketRegimeDetector`.
   - Review and fix EMA calculation in `src/lib/indicators/moving-averages.ts` to match standard implementations.
   - Add more test cases for RSI edge conditions in `src/lib/indicators/oscillators.ts`.

2. **Test Coverage (2-3 hours)**
   - Add unit tests for all indicator functions and signal components.
   - Add integration tests for the complete signal generation pipeline (`getSignal` in `src/lib/signal.ts`).
   - Implement snapshot testing for key UI components displaying signal data.

3. **Documentation (1 hour)**
   - Update test documentation with any changes.
   - Add comments explaining indicator calculations and signal logic.
   - Document expected input/output for all core functions.

### How to Run Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- market-regime.test.ts

# Run with coverage
npm test -- --coverage
