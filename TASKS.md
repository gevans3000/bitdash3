# TASKS — Bitcoin 5-Minute Trading System

Goal: Create a minimalist, high-performance decision support system optimized for Bitcoin trading on the 5-minute timeframe with **minimal code & compute** — using Next.js, React, and TypeScript without additional infrastructure.
Note: Tasks can be referenced by their numbers. Up 1 or more tasks can be worked on at a time based on user preference.

---

# RISK-MINIMIZING IMPLEMENTATION SEQUENCE

## 1. Core Data Foundation
*Building on existing caching and data freshness components*

### 1.1 Basic Market Data API (Low Risk)
- [x] 1.1 Enhance existing `app/api/market-data/route.ts` for 5-minute specific data:
- [x] 1.2 Add 5-minute candle prioritization in API responses
- [x] 1.3 Keep existing fallback mechanisms (Binance → CoinGecko → Mock)
- [x] 1.4 Leverage existing cache implementation without modifications

### 1.2 Technical Indicator Core (Low Risk)
- [x] 1.5 Create simple, pure calculation functions in `src/lib/indicators/`:
- [x] 1.6 Implement basic moving averages (EMA, SMA) first
- [x] 1.7 Add basic momentum oscillators (RSI, MACD)
- [x] 1.8 Test extensively with static data before integration

### 1.3 Minimal UI Components (Low Risk)
- [x] 1.9 Set up basic UI structure with simple, stateless components:
- [x] 1.10 Create reusable card components for data display
- [x] 1.11 Implement basic price display component
- [x] 1.12 Add responsive grid layout foundation

## 2. Signal Generation & WebSockets
*Adding real-time capabilities with careful state management*

### 2.1 Signal Generator Framework (Medium Risk)
- [ ] 1.13 Create signal detection system with strict separation of concerns:
- [ ] 1.14 Build condition checkers that take data and return boolean results
- [ ] 1.15 Implement signal scoring without side effects
- [ ] 1.16 Add comprehensive test coverage for all signal logic

### 2.2 WebSocket Management (Medium Risk)
- [ ] 1.17 Implement WebSocket connection manager with careful error handling:
- [ ] 1.18 Add connection with auto-reconnect and exponential backoff
- [ ] 1.19 Create message parsing with data validation
- [ ] 1.20 Include fallback to REST API on WebSocket failures
- [ ] 1.21 Ensure all WebSocket code has appropriate cleanup

### 2.3 Enhanced Data Visualization (Low Risk)
- [ ] 1.22 Add initial chart components building on stable data:
- [ ] 1.23 Create basic candlestick chart using proven library
- [ ] 1.24 Implement order book display with minimal state
- [ ] 1.25 Add recent trades table with static rendering

## 3. Integration & Decision Framework
*Connecting components with controlled data flow*

### 3.1 Signal Hook with Memoization (Medium Risk)
- [ ] 1.26 Implement `useSignals` hook with careful state management:
- [ ] 1.27 Add memoization checks before recalculation
- [ ] 1.28 Implement dependency tracking to prevent update loops
- [ ] 1.29 Create debounced update mechanism for real-time data
- [ ] 1.30 Test with various data update scenarios

### 3.2 Enhanced Indicator Library (Low Risk)
- [ ] 1.31 Expand technical indicators with pure calculation patterns:
- [ ] 1.32 Add Bollinger Bands and volatility measurements
- [ ] 1.33 Implement Volume Profile and OBV calculations
- [ ] 1.34 Create pattern detection for common candlestick formations
- [ ] 1.35 Ensure all new indicators have unit tests

### 3.3 Dashboard Integration (Medium Risk)
- [ ] 1.36 Connect components with controlled data flow:
- [ ] 1.37 Implement dashboard layout with data dependencies
- [ ] 1.38 Add visual data freshness indicators 
- [ ] 1.39 Create component error boundaries for isolated failures

## 4. Decision Support System
*Building advanced features on stable foundation*

### 4.1 Multi-factor Decision Framework (Medium Risk)
- [ ] 1.40 Create decision support system with isolation from UI:
- [ ] 1.41 Implement confluence scoring for multiple signals
- [ ] 1.42 Add timeframe alignment verification
- [ ] 1.43 Create decision confidence calculation
- [ ] 1.44 Test with historical data scenarios

### 4.2 Advanced Chart Annotations (Low Risk)
- [ ] 1.45 Enhance chart visualization with signal overlay:
- [ ] 1.46 Add signal markers to candlestick chart
- [ ] 1.47 Implement support/resistance visualization
- [ ] 1.48 Create pattern highlighting on chart

