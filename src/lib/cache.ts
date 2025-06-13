import fs from 'fs';
import path from 'path';
import type { Candle, TimeFrame } from './types';

const CACHE_DIR = path.join(process.cwd(), '.cache');

// Get cache file path for specific timeframe
const getCandlesCacheFilePath = (timeFrame: TimeFrame): string => {
  return path.join(CACHE_DIR, `candles_${timeFrame}.json`);
};

// Legacy cache file for backward compatibility
const CANDLES_CACHE_FILE = path.join(CACHE_DIR, 'candles.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create cache directory:', e);
  }
}

// Save candles to cache file with timeframe support
export async function saveCandles(candles: Candle[], timeFrame: TimeFrame = '5m'): Promise<void> {
  try {
    const data = {
      timestamp: Date.now(),
      timeFrame,
      candles
    };
    
    // Save to timeframe-specific file
    const cacheFile = getCandlesCacheFilePath(timeFrame);
    fs.writeFileSync(cacheFile, JSON.stringify(data), 'utf8');
    
    // For backwards compatibility, also save 5m to the legacy file
    if (timeFrame === '5m') {
      fs.writeFileSync(CANDLES_CACHE_FILE, JSON.stringify(data), 'utf8');
    }
  } catch (e) {
    console.error(`Failed to save ${timeFrame} candles to cache:`, e);
  }
}

// Load candles from cache file with timeframe support
export function loadCandles(timeFrame: TimeFrame = '5m'): { timestamp: number; timeFrame: TimeFrame; candles: Candle[] } | null {
  try {
    // Try loading from timeframe-specific cache first
    const cacheFile = getCandlesCacheFilePath(timeFrame);
    
    if (fs.existsSync(cacheFile)) {
      const data = fs.readFileSync(cacheFile, 'utf8');
      return JSON.parse(data);
    }
    
    // For backwards compatibility when loading 5m data
    if (timeFrame === '5m' && fs.existsSync(CANDLES_CACHE_FILE)) {
      const data = fs.readFileSync(CANDLES_CACHE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      // Add timeFrame if it doesn't exist in legacy cache
      if (!parsed.timeFrame) {
        parsed.timeFrame = '5m';
      }
      return parsed;
    }
  } catch (e) {
    console.error(`Failed to load ${timeFrame} candles from cache:`, e);
  }
  return null;
}

// Generate synthetic candles as a last resort, with timeframe support
export function generateSyntheticCandles(count = 100, timeFrame: TimeFrame = '5m'): Candle[] {
  const now = Math.floor(Date.now() / 1000);
  
  // Calculate interval in seconds based on timeframe
  const getIntervalSeconds = (tf: TimeFrame): number => {
    switch (tf) {
      case '1m': return 60;
      case '5m': return 5 * 60;
      case '15m': return 15 * 60;
      case '1h': return 60 * 60;
      default: return 5 * 60;
    }
  };
  
  const intervalSeconds = getIntervalSeconds(timeFrame);
  
  // Calculate volatility factor based on timeframe (higher timeframes = more volatility)
  const getVolatilityFactor = (tf: TimeFrame): number => {
    switch (tf) {
      case '1m': return 0.005; // 0.5%
      case '5m': return 0.01;  // 1%
      case '15m': return 0.015; // 1.5%
      case '1h': return 0.02;  // 2%
      default: return 0.01;
    }
  };
  
  const volatility = getVolatilityFactor(timeFrame);
  
  // Start with a reasonable Bitcoin price
  let lastClose = 35000 + Math.random() * 5000;
  
  const candles: Candle[] = [];
  
  for (let i = 0; i < count; i++) {
    const time = now - (count - i - 1) * intervalSeconds;
    
    // Generate somewhat realistic price movements scaled to the timeframe
    const changePercent = (Math.random() - 0.5) * volatility;
    const open = lastClose;
    const close = open * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * (volatility/2));
    const low = Math.min(open, close) * (1 - Math.random() * (volatility/2));
    
    // Scale volume based on timeframe
    const volumeBase = timeFrame === '1m' ? 2 : timeFrame === '5m' ? 10 : timeFrame === '15m' ? 30 : 100;
    const volumeRange = timeFrame === '1m' ? 5 : timeFrame === '5m' ? 20 : timeFrame === '15m' ? 50 : 150;
    const volume = volumeBase + Math.random() * volumeRange;
    
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
