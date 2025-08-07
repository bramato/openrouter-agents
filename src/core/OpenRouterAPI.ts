import { OpenRouterModel, ModelCategory } from '../types/api.js';

export class OpenRouterAPI {
  private baseURL = 'https://openrouter.ai/api/v1';

  async fetchAvailableModels(jsonOnly: boolean = false): Promise<OpenRouterModel[]> {
    try {
      const response = await fetch(`${this.baseURL}/models`);

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      let models = data.data || [];

      if (jsonOnly) {
        models = this.filterJsonCapableModels(models);
      }

      return models;
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      return this.getFallbackModels(jsonOnly);
    }
  }

  private filterJsonCapableModels(models: OpenRouterModel[]): OpenRouterModel[] {
    // Models known to support JSON mode based on OpenRouter docs
    const jsonCapablePatterns = [
      /^openai\//, // All OpenAI models
      /^gpt-/, // GPT models
      /^nitro/, // Nitro models
      /^anthropic\/claude-3/, // Claude 3 models support JSON
      /^google\/gemini/, // Gemini models
    ];

    return models.filter(model => {
      // Check if model ID matches known JSON-capable patterns
      const isKnownJsonCapable = jsonCapablePatterns.some(pattern => pattern.test(model.id));

      // Also check if model explicitly supports json_object in generation methods
      const hasJsonSupport = model.supported_generation_methods?.includes('json_object') ?? false;

      return isKnownJsonCapable || hasJsonSupport;
    });
  }

  async fetchImageGenerationModels(): Promise<OpenRouterModel[]> {
    try {
      const response = await fetch(`${this.baseURL}/models`);

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      let models = data.data || [];

      // Filter for image generation capable models
      models = this.filterImageGenerationModels(models);

      return models;
    } catch (error) {
      console.error('Error fetching image generation models:', error);
      return this.getFallbackImageModels();
    }
  }

  private filterImageGenerationModels(models: OpenRouterModel[]): OpenRouterModel[] {
    // Models known to support image generation
    const imageGenerationPatterns = [
      /flux/i, // FLUX models
      /dall-e/i, // DALL-E models
      /stable-diffusion/i, // Stable Diffusion
      /midjourney/i, // Midjourney
      /imagen/i, // Google Imagen
    ];

    return models.filter(model => {
      // Check if model supports image generation based on architecture
      const isImageModel =
        model.architecture?.modality?.includes('image') ||
        model.architecture?.modality === 'text->image';

      // Check if model ID matches known image generation patterns
      const isKnownImageModel = imageGenerationPatterns.some(
        pattern => pattern.test(model.id) || pattern.test(model.name || '')
      );

      // Check if model has image pricing
      const hasImagePricing = model.pricing?.image !== undefined;

      return isImageModel || isKnownImageModel || hasImagePricing;
    });
  }

  getFallbackImageModels(): OpenRouterModel[] {
    return [
      {
        id: 'openrouter/horizon-beta',
        name: 'Horizon Beta',
        description: 'Free multimodal model for image generation',
        pricing: { prompt: '0', completion: '0', image: '0' },
        context_length: 256000,
        architecture: { modality: 'text->image', tokenizer: 'Horizon' },
        top_provider: {},
        supported_generation_methods: ['image_generation'],
      },
    ];
  }

  formatModelForDisplay(model: OpenRouterModel): string {
    const price = parseFloat(model.pricing.prompt);
    let priceStr: string;

    if (price === 0) {
      priceStr = 'Free';
    } else if (price < 0.0001) {
      priceStr = `$${(price * 1000000).toFixed(2)}/1M tokens`;
    } else if (price < 0.001) {
      priceStr = `$${(price * 1000).toFixed(2)}/1k tokens`;
    } else {
      priceStr = `$${price.toFixed(3)}/1k tokens`;
    }

    const contextK = Math.floor(model.context_length / 1000);

    return `${model.name || model.id} (${contextK}k context, ${priceStr})`;
  }

  getFallbackModels(jsonOnly: boolean = false): OpenRouterModel[] {
    const allFallbacks = [
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        description: 'Most intelligent model - JSON capable',
        pricing: { prompt: '0.003', completion: '0.015' },
        context_length: 200000,
        architecture: { modality: 'text', tokenizer: 'Claude' },
        top_provider: {},
        supported_generation_methods: ['json_object'],
      },
      {
        id: 'openai/gpt-4.1-nano',
        name: 'GPT-4.1 Nano',
        description: 'Fastest and cheapest GPT-4.1 model - JSON capable',
        pricing: { prompt: '0.000100', completion: '0.000400' },
        context_length: 1047576,
        architecture: { modality: 'text', tokenizer: 'GPT' },
        top_provider: {},
        supported_generation_methods: ['json_object'],
      },
      {
        id: 'anthropic/claude-3-haiku',
        name: 'Claude 3 Haiku',
        description: 'Fast and cost-effective - JSON capable',
        pricing: { prompt: '0.00025', completion: '0.00125' },
        context_length: 200000,
        architecture: { modality: 'text', tokenizer: 'Claude' },
        top_provider: {},
        supported_generation_methods: ['json_object'],
      },
      {
        id: 'meta-llama/llama-3.1-8b-instruct:free',
        name: 'Llama 3.1 8B Instruct (Free)',
        description: 'Free open-source model',
        pricing: { prompt: '0', completion: '0' },
        context_length: 131072,
        architecture: { modality: 'text', tokenizer: 'Llama' },
        top_provider: {},
        supported_generation_methods: [],
      },
    ];

    return jsonOnly ? this.filterJsonCapableModels(allFallbacks) : allFallbacks;
  }

  async getModelsByCategory(): Promise<ModelCategory[]> {
    const models = await this.fetchAvailableModels();
    
    const categories: ModelCategory[] = [
      {
        name: 'Recommended',
        description: 'High-quality models with good performance/cost ratio',
        models: models.filter(m => 
          m.id.includes('claude-3.5-sonnet') || 
          m.id.includes('gpt-4') ||
          m.id.includes('gemini-pro')
        ).slice(0, 5)
      },
      {
        name: 'JSON Capable',
        description: 'Models that support structured JSON output',
        models: this.filterJsonCapableModels(models).slice(0, 10)
      },
      {
        name: 'Free Models',
        description: 'Free models for testing and light usage',
        models: models.filter(m => parseFloat(m.pricing.prompt) === 0).slice(0, 5)
      },
      {
        name: 'Image Generation',
        description: 'Models capable of generating images',
        models: await this.fetchImageGenerationModels()
      }
    ];

    return categories.filter(cat => cat.models.length > 0);
  }

  async checkModelAvailability(modelId: string): Promise<boolean> {
    try {
      const models = await this.fetchAvailableModels();
      return models.some(model => model.id === modelId);
    } catch (error) {
      console.error('Error checking model availability:', error);
      return false;
    }
  }
}