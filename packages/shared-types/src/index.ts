// Shared types for Laurelin applications

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface LLMRequest {
  session_id: string;
  user_id: string;
  messages: ChatMessage[];
  model_provider?: 'openai' | 'google' | 'aws-bedrock';
  model_name?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  metadata?: Record<string, any>;
}

export interface LLMResponse {
  success: boolean;
  content?: string;
  model_used: string;
  provider: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  metadata?: Record<string, any>;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  preferences?: Record<string, any>;
}

export interface Session {
  id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  messages: ChatMessage[];
  metadata?: Record<string, any>;
}

export interface ABTestVariant {
  name: string;
  weight: number;
  config: Record<string, any>;
}

export interface ABTestResult {
  variant: string;
  user_id: string;
  session_id: string;
  timestamp: Date;
  metrics?: Record<string, number>;
}

export type Environment = 'development' | 'staging' | 'production';

export interface Config {
  environment: Environment;
  gcp: {
    project_id: string;
    region: string;
  };
  api: {
    openai?: {
      api_key: string;
      model: string;
    };
    google?: {
      api_key: string;
      model: string;
    };
    aws?: {
      access_key_id: string;
      secret_access_key: string;
      region: string;
      model: string;
    };
  };
  services: {
    frontend_url: string;
    backend_url: string;
    llm_backend_url: string;
  };
}
