// Re-export all types from submodules
export * from './config';
export * from './api';
export * from './agent';

// Common utility types
export type ServiceType = 'mockGenerator' | 'codeGenerator' | 'translation' | 'documentation' | 'custom';

export interface GenerationRequest {
  prompt: string;
  schema?: any;
  count?: number;
  options?: RequestOptions;
}

export interface RequestOptions {
  forceJson?: boolean;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  enableImageProcessing?: boolean;
  arrayPath?: string;
  preferences?: string;
}

export interface GenerationResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata: {
    tokensUsed: number;
    processingTime: number;
    model: string;
  };
}

export interface CLIOptions {
  verbose?: boolean;
  output?: string;
  format?: 'json' | 'yaml' | 'text';
  config?: string;
}

export interface CLICommand {
  name: string;
  description: string;
  aliases?: string[];
  options?: CLIOption[];
  examples?: string[];
  handler: (args: any, options: CLIOptions) => Promise<void>;
}

export interface CLIOption {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean';
  required?: boolean;
  default?: any;
}