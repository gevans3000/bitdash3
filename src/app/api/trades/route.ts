import { NextResponse } from 'next/server';
import { Trade } from '@/lib/types';
import fs from 'fs';
import path from 'path';

// Set revalidation for 5 seconds to minimize API calls while keeping data fresh
export const revalidate = 5;

const CACHE_DIR = path.join(process.cwd(), '.cache');
const TRADES_CACHE_FILE = path.join(CACHE_DIR, 'trades.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create cache directory:', e);
  }
}

/**
 * GET handler for recent trades data
 * - Fetches from Binance API
 * - Implements caching for fallback
 * - Supports limit parameter (default: 50)
 */
export async function GET(request: Request) {
  // Parse URL parameters
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit') || '50';
  // Limit between 1-1000, default 50
  const limit = Math.min(1000, Math.max(1, parseInt(limitParam, 10) || 50));
  
  try {
    // Get recent trades from Binance
    const trades = await fetchRecentTrades(limit);
    
    // Cache the data for fallback
    await saveTradesCache(trades);
    
    return NextResponse.json(trades);
  } catch (err) {
    console.error('Failed to fetch recent trades data', err);
    
    // Try to fetch from cache as fallback
    const cachedData = loadTradesCache();
    if (cachedData) {
      console.log(`Using cached trades data from ${new Date(cachedData.timestamp).toISOString()}`);
      return NextResponse.json(cachedData.trades);
    }
    
    // If no cache, generate synthetic trades data
    const syntheticData = generateSyntheticTrades(limit);
    return NextResponse.json(syntheticData);
  }
}

/**
 * Fetch recent trades from Binance API
 */
async function fetchRecentTrades(limit: number): Promise<Trade[]> {
  const baseUrl = process.env.BINANCE_BASE_URL ?? 'https://api.binance.com/api/v3';
  const url = `${baseUrl}/trades?symbol=BTCUSDT&limit=${limit}`;
  
  const response = await fetch(url);
  
  // Log rate limit headers in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Binance API Response Headers:');
    for (const [name, value] of response.headers.entries()) {
      if (name.toLowerCase().startsWith('x-mbx-used-weight-') || 
          name.toLowerCase().startsWith('x-mbx-order-count-')) {
        console.log(`  ${name}: ${value}`);
      }
    }
  }
  
  if (!response.ok) {
    const status = response.status;
    const retryAfter = response.headers.get('Retry-After');
    
    try {
      const errorBodyText = await response.text();
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`Binance API Error: Status ${status}, Body: ${errorBodyText}`);
        
        if (status === 429 || status === 418) {
          console.error(`Rate limit exceeded. Retry-After: ${retryAfter || 'N/A'} seconds.`);
        }
      }
      
      throw new Error(`fetch_failed: Status ${status}. Body: ${errorBodyText}`);
    } catch (e) {
      if (status === 429 || status === 418) {
        throw new Error(`fetch_failed_rate_limit: Status ${status}, Retry-After: ${retryAfter || 'N/A'}.`);
      }
      throw new Error(`fetch_failed: Status ${status}.`);
    }
  }
  
  const rawTrades = await response.json();
  
  return rawTrades.map((trade: any) => ({
    id: trade.id,
    price: parseFloat(trade.price),
    qty: parseFloat(trade.qty),
    time: trade.time,
    isBuyerMaker: trade.isBuyerMaker
  }));
}

/**
 * Save trades data to cache
 */
async function saveTradesCache(trades: Trade[]): Promise<void> {
  try {
    const cacheData = {
      timestamp: Date.now(),
      trades
    };
    fs.writeFileSync(TRADES_CACHE_FILE, JSON.stringify(cacheData), 'utf8');
  } catch (e) {
    console.error('Failed to save trades to cache:', e);
  }
}

/**
 * Load trades data from cache
 */
function loadTradesCache(): { timestamp: number; trades: Trade[] } | null {
  try {
    if (fs.existsSync(TRADES_CACHE_FILE)) {
      const data = fs.readFileSync(TRADES_CACHE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load trades from cache:', e);
  }
  return null;
}

/**
 * Generate synthetic trades data as a fallback
 * - Used when API and cache both fail
 * - Creates realistic-looking trades
 */
function generateSyntheticTrades(count: number): Trade[] {
  const trades: Trade[] = [];
  const basePrice = 35000 + (Math.random() * 5000);
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    // Generate somewhat realistic price
    const priceVariation = (Math.random() - 0.5) * 20; // +/- $10
    const price = basePrice + priceVariation;
    
    // Generate trade size (typically 0.001 BTC to 0.5 BTC)
    const qty = 0.001 + (Math.random() * 0.499);
    
    // Generate timestamp (within last 5 minutes)
    const timeOffset = i * (5 * 60 * 1000 / count); // Spread evenly across 5 minutes
    const time = now - timeOffset;
    
    // Randomly determine if buyer is maker
    const isBuyerMaker = Math.random() > 0.5;
    
    trades.push({
      id: now - i, // Unique ID
      price,
      qty,
      time,
      isBuyerMaker
    });
  }
  
  return trades;
}
