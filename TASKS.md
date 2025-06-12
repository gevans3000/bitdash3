# TASKS — Bitdash Lite (Granular)

Goal: supply real-time 5-min BTC data to the existing **Next.js** dashboard with **minimal code & compute** — no additional servers, queues or databases.

---

## 1 · API Route (server-side only)

1.1 Create `app/api/candles/route.ts` (Next.js 13 App Router)
  • GET → JSON array of 100 latest 5-min BTC/USDT candles.
  • Source: Binance public REST
    `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=100`
  • Map to `{ time, open, high, low, close, volume }` matching `src/lib/types.ts`.

1.2 Add **Next.js caching** (`export const revalidate = 60;`) so the route calls Binance ≤1/min.

1.3 Return `502 { error: "upstream_unavailable" }` on fetch failure.

---

## 2 · Utility Helpers

2.1 Create `src/lib/binance.ts` → `getBinanceCandles(limit = 100)`
  • Reusable fetch + mapping logic used by the API route and tests.

2.2 Add lightweight in-memory rate check (throw if called <5 s apart in dev) to avoid accidental loops.

---

## 3 · Frontend Adjustments

3.1 Update `useAutoRefresh` interval in `app/page.tsx` to **60 000 ms** (matches API cache).

3.2 If `/api/candles` returns error, display "Data unavailable — retrying" banner (already handled by existing error UI, just ensure message).

---

## 4 · Testing

4.1 Add Jest test `__tests__/binance.test.ts`
  • Mock `fetch` and assert transformer returns 100 candles with correct keys.

4.2 Add Jest test `__tests__/indicators.test.ts` (already exists) to include a quick check that RSI function handles <15 candles without throwing.

---

## 5 · CI / Docs

5.1 Add `.env.example` with optional `BINANCE_BASE_URL` (default already hard-coded).

5.2 Update `README.md` → add "npm run test" step (already present) and note Binance rate limit 1200 req/min; our cache stays far below.

5.3 Create `.github/workflows/ci.yml` running `npm ci`, `npm test`, `next lint`.

---

That’s it — no databases, no back-end frameworks, no additional compute.
