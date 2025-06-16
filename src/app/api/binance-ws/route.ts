import { NextRequest, NextResponse } from 'next/server';
import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';

// Create a WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket) => {
  console.log('New WebSocket connection');
  
  // Handle messages from client
  ws.on('message', (message: string) => {
    console.log('Received:', message);
    // Echo the message back to the client
    ws.send(`Echo: ${message}`);
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

export const dynamic = 'force-dynamic';

export const wssHandler = wss;

export function GET(request: NextRequest) {
  // Check if this is a WebSocket upgrade request
  const { searchParams } = new URL(request.url);
  const upgradeHeader = request.headers.get('upgrade');
  
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
    return new NextResponse('Expected WebSocket upgrade', { status: 426 });
  }
  
  // Return a response that will be handled by Next.js WebSocket upgrade handler
  return new NextResponse(null, {
    status: 101,
    statusText: 'Switching Protocols',
    headers: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
    },
  });
}

// Handle WebSocket upgrades in development
if (process.env.NODE_ENV === 'development') {
  console.log('WebSocket route initialized in development mode');
}