### 4.3 Entry/Exit Tools (Medium Risk)
- [ ] 1.49 Build trade execution assistance components:
- [ ] 1.50 Create entry zone visualization
- [ ] 1.51 Add dynamic stop-loss calculator based on volatility
- [ ] 1.52 Implement take-profit ladder with R:R ratios

## 5. Performance & Production Readiness
*Optimizing and validating the system*

### 5.1 Performance Optimization (Low Risk)
- [ ] 1.53 Apply targeted optimization techniques:
- [ ] 1.54 Add memoization for expensive calculations
- [ ] 1.55 Implement component-level code splitting
- [ ] 1.56 Add request batching and throttling
- [ ] 1.57 Profile and optimize critical render paths

### 5.2 Backtesting Engine (Medium Risk)
- [ ] 1.58 Build isolated backtesting functionality:
- [ ] 1.59 Create historical data replay system
- [ ] 1.60 Implement performance metrics calculation
- [ ] 1.61 Add parameter optimization capabilities
- [ ] 1.62 Test with known historical scenarios

### 5.3 Production Hardening (Low Risk)
- [ ] 1.63 Apply final resilience improvements:
- [ ] 1.64 Add comprehensive error handling
- [ ] 1.65 Implement graceful degradation paths
- [ ] 1.66 Create monitoring and diagnostics
- [ ] 1.67 Test under various failure conditions

---

# ORIGINAL TASK REFERENCE

## 1 · Multi-Stream Data Pipeline

- [ ] 1.68 Enhance `app/api/candles/route.ts` 
- [ ] 1.69 Implement local file caching as fallback for API failures
- [ ] 1.70 Add support for multiple timeframes (1m, 5m, 15m, 1h)
- [ ] 1.71 Include a query parameter `?timeframe=5m` (default: 5m)

- [ ] 1.72 Create `app/api/orderbook/route.ts`
- [ ] 1.73 GET → JSON object with bids and asks arrays
- [ ] 1.74 Source: Binance public REST `https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=100`
- [ ] 1.75 Add Next.js caching (revalidate = 10) for frequent updates with rate limit safety

- [ ] 1.76 Create `app/api/trades/route.ts`
- [ ] 1.77 GET → JSON array of 50 most recent trades
- [ ] 1.78 Source: Binance `https://api.binance.com/api/v3/trades?symbol=BTCUSDT&limit=50`
- [ ] 1.79 Add Next.js caching (revalidate = 5) to minimize API calls

- [ ] 1.80 Create `app/api/market-data/route.ts`
- [ ] 1.81 GET → Combined object with 24h stats, funding rate, and open interest
- [ ] 1.82 Sources: Binance ticker, funding rate, and open interest endpoints
- [ ] 1.83 Add Next.js caching (revalidate = 60) for these less frequently changing metrics

---

## 2 · WebSocket Integration

- [ ] 1.84 Create `src/lib/websocket-manager.ts`
- [ ] 1.85 Implement a lightweight WebSocket connection manager
- [ ] 1.86 Add auto-reconnect logic with exponential backoff
- [ ] 1.87 Include message parsing functions for different stream types

- [ ] 1.88 Create `src/hooks/useWebSocket.ts` React hook
- [ ] 1.89 Create a custom hook for WebSocket subscriptions
- [ ] 1.90 Add connection status tracking (connected, connecting, error)
- [ ] 1.91 Include automatic subscription management based on component lifecycle

- [ ] 1.92 Add WebSocket streams for key data types
- [ ] 1.93 `btcusdt@kline_5m` for real-time candle updates
- [ ] 1.94 `btcusdt@depth20@100ms` for live order book (20 levels)
- [ ] 1.95 `btcusdt@aggTrade` for real-time trade execution data

---

## 3 · Technical Analysis Engine

- [ ] 1.96 Create `src/lib/indicators/moving-averages.ts`
- [ ] 1.97 Implement EMA calculations (9, 21, 50 periods)
- [ ] 1.98 Add SMA and VWAP calculations
- [ ] 1.99 Include helper for moving average crossover detection

- [ ] 1.100 Create `src/lib/indicators/oscillators.ts`
- [ ] 1.101 Implement RSI calculation with configurable period
- [ ] 1.102 Add MACD with signal line and histogram
- [ ] 1.103 Include helper for divergence detection

