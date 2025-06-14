# BitDash3 — 5-Minute Bitcoin Profit Dashboard

**Mission:** Help users identify 2-3 profitable Bitcoin trading opportunities daily from 5-minute chart analysis

**Development Philosophy:** Mock data by default (`npm run dev`), real APIs only on manual refresh to respect rate limits, make ure to use low code and minimal compute, maximum performance, sole purpose is to generate buy/sell signals for BTC/USDT on the 5-minute timeframe 

---

## 🎯 TASK SEQUENCE FOR JUNIOR DEVELOPERS

Complete tasks in order. Each task builds on the previous one. Test after every task before moving to the next.

### **TASK 1: Enhanced 5-Minute Candle Display** (45 min)
**Goal:** Show clear, actionable 5-minute Bitcoin price candles with visual profit indicators

**Files to create/edit:**
- `src/components/CandleChart.tsx` (create)
- `src/lib/api/bitcoin-candles.ts` (enhance existing)

**What to build:**
1. **Candle Visualization:**
   - Green candles for bullish moves (close > open)
   - Red candles for bearish moves (close < open)
   - Volume bars below candles
   - Clear price labels on Y-axis

2. **Profit Opportunity Highlights:**
   - Yellow borders on candles with >2% moves
   - Volume spikes (>150% average) in bright blue
   - Recent highs/lows marked with horizontal lines

3. **API Integration:**
   - Use Binance API for 5-minute Bitcoin/USDT candles
   - Cache for 60 seconds to respect rate limits
   - Show last 50 candles (4+ hours of data)

**Testing:** `npm run dev` → See clear candle chart with highlighted profit opportunities

**Success Criteria:** ✅ Candles render correctly ✅ Volume visible ✅ Price movements >2% highlighted

---

### **TASK 2: EMA Signal Generation** (60 min)
**Goal:** Generate buy/sell signals when fast EMA crosses slow EMA

**Files to create/edit:**
- `src/lib/signals/ema-crossover.ts` (create)
- `src/components/SignalIndicator.tsx` (create)
- `src/components/TradingSignalPanel.tsx` (enhance existing)

**What to build:**
1. **EMA Calculation:**
   - EMA(9) for fast-moving average
   - EMA(21) for slow-moving average
   - Calculate from 5-minute candle closes

2. **Signal Logic:**
   - **BUY:** EMA(9) crosses above EMA(21) + price above both EMAs
   - **SELL:** EMA(9) crosses below EMA(21) + price below both EMAs
   - **HOLD:** No clear cross or conflicting signals

3. **Visual Display:**
   - Green "BUY" badge with confidence percentage
   - Red "SELL" badge with confidence percentage
   - Gray "HOLD" when no clear signal
   - Show EMA lines overlaid on price chart

**Testing:** Manually refresh data and verify signals appear when EMAs cross

**Success Criteria:** ✅ EMA lines visible on chart ✅ Signal badges appear ✅ Confidence scores make sense

---

### **TASK 3: RSI Confirmation Filter** (45 min)
**Goal:** Filter EMA signals using RSI to reduce false signals and improve win rate

**Files to create/edit:**
- `src/lib/indicators/rsi.ts` (create)
- `src/lib/signals/ema-crossover.ts` (enhance)
- `src/components/RSIIndicator.tsx` (create)

**What to build:**
1. **RSI Calculation:**
   - 14-period RSI from 5-minute candles
   - Standard overbought (>70) and oversold (<30) levels

2. **Signal Enhancement:**
   - **BUY signals only when:** EMA cross + RSI < 50 (not overbought)
   - **SELL signals only when:** EMA cross + RSI > 50 (not oversold)
   - Increase confidence when RSI confirms direction

3. **Visual RSI Display:**
   - RSI line chart below main price chart
   - Red zone above 70, green zone below 30
   - Current RSI value prominently displayed

**Testing:** Compare signals before/after RSI filter - should see fewer but higher quality signals

**Success Criteria:** ✅ RSI chart visible ✅ Signals filtered correctly ✅ Fewer false signals generated

---

### **TASK 4: Volume Spike Detection** (45 min)
**Goal:** Identify high-volume moves that indicate strong price momentum

**Files to create/edit:**
- `src/lib/indicators/volume-analysis.ts` (create)
- `src/components/VolumeSpikes.tsx` (create)
- `src/lib/signals/ema-crossover.ts` (enhance)

**What to build:**
1. **Volume Analysis:**
   - Calculate 20-period average volume
   - Identify spikes >150% of average volume
   - Track volume trend (increasing/decreasing)

2. **Signal Boost:**
   - Increase EMA signal confidence by 20% when volume spike confirms
   - Mark high-volume candles with special indicators
   - Show volume trend arrows

3. **Visual Indicators:**
   - Volume bars with normal (gray) and spike (blue) colors
   - Volume trend arrows next to current price
   - "HIGH VOLUME" alert badge when spike detected

