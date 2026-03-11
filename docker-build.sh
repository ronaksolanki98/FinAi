#!/bin/bash

# ==========================================
# Docker Build and Push Helper Script
# ==========================================
# Usage: ./docker-build.sh [version] [registry]
# Examples:
#   ./docker-build.sh 1.0.0
#   ./docker-build.sh 1.0.0 myregistry
#   ./docker-build.sh latest docker.io/username
# ==========================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
VERSION="${1:-latest}"
REGISTRY="${2:-docker.io/finai}"
IMAGE_NAME="finai"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${VERSION}"

echo -e "${YELLOW}🐳 Docker Build Helper${NC}"
echo -e "${YELLOW}======================${NC}"
echo "Image: $FULL_IMAGE"
echo ""

# Build the image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
if DOCKER_BUILDKIT=1 docker build \
  --progress=plain \
  -t "$FULL_IMAGE" \
  -t "${REGISTRY}/${IMAGE_NAME}:latest" \
  .
then
  echo -e "${GREEN}✅ Build successful!${NC}"
else
  echo -e "${RED}❌ Build failed!${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}📊 Image size:${NC}"
docker images "$FULL_IMAGE" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo -e "${YELLOW}✨ Next steps:${NC}"
echo ""
echo "1. Test locally:"
echo "   docker-compose up -d"
echo "   curl http://localhost:3000/api/ping"
echo ""
echo "2. Push to registry:"
echo "   docker push $FULL_IMAGE"
echo "   docker push ${REGISTRY}/${IMAGE_NAME}:latest"
echo ""
echo "3. Deploy to production:"
echo "   # Follow instructions in DOCKER_SETUP.md"
echo ""
