const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: [
    'https://chat.laurelin-inc.com',
    'https://laurelin-frontend-975218893454.us-central1.run.app',
    'http://localhost:4200'
  ],
  credentials: true
}));
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'laurelin-llm-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Login API (simplified)
app.post('/login', (req, res) => {
  const { idToken } = req.body;
  
  if (!idToken) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID token is required' 
    });
  }

  // For now, return a mock response
  res.json({
    success: true,
    user: {
      id: 'test-user-123',
      email: 'test@laurelin-inc.com',
      name: 'Test User',
      domain: 'laurelin-inc.com'
    },
    sessionToken: 'mock-session-token-123'
  });
});

// Chat API (simplified)
app.post('/chat', (req, res) => {
  const { message, modelProvider = 'google', sessionId } = req.body;
  
  if (!message) {
    return res.status(400).json({ 
      success: false, 
      error: 'Message is required' 
    });
  }

  // Mock response
  res.json({
    success: true,
    content: `Hello! I received your message: "${message}". This is a mock response from the ${modelProvider} model. The full system is being deployed.`,
    model_used: modelProvider === 'google' ? 'gemini-pro' : 'gpt-3.5-turbo',
    provider: modelProvider,
    session_id: sessionId || `session-${Date.now()}`
  });
});

// Models API
app.get('/models', (req, res) => {
  res.json({
    success: true,
    providers: {
      'google': {
        name: 'Google AI',
        models: ['gemini-pro', 'gemini-pro-vision'],
        status: 'available'
      },
      'openai': {
        name: 'OpenAI',
        models: ['gpt-4', 'gpt-3.5-turbo'],
        status: 'available'
      },
      'custom-gpu': {
        name: 'OSS120 (Custom GPU)',
        models: ['oss120'],
        status: 'pending'
      }
    }
  });
});

// File Upload API (mock)
app.post('/upload', (req, res) => {
  res.json({
    success: true,
    file: {
      id: `file-${Date.now()}`,
      name: 'mock-file.txt',
      size: 1024,
      type: 'text/plain'
    }
  });
});

// History API (mock)
app.get('/history/:sessionId', (req, res) => {
  res.json({
    success: true,
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello, this is a test message',
        timestamp: new Date().toISOString()
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hello! This is a mock response.',
        timestamp: new Date().toISOString()
      }
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Simple backend server running on port ${PORT}`);
});
