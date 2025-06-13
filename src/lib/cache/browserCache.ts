/**
 * Browser Cache Utility
 * Handles client-side caching with localStorage and IndexedDB fallback
 * Provides standardized methods for storing and retrieving data with expiration
 */

// Cache entry with metadata
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  source?: string;
}

// Cache options
export interface CacheOptions {
  /** Cache key prefix - will be prefixed to all keys */
  prefix?: string;
  /** Default expiration time in milliseconds */
  defaultTTL?: number;
  /** Force using IndexedDB even for small items */
  forceIndexedDB?: boolean;
  /** Size threshold in bytes to switch to IndexedDB */
  indexedDBThreshold?: number;
}

/**
 * Browser cache utility for storing and retrieving data
 * Automatically uses localStorage for smaller data and IndexedDB for larger data
 */
export class BrowserCache {
  private prefix: string;
  private defaultTTL: number;
  private indexedDBThreshold: number;
  private forceIndexedDB: boolean;
  private dbName = 'bitdash_cache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;
  private dbSupported = true;

  /**
   * Create a new BrowserCache instance
   * @param options Cache configuration options
   */
  constructor(options: CacheOptions = {}) {
    this.prefix = options.prefix || 'bitdash_';
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes default
    this.indexedDBThreshold = options.indexedDBThreshold || 100 * 1024; // 100KB default
    this.forceIndexedDB = options.forceIndexedDB || false;
    
    // Initialize IndexedDB if supported
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.initDB();
    } else {
      this.dbSupported = false;
      console.warn('IndexedDB not supported in this browser, falling back to localStorage only');
    }
  }

  /**
   * Initialize IndexedDB
   */
  private initDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        try {
          const request = indexedDB.open(this.dbName, this.dbVersion);
          
          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('cache')) {
              db.createObjectStore('cache');
            }
          };
          
          request.onsuccess = (event) => {
            this.db = (event.target as IDBOpenDBRequest).result;
            resolve(this.db);
          };
          
          request.onerror = (event) => {
            this.dbSupported = false;
            console.error('IndexedDB error:', event);
            reject(new Error('Failed to open IndexedDB'));
          };
        } catch (error) {
          this.dbSupported = false;
          console.error('Error initializing IndexedDB:', error);
          reject(error);
        }
      });
    }
    
    return this.dbPromise;
  }

  /**
   * Store data in the cache
   * @param key Cache key
   * @param data Data to store
   * @param ttl Time-to-live in milliseconds
   */
  async set<T>(key: string, data: T, ttl = this.defaultTTL, source?: string): Promise<void> {
    const now = Date.now();
    const prefixedKey = this.prefix + key;
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      source
    };
    
    try {
      const serialized = JSON.stringify(entry);
      
      // Use IndexedDB for large data or if forced
      if ((this.forceIndexedDB || serialized.length > this.indexedDBThreshold) && this.dbSupported) {
        await this.setInIndexedDB(prefixedKey, entry);
      } else {
        // Use localStorage for smaller data
        localStorage.setItem(prefixedKey, serialized);
      }
    } catch (error) {
      console.error(`Failed to cache ${key}:`, error);
      // If localStorage is full, try to clear some space
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.pruneExpiredEntries();
      }
    }
  }

  /**
   * Store data in IndexedDB
   */
  private async setInIndexedDB<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    if (!this.dbSupported) return;
    
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const request = store.put(entry, key);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to store data in IndexedDB'));
      });
    } catch (error) {
      console.error('IndexedDB set error:', error);
    }
  }

  /**
   * Get data from cache
   * @param key Cache key
   * @param fallbackData Optional fallback data if not in cache
   * @returns The cached data or null if not found/expired
   */
  async get<T>(key: string, fallbackData: T | null = null): Promise<CacheEntry<T> | null> {
    const prefixedKey = this.prefix + key;
    const now = Date.now();
    
    try {
      // First check localStorage
      const localData = localStorage.getItem(prefixedKey);
      if (localData) {
        const entry = JSON.parse(localData) as CacheEntry<T>;
        
        // Check if expired
        if (entry.expiresAt > now) {
          return entry;
        } else {
          // Clean up expired data
          localStorage.removeItem(prefixedKey);
        }
      }
      
      // Then check IndexedDB if supported
      if (this.dbSupported) {
        const entry = await this.getFromIndexedDB<T>(prefixedKey);
        if (entry && entry.expiresAt > now) {
          return entry;
        }
      }
      
      // Return fallback if provided
      if (fallbackData !== null) {
        return {
          data: fallbackData,
          timestamp: now,
          expiresAt: now, // Expired immediately
          source: 'fallback'
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error retrieving from cache [${key}]:`, error);
      
      // Return fallback if provided
      if (fallbackData !== null) {
        return {
          data: fallbackData,
          timestamp: now,
          expiresAt: now,
          source: 'error-fallback'
        };
      }
      
      return null;
    }
  }

  /**
   * Get data from IndexedDB
   */
  private async getFromIndexedDB<T>(key: string): Promise<CacheEntry<T> | null> {
    if (!this.dbSupported) return null;
    
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        const request = store.get(key);
        
        request.onsuccess = () => {
          resolve(request.result as CacheEntry<T> || null);
        };
        
        request.onerror = () => {
          reject(new Error('Failed to get data from IndexedDB'));
        };
      });
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return null;
    }
  }

  /**
   * Remove item from cache
   * @param key Cache key
   */
  async remove(key: string): Promise<void> {
    const prefixedKey = this.prefix + key;
    
    try {
      localStorage.removeItem(prefixedKey);
      
      if (this.dbSupported) {
        await this.removeFromIndexedDB(prefixedKey);
      }
    } catch (error) {
      console.error(`Failed to remove cached item ${key}:`, error);
    }
  }

  /**
   * Remove item from IndexedDB
   */
  private async removeFromIndexedDB(key: string): Promise<void> {
    if (!this.dbSupported) return;
    
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const request = store.delete(key);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to remove data from IndexedDB'));
      });
    } catch (error) {
      console.error('IndexedDB remove error:', error);
    }
  }

  /**
   * Check if item exists in cache and is not expired
   * @param key Cache key
   * @returns True if valid cache entry exists
   */
  async has(key: string): Promise<boolean> {
    const entry = await this.get(key);
    return entry !== null;
  }

  /**
   * Get cache item freshness (how recent it is)
   * @param key Cache key
   * @returns Age of cache entry in milliseconds, or -1 if not found
   */
  async getFreshness(key: string): Promise<number> {
    const entry = await this.get(key);
    if (!entry) return -1;
    return Date.now() - entry.timestamp;
  }

  /**
   * Get time until expiration
   * @param key Cache key
   * @returns Milliseconds until expiration, or -1 if expired or not found
   */
  async getTimeToExpiration(key: string): Promise<number> {
    const entry = await this.get(key);
    if (!entry) return -1;
    return Math.max(0, entry.expiresAt - Date.now());
  }

  /**
   * Remove all expired entries from storage
   */
  async pruneExpiredEntries(): Promise<void> {
    const now = Date.now();
    
    // Clean localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const entry = JSON.parse(data);
              if (entry.expiresAt && entry.expiresAt < now) {
                localStorage.removeItem(key);
              }
            } catch (e) {
              // Invalid JSON, remove it
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning localStorage:', error);
    }
    
    // Clean IndexedDB
    if (this.dbSupported) {
      try {
        const db = await this.initDB();
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const request = store.openCursor();
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
          if (cursor) {
            const entry = cursor.value as CacheEntry<unknown>;
            if (entry.expiresAt < now) {
              cursor.delete();
            }
            cursor.continue();
          }
        };
      } catch (error) {
        console.error('Error cleaning IndexedDB:', error);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    // Clear localStorage entries with our prefix
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    
    // Clear IndexedDB
    if (this.dbSupported) {
      try {
        const db = await this.initDB();
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const request = store.clear();
        
        await new Promise<void>((resolve, reject) => {
          request.onsuccess = () => resolve();
          request.onerror = () => reject();
        });
      } catch (error) {
        console.error('Error clearing IndexedDB:', error);
      }
    }
  }
}

// Create a default instance for the app
export const browserCache = new BrowserCache();

// Cache retrieval with auto-refresh pattern
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    ttl?: number;
    source?: string;
    forceRefresh?: boolean;
    maxAge?: number;
  } = {}
): Promise<{ data: T, fromCache: boolean, age: number }> {
  const { ttl = 300000, forceRefresh = false, maxAge = 0, source } = options;
  
  // Try to get from cache first unless forced refresh
  if (!forceRefresh) {
    const cached = await browserCache.get<T>(key);
    
    // Return if valid and not too old
    if (cached && (!maxAge || Date.now() - cached.timestamp <= maxAge)) {
      return {
        data: cached.data,
        fromCache: true,
        age: Date.now() - cached.timestamp
      };
    }
  }
  
  // Fetch fresh data
  try {
    const data = await fetchFn();
    
    // Store in cache
    await browserCache.set(key, data, ttl, source);
    
    return {
      data,
      fromCache: false,
      age: 0
    };
  } catch (error) {
    // If fetch fails, try to return possibly stale cache as fallback
    const cached = await browserCache.get<T>(key);
    if (cached) {
      console.warn(`Fetch failed, returning stale cache for ${key}`);
      return {
        data: cached.data,
        fromCache: true,
        age: Date.now() - cached.timestamp
      };
    }
    
    // No cache fallback available
    throw error;
  }
}
