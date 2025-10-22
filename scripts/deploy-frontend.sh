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

# Build the frontend
cd apps/frontend
npm install
npm run build

# Create bucket if it doesn't exist
echo "🪣 Creating storage bucket..."
gsutil mb gs://$BUCKET_NAME || echo "Bucket already exists"

# Set bucket permissions
echo "🔐 Setting bucket permissions..."
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# Upload files
echo "📤 Uploading files..."
gsutil -m cp -r dist/* gs://$BUCKET_NAME/

# Set cache headers
echo "⚡ Setting cache headers..."
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" gs://$BUCKET_NAME/*.js
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" gs://$BUCKET_NAME/*.css
gsutil -m setmeta -h "Cache-Control:public, max-age=86400" gs://$BUCKET_NAME/*.png
gsutil -m setmeta -h "Cache-Control:public, max-age=86400" gs://$BUCKET_NAME/*.jpg
gsutil -m setmeta -h "Cache-Control:public, max-age=86400" gs://$BUCKET_NAME/*.ico

# Set index.html to no-cache
gsutil -m setmeta -h "Cache-Control:no-cache" gs://$BUCKET_NAME/index.html

echo "✅ Frontend deployment completed!"
echo ""
echo "🔗 Frontend URL:"
echo "  https://storage.googleapis.com/$BUCKET_NAME/index.html"
echo ""
echo "📝 Note: For production, consider setting up a custom domain and CDN"
