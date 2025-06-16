import { Server } from 'ws';

// In-memory store for WebSocket clients
const clients = new Set<WebSocket>();
let binanceWs: WebSocket | null = null;

// Connect to Binance WebSocket
function connectToBinance() {
  const symbol = 'btcusdt';
  const interval = '5m';
  const stream = `${symbol}@kline_${interval}`;
  const wsUrl = `wss://stream.binance.com:9443/ws/${stream}`;
  
  binanceWs = new WebSocket(wsUrl);
  
  binanceWs.on('open', () => {
    console.log('Connected to Binance WebSocket');
  });
  
  binanceWs.on('message', (data: WebSocket.Data) => {
    // Broadcast to all connected clients
    const message = data.toString();
    broadcast(message);
  });
  
  binanceWs.on('close', () => {
    console.log('Disconnected from Binance WebSocket');
    // Attempt to reconnect after a delay
    setTimeout(connectToBinance, 5000);
  });
  
  binanceWs.on('error', (error) => {
    console.error('Binance WebSocket error:', error);
  });
}

// Initialize Binance WebSocket connection
if (!binanceWs) {
  connectToBinance();
}

// Broadcast message to all connected clients
function broadcast(message: string) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Handle new WebSocket connections
export function handleWebSocket(ws: WebSocket) {
  // Add new client
  clients.add(ws);
  console.log('New client connected');
  
  // Handle client messages
  ws.on('message', (message) => {
    console.log('Received message from client:', message.toString());
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected');
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
}

// Cleanup function
export function cleanup() {
  if (binanceWs) {
    binanceWs.close();
    binanceWs = null;
  }
  
  // Close all client connections
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.close();
    }
  });
  
  clients.clear();
}
