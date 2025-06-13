# TASKS — Bitdash Pro (Granular)

Goal: Create an advanced, institutional-grade Bitcoin trading intelligence dashboard with **minimal code & compute** — using Next.js, React, and TypeScript without requiring additional servers, queues, or databases when possible.

---

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

Implementation Note: Prioritize tasks based on core functionality and gradually enhance with advanced features. Maintain minimal compute principles by leveraging browser capabilities, efficient data structures, and smart caching strategies. When implementing API calls, always adhere to the rate limits documented in the README.md file.

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
