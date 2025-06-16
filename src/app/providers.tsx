'use client';

import { ReactNode } from 'react';
import { AlertManager } from '@/components/AlertManager';
import { useSignalNotifications } from '@/hooks/useSignalNotifications';
import { AgentInitializer } from '@/components/AgentInitializer';

// Directly import agent singletons here to ensure their constructors run
// This is a more forceful way to ensure they are initialized if AgentInitializer component has issues.
import '@/lib/agents/UIAdapter'; // uiAdapter is used by useAppState, likely already loaded
import '@/lib/agents/IndicatorEngine'; // Ensures indicatorEngineAgent instance is created
import '@/lib/agents/SignalGenerator'; // Ensures signalGeneratorAgent instance is created
// The DataCollectorAgent is intentionally not imported here as it's disabled.

/**
 * Providers component that wraps the application with client-side providers
 */
export function Providers({ children }: { children: ReactNode }) {
  // Initialize the notifications system
  const { processSignals } = useSignalNotifications({
    soundEnabled: true,
    maxNotifications: 50,
    autoProcess: true,
  });

  // In a real app, you would connect this to your signal generation system
  // For now, we'll just set up the provider
  
  return (
    <>
      <AgentInitializer />
      {children}
      <AlertManager position="top-right" />
    </>
  );
}
