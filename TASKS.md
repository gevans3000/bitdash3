# TASKS — Bitcoin 5-Minute Decision Dashboard

Goal: Create a minimalist, high-performance decision support system specifically optimized for making Bitcoin trading decisions on the 5-minute timeframe with **minimal code & compute** — using Next.js, React, and TypeScript without requiring additional infrastructure.

---

# PRIORITY IMPLEMENTATION ORDER

## 1. Core Signal Generation for 5-Minute Decisions

### Technical Analysis for 5m Candles
- Implement 5-minute specific indicator calculations in `src/lib/indicators/moving-averages.ts`
  - Fast/Slow EMA crossover detection (9/21 EMA)
  - VWAP deviation tracking for 5-minute charts
  - Hull Moving Average for noise reduction
- Add Volume Profile indicator for 5-minute timeframe in `src/lib/indicators/volume.ts`
- Create momentum oscillators in `src/lib/indicators/oscillators.ts` tuned to 5-minute volatility
  - RSI with optimal 5m settings (14 period)
  - MACD with 5m-specific parameters (12/26/9)
  - Stochastic with 5m noise filtering

### Signal Generator & Decision Framework
- Develop `src/lib/signals/conditions.ts` with 5-minute specific pattern recognition
  - Price action patterns (engulfing, hammer, shooting star)
  - Support/Resistance breakouts on 5m chart
  - Volume confirmation thresholds for 5m signals
- Implement signal generator in `src/lib/signals/generator.ts` with significance weighting
  - Build confluence system scoring for 5-minute signals
  - Add trend-direction filtering to reduce false signals
  - Create entry/exit timing optimizers for 5m timeframe
- Create `src/hooks/useSignals.ts` with 5-minute specific initialization

## 2. Real-time Market Data Acquisition & Processing

### High-Performance Data Pipeline
- Create `app/api/market-data/route.ts` optimized for 5-minute decision-making
  - Ensure 5-minute candles are prioritized in data retrieval
  - Add order book imbalance metrics specifically for short timeframes
  - Include trade flow indicators (buy/sell pressure) for 5-minute windows
- Implement Data Source Fallback System with multiple exchanges
  - Binance as primary source for 5-minute data quality
  - CoinGecko as fallback with 5-minute data adaptation
  - Local mock data for testing 5-minute strategies offline

### WebSocket Integration for 5-Minute Decision Making
- Create `src/lib/websocket-manager.ts` with connection stability focus
  - Prioritize low-latency processing for 5-minute signals
  - Add automatic reconnection optimized for critical 5m candle transitions
- Create `src/hooks/useWebSocket.ts` hook focused on 5-minute data streams
  - Stream real-time trades with 5-minute aggregation
  - Add order book updates with 5-minute significance filtering
  - Create price tick data with momentum markers for 5-minute candles

### Data Resilience for Critical 5-Minute Windows
- Enhance Client-Side Caching for 5-minute strategy components
  - Implement IndexedDB storage for historical 5-minute patterns
  - Create localStorage fallback for critical 5-minute signals
- Add Data Freshness Indication specific to 5-minute decision requirements
  - Visual indicators for stale 5-minute data
  - Warning system for missing 5-minute candles

## 3. Multi-Factor Decision Support System

### Market Context for 5-Minute Decisions
- Create `app/api/market-context/route.ts` for 5-minute relevant factors
  - Volatility regime detection for 5-minute candle context
  - Recent support/resistance levels most relevant to current 5-minute action
  - Market session data (Asia/Europe/US) affecting 5-minute patterns
- Add Open Interest Delta calculation focused on 5-minute momentum shifts
  - Detect leverage ratio changes relevant to 5-minute price action
  - Track funding rate changes affecting 5-minute volatility
  - Calculate liquidation levels near current 5-minute price action

