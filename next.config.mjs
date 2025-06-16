import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import { parse } from 'url';
import { WebSocketServer } from 'ws';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, dev }) => {
    // Enable WebSocket in development
    if (dev && !isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        // Enable polling for WebSocket
        poll: 1000,
        // Don't ignore node_modules for WebSocket
        ignored: ['node_modules/**', '.git/**'],
      };
    }
    return config;
  },
  // Disable React StrictMode for WebSocket connections
  reactStrictMode: false,
  // Enable WebSocket support in development
  experimental: {
    serverComponentsExternalPackages: ['ws'],
  },
};

// In development, we need to handle WebSocket upgrade requests
if (process.env.NODE_ENV === 'development') {
  console.log('Setting up WebSocket server for development...');
  
  // Use dynamic import to handle ESM modules
  (async () => {
    try {
      // Import the WebSocket handler dynamically
      const { wssHandler } = await import('./src/app/api/binance-ws/route.js');
      
      // Create HTTP server for WebSocket
      const server = createServer((req, res) => {
        const { pathname } = parse(req.url || '');
        
        // Handle WebSocket upgrade requests
        if (pathname === '/api/binance-ws') {
          if (req.method === 'GET' && req.headers.upgrade === 'websocket') {
            wssHandler.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
              wssHandler.emit('connection', ws, req);
            });
          } else {
            res.writeHead(200).end('OK');
          }
        } else {
          res.writeHead(200).end('OK');
        }
      });
      
      // Start listening on a different port than Next.js
      const PORT = 3001;
      server.listen(PORT, () => {
        console.log(`WebSocket server listening on ws://localhost:${PORT}/api/binance-ws`);
      });
      
      // Handle server errors
      server.on('error', (error) => {
        console.error('WebSocket server error:', error);
      });
      
      // Handle process termination
      process.on('SIGTERM', () => {
        console.log('Shutting down WebSocket server...');
        server.close(() => {
          console.log('WebSocket server closed');
          process.exit(0);
        });
      });
      
    } catch (error) {
      console.error('Failed to start WebSocket server:', error);
    }
  })();
}

export default nextConfig;
