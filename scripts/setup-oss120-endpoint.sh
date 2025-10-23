#!/bin/bash

# Setup OSS120 Model Endpoint
# This script creates a LoadBalancer service for the OSS120 model and gets its endpoint

set -e

PROJECT_ID="sacred-attic-473120-i0"
CLUSTER_NAME="autopilot-cluster-1"
REGION="asia-southeast1"

echo "🚀 Setting up OSS120 model endpoint..."

# Get cluster credentials
echo "📋 Getting cluster credentials..."
gcloud container clusters get-credentials $CLUSTER_NAME --region=$REGION --project=$PROJECT_ID

# Apply the LoadBalancer service
echo "🔧 Creating LoadBalancer service for OSS120 model..."
kubectl apply -f /Users/Joe/Laurelin/laurelin-workspace/deploy/llm-backend/oss120-service.yaml

# Wait for the service to get an external IP
echo "⏳ Waiting for LoadBalancer to get external IP..."
kubectl wait --for=condition=Ready --timeout=300s service/laurelin-3-service

# Get the external IP
echo "🌐 Getting external IP for OSS120 model..."
EXTERNAL_IP=$(kubectl get service laurelin-3-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

if [ -z "$EXTERNAL_IP" ]; then
    echo "❌ Failed to get external IP. Checking service status..."
    kubectl get service laurelin-3-service
    exit 1
fi

echo "✅ OSS120 model endpoint: http://$EXTERNAL_IP"
echo "📝 Add this to your secrets:"
echo "   CUSTOM_GPU_ENDPOINT=http://$EXTERNAL_IP"
echo "   CUSTOM_GPU_API_KEY=your-api-key-here"

# Test the endpoint
echo "🧪 Testing OSS120 endpoint..."
curl -s -o /dev/null -w "%{http_code}" http://$EXTERNAL_IP/health || echo "Endpoint not ready yet"

echo ""
echo "🎯 Next steps:"
echo "1. Add the endpoint to GCP Secret Manager:"
echo "   gcloud secrets create custom-gpu-endpoint --data-file=- <<< 'http://$EXTERNAL_IP'"
echo "2. Add API key to Secret Manager:"
echo "   gcloud secrets create custom-gpu-api-key --data-file=- <<< 'your-api-key'"
echo "3. Update your domain DNS to point oss120.laurelin-inc.com to $EXTERNAL_IP"
