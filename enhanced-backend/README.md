# Laurelin LLM Backend - Enhanced Edition

A comprehensive Google Cloud Functions-based LLM processing service that provides multi-provider AI model integration, A/B testing capabilities, and seamless integration with the Laurelin chat ecosystem.

## 🚀 **Enhanced Features**

This enhanced version includes:
- **Input Validation & Security**: Comprehensive request validation and sanitization
- **Testing Framework**: Jest testing with coverage reporting
- **Error Handling**: Robust error handling with proper validation responses
- **Request Tracking**: UUID-based request tracking for better monitoring
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Development Tools**: ESLint, testing scripts, and development workflow

## Features

- **Multi-Provider LLM Support**: OpenAI GPT, Google Gemini, AWS Bedrock
- **A/B Testing Infrastructure**: Built-in model comparison and user assignment
- **Google Cloud Functions**: Serverless, scalable processing
- **Pub/Sub Integration**: Asynchronous message processing
- **Firestore Integration**: Persistent A/B testing data and analytics
- **Flask Backend Integration**: Seamless communication with chat backend
- **Health Monitoring**: Comprehensive health checks and logging
- **TypeScript**: Type-safe, modern development

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Angular       │    │   Flask Backend  │    │  LLM Backend    │
│   Frontend      │◄──►│   (Chat API)     │◄──►│  (Cloud Func)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                         │
                              ▼                         ▼
                       ┌──────────────┐         ┌──────────────┐
                       │  Firestore   │         │   Pub/Sub    │
                       │  (Sessions)  │         │ (Processing) │
                       └──────────────┘         └──────────────┘
                                                         │
                                                         ▼
                                                ┌──────────────┐
                                                │ AI Providers │
                                                │ OpenAI/Google│
                                                │ AWS Bedrock  │
                                                └──────────────┘
```

## Components

### Core Services

- **`ProcessingService`**: Main orchestration service
- **`LLMService`**: Multi-provider AI model integration
- **`ABTestingService`**: A/B testing and user assignment
- **`FlaskIntegrationService`**: Communication with Flask backend
- **`ConfigService`**: Configuration management

### Cloud Functions

- **`onConvoInput`**: Main LLM processing function (Pub/Sub trigger)
- **`healthCheck`**: Health monitoring endpoint (HTTP trigger)

## Setup and Installation

### Prerequisites

- Node.js 18+
- Google Cloud SDK
- Google Cloud Project with enabled APIs:
  - Cloud Functions
  - Pub/Sub
  - Firestore
  - Secret Manager

### 1. Clone and Install

```bash
git clone https://github.com/laurelin-inc/laurelin-llm-backend.git
cd laurelin-llm-backend
npm install
```

### 2. Configure Environment

Copy the environment template and configure:

```bash
cp env.example .env
```

Update `.env` with your configuration:

```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# AI Model API Keys
OPENAI_API_KEY=your-openai-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1

# Flask Backend Integration
FLASK_BACKEND_URL=http://localhost:8080/api
FLASK_BACKEND_SECRET=your-flask-backend-secret

# A/B Testing Configuration
AB_TEST_ENABLED=true
AB_TEST_DEFAULT_PROVIDER=openai
```

### 3. Build and Deploy

```bash
# Build TypeScript
npm run build

# Deploy to Google Cloud Functions
chmod +x deploy.sh
./deploy.sh
```

## API Integration

### Pub/Sub Message Format

The LLM backend processes messages from Pub/Sub with the following format:

```typescript
interface LLMRequest {
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
```

### Response Format

```typescript
interface LLMResponse {
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
```

## A/B Testing

The LLM backend includes comprehensive A/B testing capabilities:

### Features

- **Consistent User Assignment**: Users are consistently assigned to the same variant
- **Multiple Model Comparison**: Compare OpenAI GPT vs Google Gemini vs AWS Bedrock
- **Event Tracking**: Track user interactions and model performance
- **Analytics**: Comprehensive results and statistics

### Configuration

```typescript
// Default A/B test configuration
const variants = {
  'openai': 0.5,    // 50% of users
  'google': 0.5     // 50% of users
};
```

### Event Tracking

The system automatically tracks:
- Model selection events
- Response generation events
- Error events
- Performance metrics

## Model Providers

### OpenAI GPT
- Models: `gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo`
- Features: Function calling, vision, streaming
- Max tokens: 128,000

### Google Gemini
- Models: `gemini-pro`, `gemini-pro-vision`
- Features: Function calling, vision, streaming
- Max tokens: 1,000,000

### AWS Bedrock
- Models: `claude-3-sonnet`, `claude-3-haiku`, `claude-3-opus`
- Features: Function calling, vision, streaming
- Max tokens: 200,000

## Health Monitoring

### Health Check Endpoint

```bash
GET https://us-central1-PROJECT_ID.cloudfunctions.net/llm-health-check
```

Response:
```json
{
  "status": "healthy",
  "service": "laurelin-llm-backend",
  "version": "1.0.0",
  "checks": {
    "openai": true,
    "google": true,
    "aws-bedrock": true,
    "flask_backend": true,
    "firestore": true
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Health check test
curl http://localhost:8080/health
```

## Deployment

### Google Cloud Functions

The service is designed to run on Google Cloud Functions with:

- **Runtime**: Node.js 20
- **Memory**: 1GB (configurable)
- **Timeout**: 300 seconds
- **Max Instances**: 10
- **Triggers**: Pub/Sub topic `llm-processing`

### Environment Variables

Set environment variables in Google Cloud Console:

```bash
gcloud functions deploy on-convo-input \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=your-project-id,OPENAI_API_KEY=your-key"
```

## Integration with Laurelin Ecosystem

### Flask Backend Integration

The LLM backend integrates with the Flask chat backend via:

1. **Pub/Sub Publishing**: Flask publishes LLM requests to the `llm-processing` topic
2. **Response Updates**: LLM backend updates chat sessions in Firestore
3. **A/B Testing**: Coordinated A/B testing between services
4. **Health Monitoring**: Shared health check endpoints

### Angular Frontend Integration

The Angular frontend communicates with the LLM backend through:

1. **Flask Backend**: Frontend → Flask → LLM Backend
2. **Real-time Updates**: WebSocket or polling for response updates
3. **A/B Testing UI**: Display user's assigned variant and results

## Monitoring and Logging

### Cloud Logging

All functions log to Google Cloud Logging with structured logs:

```json
{
  "severity": "INFO",
  "message": "LLM request processed",
  "session_id": "session-123",
  "user_id": "user-456",
  "model_used": "gpt-3.5-turbo",
  "processing_time_ms": 1500
}
```

### Metrics

Key metrics tracked:
- Request processing time
- Model selection distribution
- Error rates by provider
- A/B test conversion rates

## Security

### Authentication

- Service account authentication for Google Cloud services
- API key management via Google Secret Manager
- Secure communication between services

### Data Privacy

- No persistent storage of user messages
- Encrypted communication channels
- GDPR-compliant data handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is part of the Laurelin chat application ecosystem.
