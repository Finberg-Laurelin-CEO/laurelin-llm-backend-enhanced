import { CloudEvent } from '@google-cloud/functions-framework';
import { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ProcessingService } from './src/services/processing.service';
import { AuthService } from './src/services/auth.service';
import { LLMService } from './src/services/llm.service';
import { GCSDataService } from './src/services/gcs-data.service';
import { FileUploadService } from './src/services/file-upload.service';
import { PersistenceService } from './src/services/persistence.service';
import { LLMRequest } from './src/types';
import { validateLLMRequest, ValidationError } from './src/utils/validation';

// Initialize services
const processingService = new ProcessingService();
const authService = new AuthService();
const llmService = new LLMService();
const gcsDataService = new GCSDataService();
const fileUploadService = new FileUploadService();
const persistenceService = new PersistenceService();

// CORS configuration
const corsOptions = {
  origin: [
    'https://chat.laurelin-inc.com',
    'http://localhost:4200', // Angular dev server
    'http://localhost:3000', // Alternative dev port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

const corsMiddleware = cors(corsOptions);

// Authentication middleware
const authenticateUser = async (req: Request, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers['x-session-token'] as string;
    
    let user = null;
    
    if (sessionToken) {
      // Validate session token
      const authResult = authService.validateSessionToken(sessionToken);
      if (authResult.success && authResult.user) {
        user = authResult.user;
      }
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      // Validate Google ID token
      const idToken = authHeader.substring(7);
      const authResult = await authService.verifyGoogleToken(idToken);
      if (authResult.success && authResult.user) {
        user = authResult.user;
      }
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Add user to request
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Pub/Sub trigger for legacy compatibility
export const onConvoInput = async (cloudEvent: CloudEvent<any>) => {
  try {
    console.log('Received LLM processing request:', cloudEvent.id);

    const messageData = cloudEvent.data?.message?.data;
    if (!messageData) {
      throw new Error('No message data found in CloudEvent');
    }

    const decodedData = Buffer.from(messageData, 'base64').toString();
    const rawRequest = JSON.parse(decodedData);
    const llmRequest: LLMRequest = validateLLMRequest(rawRequest);

    console.log('Processing LLM request for session:', llmRequest.session_id);
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

// Health check endpoint
export const healthCheck = async (req: Request, res: Response) => {
  try {
    const health = await processingService.healthCheck();
    const gcsHealth = await gcsDataService.healthCheck();
    const uploadHealth = await fileUploadService.healthCheck();
    const firestoreHealth = await persistenceService.healthCheck();
    
    const allChecks = {
      ...health,
      gcs: gcsHealth,
      upload: uploadHealth,
      firestore: firestoreHealth
    };
    
    const isHealthy = Object.values(allChecks).every(status => status === true);
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'laurelin-llm-backend',
      version: '2.0.0',
      checks: allChecks,
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

// Login API endpoint
export const loginAPI = async (req: Request, res: Response) => {
  corsMiddleware(req, res, async () => {
    helmet()(req, res, async () => {
      try {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }

        const { idToken } = req.body;
        if (!idToken) {
          return res.status(400).json({ success: false, error: 'ID token required' });
        }

        const authResult = await authService.verifyGoogleToken(idToken);
        if (!authResult.success || !authResult.user) {
          return res.status(401).json({ success: false, error: authResult.error });
        }

        const sessionToken = authService.generateSessionToken(authResult.user);

        res.json({
          success: true,
          user: authResult.user,
          sessionToken
        });
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
          success: false,
          error: 'Login failed'
        });
      }
    });
  });
};

// Chat API endpoint
export const chatAPI = async (req: Request, res: Response) => {
  corsMiddleware(req, res, async () => {
    helmet()(req, res, async () => {
      try {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }

        await authenticateUser(req, res, async () => {
          const user = (req as any).user;
          const { message, modelProvider, modelName, sessionId, fileReferences } = req.body;

          if (!message) {
            return res.status(400).json({ success: false, error: 'Message required' });
          }

          // Get context data from GCS if available
          let contextData = '';
          try {
            contextData = await gcsDataService.getContextData(message, 2000);
          } catch (error) {
            console.warn('Failed to get context data:', error);
          }

          // Prepare LLM request
          const llmRequest: LLMRequest = {
            session_id: sessionId || `session-${Date.now()}`,
            user_id: user.id,
            messages: [
              ...(contextData ? [{ role: 'system', content: `Context data: ${contextData}` }] : []),
              { role: 'user', content: message }
            ],
            model_provider: modelProvider || 'google',
            model_name: modelName,
            temperature: 0.7,
            max_tokens: 1000,
            metadata: {
              fileReferences: fileReferences || [],
              contextData: contextData ? 'included' : 'none'
            }
          };

          // Save user message
          await persistenceService.saveMessage({
            sessionId: llmRequest.session_id,
            userId: user.id,
            role: 'user',
            content: message,
            modelUsed: modelName,
            provider: modelProvider,
            fileReferences: fileReferences || []
          });

          // Process LLM request
          const response = await processingService.processLLMRequest(llmRequest);

          // Save assistant response
          if (response.success && response.content) {
            await persistenceService.saveMessage({
              sessionId: llmRequest.session_id,
              userId: user.id,
              role: 'assistant',
              content: response.content,
              modelUsed: response.model_used,
              provider: response.provider
            });
          }

          res.json({
            success: response.success,
            content: response.content,
            model_used: response.model_used,
            provider: response.provider,
            session_id: llmRequest.session_id,
            error: response.error
          });
        });
      } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({
          success: false,
          error: 'Chat processing failed'
        });
      }
    });
  });
};

// Models API endpoint
export const modelsAPI = async (req: Request, res: Response) => {
  corsMiddleware(req, res, async () => {
    helmet()(req, res, async () => {
      try {
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }

        const providers = llmService.getAvailableProviders();
        res.json({
          success: true,
          providers
        });
      } catch (error) {
        console.error('Models API error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get models'
        });
      }
    });
  });
};

// Upload API endpoint
export const uploadAPI = async (req: Request, res: Response) => {
  corsMiddleware(req, res, async () => {
    helmet()(req, res, async () => {
      try {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }

        await authenticateUser(req, res, async () => {
          const user = (req as any).user;
          const { sessionId } = req.body;

          // Handle multipart/form-data upload
          if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file provided' });
          }

          const uploadResult = await fileUploadService.uploadFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            user.id,
            sessionId
          );

          if (!uploadResult.success) {
            return res.status(400).json(uploadResult);
          }

          // Save upload record
          await persistenceService.saveUploadRecord({
            userId: user.id,
            sessionId,
            originalName: uploadResult.file!.originalName,
            fileName: uploadResult.file!.fileName,
            bucket: uploadResult.file!.bucket,
            path: uploadResult.file!.path,
            size: uploadResult.file!.size,
            contentType: uploadResult.file!.contentType
          });

          res.json({
            success: true,
            file: uploadResult.file
          });
        });
      } catch (error) {
        console.error('Upload API error:', error);
        res.status(500).json({
          success: false,
          error: 'Upload failed'
        });
      }
    });
  });
};

