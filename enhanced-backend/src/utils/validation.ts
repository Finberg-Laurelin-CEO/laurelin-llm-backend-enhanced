import { LLMRequest } from '../types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateLLMRequest(request: any): LLMRequest {
  // Check required fields
  if (!request.session_id || typeof request.session_id !== 'string') {
    throw new ValidationError('session_id is required and must be a string');
  }

  if (!request.user_id || typeof request.user_id !== 'string') {
    throw new ValidationError('user_id is required and must be a string');
  }

  if (!request.messages || !Array.isArray(request.messages)) {
    throw new ValidationError('messages is required and must be an array');
  }

  // Validate messages
  for (const message of request.messages) {
    if (!message.role || !['user', 'assistant', 'system'].includes(message.role)) {
      throw new ValidationError('Each message must have a valid role (user, assistant, system)');
    }

    if (!message.content || typeof message.content !== 'string') {
      throw new ValidationError('Each message must have a content string');
    }
  }

  // Validate optional fields
  if (request.model_provider && !['openai', 'google', 'aws-bedrock'].includes(request.model_provider)) {
    throw new ValidationError('model_provider must be one of: openai, google, aws-bedrock');
  }

  if (request.temperature !== undefined) {
    if (typeof request.temperature !== 'number' || request.temperature < 0 || request.temperature > 2) {
      throw new ValidationError('temperature must be a number between 0 and 2');
    }
  }

  if (request.max_tokens !== undefined) {
    if (typeof request.max_tokens !== 'number' || request.max_tokens < 1 || request.max_tokens > 100000) {
      throw new ValidationError('max_tokens must be a number between 1 and 100000');
    }
  }

  return request as LLMRequest;
}

export function sanitizeInput(input: string): string {
  // Remove potentially harmful characters and limit length
  return input
    .replace(/[<>]/g, '') // Remove HTML-like tags
    .substring(0, 10000) // Limit to 10k characters
    .trim();
}
