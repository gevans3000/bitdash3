// src/hooks/useAppState.ts
import { useState, useEffect } from 'react';
import { uiAdapter } from '@/lib/agents/UIAdapter';
import { AppState } from '@/lib/agents/types';

export function useAppState() {
  const [appState, setAppState] = useState<AppState>(() => uiAdapter.getState());

  useEffect(() => {
    const unsub = uiAdapter.subscribe(setAppState);
    return unsub;
  }, []);

  return appState;
}
