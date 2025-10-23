#!/bin/bash

# Deploy LLM Backend to Google Cloud Functions

set -e

ENVIRONMENT=${1:-staging}
PROJECT_ID="sacred-attic-473120-i0"
REGION="us-central1"

echo "🚀 Deploying LLM Backend to Cloud Functions..."

# Set project
gcloud config set project $PROJECT_ID

# Build the LLM backend
cd apps/llm-backend
npm install
npm run build

# Deploy the main LLM processing function
echo "☁️  Deploying LLM processing function..."
gcloud functions deploy on-convo-input \
    --gen2 \
    --runtime=nodejs20 \
    --region=$REGION \
    --source=. \
    --entry-point=onConvoInput \
    --trigger-topic=llm-processing \
    --memory=1GB \
    --timeout=300s \
    --max-instances=10 \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,ENVIRONMENT=$ENVIRONMENT" \
    --set-secrets="OPENAI_API_KEY=openai-api-key:latest,GOOGLE_AI_API_KEY=google-ai-api-key:latest,AWS_CREDENTIALS=aws-credentials:latest" \
    --project=$PROJECT_ID

# Deploy health check function
echo "🏥 Deploying health check function..."
gcloud functions deploy llm-health-check \
    --gen2 \
    --runtime=nodejs20 \
    --region=$REGION \
    --source=. \
    --entry-point=healthCheck \
    --trigger-http \
    --allow-unauthenticated \
    --memory=256MB \
    --timeout=30s \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,ENVIRONMENT=$ENVIRONMENT" \
    --set-secrets="OPENAI_API_KEY=openai-api-key:latest,GOOGLE_AI_API_KEY=google-ai-api-key:latest,AWS_CREDENTIALS=aws-credentials:latest" \
    --project=$PROJECT_ID

# Create Pub/Sub topic if it doesn't exist
echo "📢 Setting up Pub/Sub topic..."
gcloud pubsub topics create llm-processing --project=$PROJECT_ID || echo "Topic already exists"

# Create Pub/Sub subscription if it doesn't exist
echo "📬 Setting up Pub/Sub subscription..."
gcloud pubsub subscriptions create llm-processing-sub \
    --topic=llm-processing \
    --project=$PROJECT_ID || echo "Subscription already exists"

echo "✅ LLM Backend deployment completed!"
echo ""
echo "🔗 Health check URL:"
echo "  https://$REGION-$PROJECT_ID.cloudfunctions.net/llm-health-check"
