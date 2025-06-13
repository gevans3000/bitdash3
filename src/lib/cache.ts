import fs from 'fs';
import path from 'path';
import type { Candle } from './types';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CANDLES_CACHE_FILE = path.join(CACHE_DIR, 'candles.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create cache directory:', e);
  }
}

// Save candles to cache file
export async function saveCandles(candles: Candle[]): Promise<void> {
  try {
    const data = {
      timestamp: Date.now(),
      candles
    };
    fs.writeFileSync(CANDLES_CACHE_FILE, JSON.stringify(data), 'utf8');
  } catch (e) {
    console.error('Failed to save candles to cache:', e);
  }
}

// Load candles from cache file
export function loadCandles(): { timestamp: number; candles: Candle[] } | null {
  try {
    if (fs.existsSync(CANDLES_CACHE_FILE)) {
      const data = fs.readFileSync(CANDLES_CACHE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load candles from cache:', e);
  }
  return null;
}

// Generate synthetic candles as a last resort
export function generateSyntheticCandles(count = 100): Candle[] {
  const now = Math.floor(Date.now() / 1000);
  const fiveMinutes = 5 * 60;
  
  // Start with a reasonable Bitcoin price
  let lastClose = 35000 + Math.random() * 5000;
  
  const candles: Candle[] = [];
  
  for (let i = 0; i < count; i++) {
    const time = now - (count - i - 1) * fiveMinutes;
    
    // Generate somewhat realistic price movements
    const changePercent = (Math.random() - 0.5) * 0.01; // -0.5% to +0.5%
    const open = lastClose;
    const close = open * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    const volume = 5 + Math.random() * 20; // Random volume between 5-25 BTC
    
    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume
    });
    
    lastClose = close;
  }
  
  return candles;
}
