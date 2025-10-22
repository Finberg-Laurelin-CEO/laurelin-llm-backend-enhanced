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

# Create Dockerfile if it doesn't exist
if [ ! -f Dockerfile ]; then
    echo "📝 Creating Dockerfile..."
    cat > Dockerfile << EOF
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Run the application
CMD ["python", "app.py"]
EOF
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
