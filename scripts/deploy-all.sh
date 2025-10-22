#!/bin/bash

# Laurelin Workspace - Master Deployment Script
# This script deploys all services in the correct order

set -e

echo "🚀 Starting Laurelin Workspace Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="sacred-attic-473120-i0"
REGION="us-central1"
ENVIRONMENT=${1:-staging}

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "  - Project: $PROJECT_ID"
echo "  - Region: $REGION"
echo "  - Environment: $ENVIRONMENT"
echo ""

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed${NC}"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm is not installed${NC}"
    exit 1
fi

# Verify authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Not authenticated with gcloud${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Build all packages
echo -e "${YELLOW}🔨 Building all packages...${NC}"
pnpm install
pnpm build
echo -e "${GREEN}✅ Build completed${NC}"
echo ""

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
pnpm test
echo -e "${GREEN}✅ Tests passed${NC}"
echo ""

# Deploy services in order
echo -e "${YELLOW}☁️  Deploying services...${NC}"

# 1. Deploy LLM Backend (Cloud Functions)
echo -e "${BLUE}1. Deploying LLM Backend...${NC}"
./scripts/deploy-llm.sh $ENVIRONMENT

# 2. Deploy Chat Backend (Cloud Run)
echo -e "${BLUE}2. Deploying Chat Backend...${NC}"
./scripts/deploy-backend.sh $ENVIRONMENT

# 3. Deploy Frontend (Cloud Storage + CDN)
echo -e "${BLUE}3. Deploying Frontend...${NC}"
./scripts/deploy-frontend.sh $ENVIRONMENT

echo ""
echo -e "${GREEN}🎉 All services deployed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo "  - Environment: $ENVIRONMENT"
echo "  - Project: $PROJECT_ID"
echo "  - Region: $REGION"
echo ""
echo -e "${BLUE}🔗 Service URLs:${NC}"
echo "  - Frontend: https://storage.googleapis.com/laurelin-frontend-assets/index.html"
echo "  - Backend: https://$REGION-$PROJECT_ID.cloudfunctions.net/chat-backend"
echo "  - LLM Backend: https://$REGION-$PROJECT_ID.cloudfunctions.net/llm-backend"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "  1. Verify all services are running"
echo "  2. Run health checks"
echo "  3. Update DNS records if needed"
echo "  4. Monitor logs in Cloud Console"
