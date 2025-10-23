# MCP Deployment Guide for Cursor IDE

This guide explains how to deploy the Flask backend to Cloud Run directly from Cursor IDE using the Model Context Protocol (MCP) integration.

## Prerequisites

1. **MCP Server Installed**: The Google Cloud MCP server should be configured in `.cursor/mcp.json`
2. **Authentication**: Application Default Credentials should be set up
3. **Project Access**: You should have access to the `sacred-attic-473120-i0` project

## MCP Configuration

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

## Deployment Methods

### Method 1: Using MCP Commands in Cursor

You can use MCP commands directly in Cursor to deploy:

1. **Open Cursor IDE** in the workspace directory
2. **Use MCP commands** to interact with Google Cloud:
   - Deploy Cloud Run service
   - Manage Cloud Functions
   - View logs and monitoring
   - Manage secrets

### Method 2: Using Deployment Scripts

Run the deployment script from the terminal:

```bash
# Deploy Flask backend to Cloud Run
./scripts/deploy-from-cursor.sh staging

# Deploy all services
./scripts/deploy-all.sh staging
```

### Method 3: Using Cursor's Integrated Terminal

1. Open Cursor IDE
2. Open the integrated terminal (Ctrl+`)
3. Navigate to the workspace: `cd /Users/Joe/Laurelin/laurelin-workspace`
4. Run deployment commands

## Flask Backend Deployment Details

### Service Configuration

- **Service Name**: `chat-backend`
- **Runtime**: Python 3.11
- **Memory**: 1Gi
- **CPU**: 1
- **Port**: 8080
- **Min Instances**: 1
- **Max Instances**: 10
- **Timeout**: 300s
- **Concurrency**: 80

### Environment Variables

- `GOOGLE_CLOUD_PROJECT`: sacred-attic-473120-i0
- `ENVIRONMENT`: staging/production

### Secrets

- `FLASK_BACKEND_SECRET`: Flask backend secret
- `AB_TEST_CONFIG`: A/B testing configuration

### Health Endpoints

- **Health Check**: `GET /health`
- **Root**: `GET /`
- **API Endpoints**: `POST /api/chat`, `GET/POST /api/sessions`

## Deployment Process

1. **Build**: Docker container is built using Cloud Build
2. **Push**: Container is pushed to Google Container Registry
3. **Deploy**: Cloud Run service is updated with new container
4. **Verify**: Health check endpoints are tested

## Monitoring and Logs

### View Logs in Cursor

Use MCP commands to view logs:

```bash
# View recent logs
gcloud logs tail --follow --service=chat-backend --region=us-central1

# View specific log entries
gcloud logs read --service=chat-backend --region=us-central1 --limit=50
```

### Cloud Console

- **Cloud Run**: https://console.cloud.google.com/run?project=sacred-attic-473120-i0
- **Logs**: https://console.cloud.google.com/logs?project=sacred-attic-473120-i0
- **Monitoring**: https://console.cloud.google.com/monitoring?project=sacred-attic-473120-i0

## Troubleshooting

### Common Issues

1. **Authentication Error**: Run `gcloud auth application-default login`
2. **Permission Denied**: Check IAM roles for the service account
3. **Build Failure**: Check Dockerfile and requirements.txt
4. **Deployment Timeout**: Increase timeout in deployment script

### Debug Commands

```bash
# Check authentication
gcloud auth list

# Check project
gcloud config get-value project

# Check service status
gcloud run services describe chat-backend --region=us-central1

# View service logs
gcloud logs tail --service=chat-backend --region=us-central1
```

## Next Steps

1. **Test the deployment** by accessing the health endpoint
2. **Set up monitoring** and alerting
3. **Configure custom domain** for production
4. **Set up CI/CD** with GitHub Actions
5. **Implement proper error handling** and logging

## Integration with Other Services

The Flask backend integrates with:

- **LLM Backend**: Via Pub/Sub for AI processing
- **Frontend**: Via REST API endpoints
- **Firestore**: For session management
- **Secret Manager**: For secure configuration
