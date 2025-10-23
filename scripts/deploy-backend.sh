#!/bin/bash

# Deploy Chat Backend to Google Cloud Run

set -e

ENVIRONMENT=${1:-staging}
PROJECT_ID="sacred-attic-473120-i0"
REGION="us-central1"
SERVICE_NAME="chat-backend"

echo "🚀 Deploying Chat Backend to Cloud Run..."

# Set project
gcloud config set project $PROJECT_ID

# Build the chat backend
cd apps/chat-backend

# Verify Dockerfile exists
if [ ! -f Dockerfile ]; then
    echo "❌ Dockerfile not found. Please create one first."
    exit 1
fi

# Build and push container
echo "🐳 Building and pushing container..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME:$ENVIRONMENT

# Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME:$ENVIRONMENT \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --min-instances 1 \
    --max-instances 10 \
    --memory 1Gi \
    --cpu 1 \
    --set-env-vars="ENVIRONMENT=$ENVIRONMENT,GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
    --project $PROJECT_ID

echo "✅ Chat Backend deployment completed!"
echo ""
echo "🔗 Service URL:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)"
