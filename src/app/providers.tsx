'use client';

import { ReactNode } from 'react';
import { AlertManager } from '@/components/AlertManager';
import { useSignalNotifications } from '@/hooks/useSignalNotifications';
import { AgentInitializer } from '@/components/AgentInitializer';

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
