'use client';

import React, { useEffect, useCallback } from 'react';
import { BasicCandleChart } from '@/components/BasicCandleChart';
import { useCandleData } from '@/hooks/useCandleData';

// Simple error boundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <h3 className="text-red-800 font-medium">Chart Error</h3>
          <p className="text-red-700 text-sm mt-1">
            There was an error displaying the chart. Please try refreshing the page.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Format time for display
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: true 
  });
};

export default function ChartPage() {
  console.log('ChartPage: Rendering...');
  const { 
    candles, 
    isLoading, 
    error, 
    isConnected, 
    lastUpdate 
  } = useCandleData();
  
  const [connectionStatus, setConnectionStatus] = React.useState<{
    connected: boolean;
    message: string;
    lastUpdate: Date | null;
  }>({ 
    connected: false, 
    message: 'Connecting...', 
    lastUpdate: null 
  });
  
  // Update connection status when isConnected changes
  useEffect(() => {
    setConnectionStatus(prev => ({
      ...prev,
      connected: isConnected,
      message: isConnected ? 'Connected to data feed' : 'Disconnected from data feed',
      lastUpdate: new Date()
    }));
  }, [isConnected]);
  
  // Log state changes for debugging
  useEffect(() => {
    console.log('ChartPage: State updated', { 
      candleCount: candles.length, 
      isLoading, 
      error: error?.substring(0, 100),
      isConnected,
      lastUpdate: lastUpdate?.toISOString()
    });
  }, [candles, isLoading, error, isConnected, lastUpdate]);

  const handleRetry = () => {
    window.location.reload();
  };

  // Connection status indicator component
  const ConnectionStatus = () => {
    const [timeAgo, setTimeAgo] = React.useState<string>('');
    
    // Update time ago every second
    useEffect(() => {
      if (!connectionStatus.lastUpdate) return;
      
      const update = () => {
        if (!connectionStatus.lastUpdate) return '';
        const seconds = Math.floor((Date.now() - connectionStatus.lastUpdate.getTime()) / 1000);
        
        if (seconds < 10) return 'just now';
        if (seconds < 60) return `${seconds}s ago`;
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        return connectionStatus.lastUpdate?.toLocaleDateString();
      };
      
      setTimeAgo(update());
      const interval = setInterval(() => setTimeAgo(update()), 1000);
      return () => clearInterval(interval);
    }, [connectionStatus.lastUpdate]);
    
    return (
      <div className="flex items-center space-x-2">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          connectionStatus.connected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          <span className={`w-2 h-2 rounded-full mr-2 ${
            connectionStatus.connected ? 'bg-green-500' : 'bg-yellow-500'
          }`}></span>
          {connectionStatus.message}
          {timeAgo && (
            <span className="ml-2 text-xs opacity-70">
              {timeAgo}
            </span>
          )}
        </div>
        {candles.length > 0 && lastUpdate && (
          <div className="text-xs text-gray-500">
            {candles.length} candles • Updated {formatTime(lastUpdate.getTime())}
          </div>
        )}
      </div>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Bitcoin Price Chart</h1>
            <ConnectionStatus />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-[600px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">
                {connectionStatus.connected ? 'Loading historical data...' : 'Connecting to data source...'}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {connectionStatus.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Bitcoin Price Chart</h1>
            <ConnectionStatus />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 h-[600px] flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">
                {connectionStatus.connected ? 'Data Loading Error' : 'Connection Error'}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {connectionStatus.connected 
                  ? `Failed to load chart data: ${error}`
                  : `Cannot connect to data source: ${connectionStatus.message}`}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show chart with data
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Bitcoin Price Chart</h1>
          <div className="flex items-center space-x-2">
            <ConnectionStatus />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-[600px]">
          <div className="flex justify-between items-center mb-2 text-xs text-gray-500">
            <span>Status: {isConnected ? 'Connected' : 'Connecting...'}</span>
            <span>Candles: {candles.length}</span>
            {candles.length > 0 && (
              <span>Latest: {new Date(candles[candles.length - 1].time).toLocaleTimeString()}</span>
            )}
          </div>
          
          <ErrorBoundary>
            <div className="h-[calc(100%-24px)] w-full">
              {candles.length > 0 ? (
                <BasicCandleChart candles={candles} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
            </div>
          </ErrorBoundary>
          
          {/* Debug info - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-500 overflow-auto max-h-20">
              <div>Last update: {new Date().toISOString()}</div>
              <div>Candles: {candles.length}</div>
              {candles.length > 0 && (
                <div>
                  First: {new Date(candles[0].time).toISOString()} - Last: {new Date(candles[candles.length - 1].time).toISOString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
