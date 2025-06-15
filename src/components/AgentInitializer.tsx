'use client';

import { useEffect } from 'react';
import { dataCollectorAgent } from '@/lib/agents/DataCollector';
import { orchestrator } from '@/lib/agents/Orchestrator';

/**
 * Component that initializes all required agents when mounted.
 * Should be placed high in the app component tree.
 */
export function AgentInitializer() {
  useEffect(() => {
    console.log('AgentInitializer: Mounted, initializing agents...');
    
    // Initialize the DataCollector agent
    const initializeDataCollector = async () => {
      try {
        console.log('AgentInitializer: Initializing DataCollector...');
        await dataCollectorAgent.ensureInitialized();
        console.log('AgentInitializer: DataCollector initialized successfully');
        
        // Request initial data
        console.log('AgentInitializer: Requesting initial data...');
        orchestrator.send({
          from: 'AgentInitializer',
          type: 'REQUEST_INITIAL_DATA',
          payload: {},
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('AgentInitializer: Failed to initialize DataCollector:', error);
      }
    };
    
    initializeDataCollector();
    
    // Cleanup function
    return () => {
      console.log('AgentInitializer: Cleaning up...');
      // Any cleanup if needed
    };
  }, []);

  // This component doesn't render anything
  return null;
}
