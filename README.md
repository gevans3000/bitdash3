# Bitdash Lite

Minimal Bitcoin BUY decision dashboard.

## Setup

```bash
npm install
npm run dev
```

## Tests

```bash
npm run test
```

## Binance API

Binance limits requests to **1200 per minute**. The `/api/candles` route caches
responses for 60 seconds, so the app stays well below this limit.