- [ ] 1.104 Create `src/lib/indicators/volatility.ts`
- [ ] 1.105 Implement Bollinger Bands (20, 2)
- [ ] 1.106 Add ATR (Average True Range) calculation
- [ ] 1.107 Include helper for volatility regime detection

- [ ] 1.108 Create `src/lib/indicators/volume.ts`
- [ ] 1.109 Implement Volume Profile (VPVR) calculation
- [ ] 1.110 Add OBV (On-Balance Volume) indicator
- [ ] 1.111 Include volume spike detection logic

---

## 4 · Signal Generation System

- [ ] 1.112 Create `src/lib/signals/conditions.ts`
- [ ] 1.113 Implement price action pattern detection (engulfing, doji, etc.)
- [ ] 1.114 Add indicator condition checks (RSI overbought/oversold, MACD cross, etc.)
- [ ] 1.115 Include volume confirmation logic

- [ ] 1.116 Create `src/lib/signals/generator.ts`
- [ ] 1.117 Implement signal generation engine using condition combinations
- [ ] 1.118 Add confidence scoring based on confluence of multiple indicators
- [ ] 1.119 Include signal persistence logic with timestamp

- [ ] 1.120 Create `src/hooks/useSignals.ts`
- [ ] 1.121 Create hook for accessing latest signals
- [ ] 1.122 Add logic to track signal history
- [ ] 1.123 Include notification methods for new signals

---

## 5 · UI Components

- [ ] 1.124 Create `src/components/MarketChart.tsx`
- [ ] 1.125 Implement high-performance candlestick chart using lightweight-charts
- [ ] 1.126 Add support for indicator overlays (EMAs, Bollinger Bands)
- [ ] 1.127 Include interactive features (zoom, pan, crosshair)
- [ ] 1.128 Add volume profile side panel

- [ ] 1.129 Create `src/components/DataCard.tsx`
- [ ] 1.130 Implement component showing key market metrics
- [ ] 1.131 Add real-time price, 24h change, volume display
- [ ] 1.132 Include funding rate and open interest

- [ ] 1.133 Create `src/components/OrderBook.tsx`
- [ ] 1.134 Implement visual order book component with bids/asks
- [ ] 1.135 Add depth visualization using mini bar charts
- [ ] 1.136 Include hover details for specific price levels

- [ ] 1.137 Create `src/components/TradeFeed.tsx`
- [ ] 1.138 Implement real-time trade execution feed
- [ ] 1.139 Add color coding for buyer/seller initiated trades
- [ ] 1.140 Include automatic scrolling with pause on hover

- [ ] 1.141 Create `src/components/IndicatorCard.tsx`
- [ ] 1.142 Implement card showing indicator values 
- [ ] 1.143 Add visual indicators for overbought/oversold conditions
- [ ] 1.144 Include mini sparklines for indicator trends

- [ ] 1.145 Create `src/components/SignalCard.tsx`
- [ ] 1.146 Implement component for displaying trading signals
- [ ] 1.147 Add visual cues based on signal confidence
- [ ] 1.148 Include reasoning behind signal generation

- [ ] 1.149 Create `src/components/DashboardControlPanel.tsx`
- [ ] 1.150 Implement panel for chart timeframe selection
- [ ] 1.151 Add controls for toggling indicator visibility
- [ ] 1.152 Include layout customization options

---

## 6 · State Management

- [ ] 1.153 Create `src/context/MarketDataContext.tsx`
- [ ] 1.154 Implement React Context for global market data
- [ ] 1.155 Add candle, orderbook, and trade data state
- [ ] 1.156 Include reducer functions for efficient updates

- [ ] 1.157 Create `src/hooks/useMarketData.ts`
- [ ] 1.158 Create hook for accessing different market data streams
- [ ] 1.159 Add derived data calculations (price action metrics)
- [ ] 1.160 Include data transformation helpers

- [ ] 1.161 Implement local storage persistence
- [ ] 1.162 Add user preferences saving
- [ ] 1.163 Include view configuration persistence
- [ ] 1.164 Add support for indicator settings memory

---

## 7 · Error Handling & Resilience

- [ ] 1.165 Enhance API route error handling
- [ ] 1.166 Implement file-based caching fallbacks for all API routes
- [ ] 1.167 Add synthetic data generation for complete API failures
- [ ] 1.168 Include detailed error logging with retry mechanisms

- [ ] 1.169 Improve WebSocket stability
- [ ] 1.170 Add heartbeat monitoring
- [ ] 1.171 Implement connection quality tracking
- [ ] 1.172 Include graceful degradation to REST API fallback

