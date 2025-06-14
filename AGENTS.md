# AGENTS.md – Bitcoin 5-Minute Trading Logic

**Project:** BitDash3 – Lightweight Bitcoin 5-Minute Trading Dashboard  
**Architecture:** Low code, minimal compute, maximum performance, sole purpose is to generate buy/sell signals for BTC/USDT on the 5-minute timeframe

---

## CORE PHILOSOPHY

**LOW CODE + FAST EXECUTION**
- Minimal dependencies, maximum efficiency
- Pure calculation functions without complex frameworks  
- Client-side processing to minimize server load
- Real-time WebSocket data with intelligent caching
- **Target:** Sub-100ms signal generation

---

## TRADING SYSTEM ARCHITECTURE

### Market Regime Detection (Primary Filter)
**ADX-Based Regime Classification:**
- **Trending (ADX > 25):** Use trend-following strategies
- **Weak Trend (ADX 20-25):** Reduce position confidence  
- **Ranging (ADX < 20):** Use mean-reversion strategies

### Signal Generation Rules

#### 1. **TRENDING MARKET SIGNALS (ADX > 25)**
- **Long Entry:** EMA-9 crosses above EMA-21 + RSI(14) > 45 + Volume > 1.5x avg
- **Short Entry:** EMA-9 crosses below EMA-21 + RSI(14) < 55 + Volume > 1.5x avg
- **Stop Loss:** 2.5 × ATR(14) from entry
- **Take Profit:** 2:1 Risk/Reward ratio minimum

#### 2. **RANGING MARKET SIGNALS (ADX < 20)**  
- **Long Entry:** Price touches lower Bollinger Band + RSI < 30
- **Short Entry:** Price touches upper Bollinger Band + RSI > 70
- **Stop Loss:** Beyond opposite Bollinger Band
- **Take Profit:** Middle Bollinger Band or 1.5:1 R:R

#### 3. **CONFLUENCE SCORING SYSTEM**
Award points for signal strength:
- EMA Crossover: +3 points
- RSI Confirmation: +2 points  
- Volume Spike (>150% avg): +2 points
- Bollinger Band Touch: +2 points
- **Minimum Score:** 5/9 points to execute trade

---

## EXECUTION FRAMEWORK

### Position Management
- **Position Size:** 1% account risk using dynamic ATR stops
- **Max Concurrent Positions:** 1 (simplicity focus)
- **Trade Frequency:** 2-3 high-confidence signals per day
- **Session Focus:** US market hours (9 AM - 4 PM EST)

### Risk Controls  
- **Daily Loss Limit:** -2% account (circuit breaker)
- **Consecutive Loss Limit:** 3 trades maximum
- **Time-Based Stop:** Close position after 2 hours if no movement
- **Volatility Filter:** No trades when ATR > 90th percentile

### Performance Targets
- **Win Rate:** 55% minimum (realistic for crypto)
- **Risk/Reward:** 2:1 average
- **Monthly Returns:** 10-15% target  
- **Maximum Drawdown:** <10%

---

## TECHNICAL IMPLEMENTATION

### Data Sources (Prioritized)
1. **Binance WebSocket** (primary, real-time)
2. **Binance REST API** (fallback)  
3. **CoinGecko API** (backup)
4. **Mock Data** (development/testing)

### Core Indicators (Lightweight)
```typescript
// Minimal, pure calculation functions
calculateEMA(prices: number[], period: number): number[]
calculateRSI(prices: number[], period: number): number[]  
calculateATR(highs: number[], lows: number[], closes: number[]): number[]
calculateADX(highs: number[], lows: number[], closes: number[]): number
calculateBollingerBands(prices: number[], period: number): {upper, middle, lower}
```

### Signal Processing Pipeline
1. **Data Ingestion:** WebSocket → Normalize → Cache
2. **Indicator Calculation:** Pure functions, no side effects
3. **Regime Detection:** ADX classification  
4. **Signal Generation:** Confluence scoring
5. **Risk Assessment:** Position sizing + stop calculation
6. **Execution Decision:** Binary go/no-go output

---

## DEVELOPMENT PRIORITIES

### Phase 1: Core Engine (Week 1)
- [x] WebSocket connection + data normalization
- [x] Basic indicator calculations (EMA, RSI, ATR)
- [x] Market regime detection UI
- [ ] Signal generation logic
- [ ] Position sizing calculator

### Phase 2: Signal Validation (Week 2)  
- [ ] Confluence scoring system
- [ ] Backtesting engine (lightweight)
- [ ] Risk management integration
- [ ] Alert system

### Phase 3: UI Polish (Week 3)
- [ ] Signal confidence display
- [ ] Trade history tracking  
- [ ] Performance metrics dashboard
- [ ] Mobile-responsive design

---

## TRADING RULES (STRICT ADHERENCE)

1. **NEVER** trade without confluence score ≥5/9 points
2. **ALWAYS** respect market regime (trend vs range)
3. **NEVER** risk more than 1% per trade
4. **ALWAYS** use dynamic ATR-based stops  
5. **NEVER** add to losing positions
6. **ALWAYS** take partial profits at 1:1 R:R
7. **NEVER** trade during major news events
8. **ALWAYS** stop trading after 3 consecutive losses

---

## SUCCESS METRICS

**Code Quality:**
- Minimal external dependencies
- <100ms signal generation latency
- 95%+ uptime WebSocket connection
- Zero-downtime deployments

**Trading Performance:**  
- 55%+ win rate over 50+ trades
- 2:1+ average risk/reward
- <10% maximum drawdown
- Consistent 8-12% monthly returns

**Development Velocity:**
- Weekly feature deployments
- Rapid iteration cycles
- Minimal technical debt  
- Self-documenting code
