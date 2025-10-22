# Laurelin Workspace

A unified monorepo workspace for the Laurelin chat application ecosystem, featuring seamless Google Cloud deployment and MCP integration.

## 🏗️ Architecture

This workspace contains all Laurelin services in a unified monorepo structure:

```
laurelin-workspace/
├── apps/
│   ├── frontend/              # Angular frontend application
│   ├── chat-backend/          # Flask backend API
│   └── llm-backend/           # TypeScript LLM processing service
├── packages/
│   ├── shared-types/          # Shared TypeScript interfaces
│   └── shared-config/         # Shared configuration management
├── infra/
│   ├── gcp/                   # Google Cloud deployment configs
│   └── mcp/                   # Model Context Protocol configuration
├── scripts/
│   ├── deploy-all.sh          # Master deployment script
│   ├── deploy-frontend.sh     # Frontend deployment
│   ├── deploy-backend.sh      # Backend deployment
│   └── deploy-llm.sh          # LLM service deployment
└── .github/workflows/         # CI/CD pipelines
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Google Cloud SDK
- Docker (for backend deployment)

### Installation

```bash
# Clone the workspace
git clone https://github.com/laurelin-inc/laurelin-workspace.git
cd laurelin-workspace

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Development

```bash
# Start all services in development mode
pnpm dev

# Start individual services
cd apps/frontend && npm run dev
cd apps/chat-backend && python app.py
cd apps/llm-backend && npm run dev
```

## ☁️ Google Cloud Deployment

### Prerequisites

1. **Google Cloud Project**: `sacred-attic-473120-i0`
2. **Authentication**: Application Default Credentials configured
3. **Required APIs**: Cloud Functions, Cloud Run, Cloud Storage, Pub/Sub, Firestore

### Deploy All Services

```bash
# Deploy to staging (default)
./scripts/deploy-all.sh staging

# Deploy to production
./scripts/deploy-all.sh production
```

### Individual Service Deployment

```bash
# Deploy LLM Backend (Cloud Functions)
./scripts/deploy-llm.sh staging

# Deploy Chat Backend (Cloud Run)
./scripts/deploy-backend.sh staging

# Deploy Frontend (Cloud Storage)
./scripts/deploy-frontend.sh staging
```

## 🔧 MCP Integration

This workspace includes Model Context Protocol (MCP) integration for seamless Google Cloud management:

### Configuration

The MCP server is configured in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "google-cloud": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-cloud"],
      "env": {
        "GOOGLE_CLOUD_PROJECT": "sacred-attic-473120-i0",
        "GOOGLE_APPLICATION_CREDENTIALS": "/Users/Joe/.config/gcloud/application_default_credentials.json"
      }
    }
  }
}
```

### MCP Capabilities

- Deploy to Cloud Functions
- Deploy to Cloud Run
- Manage Firestore databases
- Manage Pub/Sub topics
- View logs and monitoring
- Manage Cloud Storage buckets

## 📦 Shared Packages

### @laurelin/shared-types

Common TypeScript interfaces used across all services:

```typescript
import { ChatMessage, LLMRequest, LLMResponse } from '@laurelin/shared-types';
```

### @laurelin/shared-config

Centralized configuration management:

```typescript
import { getConfig } from '@laurelin/shared-config';

const config = getConfig('production');
```

## 🔄 CI/CD Pipeline

### GitHub Actions

- **Staging**: Auto-deploy on push to `main`
- **Production**: Manual deployment with approval

### Workflows

1. **deploy-staging.yml**: Tests, builds, and deploys to staging
2. **deploy-production.yml**: Manual production deployment

## 🌍 Environment Configuration

### Environment Variables

Create `.env` files for each environment:

```env
# .env.staging
GOOGLE_CLOUD_PROJECT=sacred-attic-473120-i0
ENVIRONMENT=staging
OPENAI_API_KEY=your-key
GOOGLE_AI_API_KEY=your-key
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-key
```

### Secret Management

Secrets are managed through:
- **GCP Secret Manager**: For runtime secrets
- **GitHub Secrets**: For CI/CD pipeline secrets

## 📊 Service URLs

### Staging
- Frontend: `https://storage.googleapis.com/laurelin-frontend-assets/index.html`
- Backend: `https://us-central1-sacred-attic-473120-i0.cloudfunctions.net/chat-backend`
- LLM Backend: `https://us-central1-sacred-attic-473120-i0.cloudfunctions.net/llm-backend`

### Production
- Frontend: `https://laurelin-chat.com`
- Backend: `https://api.laurelin-chat.com`
- LLM Backend: `https://us-central1-sacred-attic-473120-i0.cloudfunctions.net/llm-backend`

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
cd apps/frontend && npm test
cd apps/chat-backend && python -m pytest
cd apps/llm-backend && npm test

# Run tests with coverage
pnpm test:coverage
```

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm dev` | Start development servers |
| `pnpm deploy:all` | Deploy all services |
| `pnpm clean` | Clean build artifacts |

## 🔍 Monitoring

### Health Checks

- LLM Backend: `https://us-central1-sacred-attic-473120-i0.cloudfunctions.net/llm-health-check`
- Chat Backend: `https://your-backend-url/health`

### Logs

View logs in Google Cloud Console:
- Cloud Functions logs
- Cloud Run logs
- Application logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is part of the Laurelin chat application ecosystem.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Contact the development team
- Check the documentation in individual app directories