- [ ] 1.173 Create `src/components/ConnectionStatus.tsx`
- [ ] 1.174 Implement subtle status indicator
- [ ] 1.175 Add detailed connection information on click
- [ ] 1.176 Include troubleshooting suggestions for issues

---

## 8 · Performance Optimizations

- [ ] 1.177 Implement data batching
- [ ] 1.178 Add throttling for high-frequency WebSocket streams
- [ ] 1.179 Create efficient update batching system
- [ ] 1.180 Include optimized render scheduling

- [ ] 1.181 Add component code-splitting
- [ ] 1.182 Use dynamic imports for non-essential components
- [ ] 1.183 Implement progressive enhancement for advanced features
- [ ] 1.184 Add skeleton loading states

- [ ] 1.185 Apply memoization strategies
- [ ] 1.186 Use React.memo for pure components
- [ ] 1.187 Implement useMemo for expensive calculations
- [ ] 1.188 Add useCallback for optimized event handlers

---

## 9 · Testing 

- [ ] 1.189 Expand Jest test suite
- [ ] 1.190 Add tests for all indicator calculations
- [ ] 1.191 Create tests for signal generation logic
- [ ] 1.192 Implement WebSocket manager tests

- [ ] 1.193 Add component testing
- [ ] 1.194 Create tests for core UI components
- [ ] 1.195 Add tests for WebSocket integration
- [ ] 1.196 Include user interaction tests

- [ ] 1.197 Implement end-to-end testing
- [ ] 1.198 Setup Cypress/Playwright for E2E tests
- [ ] 1.199 Create basic dashboard interaction tests
- [ ] 1.200 Add data visualization verification tests

---

## 10 · Documentation & Deployment 

- [ ] 1.201 Update environment configuration
- [ ] 1.202 Expand `.env.example` with all API options
- [ ] 1.203 Add configuration documentation
- [ ] 1.204 Include rate limit and fallback strategies

- [ ] 1.205 Enhance `README.md` 
- [ ] 1.206 Add comprehensive setup instructions
- [ ] 1.207 Include feature documentation with screenshots
- [ ] 1.208 Add performance optimization suggestions

- [ ] 1.209 Create deployment workflow
- [ ] 1.210 Set up GitHub Actions for CI/CD
- [ ] 1.211 Add Vercel/Netlify deployment configuration
- [ ] 1.212 Include performance monitoring setup

---

## 11 · API-Optimized Decision Support System

- [ ] 1.213 Implement Real-Time Core Market Data with WebSockets
- [ ] 1.214 Set up primary WebSocket connection to Binance for 5-minute candles
- [ ] 1.215 Add fallback to REST endpoints with prudent polling intervals (max every 5-10 seconds)
- [ ] 1.216 Implement local computation for all market indicators to avoid additional API calls

- [ ] 1.217 Create `app/api/social-sentiment/route.ts`
- [ ] 1.218 GET → Social sentiment metrics for Bitcoin from LunarCrush API
- [ ] 1.219 Include 5-minute cache with revalidation strategy (12 calls/hour, well under 25/hour limit)
- [ ] 1.220 Add trend detection between subsequent calls to identify sentiment shifts

- [x] 1.221 Create `app/api/macro-context/route.ts`
- [ ] 1.222 GET → Key macroeconomic indicators from FRED API
- [ ] 1.223 Implement 24-hour caching strategy for these slow-changing metrics
- [ ] 1.224 Include daily summary insights based on latest values

- [ ] 1.225 Develop Signal Confluence System for 5-Minute Chart
- [ ] 1.226 Create signal priority/weighting based on API reliability and data freshness
- [ ] 1.227 Implement hysteresis detection to avoid oscillation during consolidation periods
- [ ] 1.228 Add API fallback hierarchy for critical signals when primary source is unavailable

- [x] 1.229 Create `src/hooks/useDecisionSupport.ts`
- [ ] 1.230 Combine technical indicators, order book pressure, sentiment and macro context
- [ ] 1.231 Calculate aggregated decision confidence score (0-100%) for buy/sell signals
- [ ] 1.232 Include divergence detection between price action and underlying metrics

---

---

# IMPLEMENTATION GUIDELINES

## Parallelization Strategy
- [ ] 1.233 Each track in Phase 2 can be developed by separate team members simultaneously
- [ ] 1.234 Within each track, tackle tasks from top to bottom as they often have internal dependencies
- [ ] 1.235 Phase 3 tasks should only begin after their dependent components from Phase 2 are complete
- [ ] 1.236 Focus on testing at component boundaries to ensure smooth integration

