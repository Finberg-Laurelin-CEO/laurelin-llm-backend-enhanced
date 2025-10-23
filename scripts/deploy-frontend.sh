#!/bin/bash

# Deploy Frontend to Google Cloud Storage + CDN

set -e

ENVIRONMENT=${1:-staging}
PROJECT_ID="sacred-attic-473120-i0"
REGION="us-central1"
BUCKET_NAME="laurelin-frontend-assets"

echo "🚀 Deploying Frontend to Cloud Storage..."

# Set project
gcloud config set project $PROJECT_ID

# Use pre-built static frontend
echo "📦 Using pre-built static frontend..."
cd apps/frontend

# Create bucket if it doesn't exist
echo "🪣 Creating storage bucket..."
gsutil mb gs://$BUCKET_NAME || echo "Bucket already exists"

# Skip public permissions due to organization policy
echo "⚠️  Skipping public permissions due to organization policy..."

# Upload files
echo "📤 Uploading files..."
gsutil -m cp -r dist/* gs://$BUCKET_NAME/

# Set cache headers
echo "⚡ Setting cache headers..."
gsutil -m setmeta -h "Cache-Control:no-cache" gs://$BUCKET_NAME/index.html || echo "No index.html found"

echo "✅ Frontend deployment completed!"
echo ""
echo "🔗 Frontend URL:"
echo "  https://storage.googleapis.com/$BUCKET_NAME/index.html"
echo ""
echo "📝 Note: For production, consider setting up a custom domain and CDN"