**Testing:** Look for correlation between volume spikes and price moves

**Success Criteria:** ✅ Volume spikes highlighted ✅ Signal confidence adjusts ✅ Volume trend visible

---

### **TASK 5: Price Target Calculator** (60 min)
**Goal:** Show users exactly where to take profits and set stop losses

**Files to create/edit:**
- `src/lib/trading/price-targets.ts` (create)
- `src/components/TradingTargets.tsx` (create)
- `src/components/TradingSignalPanel.tsx` (enhance)

**What to build:**
1. **Target Calculation:**
   - **Take Profit:** 2x the stop loss distance (2:1 R:R ratio)
   - **Stop Loss:** Based on recent swing low/high or ATR
   - **Entry Price:** Current market price when signal triggers

2. **Risk Management:**
   - Calculate position size for 1% account risk
   - Show dollar amounts for common account sizes ($1K, $5K, $10K)
   - Display maximum loss per trade

3. **Visual Price Levels:**
   - Horizontal lines on chart for entry, stop, target
   - Color-coded: Green (target), Red (stop), Yellow (entry)
   - Percentage gains/losses clearly labeled

**Testing:** Verify 2:1 risk-reward ratios and reasonable stop distances

**Success Criteria:** ✅ Price levels visible on chart ✅ Risk amounts calculated ✅ 2:1 R:R maintained

---

### ✅ **TASK 6: Market Regime Detection** (COMPLETED)
**Implementation Details:**
- Created advanced `MarketRegimeDetector` class with multiple indicators
- Implemented 5 distinct market regimes: Strong/Weak Up/Down trends and Ranging
- Added confidence scoring based on ADX, volume, and EMA slope
- Integrated with existing signal generation system
- Built responsive UI component with detailed regime information

**Key Features:**
- **Multi-Indicator Analysis:** Combines ADX, RSI, EMA slope, and volume
- **Confidence Scoring:** Visual indicator of regime strength
- **Historical Context:** Tracks regime duration and changes
- **Responsive Design:** Works across all device sizes

**Next Steps:**
1. Integrate regime detection with trading signals
2. Add regime-specific strategy adjustments
3. Implement visual indicators on the price chart
4. Add regime change notifications

---

### ✅ **TASK 7: Real-Time Alert System** (COMPLETED)
**Implementation Details:**
- Created a comprehensive alert system with browser notifications and sound alerts
- Built a responsive `AlertManager` component with a clean, modern UI
- Implemented a flexible `useSignalNotifications` hook for managing alerts
- Added support for different alert types, priorities, and user preferences
- Integrated with the existing signal generation system

**Key Features:**
- **Browser Notifications:** Native browser notifications for new signals
- **Sound Alerts:** Configurable sounds for different alert types
- **Visual Indicators:** Badge counters and color-coded alerts
- **Alert Management:** Mark as read, dismiss, and clear functionality
- **Responsive Design:** Works on all device sizes
- **Customizable Settings:** Toggle sounds, set minimum confidence levels

---

### **TASK 8: Performance Tracking** (60 min)
**Goal:** Track and display the performance of trading signals

**Files to create/edit:**
- `src/lib/tracking/signal-performance.ts` (create)
- `src/components/PerformanceMetrics.tsx` (create)
- `src/lib/storage/trade-history.ts` (create)

**What to build:**
1. **Signal Performance Tracking:**
   - Record entry/exit prices for each signal
   - Calculate win/loss statistics
   - Track profit/loss in percentage and absolute terms
   
2. **Performance Metrics:**
   - Win rate percentage
   - Average win/loss ratio
   - Total profit/loss
   - Maximum drawdown
   - Risk-adjusted returns

3. **Visual Dashboard:**
   - Clean, at-a-glance metrics display
   - Performance charts over time
   - Trade history with filtering options
   - Export functionality for analysis

**Testing:**
- Verify accurate calculation of all metrics
- Test with mock trade data
- Ensure performance updates in real-time

**Success Criteria:**
✅ Accurate performance metrics displayed  
✅ Real-time updates as signals trigger  
✅ Clean, intuitive visualization of results  
✅ Persistent storage of trade history

**Next Steps:**
1. Add more alert types and customization options
2. Implement push notifications for web/mobile
3. Add alert history and filtering
4. Create a demo page to test the alert system

**Demo Available:** `/alerts-demo`

---

### **TASK 8: Performance Tracking** (90 min)
**Goal:** Track signal accuracy and help users improve their trading

**Files to create/edit:**
- `src/lib/tracking/signal-performance.ts` (create)
- `src/components/PerformanceMetrics.tsx` (create)
- `src/lib/storage/trade-history.ts` (create)

**What to build:**
1. **Signal Tracking:**
   - Record all generated signals with timestamps
   - Track price movement after signal (5min, 15min, 1hr)
   - Calculate win rate and average R:R ratio
   - Store in browser localStorage

