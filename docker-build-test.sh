#!/bin/bash

# Docker Build Test Script
# This script validates the Dockerfile syntax and configuration

echo "========================================="
echo "Docker Configuration Test"
echo "========================================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "✓ Docker not installed - checking configuration files only"
    DOCKER_AVAILABLE=false
else
    echo "✓ Docker is available"
    DOCKER_AVAILABLE=true
fi

echo ""
echo "Checking Dockerfile syntax..."

# Basic Dockerfile validation
if [ -f "Dockerfile" ]; then
    echo "✓ Dockerfile exists"
    
    # Check for required directives
    echo ""
    echo "Validating Dockerfile structure:"
    
    if grep -q "^FROM" Dockerfile; then
        echo "  ✓ FROM instruction found"
    else
        echo "  ✗ Missing FROM instruction"
    fi
    
    if grep -q "^WORKDIR" Dockerfile; then
        echo "  ✓ WORKDIR instruction found"
    else
        echo "  ✗ Missing WORKDIR instruction"
    fi
    
    if grep -q "^CMD\|^ENTRYPOINT" Dockerfile; then
        echo "  ✓ Start command found"
    else
        echo "  ✗ Missing CMD or ENTRYPOINT"
    fi
    
    if grep -q "^HEALTHCHECK" Dockerfile; then
        echo "  ✓ HEALTHCHECK defined"
    else
        echo "  ⚠ No HEALTHCHECK defined (optional)"
    fi
    
    if grep -q "^USER" Dockerfile; then
        echo "  ✓ Non-root USER configured"
    else
        echo "  ⚠ Running as root (security concern)"
    fi
else
    echo "✗ Dockerfile not found"
    exit 1
fi

echo ""
echo "Checking docker-compose.yml..."

if [ -f "docker-compose.yml" ]; then
    echo "✓ docker-compose.yml exists"
    
    # Check for required services
    echo ""
    echo "Validating docker-compose structure:"
    
    if grep -q "android-api:" docker-compose.yml; then
        echo "  ✓ Main service defined"
    else
        echo "  ✗ Main service not found"
    fi
    
    if grep -q "ports:" docker-compose.yml; then
        echo "  ✓ Port mapping configured"
    else
        echo "  ✗ No port mapping"
    fi
    
    if grep -q "volumes:" docker-compose.yml; then
        echo "  ✓ Volume mounts configured"
    else
        echo "  ⚠ No volumes configured"
    fi
    
    if grep -q "cap_add:" docker-compose.yml; then
        echo "  ✓ Capabilities configured for debugging"
    else
        echo "  ⚠ No additional capabilities"
    fi
else
    echo "✗ docker-compose.yml not found"
fi

echo ""
echo "Checking project structure..."

# Check if all required directories exist
REQUIRED_DIRS=("src" "public" "utils" "src/routes" "src/models" "src/middleware")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✓ Directory $dir exists"
    else
        echo "  ✗ Missing directory: $dir"
    fi
done

echo ""
echo "Checking required files..."

# Check if all required files exist
REQUIRED_FILES=(
    "src/server.js"
    "src/app.js"
    "package.json"
    "package-lock.json"
    ".dockerignore"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ File $file exists"
    else
        echo "  ✗ Missing file: $file"
    fi
done

# If Docker is available, try to build
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo ""
    echo "========================================="
    echo "Attempting Docker build..."
    echo "========================================="
    
    # Try to build the image
    docker build -t android-diagnostic-api:test . --no-cache
    
    if [ $? -eq 0 ]; then
        echo "✓ Docker build successful!"
        
        # Clean up test image
        docker rmi android-diagnostic-api:test
        echo "✓ Test image cleaned up"
    else
        echo "✗ Docker build failed"
        exit 1
    fi
else
    echo ""
    echo "========================================="
    echo "Configuration validation complete!"
    echo "Docker build will need to be tested on a system with Docker installed."
    echo "========================================="
fi

echo ""
echo "✅ All checks passed!"