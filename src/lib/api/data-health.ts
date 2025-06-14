export interface ApiStats {
  latencySamples: number[];
  errorCount: number;
  requestCount: number;
  lastError?: number;
}

const metrics: Record<string, ApiStats> = {};

export function recordApiCall(service: string, latency: number, success = true) {
  const stat = metrics[service] || (metrics[service] = { latencySamples: [], errorCount: 0, requestCount: 0 });
  stat.requestCount++;
  stat.latencySamples.push(latency);
  if (!success) {
    stat.errorCount++;
    stat.lastError = Date.now();
  }
  // Limit samples to last 50
  if (stat.latencySamples.length > 50) stat.latencySamples.shift();
}

export function getApiStats(service: string) {
  const stat = metrics[service];
  if (!stat) return null;
  const avgLatency = stat.latencySamples.reduce((a, b) => a + b, 0) / stat.latencySamples.length;
  const errorRate = stat.requestCount > 0 ? stat.errorCount / stat.requestCount : 0;
  return { avgLatency, errorRate, lastError: stat.lastError };
}

export async function monitorFetch<T>(service: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const res = await fn();
    recordApiCall(service, performance.now() - start, true);
    return res;
  } catch (err) {
    recordApiCall(service, performance.now() - start, false);
    throw err;
  }
}
