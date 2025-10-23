const { CloudEvent } = require('@google-cloud/functions-framework');

// Simple health check function
exports.healthCheck = async (req, res) => {
  try {
    res.status(200).json({
      status: 'healthy',
      service: 'laurelin-llm-backend',
      version: '1.0.0',
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

// Simple login API function
exports.loginAPI = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      res.status(400).json({ error: 'ID token is required' });
      return;
    }
    
    // For now, just return a success response
    res.status(200).json({
      success: true,
      user: {
        id: 'test-user',
        email: 'test@laurelin.com',
        name: 'Test User',
        domain: 'laurelin.com'
      },
      sessionToken: 'test-session-token'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

// Simple chat API function
exports.chatAPI = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }
    
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }
    
    // Simple echo response for testing
    const lastMessage = messages[messages.length - 1];
    const response = `Echo: ${lastMessage.content}`;
    
    res.status(200).json({
      success: true,
      session_id: req.body.session_id || 'test-session',
      user: {
        id: 'test-user',
        email: 'test@laurelin.com',
        name: 'Test User'
      },
      response: {
        success: true,
        content: response,
        model_used: 'test-model',
        provider: 'test-provider'
      }
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

// Simple response API function
exports.responseAPI = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }
    
    res.status(200).json({
      success: true,
      session_id: sessionId,
      status: 'completed',
      response: 'This is a test response from the simple API.'
    });
    
  } catch (error) {
    console.error('Response API error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};