## General Principles
- [ ] 1.237 Prioritize tasks based on core functionality and gradually enhance with advanced features
- [ ] 1.238 Maintain minimal compute principles by leveraging browser capabilities, efficient data structures, and smart caching
- [ ] 1.239 When implementing API calls, always adhere to the rate limits documented in the README.md file
- [ ] 1.240 Components should be developed with isolation in mind, using clear interfaces between systems
- [ ] 1.241 Early performance testing should be conducted even on Phase 1 tasks to establish baselines

---

## 12 · Data Resilience & Fallback Mechanisms

- [ ] 1.242 Implement Data Source Fallback System
- [ ] 1.243 Create a Data Abstraction Layer to manage requests to multiple data providers
- [ ] 1.244 Integrate CoinGecko as initial fallback provider when Binance API fails
- [ ] 1.245 Implement provider switching logic with appropriate retries and error handling
- [ ] 1.246 Add instrumentation to track data source reliability and performance

- [ ] 1.247 Enhance Client-Side (Browser) Caching
- [ ] 1.248 Utilize `localStorage` for caching smaller, frequently accessed data points
- [ ] 1.249 Implement `IndexedDB` for larger datasets like historical candle data
- [ ] 1.250 Add timestamping for all cached data with appropriate TTL logic
- [ ] 1.251 Create cache retrieval workflow that prioritizes fresh network data

- [ ] 1.252 Add Data Freshness Indication & Cache Invalidation
- [ ] 1.253 Implement UI indicators showing data freshness and source
- [ ] 1.254 Create differentiated TTL logic for various data types (prices, daily summaries, etc.)
- [ ] 1.255 Add manual refresh option with visual feedback during data fetching
- [ ] 1.256 Implement graceful degradation of UI components when data becomes stale

- [ ] 1.257 Enhance WebSocket Connection Handling
- [ ] 1.258 Improve `useWebSocket.ts` to retain last received message when disconnected
- [ ] 1.259 Add clear UI indication of connection state with auto-reconnect attempts
- [ ] 1.260 Implement fallback to REST API polling when WebSocket is persistently unavailable
- [ ] 1.261 Add data consistency verification between WebSocket and REST data sources

---

## 13 · Bitcoin On-Chain Data & Network Analytics

- [ ] 1.262 Create `app/api/btc-onchain/route.ts`
- [ ] 1.263 Implement endpoint for essential on-chain metrics (transaction count, fees, etc.)
- [ ] 1.264 Add 1-hour caching with revalidation for these less frequently changing metrics
- [ ] 1.265 Implement lightweight data normalization to reduce payload size

- [x] 1.266 Create `src/components/OnChainInsightsPanel.tsx`
- [ ] 1.267 Build a compact UI component showing key on-chain metrics
- [ ] 1.268 Add visual indicators for unusual network activity
- [ ] 1.269 Include togglable detail view for in-depth analysis

- [x] 1.270 Add Open Interest Delta calculation
- [ ] 1.271 Extend market data endpoints to include derivatives open interest data
- [ ] 1.272 Implement delta calculation with configurable time windows (1h, 24h)
- [ ] 1.273 Add visualization to highlight significant OI changes

- [ ] 1.274 Add Ichimoku Cloud Technical Indicator
- [ ] 1.275 Create `src/lib/indicators/ichimoku.ts` with efficient implementation
- [ ] 1.276 Extend charting components to support cloud overlay visualization
- [ ] 1.277 Add signal generation based on Ichimoku crossovers and cloud breakouts

---

## 14 · Lightweight Backtesting Engine

- [x] 1.278 Create `src/lib/backtesting/engine.ts`
- [ ] 1.279 Implement core logic using cached historical data to minimize external calls
- [ ] 1.280 Create modular signal evaluation against historical price movements
- [ ] 1.281 Add performance metrics calculation (win rate, profit factor, drawdown)

- [x] 1.282 Build `src/components/BacktestConfigPanel.tsx`
- [ ] 1.283 Create minimal UI for selecting test parameters and time ranges
- [ ] 1.284 Implement strategy presets to simplify configuration
- [ ] 1.285 Add validation to prevent resource-intensive test scenarios

- [x] 1.286 Create `src/components/BacktestResultsPanel.tsx`
- [ ] 1.287 Build compact results display with key performance metrics
- [ ] 1.288 Add visualization of trades on a minimal chart
- [ ] 1.289 Include equity curve with option to export results
