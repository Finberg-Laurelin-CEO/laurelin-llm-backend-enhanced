import { validateLLMRequest, ValidationError, sanitizeInput } from '../utils/validation';
import { LLMRequest } from '../types';

describe('Validation Utils', () => {
  describe('validateLLMRequest', () => {
    const validRequest: LLMRequest = {
      session_id: 'test-session',
      user_id: 'test-user',
      messages: [
        { role: 'user', content: 'Hello, world!' }
      ]
    };

    it('should validate a correct request', () => {
      expect(() => validateLLMRequest(validRequest)).not.toThrow();
    });

    it('should throw error for missing session_id', () => {
      const invalidRequest = { ...validRequest, session_id: undefined };
      expect(() => validateLLMRequest(invalidRequest)).toThrow(ValidationError);
    });

    it('should throw error for missing user_id', () => {
      const invalidRequest = { ...validRequest, user_id: undefined };
      expect(() => validateLLMRequest(invalidRequest)).toThrow(ValidationError);
    });

    it('should throw error for invalid messages', () => {
      const invalidRequest = { ...validRequest, messages: 'not an array' };
      expect(() => validateLLMRequest(invalidRequest)).toThrow(ValidationError);
    });

    it('should throw error for invalid message role', () => {
      const invalidRequest = {
        ...validRequest,
        messages: [{ role: 'invalid', content: 'test' }]
      };
      expect(() => validateLLMRequest(invalidRequest)).toThrow(ValidationError);
    });

    it('should throw error for invalid model provider', () => {
      const invalidRequest = { ...validRequest, model_provider: 'invalid' };
      expect(() => validateLLMRequest(invalidRequest)).toThrow(ValidationError);
    });

    it('should throw error for invalid temperature', () => {
      const invalidRequest = { ...validRequest, temperature: 5 };
      expect(() => validateLLMRequest(invalidRequest)).toThrow(ValidationError);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML-like tags', () => {
      const input = 'Hello <script>alert("xss")</script> world';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello scriptalert("xss")/script world');
    });

    it('should limit input length', () => {
      const longInput = 'a'.repeat(15000);
      const result = sanitizeInput(longInput);
      expect(result.length).toBe(10000);
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const result = sanitizeInput(input);
      expect(result).toBe('hello world');
    });
  });
});
