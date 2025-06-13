# Bitdash Lite

Minimal Bitcoin BUY decision dashboard with low compute and code.

## Setup

```bash
npm install
npm run dev
```

## Application Management

### Automatic Shutdown

The server automatically shuts down when you close the browser tab or window (development mode only). This prevents orphaned Node.js processes.

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

## API Usage Limits & Best Practices

This document outlines the specific API rate limits, usage policies, and strategic recommendations for the external services used in this Bitcoin Trading Dashboard. Adhering to these guidelines is crucial for application stability, performance, and avoiding service interruptions or bans.

### Golden Rule
All API calls that require a secret key should be proxied through our Next.js backend (`/app/api/...`). This protects our secret keys, prevents CORS issues, and allows us to implement a centralized caching layer to stay within rate limits. Never expose a secret API key on the client-side.

### General Best Practices

- **Backend Proxy is Mandatory**: Do not use NEXT_PUBLIC_ prefixed keys for services with sensitive rate limits or secret keys. Route all calls through a backend API route.
- **Aggressive Caching**: Implement a caching strategy (in-memory, Redis, etc.) on our backend for any data that doesn't need to be real-time (e.g., historical data, social sentiment).
- **Graceful Degradation**: If an API call fails due to rate-limiting (429 Too Many Requests), the UI should handle it gracefully (e.g., show "Data temporarily unavailable") instead of crashing.
- **Exponential Backoff**: When a 429 error is received, implement an exponential backoff strategy for retries. Many APIs provide a Retry-After header indicating how long to wait.

### API-Specific Limitations

#### 1. Binance API
Binance limits requests to **1200 per minute**. The `/api/candles` route caches responses for 60 seconds, so the app stays well below this limit.

#### 2. Gemini API

- **Public**: 120 requests/minute (Per IP Address) - For unauthenticated endpoints (e.g., tickers).
- **Private**: 600 requests/minute (Per API Key) - For authenticated endpoints (e.g., trading).
- **Strategy**: This is a generous rate limit, making Gemini a reliable primary source for real-time market data if needed, though WebSockets are preferred for candlestick data.

#### 3. Financial Modeling Prep (FMP)

- **Free**: 250 requests/day (Per API Key)
- **Paid Plans**: 300-750 requests/minute (Per API Key)
- **Strategy**: The free tier's limit is extremely restrictive. Use FMP only for fetching data that rarely changes, with aggressive caching (24 hours).

#### 4. Alpha Vantage

- **Free**: 25 requests/day (Per API Key)
- **Premium**: 75-1200 calls/minute (depending on tier)
- **Strategy**: Not recommended for core dashboard functionality due to severe free tier limitations.

#### 5. Polygon.io

- **Free**: 5 API calls/minute, 1 WebSocket Connection (Max 2 symbols)
- **Strategy**: Best used for fetching data on a slow polling interval (15-20 seconds) or for WebSocket connections managed on the server.

#### 6. FRED (Federal Reserve Economic Data)

- **Limit**: 120 requests/minute (Per API Key)
- **Strategy**: Very generous limit for macroeconomic data that updates infrequently. Cache aggressively (once per day).

#### 7. LunarCrush

- **Free**: 25 requests/hour (Last 3 months of data)
- **Strategy**: Create a backend endpoint that fetches and caches data for 5-10 minutes to stay within limits.

### Summary of API Limits

| API Provider | Free Tier Limit | Time Frame | Recommendation |
|--------------|----------------|------------|----------------|
| Binance | 1200 reqs/min | Minute | GOOD: Primary data source with caching |
| Gemini | 600 reqs/min (Private) | Minute | GOOD: Backup real-time data |
| FRED | 120 reqs/min | Minute | GOOD: Macroeconomic data (cache daily) |
| Polygon.io | 5 reqs/min | Minute | OK: Supplementary data, WebSocket stream |
| LunarCrush | 25 reqs/hour | Hour | OK: Social sentiment (cache for 5-10 mins) |
| FMP | 250 reqs/day | Day | LIMITED: One-time data loads (24h cache) |
| Alpha Vantage | 25 reqs/day | Day | NOT RECOMMENDED: Too limited |

## Macro Context API

The `/api/macro-context` route provides a compact snapshot of key U.S. macroeconomic indicators. Results are cached for 24 hours to minimize requests to the FRED API.

Example:

```bash
curl http://localhost:3000/api/macro-context
```

Response

```json
{
  "updated": 1710000000000,
  "data": {
    "fedFundsRate": { "date": "2024-05-01", "value": 5.25, "change": 0.25, "trend": "up" },
    "cpi": { "date": "2024-05-01", "value": 300.1, "change": 1.0, "trend": "up" },
    "unemployment": { "date": "2024-05-01", "value": 3.9, "change": 0.1, "trend": "up" }
  },
  "insights": {
    "fedFunds": "Rates rising",
    "inflation": "Inflation increasing",
    "employment": "Job market weakening"
  }
}
```

Use these metrics for additional trading context alongside technical signals.
