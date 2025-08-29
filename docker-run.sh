#!/bin/bash

# Docker run script for Android Diagnostic API

# Configuration
CONTAINER_NAME="android-diagnostic-api"
IMAGE_NAME="android-diagnostic-api:latest"
PORT="${PORT:-3000}"
API_KEY="${API_KEY:-diagnostic-api-key-2024}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 Starting Android Diagnostic API Container${NC}"

# Check if container already exists
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo -e "${YELLOW}⚠️  Container $CONTAINER_NAME already exists${NC}"
    echo "Stopping and removing old container..."
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# Run the container
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p $PORT:3000 \
    -e API_KEY=$API_KEY \
    -e NODE_ENV=production \
    -v $(pwd)/logs:/app/logs \
    $IMAGE_NAME

# Check if container started successfully
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Container started successfully!${NC}"
    echo ""
    echo "📋 Container Details:"
    echo "  Name: $CONTAINER_NAME"
    echo "  Port: $PORT"
    echo "  API Key: $API_KEY"
    echo ""
    echo "🌐 Access the API at:"
    echo "  http://localhost:$PORT"
    echo ""
    echo "📊 View logs:"
    echo "  docker logs -f $CONTAINER_NAME"
    echo ""
    echo "🛑 Stop container:"
    echo "  docker stop $CONTAINER_NAME"
else
    echo -e "${RED}❌ Failed to start container${NC}"
    exit 1
fi