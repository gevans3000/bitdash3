# BitDash3 — 5-Minute Bitcoin Profit Engine

**Mission:** Generate 2-3 profitable Bitcoin buy/sell signals daily with 55%+ win rate and 2:1+ R:R ratio

**Testing Philosophy:** `npm run dev` uses mock data by default. Real API calls only on manual refresh.

---

## 🏁 QUICK START CHECKLIST

**Current Status:** ✅ Phase 1 Complete - Basic signal panel working with mock data

**Next Action:** Choose your implementation path:
- 🚀 **Fast Track:** Go to [A1] for immediate signal improvements
- 🔧 **Technical:** Go to [B1] for data infrastructure  
- 📊 **Analysis:** Go to [C1] for backtesting setup

---

## 🎯 PATH A: SIGNAL GENERATION (For Immediate Profit)

### [A1] Enhanced Mock Signal Generator (30 min) ⭐
**Goal:** Improve current mock signals to simulate realistic market conditions

**Steps:**
1. **Replace static signals** with dynamic mock generator:
   ```typescript
   // Add to TradingSignalPanel.tsx
   - Generate signals based on realistic price patterns
   - Include confluence scoring simulation
   - Add regime-specific signal types
   ```
2. **Test Scenarios:** Create mock data for:
   - Bull trend (EMA crossover signals)
   - Bear trend (Short signals)  
   - Ranging market (Mean reversion)
3. **Validation:** Signal confidence should vary 45-95%

**Testing:** `npm run dev` → Check signal panel shows varied, realistic signals

**Success Criteria:** ✅ Signals change based on mock market regime  
**Next:** [A2] Real Signal Integration

### [A2] 5-Minute EMA Crossover Signals (45 min) ⭐⭐
**Goal:** Implement core profitable signal: EMA(9) crossing EMA(21)

**Files to Edit:**
- `src/lib/signals/ema-signals.ts` (create)
- `src/components/TradingSignalPanel.tsx` (update)

**Implementation:**
1. **EMA Calculator:**
   ```typescript
   function calculateEMA(prices: number[], period: number): number[]
   function detectCrossover(ema9: number[], ema21: number[]): 'bullish' | 'bearish' | 'none'
   ```
2. **Signal Logic:**
   - BUY: EMA(9) crosses above EMA(21) + RSI > 50
   - SELL: EMA(9) crosses below EMA(21) + RSI < 50
   - Confidence: Based on separation distance
3. **Mock Integration:** Use pre-calculated EMA data for testing

**Testing:** 
- Mock: Verify crossover detection works
- Visual: Add EMA lines to price chart

**Success Criteria:** ✅ Clear BUY/SELL signals on EMA crossovers  
**Next:** [A3] RSI Confirmation

### [A3] RSI Confirmation Filter (30 min) ⭐⭐
**Goal:** Add RSI(14) filter to reduce false signals

**Implementation:**
1. **RSI Calculator:**
   ```typescript
   function calculateRSI(prices: number[], period: number = 14): number[]
   function getRSISignal(rsi: number): 'overbought' | 'oversold' | 'neutral'
   ```
2. **Enhanced Signal Logic:**
   - BUY: EMA crossover + RSI(30-70) + RSI rising
   - SELL: EMA crossover + RSI(30-70) + RSI falling  
   - SKIP: RSI extreme zones (>80 or <20)
3. **Confidence Boost:** +20% confidence when RSI confirms

**Testing:** Compare signals before/after RSI filter

**Success Criteria:** ✅ Fewer but higher quality signals  
**Next:** [A4] Volume Confirmation

### [A4] Volume Spike Detection (30 min) ⭐⭐
**Goal:** Only trade when volume confirms the move

**Implementation:**
1. **Volume Analysis:**
   ```typescript
   function calculateVolumeMA(volumes: number[], period: number = 20): number[]
   function detectVolumeSpike(currentVol: number, avgVol: number): boolean
   ```
2. **Signal Enhancement:**
   - Require volume > 1.5x 20-period average
   - Higher confidence for larger volume spikes
   - Skip signals on low volume breakouts
3. **Mock Data:** Include realistic volume patterns

**Testing:** Verify volume requirements filter weak signals

**Success Criteria:** ✅ Only high-volume signals displayed  
**Next:** [A5] Market Regime Detection

### [A5] Simple Market Regime (45 min) ⭐⭐⭐
**Goal:** Adapt signal strategy based on market conditions

