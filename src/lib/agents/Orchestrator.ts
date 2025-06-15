// src/lib/agents/Orchestrator.ts
import { AgentMessage, MessageHandler } from './types';

/**
 * Central message bus for agent communication
 * Follows publish-subscribe pattern to decouple components
 */
class OrchestratorService {
  private subscribers: Map<string, MessageHandler[]> = new Map();

  /**
   * Register a handler for a specific message type
   * @param messageType The message type to subscribe to
   * @param handler The callback function to handle the message
   * @returns Unsubscribe function to remove the handler
   */
  public register(messageType: string, handler: MessageHandler): () => void {
    if (!this.subscribers.has(messageType)) {
      this.subscribers.set(messageType, []);
    }
    
    const handlers = this.subscribers.get(messageType)!;
    handlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const updatedHandlers = this.subscribers.get(messageType)?.filter(h => h !== handler);
      if (updatedHandlers) {
        this.subscribers.set(messageType, updatedHandlers);
      }
    };
  }

  /**
   * Send a message to all subscribers of the message type
   * @param message The message to send
   */
  public send<T>(message: AgentMessage<T>): void {
    // Log the message for debugging
    console.log(`📬 Orchestrator: [${message.from}] sent [${message.type}]`, message.payload);
    
    const handlers = this.subscribers.get(message.type) || [];
    
    // Execute all handlers safely
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error(`Error in handler for ${message.type}:`, error);
      }
    });
  }
}

// Export a singleton instance
export const orchestrator = new OrchestratorService();
