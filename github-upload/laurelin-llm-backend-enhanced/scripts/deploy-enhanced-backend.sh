#!/bin/bash

# Deploy Enhanced Laurelin LLM Backend
# This script deploys the enhanced backend with all new features

set -e

PROJECT_ID="sacred-attic-473120-i0"
REGION="us-central1"

echo "🚀 Deploying Enhanced Laurelin LLM Backend..."

# Navigate to deployment directory
cd /Users/Joe/Laurelin/laurelin-workspace/deploy/llm-backend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
npx tsc

# Create user upload bucket if it doesn't exist
echo "🪣 Creating user upload bucket..."
gsutil mb gs://laurelin-user-uploads 2>/dev/null || echo "Bucket already exists"

# Set up secrets
echo "🔐 Setting up secrets..."

# Create custom GPU endpoint secret (placeholder - will be updated after OSS120 setup)
gcloud secrets create custom-gpu-endpoint --data-file=- <<< 'http://placeholder-endpoint' 2>/dev/null || echo "Secret already exists"

# Create custom GPU API key secret (placeholder)
gcloud secrets create custom-gpu-api-key --data-file=- <<< 'placeholder-api-key' 2>/dev/null || echo "Secret already exists"

# Create user upload bucket secret
gcloud secrets create user-upload-bucket --data-file=- <<< 'laurelin-user-uploads' 2>/dev/null || echo "Secret already exists"

# Create max file size secret (1GB)
gcloud secrets create max-file-size --data-file=- <<< '1073741824' 2>/dev/null || echo "Secret already exists"

# Deploy Cloud Functions
echo "☁️ Deploying Cloud Functions..."

# Deploy chat API
echo "📝 Deploying chat API..."
gcloud functions deploy llm-chat-api \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=. \
  --entry-point=chatAPI \
  --trigger-http \
  --allow-unauthenticated \
  --memory=2GB \
  --timeout=540s \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,USER_UPLOAD_BUCKET=laurelin-user-uploads,MAX_FILE_SIZE=1073741824" \
  --set-secrets="GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest,OPENAI_API_KEY=openai-api-key:latest,GOOGLE_AI_API_KEY=google-ai-api-key:latest,AWS_ACCESS_KEY_ID=aws-credentials:latest,AWS_SECRET_ACCESS_KEY=aws-credentials:latest,CUSTOM_GPU_ENDPOINT=custom-gpu-endpoint:latest,CUSTOM_GPU_API_KEY=custom-gpu-api-key:latest" \
  --project=$PROJECT_ID

# Deploy login API
echo "🔑 Deploying login API..."
gcloud functions deploy llm-login-api \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=. \
  --entry-point=loginAPI \
  --trigger-http \
  --allow-unauthenticated \
  --memory=512MB \
  --timeout=60s \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
  --set-secrets="GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest" \
  --project=$PROJECT_ID

# Deploy models API
echo "🤖 Deploying models API..."
gcloud functions deploy llm-models-api \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=. \
  --entry-point=modelsAPI \
  --trigger-http \
  --allow-unauthenticated \
  --memory=512MB \
  --timeout=60s \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
  --set-secrets="OPENAI_API_KEY=openai-api-key:latest,GOOGLE_AI_API_KEY=google-ai-api-key:latest,AWS_ACCESS_KEY_ID=aws-credentials:latest,AWS_SECRET_ACCESS_KEY=aws-credentials:latest,CUSTOM_GPU_ENDPOINT=custom-gpu-endpoint:latest,CUSTOM_GPU_API_KEY=custom-gpu-api-key:latest" \
  --project=$PROJECT_ID

# Deploy upload API
echo "📤 Deploying upload API..."
gcloud functions deploy llm-upload-api \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=. \
  --entry-point=uploadAPI \
  --trigger-http \
  --allow-unauthenticated \
  --memory=2GB \
  --timeout=300s \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,USER_UPLOAD_BUCKET=laurelin-user-uploads,MAX_FILE_SIZE=1073741824" \
  --set-secrets="GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest" \
  --project=$PROJECT_ID

# Deploy history API
echo "📚 Deploying history API..."
gcloud functions deploy llm-history-api \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=. \
  --entry-point=historyAPI \
  --trigger-http \
  --allow-unauthenticated \
  --memory=1GB \
  --timeout=120s \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
  --set-secrets="GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest" \
  --project=$PROJECT_ID

# Deploy data sources API
echo "🗂️ Deploying data sources API..."
gcloud functions deploy llm-data-sources-api \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=. \
  --entry-point=dataSourcesAPI \
  --trigger-http \
  --allow-unauthenticated \
  --memory=512MB \
  --timeout=60s \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
  --project=$PROJECT_ID

# Deploy health check
echo "🏥 Deploying health check..."
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
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
  --set-secrets="OPENAI_API_KEY=openai-api-key:latest,GOOGLE_AI_API_KEY=google-ai-api-key:latest,AWS_ACCESS_KEY_ID=aws-credentials:latest,AWS_SECRET_ACCESS_KEY=aws-credentials:latest,CUSTOM_GPU_ENDPOINT=custom-gpu-endpoint:latest,CUSTOM_GPU_API_KEY=custom-gpu-api-key:latest" \
  --project=$PROJECT_ID

echo ""
echo "✅ Enhanced backend deployment completed!"
echo ""
echo "📋 Deployed endpoints:"
echo "   Chat API: https://$REGION-$PROJECT_ID.cloudfunctions.net/llm-chat-api"
echo "   Login API: https://$REGION-$PROJECT_ID.cloudfunctions.net/llm-login-api"
echo "   Models API: https://$REGION-$PROJECT_ID.cloudfunctions.net/llm-models-api"
echo "   Upload API: https://$REGION-$PROJECT_ID.cloudfunctions.net/llm-upload-api"
echo "   History API: https://$REGION-$PROJECT_ID.cloudfunctions.net/llm-history-api"
echo "   Data Sources API: https://$REGION-$PROJECT_ID.cloudfunctions.net/llm-data-sources-api"
echo "   Health Check: https://$REGION-$PROJECT_ID.cloudfunctions.net/llm-health-check"
echo ""
echo "🎯 Next steps:"
echo "1. Run ./scripts/setup-oss120-endpoint.sh to get OSS120 model endpoint"
echo "2. Update custom-gpu-endpoint secret with actual endpoint"
echo "3. Deploy frontend to GCS bucket"
echo "4. Configure DNS for chat.laurelin-inc.com"
