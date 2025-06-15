# BitDash3: Lean & Profitable 5-Minute Bitcoin Signal Dashboard

BitDash3 is designed to provide clear, actionable signals for Bitcoin (BTC/USDT) trading on the 5-minute chart. Its primary goal is to help users identify potentially profitable trading opportunities by focusing on a lean set of core indicators and a responsive, event-driven architecture.

## Setup

```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or your configured port) in your browser.

## Core Architecture: Event-Driven Agents

BitDash3 utilizes an **agent-based, event-driven architecture** to manage data flow and application logic. This approach enhances modularity, testability, and real-time responsiveness. Key components include:

*   **Orchestrator:** A central message bus that facilitates communication between agents.
*   **DataCollectorAgent:** Fetches historical candle data and subscribes to live Binance WebSocket for 5-minute BTC/USDT klines. Publishes candle data events.
*   **IndicatorEngineAgent:** Subscribes to closed candle events and calculates a core set of technical indicators (EMAs, RSI, Bollinger Bands, ATR, Average Volume). Publishes indicator data events.
*   **SignalGeneratorAgent:** Subscribes to indicator events. It determines market regime, applies confluence scoring logic, calculates trade parameters (Entry, SL, TP), and publishes the final trading signal (BUY/SELL/HOLD) with confidence and reasoning.
*   **UIAdapter:** Subscribes to various agent events and manages a centralized application state for the React UI. Provides a `useAppState` hook for components.

For a detailed explanation of each agent and the data flow, please refer to `AGENTS.md`. The development tasks for implementing this architecture are outlined in `TASKS.md`.

## Application Management

### Automatic Shutdown
In development mode (`npm run dev`), the Next.js server typically includes features for automatic shutdown or hot reloading when code changes are made.

### Manual Termination
If you need to manually terminate all Node.js instances:

#### Windows
```powershell
# Kill all Node.js processes
taskkill /F /IM node.exe
```

#### Mac/Linux
```bash
# Kill all Node.js processes
pkill -f node
```

## Tests

```bash
npm run test
```
Refer to `TASKS.md` for specific testing guidance related to the agent-based architecture and individual component functionalities.

## API Usage Limits & Best Practices

Adhering to API guidelines is crucial for application stability, performance, and avoiding service interruptions.

### Golden Rule for API Keys
**All API calls requiring a secret key MUST be proxied through Next.js backend API routes (e.g., in `/app/api/...`).** This protects secret keys, prevents CORS issues on the client-side, and allows for centralized caching and rate limit management. Never expose a secret API key directly in client-side code.

### General Best Practices

*   **Backend Proxy for Sensitive Calls:** This is mandatory for any service with sensitive rate limits or requiring secret keys.
*   **Caching Strategy:**
    *   **Live Data (Binance WebSocket):** The `DataCollectorAgent` handles live 5-minute candle data directly via WebSocket.
    *   **Historical Data (Binance API):** Initial historical candle fetches performed by `DataCollectorAgent` (e.g., for chart backfill using `/api/v3/klines`) should be routed through a Next.js API route if an API key is used. This backend route should implement caching (e.g., 1-5 minute cache for recent history, longer for older data) to minimize direct calls to Binance.
    *   **Other APIs (if used for supplementary data):** Any other external APIs for data like macroeconomic indicators or social sentiment must be called via backend proxies that implement aggressive caching appropriate to the data's update frequency.
*   **Graceful Degradation:** The application should handle API call failures or rate-limiting gracefully. For instance, the `DataFreshnessIndicator` component should visually reflect data issues based on events from the `DataCollectorAgent`.
*   **Exponential Backoff:** For proxied API calls that might be retried, implement an exponential backoff strategy if a 429 (Too Many Requests) error is received.

### API-Specific Limitations & Focus for BitDash3

The core 5-minute Bitcoin signal generation in BitDash3 relies primarily on **Binance** for candle data.

#### 1. **Binance API (Primary for Candles)**
*   **WebSocket (Live Data):** The `DataCollectorAgent` uses `wss://stream.binance.com:9443/ws/btcusdt@kline_5m` for real-time 5-minute klines. WebSocket connections have their own limits, generally related to connection count per IP, which are typically generous for a single client application.
*   **REST API (Historical Data & Other Endpoints):**
    *   Limits: Typically 1200 requests per minute per IP, or higher based on API key weight limits.
    *   **Strategy for BitDash3:**
        *   The `DataCollectorAgent` fetches initial historical 5-minute candles (e.g., using `/api/v3/klines`). If this fetch uses a Binance API key, it **must** be done through a dedicated Next.js API route (e.g., `/app/api/historical-candles`) that handles key management and caching. If no key is used (public endpoint access), direct fetching might be permissible but still benefits from caching if done via a backend route.
