import { NextResponse } from 'next/server';
import { OrderBookData } from '@/lib/types';
import fs from 'fs';
import path from 'path';

// Set revalidation for 10 seconds to avoid hitting API limits
export const revalidate = 10;

const CACHE_DIR = path.join(process.cwd(), '.cache');
const ORDERBOOK_CACHE_FILE = path.join(CACHE_DIR, 'orderbook.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create cache directory:', e);
  }
}

/**
 * GET handler for order book data
 * - Fetches from Binance API
 * - Implements caching for fallback
 * - Supports depth parameter (default: 100)
 */
export async function GET(request: Request) {
  // Parse URL parameters
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit') || '100';
  const limit = Math.min(5000, Math.max(5, parseInt(limitParam, 10) || 100)); // Between 5-5000, default 100
  
  try {
    // Get order book data from Binance
    const orderBook = await fetchOrderBook(limit);
    
    // Cache the data for fallback
    await saveOrderBookCache(orderBook);
    
    return NextResponse.json(orderBook);
  } catch (err) {
    console.error('Failed to fetch order book data', err);
    
    // Try to fetch from cache as fallback
    const cachedData = loadOrderBookCache();
    if (cachedData) {
      console.log(`Using cached order book data from ${new Date(cachedData.timestamp).toISOString()}`);
      return NextResponse.json(cachedData.data);
    }
    
    // If no cache, generate synthetic order book data
    const syntheticData = generateSyntheticOrderBook();
    return NextResponse.json(syntheticData);
  }
}

/**
 * Fetch order book data from Binance API
 */
async function fetchOrderBook(limit: number): Promise<OrderBookData> {
  const baseUrl = process.env.BINANCE_BASE_URL ?? 'https://api.binance.com/api/v3';
  const url = `${baseUrl}/depth?symbol=BTCUSDT&limit=${limit}`;
  
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
  
  const data = await response.json();
  return data as OrderBookData;
}

/**
 * Save order book data to cache
 */
async function saveOrderBookCache(data: OrderBookData): Promise<void> {
  try {
    const cacheData = {
      timestamp: Date.now(),
      data
    };
    fs.writeFileSync(ORDERBOOK_CACHE_FILE, JSON.stringify(cacheData), 'utf8');
  } catch (e) {
    console.error('Failed to save order book to cache:', e);
  }
}

/**
 * Load order book data from cache
 */
function loadOrderBookCache(): { timestamp: number; data: OrderBookData } | null {
  try {
    if (fs.existsSync(ORDERBOOK_CACHE_FILE)) {
      const data = fs.readFileSync(ORDERBOOK_CACHE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load order book from cache:', e);
  }
  return null;
}

/**
 * Generate synthetic order book data as a fallback
 * - Used when API and cache both fail
 * - Creates realistic-looking order book with bids and asks
 */
function generateSyntheticOrderBook(): OrderBookData {
  // Current approximate BTC price
  const basePrice = 35000 + (Math.random() * 5000);
  const bids: [string, string][] = [];
  const asks: [string, string][] = [];
  
  // Generate bids (lower than current price)
  for (let i = 0; i < 100; i++) {
    // Price decreases as we go down the order book
    const priceOffset = (i * 10) * (1 + (Math.random() * 0.3));
    const price = (basePrice - priceOffset).toFixed(2);
    
    // Volume generally decreases with distance from market price
    const volume = (1 / (1 + i * 0.05) * (0.8 + Math.random() * 0.4)).toFixed(6);
    
    bids.push([price, volume]);
  }
  
  // Generate asks (higher than current price)
  for (let i = 0; i < 100; i++) {
    // Price increases as we go up the order book
    const priceOffset = (i * 10) * (1 + (Math.random() * 0.3));
    const price = (basePrice + priceOffset).toFixed(2);
    
    // Volume generally decreases with distance from market price
    const volume = (1 / (1 + i * 0.05) * (0.8 + Math.random() * 0.4)).toFixed(6);
    
    asks.push([price, volume]);
  }
  
  return {
    lastUpdateId: Date.now(),
    bids,
    asks
  };
}
