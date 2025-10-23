import { CloudEvent } from '@google-cloud/functions-framework';
import { ProcessingService } from './src/services/processing.service';
import { LLMRequest } from './src/types';
import { validateLLMRequest, ValidationError } from './src/utils/validation';

// Initialize processing service
const processingService = new ProcessingService();

// Register a CloudEvent callback with the Functions Framework that will
// be executed when the Pub/Sub trigger topic receives a message.
export const onConvoInput = async (cloudEvent: CloudEvent) => {
  try {
    console.log('Received LLM processing request:', cloudEvent.id);

    // Parse the Pub/Sub message
    const messageData = cloudEvent.data?.message?.data;
    if (!messageData) {
      throw new Error('No message data found in CloudEvent');
    }

    // Decode the base64 message
    const decodedData = Buffer.from(messageData, 'base64').toString();
    const rawRequest = JSON.parse(decodedData);

    // Validate the request
    const llmRequest: LLMRequest = validateLLMRequest(rawRequest);

    console.log('Processing LLM request for session:', llmRequest.session_id);

    // Process the LLM request
    const response = await processingService.processLLMRequest(llmRequest);

    console.log('LLM processing completed:', {
      session_id: llmRequest.session_id,
      success: response.success,
      model_used: response.model_used,
      provider: response.provider
    });

    return response;
  } catch (error) {
    console.error('Error processing LLM request:', error);
    
    if (error instanceof ValidationError) {
      // Return validation error response instead of throwing
      return {
        success: false,
        model_used: 'unknown',
        provider: 'unknown',
        error: error.message
      };
    }
    
    throw error;
  }
};

// Health check endpoint for Cloud Functions
export const healthCheck = async (req: any, res: any) => {
  try {
    const health = await processingService.healthCheck();
    const isHealthy = Object.values(health).every(status => status === true);
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'laurelin-llm-backend',
      version: '1.0.0',
      checks: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'laurelin-llm-backend',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};
