# TASKS — Bitcoin 5-Minute Trading System

Goal: Create a minimalist, high-performance decision support system optimized for Bitcoin trading on the 5-minute timeframe with **minimal code & compute** — using Next.js, React, and TypeScript without additional infrastructure.

---

# PARALLEL WORKSTREAMS

## Workstream A: Market Data Infrastructure

### A1. API Routes & Data Pipeline
- Create `app/api/market-data/route.ts` for consolidated market data
  - Implement multiple timeframes with priority for 5-minute candles
  - Add order book imbalance metrics for short timeframes
  - Include trade flow indicators and volume analysis
- Build data source fallback system
  - Primary source: Binance API
  - Secondary source: CoinGecko API
  - Offline capability: Local mock data generators
- Add automatic reconnection logic with exponential backoff

### A2. Real-time WebSocket Integration
- Create `src/lib/websocket-manager.ts` for connection handling
  - Implement auto-reconnect with prioritized 5m candle handling
  - Add message parsing for different stream types
- Develop `src/hooks/useWebSocket.ts` React hook
  - Add connection status tracking (connected/disconnected/error)
  - Implement subscription management tied to component lifecycle
- Set up critical data streams
  - `btcusdt@kline_5m` for real-time candle updates
  - `btcusdt@depth20@100ms` for order book
  - `btcusdt@aggTrade` for trade execution data

### A3. Data Resilience & Caching
- Implement browser caching strategy
  - Use IndexedDB for historical patterns storage
  - Set up localStorage for critical signals backup
- Create data freshness monitoring
  - Add timestamp tracking for all data sources
  - Implement visual indicators for stale data
  - Build warning system for missing 5-minute candles

## Workstream B: Technical Analysis Engine

### B1. Core Technical Indicators
- Implement moving averages library in `src/lib/indicators/moving-averages.ts`
  - Fast/Slow EMA crossover detection (9/21 EMA)
  - SMA calculations (20, 50, 200)
  - VWAP implementation with volume weighting
  - Hull Moving Average for noise reduction
- Create momentum oscillators in `src/lib/indicators/oscillators.ts`
  - RSI with configurable periods (default 14)
  - MACD with optimized parameters for 5m (12/26/9)
  - Stochastic with noise filtering
- Develop volatility indicators in `src/lib/indicators/volatility.ts`
  - Bollinger Bands implementation (20, 2)
  - ATR calculation for dynamic stop placement
  - Volatility regime detection
- Add volume analysis in `src/lib/indicators/volume.ts`
  - Volume Profile for key levels
  - OBV for trend confirmation
  - Volume spike detection for breakouts

### B2. Pattern Recognition
- Develop `src/lib/signals/conditions.ts` for pattern detection
  - Candlestick patterns (engulfing, hammer, doji)
  - Support/Resistance breakout identification
  - Volume confirmation thresholds 
- Build signal generation system in `src/lib/signals/generator.ts`
  - Implement weighted scoring system
  - Add trend-direction filtering logic
  - Create time-based signal expiration

### B3. Market Context Analysis
- Create `app/api/market-context/route.ts` for broader context
  - Volatility regime classification
  - Support/resistance level identification
  - Trading session detection (Asia/Europe/US)
- Add derivatives market metrics
  - Open Interest delta calculations
  - Funding rate analysis
  - Liquidation level detection

## Workstream C: Decision Support & Trading Intelligence

### C1. Trading Decision Framework
- Create `src/hooks/useSignals.ts` for signal management
  - Implement state management for active signals
  - Add signal history tracking
  - Create auto-refresh mechanism with optimized state updates
- Build `src/hooks/useDecisionSupport.ts` for trading decisions
  - Implement buy/sell scoring system based on multiple factors
  - Add position sizing recommendations with risk management
  - Create dynamic stop-loss and take-profit calculators
- Develop multi-factor signal confluence system
  - Implement weighting for technical indicator signals
  - Create trend alignment verification across timeframes
  - Add high-conviction signal identification

### C2. Entry/Exit Precision Tools
- Create `src/components/TradeEntry.tsx` for trade execution
  - Add ideal entry zone visualization
  - Implement dynamic stop calculation based on volatility
  - Create take-profit ladder suggestions with R:R ratios
- Build trade management components
  - Create position tracking dashboard component
  - Add trade journal integration
  - Implement performance metrics calculation

## Workstream D: Visualization & Interface

### D1. Chart & Data Visualization
- Implement `src/components/CandlestickChart.tsx`
  - Add custom annotations for signals and patterns
  - Create visual highlighting for high-probability setups
  - Build interactive trend line and support/resistance tools
- Create `src/components/OrderBookVisualizer.tsx`
  - Add heatmap for order book imbalance detection
  - Implement liquidity gap visualization
  - Build dynamic support/resistance overlay from depth data
- Build `src/components/TradesTable.tsx` for trade flow
  - Implement color coding for buyer/seller initiated trades
  - Add volume clustering visualization
  - Create real-time trade impact assessment

### D2. Decision Interface Components
- Create core UI components optimized for rapid decisions
  - Implement traffic-light system for signal confidence
  - Add expiration timers for time-sensitive signals
  - Create focused action cards for trade decisions
- Build `src/components/PriceDisplay.tsx`
  - Add momentum velocity indicators
  - Implement reversal alert system
  - Create price comparison to previous levels
- Develop responsive dashboard layout system
  - Implement grid system with priority components
  - Create dark mode optimized for extended sessions
  - Add focus mode for critical trading periods

## Workstream E: Testing & Optimization

### E1. Backtesting Framework
- Create `src/lib/backtesting/engine.ts` for strategy validation
  - Implement efficient historical data replay system
  - Add performance metrics calculation (win rate, drawdown, Sharpe)
  - Build Monte Carlo simulation for robustness testing
- Develop configuration components
  - Create `src/components/BacktestConfigPanel.tsx` for parameters
  - Build market condition filters for scenario testing
  - Add session-specific testing capabilities
- Build results visualization
  - Create `src/components/BacktestResultsPanel.tsx` for metrics display
  - Implement strategy comparison tools
  - Add optimization suggestions based on results

### E2. Performance Optimization
- Conduct targeted performance audit
  - Test rendering performance during high-activity periods
  - Measure data processing latency for critical signals
  - Analyze memory usage patterns during extended sessions
- Implement optimization strategies
  - Apply memoization for compute-intensive calculations
  - Add worker threads for non-blocking signal processing
  - Create efficient data structures for pattern recognition
  - Implement request batching and throttling

### E3. Production Readiness
- Add error handling and resilience
  - Implement comprehensive error boundaries
  - Create graceful degradation for API failures
  - Add automatic recovery mechanisms
- Prepare deployment pipeline
  - Create CI/CD workflow with automated testing
  - Set up monitoring for critical components
  - Add performance benchmarking

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