### Trading Decision Framework
- Create `src/hooks/useDecisionSupport.ts` with 5-minute specific logic
  - Implement buy/sell decision scoring system for 5-minute entries
  - Add position sizing recommendations based on 5-minute signal strength
  - Create stop-loss and take-profit calculators optimized for 5-minute trades
- Develop Signal Confluence System specifically for 5-Minute Chart
  - Weight technical signals by 5-minute timeframe relevance
  - Add trend alignment checking across multiple timeframes
  - Create multi-factor confirmation scoring for high-conviction signals

### Entry/Exit Precision Tools
- Create `src/components/TradeEntry.tsx` optimized for 5-minute execution
  - Add ideal entry zone visualization for 5-minute signals
  - Implement dynamic stop calculation based on 5-minute volatility
  - Create take-profit ladder suggestions for 5-minute position management

## 4. Decision Visualization & UI Components

### 5-Minute Chart Analysis Components
- Implement `src/components/CandlestickChart.tsx` with 5-minute optimizations
  - Add 5-minute specific annotations (signal markers, momentum shifts)
  - Create visual highlighting for high-probability 5-minute setups
  - Implement trend line detection focused on 5-minute relevance
- Create `src/components/OrderBookVisualizer.tsx` for short-term insights
  - Add order book imbalance heatmap for 5-minute price impact detection
  - Implement visual liquidity gaps indicator for 5-minute breakout potential
  - Create dynamic support/resistance visualization from order book depth

### Decision Dashboard Layout
- Create reusable decision card components for 5-minute signals
  - Implement traffic-light system for rapid decision recognition
  - Add expiration timers for 5-minute limited signals
- Create `src/components/PriceDisplay.tsx` with 5-minute context
  - Add price movement velocity indicator for 5-minute momentum
  - Implement price reversal alerts for 5-minute signal invalidation
  - Create visual comparison to previous 5-minute close/high/low

### User Interface Optimization
- Implement dark mode UI theme optimized for extended monitoring sessions
- Add focus mode highlighting only actionable 5-minute signals
- Create responsive layout system prioritizing critical decision components

## 5. Performance & Strategy Validation

### 5-Minute Strategy Backtesting
- Create `src/lib/backtesting/engine.ts` specific to 5-minute strategies
  - Implement historical 5-minute candle replay system
  - Add performance metrics focused on 5-minute trading (win rate, drawdown)
  - Create Monte Carlo simulation for 5-minute strategy robustness testing
- Build `src/components/BacktestConfigPanel.tsx` for 5-minute strategy tuning
  - Add parameter optimization for 5-minute specific indicators
  - Implement market condition filters for 5-minute backtest scenarios
  - Create session-specific (Asia/Europe/US) testing for 5-minute patterns
- Create `src/components/BacktestResultsPanel.tsx` with 5-minute insights
  - Add detailed performance metrics for 5-minute trading assessment
  - Implement visual comparison of different 5-minute strategies
  - Create optimization suggestions based on backtest results

### Optimization & Production Readiness
- Conduct performance audit focused on critical 5-minute decision points
  - Test rendering performance during 5-minute candle transitions
  - Measure data processing latency for real-time 5-minute signals
  - Evaluate memory usage during extended 5-minute trading sessions
- Apply optimization strategies for low-latency decision making
  - Implement memoization of intensive 5-minute calculations
  - Add worker threads for non-blocking signal processing
  - Create efficient data structures for 5-minute pattern recognition
- Create deployment workflow optimized for stable trading environment

---

# ORIGINAL TASK REFERENCE

## 1 · Multi-Stream Data Pipeline

1.1 Enhance `app/api/candles/route.ts` 
  • Implement local file caching as fallback for API failures
  • Add support for multiple timeframes (1m, 5m, 15m, 1h)
  • Include a query parameter `?timeframe=5m` (default: 5m)

1.2 Create `app/api/orderbook/route.ts`
  • GET → JSON object with bids and asks arrays
  • Source: Binance public REST `https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=100`
  • Add Next.js caching (revalidate = 10) for frequent updates with rate limit safety

