// Export all core components
export * from './core/index.js';
export * from './types/index.js';

// Version information
export const version = '1.0.0';

// Default exports for convenience
export { OpenRouterClient as Client } from './core/OpenRouterClient.js';
export { OpenRouterAPI as API } from './core/OpenRouterAPI.js';
export { Agent } from './core/Agent.js';
export { AgentManager as Manager } from './core/AgentManager.js';