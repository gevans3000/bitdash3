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
  serverExternalPackages: ['ws'],
};


export default nextConfig;
