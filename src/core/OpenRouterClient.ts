import { OpenRouterConfig, ServiceType } from '../types/index.js';
import { APIRequest, APIResponse, APIError } from '../types/api.js';

export class OpenRouterClient {
  private config: OpenRouterConfig;
  private serviceType: ServiceType;

  constructor(config: OpenRouterConfig, serviceType: ServiceType = 'custom') {
    this.config = config;
    this.serviceType = serviceType;
  }

  private getModelForService(): string {
    // Check for service-specific model first
    const serviceKey = this.getServiceKey();
    const serviceModelKey = `OPENROUTER_${serviceKey}_MODEL`;
    const serviceModel = process.env[serviceModelKey];

    if (serviceModel) {
      return serviceModel;
    }

    // Fall back to default model
    if (process.env.OPENROUTER_DEFAULT_MODEL) {
      return process.env.OPENROUTER_DEFAULT_MODEL;
    }

    // Finally, use the config model or hardcoded default
    return this.config.model;
  }

  private getServiceKey(): string {
    switch (this.serviceType) {
      case 'mockGenerator':
        return 'MOCK_GENERATOR';
      case 'codeGenerator':
        return 'CODE_GENERATOR';
      case 'translation':
        return 'TRANSLATION';
      case 'documentation':
        return 'DOCUMENTATION';
      default:
        return 'DEFAULT';
    }
  }

  private supportsJsonMode(modelId: string): boolean {
    // Models known to support JSON mode based on OpenRouter docs
    const jsonCapablePatterns = [
      /^openai\//, // All OpenAI models
      /^gpt-/, // GPT models
      /^nitro/, // Nitro models
      /^anthropic\/claude-3/, // Claude 3 models support JSON
      /^google\/gemini/, // Gemini models
    ];

    return jsonCapablePatterns.some(pattern => pattern.test(modelId));
  }

  async generate(
    prompt: string,
    options?: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      forceJson?: boolean;
      model?: string;
    }
  ): Promise<string> {
    try {
      const model = options?.model || this.getModelForService();
      const systemPrompt = options?.systemPrompt || this.getSystemPromptForService(options?.forceJson);
      const temperature = options?.temperature ?? this.getTemperatureForService();
      const maxTokens = options?.maxTokens ?? this.getMaxTokensForService();

      const requestBody: APIRequest = {
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
      };

      // Force JSON output for compatible models
      if (options?.forceJson && this.supportsJsonMode(model)) {
        requestBody.response_format = { type: 'json_object' };
      }

      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/bramato/openrouter-agents',
          'X-Title': `OpenRouter Agents ${this.serviceType}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as APIError;
        throw new Error(
          `OpenRouter API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
        );
      }

      const data = (await response.json()) as APIResponse;
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(
        `Failed to generate with ${this.serviceType}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private getSystemPromptForService(forceJson: boolean = false): string {
    switch (this.serviceType) {
      case 'mockGenerator':
        if (forceJson) {
          return 'You are a mock data generator. Generate realistic mock data based on the provided schema and examples. You MUST return only valid JSON. Do not include any markdown formatting, code blocks, or explanations. The response must be parseable JSON.';
        }
        return 'You are a mock data generator. Generate realistic mock data based on the provided schema and examples. Return only valid JSON without markdown formatting or explanations.';
      case 'codeGenerator':
        return 'You are a code generator assistant. Generate clean, well-structured code following best practices. Include appropriate comments and follow the existing code style.';
      case 'translation':
        return 'You are a translation assistant. Translate text accurately while preserving technical terms and context. Return only the translated text without explanations.';
      case 'documentation':
        return 'You are a documentation assistant. Create clear, comprehensive documentation that is well-structured and easy to understand. Include examples where appropriate.';
      default:
        return 'You are an AI assistant. Provide helpful and accurate responses.';
    }
  }

  private getTemperatureForService(): number {
    switch (this.serviceType) {
      case 'mockGenerator':
        return 0.7; // More creative for varied data
      case 'codeGenerator':
        return 0.3; // More deterministic for code
      case 'translation':
        return 0.1; // Very consistent for translations
      case 'documentation':
        return 0.4; // Balanced for clear documentation
      default:
        return 0.5;
    }
  }

  private getMaxTokensForService(): number {
    const model = this.getModelForService();

    // Check model-specific limits and set appropriate max_tokens
    if (model.includes('claude-3')) {
      // Claude 3 models have high context windows, use generous token limits
      return this.getTokenLimitByService(8000, 4000);
    } else if (model.includes('gpt-4')) {
      // GPT-4 models
      return this.getTokenLimitByService(6000, 3000);
    } else if (model.includes('gpt-3.5')) {
      // GPT-3.5 has lower limits
      return this.getTokenLimitByService(3000, 2000);
    } else if (model.includes('gemini')) {
      // Gemini models
      return this.getTokenLimitByService(7000, 3500);
    }

    // Default conservative limit
    return this.getTokenLimitByService(4000, 2000);
  }

  private getTokenLimitByService(highLimit: number, defaultLimit: number): number {
    switch (this.serviceType) {
      case 'mockGenerator':
        return highLimit; // High limit for mock data generation
      case 'codeGenerator':
        return Math.floor(highLimit * 0.75); // Moderate limit for code
      case 'translation':
        return Math.floor(defaultLimit * 0.75); // Lower limit for translations
      case 'documentation':
        return highLimit; // High limit for comprehensive docs
      default:
        return defaultLimit;
    }
  }

  setServiceType(serviceType: ServiceType): void {
    this.serviceType = serviceType;
  }

  getServiceType(): ServiceType {
    return this.serviceType;
  }

  updateConfig(config: Partial<OpenRouterConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): OpenRouterConfig {
    return { ...this.config };
  }

  static getDefaultConfig(): OpenRouterConfig {
    return {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseURL: 'https://openrouter.ai/api/v1',
      model: process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-3.5-sonnet',
    };
  }
}