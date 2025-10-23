#!/bin/bash

# Deploy Laurelin Chatbot Frontend to Production
# This script builds and deploys the Angular frontend to GCS

set -e

PROJECT_ID="sacred-attic-473120-i0"
BUCKET_NAME="chat.laurelin-inc.com"
REGION="us-central1"

echo "🚀 Deploying Laurelin Chatbot Frontend to Production..."

# Navigate to frontend directory
cd /Users/Joe/Laurelin/laurelin-workspace/apps/frontend

# Check if Node.js version is compatible
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="20.19.0"

if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
    echo "❌ Node.js version $NODE_VERSION is not compatible with Angular CLI"
    echo "   Required: >= $REQUIRED_VERSION"
    echo "   Please update Node.js or use nvm to switch versions"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build for production
echo "🔨 Building Angular app for production..."
npm run build -- --configuration production

# Check if build was successful
if [ ! -d "dist/browser" ]; then
    echo "❌ Build failed - dist/browser directory not found"
    exit 1
fi

# Create GCS bucket if it doesn't exist
echo "🪣 Creating GCS bucket for frontend..."
gsutil mb gs://$BUCKET_NAME 2>/dev/null || echo "Bucket already exists"

# Configure bucket for website hosting
echo "🌐 Configuring bucket for website hosting..."
gsutil web set -m index.html -e 404.html gs://$BUCKET_NAME

# Set public read access
echo "🔓 Setting public read access..."
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# Upload files to GCS
echo "📤 Uploading files to GCS..."
gsutil -m rsync -r -d dist/browser/ gs://$BUCKET_NAME/

# Set cache headers for static assets
echo "⚡ Setting cache headers for static assets..."
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://$BUCKET_NAME/assets/**

# Set cache headers for HTML files
echo "📄 Setting cache headers for HTML files..."
gsutil -m setmeta -h "Cache-Control:public, max-age=0, must-revalidate" gs://$BUCKET_NAME/*.html

# Test the deployment
echo "🧪 Testing deployment..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://storage.googleapis.com/$BUCKET_NAME/index.html)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Frontend deployed successfully!"
    echo ""
    echo "🌐 Your chatbot is now available at:"
    echo "   https://chat.laurelin-inc.com"
    echo ""
    echo "📋 Next steps:"
    echo "1. Configure DNS CNAME record: chat.laurelin-inc.com → c.storage.googleapis.com"
    echo "2. Wait for DNS propagation (5-15 minutes)"
    echo "3. Test the full application flow"
    echo ""
    echo "🔧 If you need to update the frontend:"
    echo "   Run this script again after making changes"
else
    echo "❌ Deployment test failed (HTTP $HTTP_CODE)"
    echo "   Check the bucket configuration and try again"
    exit 1
fi

echo ""
echo "📊 Deployment Summary:"
echo "   Project: $PROJECT_ID"
echo "   Bucket: $BUCKET_NAME"
echo "   Region: $REGION"
echo "   Build: dist/browser/"
echo "   URL: https://chat.laurelin-inc.com"