// History API endpoint
export const historyAPI = async (req: Request, res: Response) => {
  corsMiddleware(req, res, async () => {
    helmet()(req, res, async () => {
      try {
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }

        await authenticateUser(req, res, async () => {
          const user = (req as any).user;
          const { sessionId, limit = 50 } = req.query;

          if (sessionId) {
            // Get messages for specific session
            const messages = await persistenceService.getSessionMessages(sessionId as string, parseInt(limit as string));
            res.json({
              success: true,
              messages
            });
          } else {
            // Get user's sessions
            const sessions = await persistenceService.getUserSessions(user.id, parseInt(limit as string));
            res.json({
              success: true,
              sessions
            });
          }
        });
      } catch (error) {
        console.error('History API error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get history'
        });
      }
    });
  });
};

// Data sources API endpoint
export const dataSourcesAPI = async (req: Request, res: Response) => {
  corsMiddleware(req, res, async () => {
    helmet()(req, res, async () => {
      try {
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }

        await authenticateUser(req, res, async () => {
          const dataSources = gcsDataService.getDataSources();
          res.json({
            success: true,
            dataSources
          });
        });
      } catch (error) {
        console.error('Data sources API error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get data sources'
        });
      }
    });
  });
};

// Response API endpoint (for polling)
export const responseAPI = async (req: Request, res: Response) => {
  corsMiddleware(req, res, async () => {
    helmet()(req, res, async () => {
      try {
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }

        await authenticateUser(req, res, async () => {
          const { sessionId } = req.params;
          
          if (!sessionId) {
            return res.status(400).json({ success: false, error: 'Session ID required' });
          }

          // Get latest messages for the session
          const messages = await persistenceService.getSessionMessages(sessionId, 1);
          
          if (messages.length === 0) {
            return res.json({
              success: true,
              status: 'processing',
              message: 'No response yet'
            });
          }

          const lastMessage = messages[messages.length - 1];
          
          res.json({
            success: true,
            status: 'completed',
            response: lastMessage.content,
            model_used: lastMessage.modelUsed,
            provider: lastMessage.provider
          });
        });
      } catch (error) {
        console.error('Response API error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get response'
        });
      }
    });
  });
};

// Export all functions for Cloud Functions
export { onConvoInput, chatAPI, loginAPI, modelsAPI, uploadAPI, historyAPI, dataSourcesAPI, responseAPI, healthCheck };