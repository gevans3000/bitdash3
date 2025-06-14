import { withCache, browserCache } from './browserCache';
import { monitorFetch } from '../api/data-health';

export interface SmartFetchOptions {
  ttl?: number;
  maxAge?: number;
  strategy?: 'network-first' | 'cache-first';
  source?: string;
}

export async function smartFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: SmartFetchOptions = {}
): Promise<{ data: T; fromCache: boolean; age: number }> {
  const { ttl = 60000, maxAge = 0, strategy = 'network-first', source = 'api' } = options;
  const online = typeof navigator === 'undefined' || navigator.onLine;

  const monitoredFetch = () => monitorFetch(source, fetchFn());

  if (strategy === 'cache-first' || !online) {
    return withCache(key, monitoredFetch, { ttl, maxAge, source });
  }

  try {
    return await withCache(key, monitoredFetch, { ttl, maxAge, source, forceRefresh: true });
  } catch {
    return withCache(key, monitoredFetch, { ttl, maxAge, source });
  }
}

export { browserCache };
