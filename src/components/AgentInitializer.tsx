'use client';

import { useEffect } from 'react';
// Import agent singletons to ensure their constructors run and they register with the orchestrator
// import { dataCollectorAgent } from '@/lib/agents/DataCollector'; // Original DataCollector, now disabled by commenting out its instance export
import { indicatorEngineAgent } from '@/lib/agents/IndicatorEngine';
import { signalGeneratorAgent } from '@/lib/agents/SignalGenerator';
import { uiAdapter } from '@/lib/agents/UIAdapter';
import { orchestrator } from '@/lib/agents/Orchestrator';

/**
 * Component that initializes all required agents when mounted.
 * Should be placed high in the app component tree.
 */
export function AgentInitializer() {
  useEffect(() => {
    console.log('AgentInitializer: Mounted, initializing agents...');
    
    // DataCollectorAgent initialization is now deferred until MAN MANUAL_DATA_REFRESH_REQUEST (main refresh button).
    // We will still send REQUEST_INITIAL_DATA, and DataCollectorAgent will respond if it's already been initialized.
    // const initializeDataCollector = async () => { // Entire block commented out or removed
    //   try {
    //     console.log('AgentInitializer: Initializing DataCollector...');
    //     // await dataCollectorAgent.ensureInitialized(); // REMOVED - This was causing auto-init
    //     console.log('AgentInitializer: DataCollector initialization deferred.');
    //
    //     // Request initial data - DataCollector will only respond if already initialized by manual refresh
    //     console.log('AgentInitializer: Requesting initial data (DataCollector will respond if ready)...');
    //     orchestrator.send({
    //       from: 'AgentInitializer',
    //       type: 'REQUEST_INITIAL_DATA',
    //       payload: {},
    //       timestamp: Date.now()
    //     });
    //   } catch (error) {
    //     // This catch block might not be hit anymore if ensureInitialized is not called.
    //     console.error('AgentInitializer: Error during deferred DataCollector setup:', error);
    //   }
    // };
    // initializeDataCollector(); // REMOVED

    // Still send REQUEST_INITIAL_DATA. DataCollectorAgent's handleInitialDataRequest
    // will be modified to only send data if it's already initialized.
    console.log('AgentInitializer: Requesting initial data (DataCollector will respond if/when initialized by user action)...');
    orchestrator.send({
      from: 'AgentInitializer',
      type: 'REQUEST_INITIAL_DATA',
      payload: {},
      timestamp: Date.now()
    });
    
    // Cleanup function
    return () => {
      console.log('AgentInitializer: Cleaning up...');
      // Any cleanup if needed
    };
  }, []);

  // This component doesn't render anything
  return null;
}
