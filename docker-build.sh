#!/bin/bash

# Docker build script for Android Diagnostic API

echo "🐳 Building Android Diagnostic API Docker image..."

# Build the production image
docker build -t android-diagnostic-api:latest .

# Tag for registry (optional)
# docker tag android-diagnostic-api:latest your-registry/android-diagnostic-api:latest

echo "✅ Build complete!"
echo ""
echo "To run the container:"
echo "  docker run -d -p 3000:3000 --name android-api android-diagnostic-api:latest"
echo ""
echo "Or use docker-compose:"
echo "  docker-compose up -d"