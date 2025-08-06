#!/bin/bash

echo "Testing Docker-based VM approach for LeetHack..."

# Test if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop for macOS."
    echo "You can download it from: https://docs.docker.com/desktop/install/mac-install/"
    exit 1
fi

echo "✅ Docker is available"

# Test creating a simple container
echo "🚀 Creating test container..."
CONTAINER_NAME="leethack-test-$(date +%s)"

# Pull Kali Linux image (this might take a while first time)
echo "📦 Pulling Kali Linux image (this may take several minutes on first run)..."
docker pull kalilinux/kali-rolling:latest

# Create test container
docker run -d --name "$CONTAINER_NAME" \
    --cap-add=NET_ADMIN --cap-add=SYS_ADMIN \
    kalilinux/kali-rolling:latest tail -f /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Test container created: $CONTAINER_NAME"
    
    # Test command execution
    echo "🧪 Testing command execution..."
    docker exec "$CONTAINER_NAME" bash -c "echo 'Hello from LeetHack VM!'"
    docker exec "$CONTAINER_NAME" bash -c "whoami"
    docker exec "$CONTAINER_NAME" bash -c "pwd"
    
    # Install test tools
    echo "🔧 Installing basic tools..."
    docker exec "$CONTAINER_NAME" bash -c "apt-get update && apt-get install -y curl"
    docker exec "$CONTAINER_NAME" bash -c "curl --version"
    
    echo "✅ Container is working correctly!"
    
    # Cleanup
    echo "🧹 Cleaning up test container..."
    docker rm -f "$CONTAINER_NAME"
    
    echo ""
    echo "🎉 Docker VM setup is ready!"
    echo "Now restart your backend server and try the terminal again."
    echo ""
    echo "To restart backend:"
    echo "  1. Stop current backend (Ctrl+C in the terminal where it's running)"
    echo "  2. Run: cd /Users/Nicholas/leethack && npm run dev"
    echo ""
    
else
    echo "❌ Failed to create test container"
    exit 1
fi
