'use client';

import LiveDashboard from '@/components/LiveDashboard';
import MarketChart from '@/components/MarketChart';
import { useState } from 'react';

export default function Page() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handleRefresh = () => {
    setRefreshTrigger(Date.now());
  };
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <h1 className="text-2xl font-bold text-center">BitDash Pro</h1>
          <button 
            onClick={handleRefresh} 
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Refresh Data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* TradingView Chart */}
        <div className="rounded-xl bg-white/5 p-4 shadow-lg">
          <MarketChart />
        </div>
        
        {/* Live Dashboard with WebSocket Data */}
        <LiveDashboard refreshTrigger={refreshTrigger} />
      </div>
    </main>
  );
}
