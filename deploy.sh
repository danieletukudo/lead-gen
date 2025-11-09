#!/bin/bash

echo "=================================================="
echo "🚀 Lead Generator - Deployment Script"
echo "=================================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo ""
    echo "Please create .env file with:"
    echo "  GEMINI_API_KEY=your_key"
    echo "  EMAIL_USER=your@gmail.com"
    echo "  EMAIL_PASSWORD=your_app_password"
    echo ""
    exit 1
fi

echo "✅ .env file found"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Install from: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker found: $(docker --version)"
echo ""

# Ask deployment method
echo "Choose deployment method:"
echo "1) Docker (single container)"
echo "2) Docker Compose (recommended)"
echo "3) Exit"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "🐳 Deploying with Docker..."
        echo ""
        
        # Stop existing container
        docker stop leadgen-api 2>/dev/null
        docker rm leadgen-api 2>/dev/null
        
        # Build image
        echo "📦 Building Docker image..."
        docker build -t lead-generator-api .
        
        if [ $? -ne 0 ]; then
            echo "❌ Docker build failed"
            exit 1
        fi
        
        echo "✅ Docker image built"
        echo ""
        
        # Run container
        echo "🚀 Starting container..."
        docker run -d \
          -p 8000:8000 \
          --env-file .env \
          --name leadgen-api \
          --restart unless-stopped \
          lead-generator-api
        
        if [ $? -ne 0 ]; then
            echo "❌ Failed to start container"
            exit 1
        fi
        
        echo "✅ Container started"
        ;;
        
    2)
        echo ""
        echo "🐳 Deploying with Docker Compose..."
        echo ""
        
        # Check docker-compose
        if ! command -v docker-compose &> /dev/null; then
            echo "❌ docker-compose not found"
            echo "Install with: pip install docker-compose"
            exit 1
        fi
        
        # Stop existing services
        docker-compose down 2>/dev/null
        
        # Build and start
        echo "📦 Building and starting services..."
        docker-compose up -d --build
        
        if [ $? -ne 0 ]; then
            echo "❌ Docker Compose failed"
            exit 1
        fi
        
        echo "✅ Services started"
        ;;
        
    3)
        echo "Exiting..."
        exit 0
        ;;
        
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=================================================="
echo "🎉 Deployment Complete!"
echo "=================================================="
echo ""
echo "📡 API is running at: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo "💚 Health Check: http://localhost:8000/health"
echo ""
echo "🔍 View logs:"
if [ $choice -eq 1 ]; then
    echo "   docker logs -f leadgen-api"
else
    echo "   docker-compose logs -f"
fi
echo ""
echo "🛑 Stop service:"
if [ $choice -eq 1 ]; then
    echo "   docker stop leadgen-api"
else
    echo "   docker-compose down"
fi
echo ""
echo "=================================================="

# Wait a moment for container to start
sleep 3

# Test health endpoint
echo "🔍 Testing API health..."
HEALTH_CHECK=$(curl -s http://localhost:8000/health 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ API is healthy and responding!"
    echo ""
    echo "Response: $HEALTH_CHECK"
else
    echo "⚠️  API health check failed. Check logs for details."
fi

echo ""
echo "=================================================="
echo "🎊 Your Lead Generator is now deployed!"
echo "=================================================="

