/**
 * Client-side utility for graceful server shutdown
 * Only active in development mode for safety
 */

// Only register in browser environment
if (typeof window !== 'undefined') {
  // Function to attempt server shutdown
  const attemptShutdown = async () => {
    try {
      // Only run in development mode
      if (process.env.NODE_ENV !== 'development') return;
      
      // Make request to shutdown endpoint
      await fetch('/api/shutdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Use keepalive to ensure the request completes even if the page is unloading
        keepalive: true,
      });
      
      console.log('Shutdown request sent to server');
    } catch (error) {
      console.error('Failed to send shutdown request:', error);
    }
  };

  // Register shutdown events
  window.addEventListener('beforeunload', attemptShutdown);
  
  // Also handle tab close event
  window.addEventListener('unload', attemptShutdown);
}

export {};