1.3 Create `app/api/trades/route.ts`
  • GET → JSON array of 50 most recent trades
  • Source: Binance `https://api.binance.com/api/v3/trades?symbol=BTCUSDT&limit=50`
  • Add Next.js caching (revalidate = 5) to minimize API calls

1.4 Create `app/api/market-data/route.ts`
  • GET → Combined object with 24h stats, funding rate, and open interest
  • Sources: Binance ticker, funding rate, and open interest endpoints
  • Add Next.js caching (revalidate = 60) for these less frequently changing metrics

---

## 2 · WebSocket Integration

2.1 Create `src/lib/websocket-manager.ts`
  • Implement a lightweight WebSocket connection manager
  • Add auto-reconnect logic with exponential backoff
  • Include message parsing functions for different stream types

2.2 Create `src/hooks/useWebSocket.ts` React hook
  • Create a custom hook for WebSocket subscriptions
  • Add connection status tracking (connected, connecting, error)
  • Include automatic subscription management based on component lifecycle

2.3 Add WebSocket streams for key data types
  • `btcusdt@kline_5m` for real-time candle updates
  • `btcusdt@depth20@100ms` for live order book (20 levels)
  • `btcusdt@aggTrade` for real-time trade execution data

---

## 3 · Technical Analysis Engine

3.1 Create `src/lib/indicators/moving-averages.ts`
  • Implement EMA calculations (9, 21, 50 periods)
  • Add SMA and VWAP calculations
  • Include helper for moving average crossover detection

3.2 Create `src/lib/indicators/oscillators.ts`
  • Implement RSI calculation with configurable period
  • Add MACD with signal line and histogram
  • Include helper for divergence detection

3.3 Create `src/lib/indicators/volatility.ts`
  • Implement Bollinger Bands (20, 2)
  • Add ATR (Average True Range) calculation
  • Include helper for volatility regime detection

3.4 Create `src/lib/indicators/volume.ts`
  • Implement Volume Profile (VPVR) calculation
  • Add OBV (On-Balance Volume) indicator
  • Include volume spike detection logic

---

## 4 · Signal Generation System

4.1 Create `src/lib/signals/conditions.ts`
  • Implement price action pattern detection (engulfing, doji, etc.)
  • Add indicator condition checks (RSI overbought/oversold, MACD cross, etc.)
  • Include volume confirmation logic

4.2 Create `src/lib/signals/generator.ts`
  • Implement signal generation engine using condition combinations
  • Add confidence scoring based on confluence of multiple indicators
  • Include signal persistence logic with timestamp

4.3 Create `src/hooks/useSignals.ts`
  • Create hook for accessing latest signals
  • Add logic to track signal history
  • Include notification methods for new signals

---

## 5 · UI Components

5.1 Create `src/components/MarketChart.tsx`
  • Implement high-performance candlestick chart using lightweight-charts
  • Add support for indicator overlays (EMAs, Bollinger Bands)
  • Include interactive features (zoom, pan, crosshair)
  • Add volume profile side panel

5.2 Create `src/components/DataCard.tsx`
  • Implement component showing key market metrics
  • Add real-time price, 24h change, volume display
  • Include funding rate and open interest

5.3 Create `src/components/OrderBook.tsx`
  • Implement visual order book component with bids/asks
  • Add depth visualization using mini bar charts
  • Include hover details for specific price levels

5.4 Create `src/components/TradeFeed.tsx`
  • Implement real-time trade execution feed
  • Add color coding for buyer/seller initiated trades
  • Include automatic scrolling with pause on hover

5.5 Create `src/components/IndicatorCard.tsx`
  • Implement card showing indicator values 
  • Add visual indicators for overbought/oversold conditions
  • Include mini sparklines for indicator trends

5.6 Create `src/components/SignalCard.tsx`
  • Implement component for displaying trading signals
  • Add visual cues based on signal confidence
  • Include reasoning behind signal generation

