# TASKS — Bitcoin 5-Minute Trading System

Goal: Create a minimalist, high-performance decision support system optimized for Bitcoin trading on the 5-minute timeframe with **minimal code & compute** — using Next.js, React, and TypeScript without additional infrastructure.

---

# RISK-MINIMIZING IMPLEMENTATION SEQUENCE

## 1. Core Data Foundation
*Building on existing caching and data freshness components*

### 1.1 Basic Market Data API (Low Risk)
- Enhance existing `app/api/market-data/route.ts` for 5-minute specific data:
  - Add 5-minute candle prioritization in API responses
  - Keep existing fallback mechanisms (Binance → CoinGecko → Mock)
  - Leverage existing cache implementation without modifications

### 1.2 Technical Indicator Core (Low Risk)
- Create simple, pure calculation functions in `src/lib/indicators/`:
  - Implement basic moving averages (EMA, SMA) first
  - Add basic momentum oscillators (RSI, MACD)
  - Test extensively with static data before integration

### 1.3 Minimal UI Components (Low Risk)
- Set up basic UI structure with simple, stateless components:
  - Create reusable card components for data display
  - Implement basic price display component
  - Add responsive grid layout foundation

## 2. Signal Generation & WebSockets
*Adding real-time capabilities with careful state management*

### 2.1 Signal Generator Framework (Medium Risk)
- Create signal detection system with strict separation of concerns:
  - Build condition checkers that take data and return boolean results
  - Implement signal scoring without side effects
  - Add comprehensive test coverage for all signal logic

### 2.2 WebSocket Management (Medium Risk)
- Implement WebSocket connection manager with careful error handling:
  - Add connection with auto-reconnect and exponential backoff
  - Create message parsing with data validation
  - Include fallback to REST API on WebSocket failures
  - Ensure all WebSocket code has appropriate cleanup

### 2.3 Enhanced Data Visualization (Low Risk)
- Add initial chart components building on stable data:
  - Create basic candlestick chart using proven library
  - Implement order book display with minimal state
  - Add recent trades table with static rendering

## 3. Integration & Decision Framework
*Connecting components with controlled data flow*

### 3.1 Signal Hook with Memoization (Medium Risk)
- Implement `useSignals` hook with careful state management:
  - Add memoization checks before recalculation
  - Implement dependency tracking to prevent update loops
  - Create debounced update mechanism for real-time data
  - Test with various data update scenarios

### 3.2 Enhanced Indicator Library (Low Risk)
- Expand technical indicators with pure calculation patterns:
  - Add Bollinger Bands and volatility measurements
  - Implement Volume Profile and OBV calculations
  - Create pattern detection for common candlestick formations
  - Ensure all new indicators have unit tests

### 3.3 Dashboard Integration (Medium Risk)
- Connect components with controlled data flow:
  - Implement dashboard layout with data dependencies
  - Add visual data freshness indicators 
  - Create component error boundaries for isolated failures

## 4. Decision Support System
*Building advanced features on stable foundation*

### 4.1 Multi-factor Decision Framework (Medium Risk)
- Create decision support system with isolation from UI:
  - Implement confluence scoring for multiple signals
  - Add timeframe alignment verification
  - Create decision confidence calculation
  - Test with historical data scenarios

### 4.2 Advanced Chart Annotations (Low Risk)
- Enhance chart visualization with signal overlay:
  - Add signal markers to candlestick chart
  - Implement support/resistance visualization
  - Create pattern highlighting on chart

### 4.3 Entry/Exit Tools (Medium Risk)
- Build trade execution assistance components:
  - Create entry zone visualization
  - Add dynamic stop-loss calculator based on volatility
  - Implement take-profit ladder with R:R ratios

## 5. Performance & Production Readiness
*Optimizing and validating the system*

### 5.1 Performance Optimization (Low Risk)
- Apply targeted optimization techniques:
  - Add memoization for expensive calculations
  - Implement component-level code splitting
  - Add request batching and throttling
  - Profile and optimize critical render paths

### 5.2 Backtesting Engine (Medium Risk)
- Build isolated backtesting functionality:
  - Create historical data replay system
  - Implement performance metrics calculation
  - Add parameter optimization capabilities
  - Test with known historical scenarios

### 5.3 Production Hardening (Low Risk)
- Apply final resilience improvements:
  - Add comprehensive error handling
  - Implement graceful degradation paths
  - Create monitoring and diagnostics
  - Test under various failure conditions

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

11.3 Create `app/api/macro-context/route.ts` — DONE
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
