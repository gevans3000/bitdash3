import { NextRequest, NextResponse } from 'next/server';
import { Server } from 'ws';

declare global {
  var wss: Server | undefined;
}

// Create a WebSocket server if it doesn't exist
function getWss() {
  if (!global.wss) {
    console.log('Creating new WebSocket server');
    global.wss = new Server({ noServer: true });
    
    // Handle new connections
    global.wss.on('connection', (ws) => {
      console.log('New WebSocket connection');
      
      ws.on('message', (message) => {
        console.log('Received message:', message.toString());
      });
      
      ws.on('close', () => {
        console.log('WebSocket connection closed');
      });
    });
  }
  
  return global.wss;
}

export function withWebSocket(request: NextRequest) {
  const wss = getWss();
  
  // Check if this is a WebSocket upgrade request
  if (request.headers.get('upgrade') === 'websocket') {
    // This will be handled by the WebSocket server
    return new NextResponse(null, {
      status: 101,
      statusText: 'Switching Protocols',
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
      },
    });
  }
  
  // For non-WebSocket requests, continue with normal processing
  return NextResponse.next();
}
