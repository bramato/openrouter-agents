import { AgentConfig, AgentType } from './config';

export interface AgentRequest {
  input: any;
  options?: AgentRequestOptions;
}

export interface AgentRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  forceJson?: boolean;
  schema?: any;
  context?: Record<string, any>;
  sessionId?: string;
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata: AgentResponseMetadata;
}

export interface AgentResponseMetadata {
  model: string;
  tokensUsed: number;
  processingTime: number;
  timestamp: string;
  agentType: AgentType;
  sessionId?: string;
}

export interface AgentCapabilities {
  jsonMode: boolean;
  imageGeneration: boolean;
  batchProcessing: boolean;
  streamingSupport: boolean;
  contextMemory: boolean;
  schemaValidation: boolean;
}

export interface BenchmarkResult {
  agentType: AgentType;
  model: string;
  averageResponseTime: number;
  successRate: number;
  tokenEfficiency: number;
  qualityScore: number;
  testCases: number;
  errors: string[];
}

export interface SessionData {
  id: string;
  agentType: AgentType;
  messages: SessionMessage[];
  createdAt: string;
  lastActivity: string;
  metadata: Record<string, any>;
}

export interface SessionMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AgentPlugin {
  name: string;
  version: string;
  description: string;
  supportedTypes: AgentType[];
  hooks: {
    beforeProcess?: (input: any, options?: AgentRequestOptions) => Promise<any>;
    afterProcess?: (response: AgentResponse) => Promise<AgentResponse>;
    onError?: (error: Error, context: any) => Promise<void>;
  };
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  
  constructor(config: AgentConfig) {
    this.config = config;
  }
  
  abstract getType(): AgentType;
  abstract getCapabilities(): AgentCapabilities;
  abstract getSystemPrompt(): string;
  abstract process(request: AgentRequest): Promise<AgentResponse>;
  
  protected abstract validateInput(input: any): boolean;
  protected abstract formatOutput(output: any): any;
}