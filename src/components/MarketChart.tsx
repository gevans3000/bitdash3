'use client';
import { useEffect } from 'react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TradingView: any;
  }
}

export default function MarketChart() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.onload = () => init();
      document.body.appendChild(script);
    } else {
      init();
    }

    function init() {
      new window.TradingView.widget({
        symbol: 'BTCUSDT',
        interval: '5',
        container_id: 'tv-chart',
        width: '100%',
        height: 400,
        studies: [
          'BB@tv-basicstudies',
          'VWAP@tv-basicstudies',
          'RSI@tv-basicstudies',
          'IchimokuCloud@tv-basicstudies',
        ],
        hide_top_toolbar: false,
        hide_legend: false,
        theme: 'dark',
        style: '1',
        timezone: 'Etc/UTC',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        save_image: false,
      });
    }
    
    return () => {
      // Clean up if needed
      const chartContainer = document.getElementById('tv-chart');
      if (chartContainer) {
        chartContainer.innerHTML = '';
      }
    };
  }, []);

  return <div id="tv-chart" className="w-full h-[400px]" />;
}