**Implementation:**
1. **ADX Calculator:**
   ```typescript
   function calculateADX(highs: number[], lows: number[], closes: number[]): number[]
   function getMarketRegime(adx: number): 'trending' | 'ranging' | 'volatile'
   ```
2. **Regime-Based Signals:**
   - **Trending (ADX > 25):** Use EMA crossovers, wider stops
   - **Ranging (ADX < 20):** Use mean reversion, tight stops
   - **Volatile:** Reduce position size, wider stops
3. **UI Indicator:** Show current regime prominently

**Testing:** 
- Mock different ADX values
- Verify signal strategy changes

**Success Criteria:** ✅ Signal strategy adapts to market regime  
**Next:** [A6] Dynamic Stop-Loss

### [A6] ATR-Based Dynamic Stops (30 min) ⭐⭐⭐
**Goal:** Calculate optimal stop-loss using Average True Range

**Implementation:**
1. **ATR Calculator:**
   ```typescript
   function calculateATR(highs: number[], lows: number[], closes: number[]): number[]
   function getOptimalStop(atr: number, regime: string): number
   ```
2. **Stop-Loss Logic:**
   - **Trending:** 2.5x ATR from entry
   - **Ranging:** 1.5x ATR from entry
   - **Volatile:** 3.0x ATR from entry
3. **Position Sizing:** Risk 1% account based on stop distance

**Testing:** Verify stop distances make sense for different regimes

**Success Criteria:** ✅ Dynamic stops shown in signal panel  
**Next:** [B1] or [C1] based on priority

---

## 🔧 PATH B: DATA INFRASTRUCTURE (For Reliability)

### [B1] Cached Market Data (45 min) ⭐
**Goal:** Implement smart caching to minimize API calls

**Implementation:**
1. **Enhanced Cache:**
   ```typescript
   // Update useMarketData.ts
   - Cache 5m candles for 4 hours  
   - Cache current price for 10 seconds
   - Cache order book for 5 seconds
   ```
2. **Refresh Strategy:**
   - Auto-refresh only critical data
   - Manual refresh button for full update
   - Visual indicators for data freshness
3. **Offline Mode:** Extended mock data when disconnected

**Testing:** 
- Verify `npm run dev` minimal API usage
- Test manual refresh functionality

**Success Criteria:** ✅ Dashboard works offline, minimal API calls  
**Next:** [B2] WebSocket Optimization

### [B2] WebSocket Connection Manager (60 min) ⭐⭐
**Goal:** Reliable real-time data with minimal overhead

**Implementation:**
1. **Connection Strategy:**
   ```typescript
   // Update websocket.ts
   - Connect only when dashboard is active
   - Automatic disconnect after 5 min idle
   - Exponential backoff on reconnect
   ```
2. **Data Throttling:**
   - Batch updates every 5 seconds
   - Only update when price changes >0.01%
   - Pause updates when tab inactive
3. **Manual Mode:** Button to enable/disable live data

**Testing:** Monitor connection behavior and data usage

**Success Criteria:** ✅ Efficient WebSocket usage, manual control  
**Next:** [B3] Error Handling

### [B3] Robust Error Handling (30 min) ⭐
**Goal:** Graceful degradation when APIs fail

**Implementation:**
1. **Fallback Chain:**
   ```typescript
   WebSocket → REST API → Cached Data → Mock Data
   ```
2. **Error UI:**
   - Clear error messages
   - Data source indicators
   - Retry mechanisms
3. **Mock Fallback:** Always-working mock signals

**Testing:** Disconnect internet, verify graceful handling

**Success Criteria:** ✅ App never crashes, clear error states  
**Next:** [A6] or [C1]

---

## 📊 PATH C: BACKTESTING & VALIDATION (For Confidence)

### [C1] Historical Data Loader (45 min) ⭐⭐
**Goal:** Load historical 5m Bitcoin data for backtesting

**Implementation:**
1. **Data Source:**
   ```typescript
   // Create backtest-data.ts
   - Load 90 days of 5m BTCUSDT data
   - Include OHLCV + basic indicators  
   - Cache locally for fast testing
   ```
2. **Data Format:**
   - Standardized candle objects
   - Pre-calculated EMA, RSI, ATR
   - Market regime classifications
3. **Mock Integration:** Use historical data in development

**Testing:** Load and display historical signals

**Success Criteria:** ✅ 90 days historical data loaded and accessible  
**Next:** [C2] Signal Backtester

