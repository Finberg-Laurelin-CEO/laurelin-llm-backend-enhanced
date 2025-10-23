import { v4 as uuidv4 } from 'uuid';
import { LLMService } from './llm.service';
import { FlaskIntegrationService } from './flask-integration.service';
import { ABTestingService } from './ab-testing.service';
import { ConfigService } from './config.service';
import { LLMRequest, LLMResponse, ProcessingEvent } from '../types';

export class ProcessingService {
  private llmService: LLMService;
  private flaskIntegration: FlaskIntegrationService;
  private abTesting: ABTestingService;
  private config: ConfigService;

  constructor() {
    this.llmService = new LLMService();
    this.flaskIntegration = new FlaskIntegrationService();
    this.abTesting = new ABTestingService();
    this.config = ConfigService.getInstance();
  }

  public async processLLMRequest(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    try {
      // Log processing start
      await this.logEvent('request_received', request);

      // Determine model provider based on A/B testing
      const modelProvider = await this.determineModelProvider(request);
      
      // Update request with determined provider
      const enhancedRequest: LLMRequest = {
        ...request,
        model_provider: modelProvider
      };

      // Log model selection
      await this.logEvent('model_selected', enhancedRequest);

      // Generate LLM response
      const response = await this.llmService.generateResponse(enhancedRequest);

      // Log response generation
      await this.logEvent('response_generated', enhancedRequest, response);

      // Update Flask backend with the response
      if (response.success) {
        await this.flaskIntegration.updateChatSession(request.session_id, response);
        
        // Track A/B testing event
        if (this.config.getConfig().abTestEnabled) {
          await this.trackABTestEvent(request, response);
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`LLM request processed in ${processingTime}ms`);

      return response;
    } catch (error) {
      console.error('Error processing LLM request:', error);
      
      // Log error
      await this.logEvent('error_occurred', request, null, error);

      return {
        success: false,
        model_used: request.model_name || 'unknown',
        provider: request.model_provider || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async determineModelProvider(request: LLMRequest): Promise<string> {
    // If provider is explicitly specified, use it
    if (request.model_provider) {
      return request.model_provider;
    }

    // If A/B testing is enabled, get user's assignment
    if (this.config.getConfig().abTestEnabled) {
      const variant = await this.abTesting.getUserAssignment(
        request.user_id,
        'model_comparison'
      );
      
      if (variant) {
        return variant;
      }

      // If no assignment exists, create one
      const variants = {
        'openai': 0.5,
        'google': 0.5
      };
      
      const assignedVariant = await this.abTesting.assignUserToVariant(
        request.user_id,
        'model_comparison',
        variants
      );
      
      return assignedVariant;
    }

    // Default to configured provider
    return this.config.getConfig().abTestDefaultProvider;
  }

  private async trackABTestEvent(request: LLMRequest, response: LLMResponse): Promise<void> {
    try {
      await this.abTesting.trackEvent(
        request.user_id,
        'model_comparison',
        'message_sent',
        {
          session_id: request.session_id,
          model_provider: response.provider,
          model_name: response.model_used,
          response_length: response.content?.length || 0,
          success: response.success,
          processing_time: Date.now()
        }
      );
    } catch (error) {
      console.error('Failed to track A/B test event:', error);
    }
  }

  private async logEvent(
    eventType: ProcessingEvent['event_type'],
    request: LLMRequest,
    response?: LLMResponse | null,
    error?: any
  ): Promise<void> {
    try {
      const event: ProcessingEvent = {
        event_type: eventType,
        session_id: request.session_id,
        user_id: request.user_id,
        model_provider: request.model_provider || 'unknown',
        model_name: request.model_name || 'unknown',
        timestamp: new Date().toISOString(),
        metadata: {
          request_id: uuidv4(),
          response_success: response?.success,
          error_message: error?.message,
          processing_time: Date.now()
        }
      };

      await this.flaskIntegration.logProcessingEvent(event);
    } catch (error) {
      console.error('Failed to log processing event:', error);
    }
  }

  public async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    // Check LLM providers
    const llmHealth = await this.llmService.healthCheck();
    Object.assign(results, llmHealth);

    // Check Flask backend
    results.flask_backend = await this.flaskIntegration.healthCheck();

    // Check Firestore (via A/B testing service)
    try {
      await this.abTesting.getUserAssignment('test', 'test');
      results.firestore = true;
    } catch (error) {
      results.firestore = false;
    }

    return results;
  }
}
