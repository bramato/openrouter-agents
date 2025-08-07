// Export all core components
export * from './core/index';
export * from './types/index';

// Version information
export const version = '1.2.3';

// Default exports for convenience
export { OpenRouterClient as Client } from './core/OpenRouterClient';
export { OpenRouterAPI as API } from './core/OpenRouterAPI';
export { Agent } from './core/Agent';
export { AgentManager as Manager } from './core/AgentManager';