### [C2] Basic Signal Backtester (60 min) ⭐⭐⭐
**Goal:** Test signal performance on historical data

**Implementation:**
1. **Backtest Engine:**
   ```typescript
   // Create backtest-engine.ts
   function runBacktest(signals: Signal[], data: HistoricalData): Results
   - Track entries, exits, P&L
   - Calculate win rate, avg R:R
   - Include slippage and fees
   ```
2. **Metrics:**
   - Win rate by signal confidence
   - Average risk/reward ratio
   - Maximum drawdown
   - Sharpe ratio
3. **Visual Results:** Charts showing equity curve

**Testing:** Backtest EMA crossover strategy

**Success Criteria:** ✅ Backtest shows realistic trading results  
**Next:** [C3] Strategy Comparison

### [C3] Strategy Performance Comparison (45 min) ⭐⭐
**Goal:** Compare different signal strategies

**Implementation:**
1. **Strategy Tests:**
   - EMA crossover only
   - EMA + RSI filter  
   - EMA + RSI + Volume
   - Regime-aware signals
2. **Comparison Metrics:**
   - Risk-adjusted returns
   - Maximum drawdown
   - Trade frequency
   - Best market conditions
3. **Results Dashboard:** Side-by-side comparison

**Testing:** Run all strategies on same historical data

**Success Criteria:** ✅ Clear winner identified for live trading  
**Next:** [A6] or [D1]

---

## 🚀 PATH D: ADVANCED FEATURES (For Edge)

### [D1] Multi-Timeframe Confluence (90 min) ⭐⭐⭐⭐
**Goal:** Combine 5m, 15m, 1h signals for higher accuracy

**Implementation:**
1. **Timeframe Analysis:**
   - 5m: Entry timing (EMA crossover)
   - 15m: Trend filter (only trade with trend)
   - 1h: Structure (support/resistance)
2. **Confluence Scoring:**
   - All timeframes aligned: +4 confidence
   - 2/3 timeframes aligned: +2 confidence  
   - Against higher timeframe: Skip trade
3. **Visual Display:** Show all timeframe signals

**Testing:** Compare single vs multi-timeframe accuracy

**Success Criteria:** ✅ Higher win rate with confluence filtering  
**Next:** [D2] Order Flow

### [D2] Order Book Analysis (90 min) ⭐⭐⭐⭐
**Goal:** Use bid/ask imbalance for signal confirmation

**Implementation:**
1. **Imbalance Calculator:**
   ```typescript
   function calculateImbalance(orderBook: OrderBook): number
   - Ratio of bid vs ask volume in top 10 levels
   - Weighted by price distance  
   - Historical imbalance tracking
   ```
2. **Signal Enhancement:**
   - Strong bid imbalance: Bullish confirmation
   - Strong ask imbalance: Bearish confirmation
   - Neutral imbalance: Reduce confidence
3. **Large Order Detection:** Alert on >10 BTC orders

**Testing:** Verify imbalance correlates with price movement

**Success Criteria:** ✅ Order flow confirms technical signals  
**Next:** [D3] Machine Learning

---

## 🎯 TESTING CHECKPOINTS

**After Every 2 Steps:**
1. Run `npm run dev` - No errors
2. Check signal panel updates correctly  
3. Verify mock data works offline
4. Test manual refresh functionality

**Weekly Validation:**
1. Backtest latest strategy
2. Check win rate >50%
3. Verify risk/reward >1.5:1
4. Review signal frequency (2-3/day target)

---

## 🏆 SUCCESS METRICS

**Phase Goals:**
- **A-Path Complete:** High-quality 5m signals ready
- **B-Path Complete:** Reliable data infrastructure  
- **C-Path Complete:** Validated strategy performance
- **D-Path Complete:** Advanced edge-finding features

**Trading Targets:**
- Win Rate: 55%+ (trending), 50%+ (ranging)
- Risk/Reward: 2:1 average
- Signals/Day: 2-3 high-confidence
- Max Drawdown: <10%

**Development Targets:**
- `npm run dev` starts in <5 seconds
- Minimal API calls unless manual refresh
- No console errors or infinite loops
- All features work with mock data

---

## 🔄 CURRENT STATUS

✅ **Phase 1 Complete:** Basic signal panel with mock data  
🎯 **Next Recommended:** [A1] Enhanced Mock Signals (Quick win)  
🔧 **Alternative:** [B1] Cached Data (Reliability focus)  
📊 **Alternative:** [C1] Historical Data (Validation focus)
