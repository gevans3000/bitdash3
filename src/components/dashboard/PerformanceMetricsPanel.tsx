'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import PerformanceMetrics with no SSR since it uses browser APIs
const PerformanceMetrics = dynamic(
  () => import('@/components/PerformanceMetrics'),
  { ssr: false, loading: () => <div className="p-4 text-sm text-gray-500">Loading performance data...</div> }
);

const PerformanceMetricsPanel: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Performance Metrics</h3>
      <PerformanceMetrics />
    </div>
  );
};

export default PerformanceMetricsPanel;
