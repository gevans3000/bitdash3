# AGENTS.md – Bitcoin 5-Minute Trading Logic

**Project:** Windsurf – Bitcoin 5‑Minute Trading Dashboard

## Trading Rules for BTC/USDT (5-Minute Timeframe)

1. **EMA-10 / EMA-50 Crossover**
   - **Bullish Entry:** Enter long when EMA-10 crosses above EMA-50.
   - **Bearish Entry:** Enter short when EMA-10 crosses below EMA-50.

2. **Bollinger Bands + RSI**
   - **Overbought/Exit Signal:** If RSI > 72 *and* price is above the upper Bollinger Band, consider exiting longs or entering short.
   - **Oversold/Entry Signal:** If RSI < 28 *and* price is below the lower Bollinger Band, consider exiting shorts or entering long.

3. **Volume Confirmation**
   - Only act on a crossover or band signal if current 5-min volume ≥ 1.5 × 20-period SMA of volume.

4. **Cooldown Logic**
   - After any trade (long or short), wait at least 15 minutes (3 bars) before taking the next position in the same direction.

5. **Risk Controls**
   - Use stop loss at 0.8% from entry price.
   - Take profit target at 2% from entry.
   - If after 6 bars (30 minutes) position is not closed, move stop loss to breakeven.

## Configuration

- **Candle timeframe:** 5 minutes
- **EMA lengths:** 10, 50
- **Bollinger Bands:** 20-period, ±2 standard deviations
- **RSI length:** 14
- **Volume SMA:** 20 periods

## Example Trade Workflow

1. **Wait** for EMA-10 to cross EMA-50 *and* volume confirmation.
2. **Check** RSI and Bollinger Band for potential exit or contrary signal.
3. **If all conditions met**, place trade, set stop loss and take profit.
4. **After trade closes**, record timestamp, do not enter same-direction trade for 15 minutes.

---

**End of AGENTS.md**