5.7 Create `src/components/DashboardControlPanel.tsx`
  • Implement panel for chart timeframe selection
  • Add controls for toggling indicator visibility
  • Include layout customization options

---

## 6 · State Management

6.1 Create `src/context/MarketDataContext.tsx`
  • Implement React Context for global market data
  • Add candle, orderbook, and trade data state
  • Include reducer functions for efficient updates

6.2 Create `src/hooks/useMarketData.ts`
  • Create hook for accessing different market data streams
  • Add derived data calculations (price action metrics)
  • Include data transformation helpers

6.3 Implement local storage persistence
  • Add user preferences saving
  • Include view configuration persistence
  • Add support for indicator settings memory

---

## 7 · Error Handling & Resilience

7.1 Enhance API route error handling
  • Implement file-based caching fallbacks for all API routes
  • Add synthetic data generation for complete API failures
  • Include detailed error logging with retry mechanisms

7.2 Improve WebSocket stability
  • Add heartbeat monitoring
  • Implement connection quality tracking
  • Include graceful degradation to REST API fallback

7.3 Create `src/components/ConnectionStatus.tsx`
  • Implement subtle status indicator
  • Add detailed connection information on click
  • Include troubleshooting suggestions for issues

---

## 8 · Performance Optimizations

8.1 Implement data batching
  • Add throttling for high-frequency WebSocket streams
  • Create efficient update batching system
  • Include optimized render scheduling

8.2 Add component code-splitting
  • Use dynamic imports for non-essential components
  • Implement progressive enhancement for advanced features
  • Add skeleton loading states

8.3 Apply memoization strategies
  • Use React.memo for pure components
  • Implement useMemo for expensive calculations
  • Add useCallback for optimized event handlers

---

## 9 · Testing 

9.1 Expand Jest test suite
  • Add tests for all indicator calculations
  • Create tests for signal generation logic
  • Implement WebSocket manager tests

9.2 Add component testing
  • Create tests for core UI components
  • Add tests for WebSocket integration
  • Include user interaction tests

9.3 Implement end-to-end testing
  • Setup Cypress/Playwright for E2E tests
  • Create basic dashboard interaction tests
  • Add data visualization verification tests

---

## 10 · Documentation & Deployment 

10.1 Update environment configuration
  • Expand `.env.example` with all API options
  • Add configuration documentation
  • Include rate limit and fallback strategies

10.2 Enhance `README.md` 
  • Add comprehensive setup instructions
  • Include feature documentation with screenshots
  • Add performance optimization suggestions

10.3 Create deployment workflow
  • Set up GitHub Actions for CI/CD
  • Add Vercel/Netlify deployment configuration
  • Include performance monitoring setup

---

## 11 · API-Optimized Decision Support System

11.1 Implement Real-Time Core Market Data with WebSockets
  • Set up primary WebSocket connection to Binance for 5-minute candles
  • Add fallback to REST endpoints with prudent polling intervals (max every 5-10 seconds)
  • Implement local computation for all market indicators to avoid additional API calls

11.2 Create `app/api/social-sentiment/route.ts`
  • GET → Social sentiment metrics for Bitcoin from LunarCrush API
  • Include 5-minute cache with revalidation strategy (12 calls/hour, well under 25/hour limit)
  • Add trend detection between subsequent calls to identify sentiment shifts

11.3 Create `app/api/macro-context/route.ts`
  • GET → Key macroeconomic indicators from FRED API
  • Implement 24-hour caching strategy for these slow-changing metrics
  • Include daily summary insights based on latest values

11.4 Develop Signal Confluence System for 5-Minute Chart
  • Create signal priority/weighting based on API reliability and data freshness
  • Implement hysteresis detection to avoid oscillation during consolidation periods
  • Add API fallback hierarchy for critical signals when primary source is unavailable