*   **Recommendation:** Binance is the **GOOD** and primary data source for both live (WebSocket) and historical (REST API) 5-minute candle data. Prioritize robust implementation of the `DataCollectorAgent`'s interaction with Binance.

#### 2. Other APIs (Supplementary - Use with Strict Caching via Backend)
The following APIs are listed for general awareness. If integrated for supplementary data (not core to the lean 5-minute signal), they **must** be called via backend proxies with aggressive caching to respect free-tier limits.
*   **Gemini API:** Public: 120 reqs/min. Private: 600 reqs/min. (Backup/Supplementary)
*   **FRED (Federal Reserve Economic Data):** Limit: 120 reqs/min. (Macro context, cache daily via backend, e.g., `/api/macro-context`)
*   **Polygon.io:** Free: 5 API calls/min. (Limited)
*   **LunarCrush (Social Sentiment):** Free: 25 reqs/hour. (Limited, cache 5-10 mins via backend)
*   **Financial Modeling Prep (FMP):** Free: 250 reqs/day. (Very limited, static data, cache 24h via backend)
*   **Alpha Vantage:** Free: 25 reqs/day. (**NOT RECOMMENDED** for core functionality)

### Summary Table of API Limits (General Reference)

| API Provider | Free Tier Limit        | Time Frame | BitDash3 Focus Recommendation             |
|--------------|------------------------|------------|-------------------------------------------|
| Binance      | 1200 reqs/min (REST)   | Minute     | **PRIMARY**: Candles (WebSocket + REST via cached backend route if keyed) |
| Gemini       | 600 reqs/min (Private) | Minute     | OK: Backup/Supplementary data (via backend) |
| FRED         | 120 reqs/min           | Minute     | OK: Macro context (cache daily via backend) |
| Polygon.io   | 5 reqs/min             | Minute     | LIMITED: Supplementary (via backend)      |
| LunarCrush   | 25 reqs/hour           | Hour       | LIMITED: Social sentiment (cache via backend) |
| FMP          | 250 reqs/day           | Day        | VERY LIMITED: Static data (cache 24h via backend) |
| Alpha Vantage| 25 reqs/day            | Day        | NOT RECOMMENDED                           |

---
## Notes on Existing API Routes

The project may contain pre-existing Next.js API routes. These should be reviewed in the context of the new agent-based architecture:

*   **`/app/api/candles/route.ts`**: If this route was used for fetching live or frequent candle data for the UI, its role will largely be superseded by the `DataCollectorAgent`'s direct WebSocket handling for live updates and its event-driven propagation of data to the UI via the `UIAdapter`. This route might be repurposed or used by the `DataCollectorAgent` *only* for its initial fetch of historical candles, especially if API key management and caching are implemented there.
*   **`/app/api/macro-context/route.ts`**: This route provides cached FRED data. For the lean dashboard, this can remain a separate utility. Its data can be displayed on the UI independently or, if macro context becomes a direct input to the `SignalGeneratorAgent` in the future, a new agent could be developed to consume this API route and publish relevant macro events.
*   **`/app/api/market-data/route.ts`**: This route aggregates various data points. Its functionality should be reviewed. If any data it provides (like Open Interest) is deemed critical for the 5-minute trading strategy, that specific data fetching should be integrated into an appropriate agent (e.g., `DataCollectorAgent` or a new specialized agent) and adhere to the event-driven pattern.

The `DataCollectorAgent` is central to the new architecture for providing the 5-minute candle data. All data fetching must strictly adhere to the API limits and best practices, prioritizing client-side WebSocket for live data and proxied, cached calls for historical or supplementary data.
