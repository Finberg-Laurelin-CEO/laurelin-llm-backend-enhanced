#!/bin/bash

# Laurelin LLM Backend Deployment Script
# This script deploys the LLM backend to Google Cloud Functions

set -e

echo "🚀 Deploying Laurelin LLM Backend to Google Cloud Functions..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with gcloud. Please run 'gcloud auth login' first."
    exit 1
fi

# Set project ID
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-$(gcloud config get-value project)}
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No project ID found. Set GOOGLE_CLOUD_PROJECT environment variable or run 'gcloud config set project PROJECT_ID'"
    exit 1
fi

echo "📋 Using project: $PROJECT_ID"

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Deploy the main LLM processing function
echo "☁️  Deploying LLM processing function..."
gcloud functions deploy on-convo-input \
    --gen2 \
    --runtime=nodejs20 \
    --region=us-central1 \
    --source=. \
    --entry-point=onConvoInput \
    --trigger-topic=llm-processing \
    --memory=1GB \
    --timeout=300s \
    --max-instances=10 \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
    --project=$PROJECT_ID

# Deploy health check function
echo "🏥 Deploying health check function..."
gcloud functions deploy llm-health-check \
    --gen2 \
    --runtime=nodejs20 \
    --region=us-central1 \
    --source=. \
    --entry-point=healthCheck \
    --trigger-http \
    --allow-unauthenticated \
    --memory=256MB \
    --timeout=30s \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
    --project=$PROJECT_ID

# Create Pub/Sub topic if it doesn't exist
echo "📢 Setting up Pub/Sub topic..."
gcloud pubsub topics create llm-processing --project=$PROJECT_ID || echo "Topic already exists"

# Create Pub/Sub subscription if it doesn't exist
echo "📬 Setting up Pub/Sub subscription..."
gcloud pubsub subscriptions create llm-processing-sub \
    --topic=llm-processing \
    --project=$PROJECT_ID || echo "Subscription already exists"

echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "  - Project: $PROJECT_ID"
echo "  - Region: us-central1"
echo "  - Functions deployed:"
echo "    - on-convo-input (Pub/Sub trigger)"
echo "    - llm-health-check (HTTP trigger)"
echo "  - Pub/Sub topic: llm-processing"
echo ""
echo "🔗 Health check URL:"
echo "  https://us-central1-$PROJECT_ID.cloudfunctions.net/llm-health-check"
echo ""
echo "📝 Next steps:"
echo "  1. Set up environment variables in Google Cloud Console"
echo "  2. Configure your Flask backend to publish to the llm-processing topic"
echo "  3. Test the integration"
