#!/bin/bash

# Deploy from Cursor IDE - Flask Backend to Cloud Run
# This script is optimized for Cursor IDE integration

set -e

# Configuration
PROJECT_ID="sacred-attic-473120-i0"
REGION="us-central1"
SERVICE_NAME="chat-backend"
ENVIRONMENT=${1:-staging}

echo "🚀 Deploying Flask Backend from Cursor to Cloud Run..."
echo "📋 Configuration:"
echo "  - Project: $PROJECT_ID"
echo "  - Region: $REGION"
echo "  - Service: $SERVICE_NAME"
echo "  - Environment: $ENVIRONMENT"
echo ""

# Set project
export PATH=/opt/homebrew/share/google-cloud-sdk/bin:"$PATH"
gcloud config set project $PROJECT_ID

# Navigate to chat-backend directory
cd apps/chat-backend

# Verify files exist
if [ ! -f "app.py" ]; then
    echo "❌ app.py not found"
    exit 1
fi

if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt not found"
    exit 1
fi

if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile not found"
    exit 1
fi

echo "✅ All required files found"

# Create Artifact Registry repository if it doesn't exist
echo "📦 Setting up Artifact Registry..."
gcloud artifacts repositories create laurelin-repo \
    --repository-format=docker \
    --location=$REGION \
    --project=$PROJECT_ID || echo "Repository already exists"

# Build and push container using Cloud Build
echo "🐳 Building and pushing container..."
gcloud builds submit \
    --tag $REGION-docker.pkg.dev/$PROJECT_ID/laurelin-repo/$SERVICE_NAME:$ENVIRONMENT \
    --project $PROJECT_ID

# Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $REGION-docker.pkg.dev/$PROJECT_ID/laurelin-repo/$SERVICE_NAME:$ENVIRONMENT \
    --platform managed \
    --region $REGION \
    --no-allow-unauthenticated \
    --port 8080 \
    --min-instances 1 \
    --max-instances 10 \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --concurrency 80 \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,ENVIRONMENT=$ENVIRONMENT" \
    --set-secrets="FLASK_BACKEND_SECRET=flask-backend-secret:latest,AB_TEST_CONFIG=ab-test-config:latest" \
    --project $PROJECT_ID

# Allow unauthenticated access after deployment
echo "🔓 Setting up public access..."
gcloud run services add-iam-policy-binding $SERVICE_NAME \
    --region=$REGION \
    --member="allUsers" \
    --role="roles/run.invoker" \
    --project=$PROJECT_ID

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo ""
echo "✅ Flask Backend deployment completed!"
echo ""
echo "🔗 Service URL: $SERVICE_URL"
echo "🏥 Health Check: $SERVICE_URL/health"
echo ""
echo "📊 Service Details:"
echo "  - Service Name: $SERVICE_NAME"
echo "  - Region: $REGION"
echo "  - Environment: $ENVIRONMENT"
echo "  - Memory: 1Gi"
echo "  - CPU: 1"
echo "  - Min Instances: 1"
echo "  - Max Instances: 10"
echo ""
echo "🔍 View logs:"
echo "  gcloud logs tail --follow --service=$SERVICE_NAME --region=$REGION"
echo ""
echo "🌐 Open in browser:"
echo "  open $SERVICE_URL"
