import { OpenRouterClient } from './OpenRouterClient.js';
import { 
  AgentConfig, 
  AgentType, 
  AgentRequest, 
  AgentResponse, 
  AgentCapabilities,
  BaseAgent 
} from '../types/index.js';

export abstract class Agent extends BaseAgent {
  protected client: OpenRouterClient;

  constructor(config: AgentConfig) {
    super(config);
    this.client = new OpenRouterClient(config.openRouter, this.mapAgentTypeToServiceType());
  }

  private mapAgentTypeToServiceType() {
    switch (this.config.type) {
      case 'mock-data':
        return 'mockGenerator';
      case 'code-generator':
        return 'codeGenerator';
      case 'translator':
        return 'translation';
      case 'documentation':
        return 'documentation';
      default:
        return 'custom';
    }
  }

  abstract getType(): AgentType;
  abstract getCapabilities(): AgentCapabilities;
  abstract getSystemPrompt(): string;
  
  async process(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      // Validate input
      if (!this.validateInput(request.input)) {
        return {
          success: false,
          error: 'Invalid input provided',
          metadata: this.createMetadata(startTime, 0)
        };
      }

      // Get processing options
      const options = this.getProcessingOptions(request.options);
      
      // Generate response using OpenRouter client
      const rawResponse = await this.client.generate(
        this.formatPrompt(request.input),
        options
      );

      // Format and validate output
      const formattedOutput = this.formatOutput(rawResponse);
      
      return {
        success: true,
        data: formattedOutput,
        metadata: this.createMetadata(startTime, rawResponse.length)
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: this.createMetadata(startTime, 0)
      };
    }
  }

  protected getProcessingOptions(requestOptions?: any) {
    return {
      systemPrompt: requestOptions?.systemPrompt || this.getSystemPrompt(),
      temperature: requestOptions?.temperature ?? this.config.temperature,
      maxTokens: requestOptions?.maxTokens ?? this.config.maxTokens,
      forceJson: requestOptions?.forceJson ?? this.config.features?.jsonMode,
      model: requestOptions?.model || this.config.model
    };
  }

  protected formatPrompt(input: any): string {
    if (typeof input === 'string') {
      return input;
    }
    
    if (typeof input === 'object') {
      return JSON.stringify(input, null, 2);
    }
    
    return String(input);
  }

  private createMetadata(startTime: number, tokensUsed: number) {
    return {
      model: this.config.model || this.config.openRouter.model,
      tokensUsed,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      agentType: this.getType()
    };
  }

  protected abstract validateInput(input: any): boolean;
  protected abstract formatOutput(output: any): any;

  // Utility methods for agents
  protected parseJson(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error(`Failed to parse JSON output: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected cleanJsonString(jsonString: string): string {
    // Remove markdown code blocks if present
    const cleaned = jsonString
      .replace(/^```json\s*/gm, '')
      .replace(/^```\s*/gm, '')
      .replace(/```$/gm, '')
      .trim();
    
    return cleaned;
  }

  protected validateJsonSchema(data: any, schema: any): boolean {
    // Basic schema validation - can be extended with more sophisticated validation
    if (!schema) return true;
    
    try {
      // This is a simplified validation - in production you might want to use a library like Joi or Zod
      return typeof data === typeof schema || Array.isArray(data) === Array.isArray(schema);
    } catch (error) {
      return false;
    }
  }

  // Configuration management
  updateConfig(updates: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Update client if OpenRouter config changed
    if (updates.openRouter) {
      this.client.updateConfig(updates.openRouter);
    }
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  // Agent information
  getName(): string {
    return this.config.name;
  }

  getDescription(): string {
    return this.config.description || `${this.getType()} agent`;
  }

  // Performance and debugging
  async benchmark(testCases: any[], iterations: number = 1): Promise<{
    averageTime: number;
    successRate: number;
    errors: string[];
  }> {
    const results: { success: boolean; time: number; error?: string }[] = [];
    
    for (let i = 0; i < iterations; i++) {
      for (const testCase of testCases) {
        const startTime = Date.now();
        try {
          const response = await this.process({ input: testCase });
          results.push({
            success: response.success,
            time: Date.now() - startTime,
            error: response.error
          });
        } catch (error) {
          results.push({
            success: false,
            time: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    const successfulResults = results.filter(r => r.success);
    const errors = results.filter(r => !r.success).map(r => r.error || 'Unknown error');

    return {
      averageTime: results.reduce((sum, r) => sum + r.time, 0) / results.length,
      successRate: (successfulResults.length / results.length) * 100,
      errors: [...new Set(errors)] // Remove duplicates
    };
  }
}