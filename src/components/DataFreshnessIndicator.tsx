'use client';

import { useEffect, useState } from 'react';
import { BrowserCache } from '@/lib/cache/browserCache';

interface DataFreshnessIndicatorProps {
  lastUpdated: number | null;
  dataSource?: string;
  cacheKey?: string;
  browserCache?: BrowserCache;
  className?: string;
}

/**
 * Component that displays the freshness status of data and its source
 */
export default function DataFreshnessIndicator({
  lastUpdated,
  dataSource = 'unknown',
  cacheKey,
  browserCache,
  className = ''
}: DataFreshnessIndicatorProps) {
  const [age, setAge] = useState<number>(0);
  const [status, setStatus] = useState<'fresh' | 'recent' | 'stale' | 'old' | 'unknown'>('unknown');
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Update the freshness status when lastUpdated changes
    if (lastUpdated) {
      updateFreshness(lastUpdated);
      
      // Set up interval to update the time status
      const interval = setInterval(() => {
        updateFreshness(lastUpdated);
      }, 10000); // Update every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [lastUpdated]);
  
  // Check cache details if browser cache instance and key are provided
  useEffect(() => {
    if (browserCache && cacheKey) {
      const checkCache = async () => {
        const freshness = await browserCache.getFreshness(cacheKey);
        const ttl = await browserCache.getTimeToExpiration(cacheKey);
        
        // Update attributes with the cache info
        if (freshness > 0) {
          setAge(freshness);
          updateStatusByAge(freshness);
        }
      };
      
      checkCache();
    }
  }, [browserCache, cacheKey]);
  
  const updateFreshness = (timestamp: number) => {
    const now = Date.now();
    const ageMs = now - timestamp;
    setAge(ageMs);
    updateStatusByAge(ageMs);
    setTimeSinceUpdate(formatTimeSince(ageMs));
  };
  
  const updateStatusByAge = (ageMs: number) => {
    if (ageMs < 30000) { // 30 seconds
      setStatus('fresh');
    } else if (ageMs < 120000) { // 2 minutes
      setStatus('recent');
    } else if (ageMs < 600000) { // 10 minutes
      setStatus('stale');
    } else {
      setStatus('old');
    }
  };
  
  const formatTimeSince = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };
  
  const getStatusColor = () => {
    switch (status) {
      case 'fresh': return 'bg-green-500';
      case 'recent': return 'bg-blue-500';
      case 'stale': return 'bg-yellow-500';
      case 'old': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getSourceBadge = () => {
    switch (dataSource) {
      case 'binance': return 'bg-yellow-800 text-yellow-200';
      case 'coingecko': return 'bg-blue-800 text-blue-200';
      case 'mock': return 'bg-red-800 text-red-200';
      default: return 'bg-gray-700 text-gray-300';
    }
  };
  
  const toggleExpanded = () => setIsExpanded(!isExpanded);
  
  return (
    <div 
      className={`flex flex-col text-xs ${className}`}
      onClick={toggleExpanded}
    >
      <div className="flex items-center cursor-pointer">
        <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor()}`}></div>
        <span className="mr-1">{timeSinceUpdate || 'Unknown'}</span>
        <span className={`px-1 py-0.5 text-2xs rounded ${getSourceBadge()}`}>
          {dataSource}
        </span>
      </div>
      
      {isExpanded && (
        <div className="mt-1 ml-4 text-2xs text-gray-400">
          <div>Last update: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Unknown'}</div>
          <div>Status: {status}</div>
          <div>Age: {formatTimeSince(age)}</div>
        </div>
      )}
    </div>
  );
}
