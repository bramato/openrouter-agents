export interface OpenRouterConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

export interface AgentConfig {
  name: string;
  type: AgentType;
  description?: string;
  openRouter: OpenRouterConfig;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  features?: AgentFeatures;
}

export interface AgentFeatures {
  jsonMode?: boolean;
  imageGeneration?: boolean;
  schemaValidation?: boolean;
  batchProcessing?: boolean;
  sessionMemory?: boolean;
}

export interface GlobalConfig {
  openRouter: OpenRouterConfig;
  agents: Record<string, AgentConfig>;
  preferences: UserPreferences;
  version: string;
}

export interface UserPreferences {
  outputFormat: 'json' | 'yaml' | 'text';
  verboseLogging: boolean;
  autoSave: boolean;
  theme: 'light' | 'dark' | 'auto';
  editor: string;
}

export type AgentType = 
  | 'mock-data'
  | 'code-generator'
  | 'translator'
  | 'documentation'
  | 'custom';

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}