11.5 Create `src/hooks/useDecisionSupport.ts`
  • Combine technical indicators, order book pressure, sentiment and macro context
  • Calculate aggregated decision confidence score (0-100%) for buy/sell signals
  • Include divergence detection between price action and underlying metrics

---

---

# IMPLEMENTATION GUIDELINES

## Parallelization Strategy
- Each track in Phase 2 can be developed by separate team members simultaneously
- Within each track, tackle tasks from top to bottom as they often have internal dependencies
- Phase 3 tasks should only begin after their dependent components from Phase 2 are complete
- Focus on testing at component boundaries to ensure smooth integration

## General Principles
- Prioritize tasks based on core functionality and gradually enhance with advanced features
- Maintain minimal compute principles by leveraging browser capabilities, efficient data structures, and smart caching
- When implementing API calls, always adhere to the rate limits documented in the README.md file
- Components should be developed with isolation in mind, using clear interfaces between systems
- Early performance testing should be conducted even on Phase 1 tasks to establish baselines

---

## 12 · Data Resilience & Fallback Mechanisms

12.1 Implement Data Source Fallback System
  • Create a Data Abstraction Layer to manage requests to multiple data providers
  • Integrate CoinGecko as initial fallback provider when Binance API fails
  • Implement provider switching logic with appropriate retries and error handling
  • Add instrumentation to track data source reliability and performance

12.2 Enhance Client-Side (Browser) Caching
  • Utilize `localStorage` for caching smaller, frequently accessed data points
  • Implement `IndexedDB` for larger datasets like historical candle data
  • Add timestamping for all cached data with appropriate TTL logic
  • Create cache retrieval workflow that prioritizes fresh network data

12.3 Add Data Freshness Indication & Cache Invalidation
  • Implement UI indicators showing data freshness and source
  • Create differentiated TTL logic for various data types (prices, daily summaries, etc.)
  • Add manual refresh option with visual feedback during data fetching
  • Implement graceful degradation of UI components when data becomes stale

12.4 Enhance WebSocket Connection Handling
  • Improve `useWebSocket.ts` to retain last received message when disconnected
  • Add clear UI indication of connection state with auto-reconnect attempts
  • Implement fallback to REST API polling when WebSocket is persistently unavailable
  • Add data consistency verification between WebSocket and REST data sources

---

## 13 · Bitcoin On-Chain Data & Network Analytics

13.1 Create `app/api/btc-onchain/route.ts`
  • Implement endpoint for essential on-chain metrics (transaction count, fees, etc.)
  • Add 1-hour caching with revalidation for these less frequently changing metrics
  • Implement lightweight data normalization to reduce payload size

13.2 Create `src/components/OnChainInsightsPanel.tsx`
  • Build a compact UI component showing key on-chain metrics
  • Add visual indicators for unusual network activity
  • Include togglable detail view for in-depth analysis

13.3 Add Open Interest Delta calculation
  • Extend market data endpoints to include derivatives open interest data
  • Implement delta calculation with configurable time windows (1h, 24h)
  • Add visualization to highlight significant OI changes

13.4 Add Ichimoku Cloud Technical Indicator
  • Create `src/lib/indicators/ichimoku.ts` with efficient implementation
  • Extend charting components to support cloud overlay visualization
  • Add signal generation based on Ichimoku crossovers and cloud breakouts

---

## 14 · Lightweight Backtesting Engine

14.1 Create `src/lib/backtesting/engine.ts`
  • Implement core logic using cached historical data to minimize external calls
  • Create modular signal evaluation against historical price movements
  • Add performance metrics calculation (win rate, profit factor, drawdown)

14.2 Build `src/components/BacktestConfigPanel.tsx`
  • Create minimal UI for selecting test parameters and time ranges
  • Implement strategy presets to simplify configuration
  • Add validation to prevent resource-intensive test scenarios

14.3 Create `src/components/BacktestResultsPanel.tsx`
  • Build compact results display with key performance metrics
  • Add visualization of trades on a minimal chart
  • Include equity curve with option to export results