2. **Performance Metrics:**
   - Daily/weekly win rate percentages
   - Average profit per winning trade
   - Best performing signal types
   - Time-of-day performance analysis

3. **Visual Dashboard:**
   - Performance charts (win rate over time)
   - Signal accuracy breakdown by type
   - Recent signal outcomes table
   - Profit/loss trends

**Testing:** Generate several signals and verify tracking works correctly

**Success Criteria:** ✅ Signals tracked accurately ✅ Performance calculated ✅ Historical data persists

---

### **TASK 9: Quick Action Panel** (45 min)
**Goal:** Provide one-click access to common trading actions

**Files to create/edit:**
- `src/components/QuickActions.tsx` (create)
- `src/lib/trading/quick-trades.ts` (create)
- `src/components/LiveDashboard.tsx` (enhance)

**What to build:**
1. **Action Buttons:**
   - "Execute BUY Signal" with pre-filled amounts
   - "Set Price Alerts" for key levels
   - "Calculate Position Size" quick tool
   - "Export Signal Data" for record keeping

2. **Quick Calculations:**
   - Position size calculator with risk slider
   - Profit/loss estimator for different scenarios
   - Risk-reward ratio validator
   - Break-even price calculator

3. **Integration Links:**
   - "Copy to Clipboard" for trade parameters
   - "Open Exchange" links (educational only)
   - "Save Trade Plan" functionality
   - "Share Signal" for discussion

**Testing:** Verify all buttons work and calculations are accurate

**Success Criteria:** ✅ All buttons functional ✅ Calculations correct ✅ Data export works

---

### **TASK 10: Data Freshness & Reliability** (60 min)
**Goal:** Ensure users always know how current their data is

**Files to create/edit:**
- `src/components/DataFreshness.tsx` (enhance existing)
- `src/lib/api/data-health.ts` (create)
- `src/lib/cache/smart-cache.ts` (enhance existing)

**What to build:**
1. **Freshness Indicators:**
   - Green: Data <30 seconds old
   - Yellow: Data 30s-2min old  
   - Red: Data >2min old
   - Gray: Using cached/mock data

2. **Health Monitoring:**
   - API response time tracking
   - Error rate monitoring
   - Automatic fallback to backup APIs
   - Connection status indicators

3. **Smart Refresh:**
   - Auto-refresh critical data every 30 seconds
   - Manual refresh button for immediate updates
   - Refresh rate adjustment based on API limits
   - Background refresh without UI interruption

**Testing:** Disconnect internet, verify fallback behavior and status indicators

**Success Criteria:** ✅ Freshness status accurate ✅ Fallback works ✅ Auto-refresh functions

---

## 🧪 TESTING CHECKPOINTS

After completing every 3 tasks, run this full test sequence:

### Quick Smoke Test (5 min)
```bash
npm run dev
# 1. Dashboard loads without errors
# 2. Charts render with data
# 3. Signals appear and update
# 4. All buttons clickable
# 5. No console errors
```

### Signal Accuracy Test (10 min)
1. Manually refresh data 5 times
2. Verify signals make logical sense
3. Check EMA lines match signal direction
4. Confirm RSI supports signal bias
5. Validate price targets show 2:1 R:R

### Performance Test (5 min)
1. Monitor API call frequency (should be <10/min)
2. Check page load speed (<3 seconds)
3. Verify smooth chart updates
4. Test with slow internet connection

---

## 📋 TASK COMPLETION CHECKLIST

Mark each task as complete only when ALL criteria are met:

- [x] **Task 1:** Enhanced 5-Minute Candles (Completed: Visual indicators for price moves >2%)
- [x] **Task 2:** EMA Signal Generation (Completed: EMA 9/21 with confidence scoring)
- [x] **Task 3:** Volume Spike Detection (Completed: 150% volume threshold with alerts)
- [x] **Task 4:** RSI Confirmation Filter (Completed: RSI 14 with overbought/oversold confirmation)
- [x] **Task 5:** Price Target Calculator (Completed: ATR-based stop loss with 2:1 risk-reward)
- [x] **Task 6:** Market Regime Detection (Completed: Regime classification with confidence scoring)
- [x] **Task 7:** Real-Time Alert System (Completed: Browser notifications with sound alerts)
- [x] **Task 8:** Performance Tracking (Completed: Win rate, P&L, and trade metrics) - Jest tests added
- [ ] **Task 9:** Quick Action Panel
- [ ] **Task 10:** Data Freshness & Reliability

**Final Success Criteria:**
- ✅ Dashboard helps users identify 2-3 daily Bitcoin trading opportunities
- ✅ All signals include entry, stop loss, and take profit levels
- ✅ Win rate tracking shows signal accuracy over time
- ✅ Users can act quickly on profitable setups
- ✅ No API rate limit violations
- ✅ Works reliably with mock data offline

**Ready for Production:** When all 10 tasks complete with full testing validation
