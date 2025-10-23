export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  model_used?: string;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  session_id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
  metadata: Record<string, any>;
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

export interface ModelProvider {
  name: string;
  models: string[];
  capabilities: {
    streaming: boolean;
    function_calling: boolean;
    vision: boolean;
    max_tokens: number;
  };
}

export interface ABTestAssignment {
  user_id: string;
  experiment_name: string;
  variant: string;
  assigned_at: string;
}

export interface ProcessingEvent {
  event_type: 'request_received' | 'model_selected' | 'response_generated' | 'error_occurred';
  session_id: string;
  user_id: string;
  model_provider: string;
  model_name: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PubSubMessage {
  data: string;
  attributes?: Record<string, string>;
  messageId: string;
  publishTime: string;
}

export interface CloudEvent {
  id: string;
  source: string;
  specversion: string;
  type: string;
  datacontenttype: string;
  time: string;
  data: {
    message: PubSubMessage;
  };
}
