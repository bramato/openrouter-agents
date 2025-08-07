export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
    image?: string;
    request?: string;
  };
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
  top_provider: {
    max_completion_tokens?: number;
    is_moderated?: boolean;
  };
  per_request_limits?: {
    prompt_tokens?: string;
    completion_tokens?: string;
  };
  supported_generation_methods?: string[];
}

export interface ModelCategory {
  name: string;
  description: string;
  models: OpenRouterModel[];
}

export interface APIRequest {
  model: string;
  messages: APIMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
  stream?: boolean;
}

export interface APIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface ResponseFormat {
  type: 'text' | 'json_object';
}

export interface APIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: APIChoice[];
  usage: APIUsage;
}

export interface APIChoice {
  index: number;
  message: APIMessage;
  finish_reason: string;
}

export interface APIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface APIError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}