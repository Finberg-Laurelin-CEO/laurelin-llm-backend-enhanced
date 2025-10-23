#!/bin/bash

# Setup GCP Secret Manager secrets for Laurelin workspace

set -e

PROJECT_ID="sacred-attic-473120-i0"

echo "🔐 Setting up GCP Secret Manager secrets..."

# Function to create or update secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if gcloud secrets describe $secret_name --project=$PROJECT_ID &>/dev/null; then
        echo "📝 Updating secret: $secret_name"
        echo -n "$secret_value" | gcloud secrets versions add $secret_name --data-file=- --project=$PROJECT_ID
    else
        echo "🆕 Creating secret: $secret_name"
        echo -n "$secret_value" | gcloud secrets create $secret_name --data-file=- --project=$PROJECT_ID
    fi
}

# Prompt for API keys
echo "Please provide the following API keys (press Enter to skip):"
echo ""

read -p "OpenAI API Key: " OPENAI_KEY
if [ ! -z "$OPENAI_KEY" ]; then
    create_or_update_secret "openai-api-key" "$OPENAI_KEY"
fi

read -p "Google AI API Key: " GOOGLE_KEY
if [ ! -z "$GOOGLE_KEY" ]; then
    create_or_update_secret "google-ai-api-key" "$GOOGLE_KEY"
fi

read -p "AWS Access Key ID: " AWS_ACCESS_KEY
read -p "AWS Secret Access Key: " AWS_SECRET_KEY
if [ ! -z "$AWS_ACCESS_KEY" ] && [ ! -z "$AWS_SECRET_KEY" ]; then
    AWS_CREDS="{\"access_key_id\":\"$AWS_ACCESS_KEY\",\"secret_access_key\":\"$AWS_SECRET_KEY\"}"
    create_or_update_secret "aws-credentials" "$AWS_CREDS"
fi

# Create other configuration secrets
create_or_update_secret "flask-backend-secret" "laurelin-flask-secret-$(date +%s)"
create_or_update_secret "ab-test-config" '{"enabled":true,"default_provider":"openai","variants":{"openai":0.5,"google":0.5}}'

echo ""
echo "✅ Secret Manager setup completed!"
echo ""
echo "📋 Created secrets:"
echo "  - openai-api-key"
echo "  - google-ai-api-key"
echo "  - aws-credentials"
echo "  - flask-backend-secret"
echo "  - ab-test-config"
echo ""
echo "🔗 View secrets in Google Cloud Console:"
echo "  https://console.cloud.google.com/security/secret-manager?project=$PROJECT_ID"
